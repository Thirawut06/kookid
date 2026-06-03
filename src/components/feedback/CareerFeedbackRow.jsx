import React from "react";
import { cn } from "@/lib/utils";

// Labels for the 3-level interest scale (change here to update all labels)
const INTEREST_OPTIONS = [
  { value: 1, label: "ไม่สนใจเลย" },
  { value: 2, label: "เฉย ๆ" },
  { value: 3, label: "สนใจมาก" },
];

/**
 * Inline feedback row shown inside each CareerCard.
 * Stops click propagation so it doesn't toggle the card expand.
 */
export default function CareerFeedbackRow({ clusterId, value, onChange }) {
  return (
    <div className="mt-3 pt-3 border-t border-border/30" onClick={e => e.stopPropagation()}>
      <p className="text-xs text-muted-foreground mb-2">น้องๆ สนใจสายอาชีพนี้ไหม? (ช่วยพี่ๆ กดหน่อยน้า)</p>
      <div className="flex gap-2 flex-wrap">
        {INTEREST_OPTIONS.map(opt => (
          <button
            key={opt.value}
            onClick={() => onChange(clusterId, opt.value)}
            className={cn(
              "px-3 py-1 rounded-full text-xs font-medium border transition-all",
              value === opt.value
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-background text-muted-foreground border-border/50 hover:border-primary/40 hover:text-foreground"
            )}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}