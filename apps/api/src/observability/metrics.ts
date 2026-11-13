/**
 * In-memory Metrics Registry for the Echo distributed messaging platform.
 * Tracks Google SRE Golden Signals (Traffic, Latency, Errors, Saturation)
 * adhering strictly to the bounded cardinality rules defined in observability/SKILL.md.
 */

export interface MetricSummary {
  count: number;
  sum: number;
  min: number;
  max: number;
  p50: number;
  p90: number;
  p95: number;
  p99: number;
}

export class MetricsRegistry {
  // Counters: key -> count
  private httpRequestsTotal = new Map<string, number>();
  private messagesPersistedTotal = new Map<string, number>();
  private idempotencyHitsTotal = new Map<string, number>();

  // Gauges
  private activeSocketConnections = 0;

  // Latency samples: key -> number[]
  private httpRequestDurations = new Map<string, number[]>();
  private messagePersistenceDurations: number[] = [];

  /**
   * Reset all metric stores (useful for isolated unit & integration tests).
   */
  public reset(): void {
    this.httpRequestsTotal.clear();
    this.messagesPersistedTotal.clear();
    this.idempotencyHitsTotal.clear();
    this.activeSocketConnections = 0;
    this.httpRequestDurations.clear();
    this.messagePersistenceDurations = [];
  }

  /**
   * Record an incoming HTTP request with method, route, and status code.
   * Route parameter normalization prevents high-cardinality label explosion.
   */
  public recordHttpRequest(
    method: string,
    route: string,
    statusCode: number,
    durationMs: number
  ): void {
    const normalizedMethod = method.toUpperCase();
    const normalizedRoute = this.normalizeRoute(route);
    const key = `method="${normalizedMethod}",route="${normalizedRoute}",status="${statusCode}"`;

    this.httpRequestsTotal.set(key, (this.httpRequestsTotal.get(key) || 0) + 1);

    const durations = this.httpRequestDurations.get(key) || [];
    // Keep a bounded sliding sample buffer (last 1,000 requests per key) to prevent memory leak
    if (durations.length >= 1000) {
      durations.shift();
    }
    durations.push(durationMs);
    this.httpRequestDurations.set(key, durations);
  }

  /**
   * Record a message persistence event and optional database transaction latency.
   */
  public recordMessagePersistence(
    status: 'success' | 'duplicate' | 'failed',
    durationMs?: number
  ): void {
    const key = `status="${status}"`;
    this.messagesPersistedTotal.set(key, (this.messagesPersistedTotal.get(key) || 0) + 1);

    if (typeof durationMs === 'number') {
      if (this.messagePersistenceDurations.length >= 1000) {
        this.messagePersistenceDurations.shift();
      }
      this.messagePersistenceDurations.push(durationMs);
    }
  }

  /**
   * Record an idempotency collision (fast-path cache lookup vs PostgreSQL 23505 concurrency collision).
   */
  public recordIdempotencyHit(type: 'fast_path' | 'concurrency_collision'): void {
    const key = `type="${type}"`;
    this.idempotencyHitsTotal.set(key, (this.idempotencyHitsTotal.get(key) || 0) + 1);
  }

  /**
   * Adjust active WebSocket connection gauge.
   */
  public incrementActiveSockets(): void {
    this.activeSocketConnections++;
  }

  public decrementActiveSockets(): void {
    this.activeSocketConnections = Math.max(0, this.activeSocketConnections - 1);
  }

  public getActiveSockets(): number {
    return this.activeSocketConnections;
  }

  /**
   * Normalizes route paths to avoid high-cardinality UUID or ID explosion.
   * Example: /api/v1/conversations/0192e212-0000-7000-8000-000000000001/messages -> /api/v1/conversations/:id/messages
   */
  private normalizeRoute(route: string): string {
    if (!route || route === '') return '/';
    // Replace UUIDs and IDs with :id placeholder
    return route
      .replace(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi, ':id')
      .split('?')[0]; // Strip query parameters
  }

  /**
   * Calculate summary percentiles (p50, p90, p95, p99) from sample durations.
   */
  private calculateSummary(samples: number[]): MetricSummary {
    if (samples.length === 0) {
      return { count: 0, sum: 0, min: 0, max: 0, p50: 0, p90: 0, p95: 0, p99: 0 };
    }

    const sorted = [...samples].sort((a, b) => a - b);
    const count = sorted.length;
    const sum = sorted.reduce((acc, val) => acc + val, 0);
    const min = sorted[0];
    const max = sorted[count - 1];

    const percentile = (p: number) => {
      const idx = Math.min(count - 1, Math.floor((p / 100) * count));
      return sorted[idx];
    };

    return {
      count,
      sum: Math.round(sum * 100) / 100,
      min: Math.round(min * 100) / 100,
      max: Math.round(max * 100) / 100,
      p50: Math.round(percentile(50) * 100) / 100,
      p90: Math.round(percentile(90) * 100) / 100,
      p95: Math.round(percentile(95) * 100) / 100,
      p99: Math.round(percentile(99) * 100) / 100,
    };
  }

  /**
   * Export metrics in standard Prometheus text exposition format.
   */
  public getPrometheusMetrics(): string {
    const lines: string[] = [];

    // 1. HTTP Requests Total
    lines.push('# HELP echo_http_requests_total Total number of HTTP requests processed');
    lines.push('# TYPE echo_http_requests_total counter');
    if (this.httpRequestsTotal.size === 0) {
      lines.push('echo_http_requests_total 0');
    } else {
      for (const [labels, count] of this.httpRequestsTotal.entries()) {
        lines.push(`echo_http_requests_total{${labels}} ${count}`);
      }
    }
    lines.push('');

    // 2. HTTP Request Latency Summary
    lines.push('# HELP echo_http_request_duration_ms HTTP request latency in milliseconds');
    lines.push('# TYPE echo_http_request_duration_ms summary');
    for (const [labels, samples] of this.httpRequestDurations.entries()) {
      const summary = this.calculateSummary(samples);
      lines.push(`echo_http_request_duration_ms{${labels},quantile="0.5"} ${summary.p50}`);
      lines.push(`echo_http_request_duration_ms{${labels},quantile="0.9"} ${summary.p90}`);
      lines.push(`echo_http_request_duration_ms{${labels},quantile="0.95"} ${summary.p95}`);
      lines.push(`echo_http_request_duration_ms{${labels},quantile="0.99"} ${summary.p99}`);
      lines.push(`echo_http_request_duration_ms_sum{${labels}} ${summary.sum}`);
      lines.push(`echo_http_request_duration_ms_count{${labels}} ${summary.count}`);
    }
    lines.push('');

    // 3. Active Socket Connections Gauge
    lines.push('# HELP echo_socket_connections_active Number of active WebSocket connections');
    lines.push('# TYPE echo_socket_connections_active gauge');
    lines.push(`echo_socket_connections_active ${this.activeSocketConnections}`);
    lines.push('');

    // 4. Messages Persisted Counter
    lines.push('# HELP echo_messages_persisted_total Total number of message persistence attempts');
    lines.push('# TYPE echo_messages_persisted_total counter');
    if (this.messagesPersistedTotal.size === 0) {
      lines.push('echo_messages_persisted_total 0');
    } else {
      for (const [labels, count] of this.messagesPersistedTotal.entries()) {
        lines.push(`echo_messages_persisted_total{${labels}} ${count}`);
      }
    }
    lines.push('');

    // 5. Message Persistence Latency Summary
    lines.push(
      '# HELP echo_message_persistence_duration_ms Message persistence database latency in milliseconds'
    );
    lines.push('# TYPE echo_message_persistence_duration_ms summary');
    const msgSummary = this.calculateSummary(this.messagePersistenceDurations);
    lines.push(`echo_message_persistence_duration_ms{quantile="0.5"} ${msgSummary.p50}`);
    lines.push(`echo_message_persistence_duration_ms{quantile="0.95"} ${msgSummary.p95}`);
    lines.push(`echo_message_persistence_duration_ms{quantile="0.99"} ${msgSummary.p99}`);
    lines.push(`echo_message_persistence_duration_ms_sum ${msgSummary.sum}`);
    lines.push(`echo_message_persistence_duration_ms_count ${msgSummary.count}`);
    lines.push('');

    // 6. Idempotency Hits Counter
    lines.push(
      '# HELP echo_idempotency_hits_total Total number of duplicate send retries deduplicated'
    );
    lines.push('# TYPE echo_idempotency_hits_total counter');
    if (this.idempotencyHitsTotal.size === 0) {
      lines.push('echo_idempotency_hits_total 0');
    } else {
      for (const [labels, count] of this.idempotencyHitsTotal.entries()) {
        lines.push(`echo_idempotency_hits_total{${labels}} ${count}`);
      }
    }
    lines.push('');

    return lines.join('\n');
  }

  /**
   * Get an in-memory JSON snapshot of all metrics for verification and monitoring dashboards.
   */
  public getMetricsSnapshot(): Record<string, unknown> {
    const httpSummary: Record<string, MetricSummary> = {};
    for (const [labels, samples] of this.httpRequestDurations.entries()) {
      httpSummary[labels] = this.calculateSummary(samples);
    }

    return {
      httpRequestsTotal: Object.fromEntries(this.httpRequestsTotal.entries()),
      httpLatencySummary: httpSummary,
      activeSocketConnections: this.activeSocketConnections,
      messagesPersistedTotal: Object.fromEntries(this.messagesPersistedTotal.entries()),
      messagePersistenceSummary: this.calculateSummary(this.messagePersistenceDurations),
      idempotencyHitsTotal: Object.fromEntries(this.idempotencyHitsTotal.entries()),
    };
  }
}

export const metrics = new MetricsRegistry();
