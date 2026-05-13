import React from "react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

const LIKERT_OPTIONS = [
  { value: 1, label: "ไม่ชอบเลย", emoji: "😕" },
  { value: 2, label: "ไม่ค่อยชอบ", emoji: "😐" },
  { value: 3, label: "เฉย ๆ", emoji: "🤔" },
  { value: 4, label: "ชอบ", emoji: "😊" },
  { value: 5, label: "ชอบมาก", emoji: "🤩" },
];

export default function LikertQuestion({ question, value, onChange, index }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3 }}
      className="bg-card rounded-2xl border border-border/50 p-5 sm:p-6 shadow-sm"
    >
      <p className="text-base sm:text-lg font-medium text-foreground mb-5 leading-relaxed">
        <span className="text-primary/60 text-sm mr-2">Q{index + 1}</span>
        {question.text}
      </p>
      <div className="flex flex-wrap gap-2 sm:gap-3">
        {LIKERT_OPTIONS.map(opt => {
          const selected = value === opt.value;
          return (
            <button
              key={opt.value}
              onClick={() => onChange(question.id, opt.value)}
              className={cn(
                "flex flex-col items-center gap-1 px-3 py-2.5 sm:px-4 sm:py-3 rounded-xl border-2 transition-all flex-1 min-w-[60px]",
                selected
                  ? "border-primary bg-primary/10 shadow-sm"
                  : "border-border/50 bg-background hover:border-primary/30 hover:bg-primary/5"
              )}
            >
              <span className="text-xl sm:text-2xl">{opt.emoji}</span>
              <span className={cn(
                "text-[10px] sm:text-xs font-medium",
                selected ? "text-primary" : "text-muted-foreground"
              )}>
                {opt.label}
              </span>
            </button>
          );
        })}
      </div>
    </motion.div>
  );
}