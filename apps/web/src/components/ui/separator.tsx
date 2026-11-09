"use client";

import { Separator as SeparatorPrimitive } from "@base-ui/react/separator";
import { cn } from "@/lib/utils";

export const Separator = (props: SeparatorPrimitive.Props) => {
  const { className, orientation = "horizontal", ...rest } = props;

  return (
    <SeparatorPrimitive
      className={cn(
        "shrink-0 bg-border data-horizontal:h-px data-horizontal:w-full data-vertical:w-px data-vertical:self-stretch",
        orientation === "horizontal" && "h-px w-full",
        orientation === "vertical" && "h-full w-px",
        className
      )}
      data-slot="separator"
      orientation={orientation}
      {...rest}
    />
  );
};
