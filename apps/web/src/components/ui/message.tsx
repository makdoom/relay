"use client";

import type * as React from "react";

import { cn } from "@/lib/utils";

function MessageGroup({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={cn("gap-2 flex min-w-0 flex-col", className)}
      data-slot="message-group"
      {...props}
    />
  );
}

function Message({
  className,
  align = "start",
  ...props
}: React.ComponentProps<"div"> & {
  /** The side of the conversation it sits on: `start` (theirs) or `end` (yours). */
  align?: "start" | "end";
}) {
  return (
    <div
      className={cn(
        "text-sm gap-2 group/message relative flex w-full min-w-0 data-[align=end]:flex-row-reverse",
        className
      )}
      data-align={align}
      data-slot="message"
      {...props}
    />
  );
}

function MessageAvatar({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "min-w-8 group-has-data-[slot=message-footer]/message:-translate-y-8 flex w-fit shrink-0 items-center justify-center self-end overflow-hidden rounded-full bg-muted",
        className
      )}
      data-slot="message-avatar"
      {...props}
    />
  );
}

function MessageContent({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "gap-2.5 group-data-[align=end]/message:*:data-slot:self-end wrap-break-word flex w-full min-w-0 flex-col",
        className
      )}
      data-slot="message-content"
      {...props}
    />
  );
}

function MessageHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "text-xs font-medium text-muted-foreground px-3 group-has-data-[variant=ghost]/message:px-0 flex min-w-0 max-w-full items-center",
        className
      )}
      data-slot="message-header"
      {...props}
    />
  );
}

function MessageFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "text-xs font-medium text-muted-foreground px-3 group-has-data-[variant=ghost]/message:px-0 flex min-w-0 max-w-full items-center group-data-[align=end]/message:justify-end",
        className
      )}
      data-slot="message-footer"
      {...props}
    />
  );
}

export {
  Message,
  MessageAvatar,
  MessageContent,
  MessageFooter,
  MessageGroup,
  MessageHeader,
};
