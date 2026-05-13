import React from "react";
import { CheckCircle, Circle } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Horizontal stepper showing quiz sections.
 * @param {{ sections: Array<{ id: string, label: string }>, activeIndex: number }} props
 */
export default function SectionStepper({ sections, activeIndex }) {
  return (
    <div className="flex items-center gap-1 sm:gap-2 w-full overflow-x-auto pb-1">
      {sections.map((sec, i) => {
        const done = i < activeIndex;
        const active = i === activeIndex;
        return (
          <React.Fragment key={sec.id}>
            {i > 0 && (
              <div className={cn(
                "flex-1 h-0.5 min-w-4",
                done ? "bg-primary" : "bg-border"
              )} />
            )}
            <div className="flex items-center gap-1.5 shrink-0">
              {done ? (
                <CheckCircle className="w-5 h-5 text-primary" />
              ) : (
                <Circle className={cn(
                  "w-5 h-5",
                  active ? "text-primary" : "text-muted-foreground/40"
                )} />
              )}
              <span className={cn(
                "text-xs sm:text-sm font-medium whitespace-nowrap",
                active ? "text-foreground" : done ? "text-primary" : "text-muted-foreground"
              )}>
                {sec.label}
              </span>
            </div>
          </React.Fragment>
        );
      })}
    </div>
  );
}