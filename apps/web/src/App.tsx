export function App() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6 text-center">
      <div className="flex max-w-md flex-col items-center gap-4 rounded-lg border border-[rgba(255,255,255,0.08)] bg-[#101114] p-8">
        <div className="flex h-12 w-12 items-center justify-center rounded-md border border-[rgba(255,255,255,0.16)] bg-[#16171b] text-xl font-bold text-[#5e6ad2]">
          R
        </div>
        <h1 className="text-xl font-semibold tracking-tight text-[#ededed]">Relay Messaging</h1>
        <p className="text-sm text-[#8a8f98]">
          Phase 1 Tooling & Developer Environment Initialized.
        </p>
        <div className="inline-flex items-center gap-2 rounded-full border border-[rgba(255,255,255,0.08)] bg-[#16171b] px-3 py-1 text-xs text-[#8a8f98]">
          <span className="h-2 w-2 rounded-full bg-[#5e6ad2]" />
          <span>Vite + React 19 + Vitest + Biome</span>
        </div>
      </div>
    </main>
  );
}

export default App;
