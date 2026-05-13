import React from "react";
import { cn } from "@/lib/utils";

// Binary interest options for majors (keep simple for MVP)
const BINARY_OPTIONS = [
  { value: 1, label: "ไม่สนใจ" },
  { value: 3, label: "น่าสนใจ" },
];

/**
 * Compact binary feedback row shown below each major item.
 */
export default function MajorFeedbackButton({ majorId, value, onChange }) {
  return (
    <div className="flex items-center gap-2 mt-2">
      <span className="text-[10px] text-muted-foreground">สาขานี้น่าสนใจไหม?</span>
      {BINARY_OPTIONS.map(opt => (
        <button
          key={opt.value}
          onClick={() => onChange(majorId, opt.value)}
          className={cn(
            "px-2.5 py-0.5 rounded-full text-[10px] font-medium border transition-all",
            value === opt.value
              ? "bg-primary text-primary-foreground border-primary"
              : "bg-background text-muted-foreground border-border/50 hover:border-primary/40"
          )}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}