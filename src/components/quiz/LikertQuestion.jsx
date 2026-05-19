import React, { useCallback } from "react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

const LIKERT_OPTIONS = [
  { value: 1, label: "ไม่ชอบเลย", emoji: "😕" },
  { value: 2, label: "ไม่ค่อยชอบ", emoji: "😐" },
  { value: 3, label: "เฉย ๆ", emoji: "🤔" },
  { value: 4, label: "ชอบ", emoji: "😊" },
  { value: 5, label: "ชอบมาก", emoji: "🤩" },
];

/**
 * LikertQuestion: A 5-point Likert scale component with radio-style layout.
 * 
 * @param {Object} props
 * @param {Object} props.question - Question object with id and text
 * @param {number} props.value - Currently selected value (1-5) or undefined
 * @param {Function} props.onChange - Callback: (questionId, value)
 * @param {number} props.index - Question number for display
 * @param {Function} [props.onAnswered] - Optional callback fired only on first selection: (questionId, value)
 */
export default function LikertQuestion({ question, value, onChange, index, onAnswered }) {
  const handleAnswer = useCallback((opt) => {
    const isFirstSelection = value === undefined || value === null;
    
    // Always call onChange to update the answer
    onChange(question.id, opt.value);
    
    // Call onAnswered only on the first selection (for auto-next parent behavior)
    if (isFirstSelection && onAnswered) {
      onAnswered(question.id, opt.value);
    }
  }, [value, question.id, onChange, onAnswered]);

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3 }}
      className="bg-card rounded-2xl border border-border/50 p-4 sm:p-6 shadow-sm"
    >
      {/* Question text */}
      <p className="text-base sm:text-lg font-medium text-foreground mb-4 leading-relaxed">
        <span className="text-primary/60 text-sm mr-2">Q{index + 1}</span>
        {question.text}
      </p>

      {/* Radio-style options row - 5 pills in a horizontal row */}
      <div className="flex gap-2 sm:gap-2.5" role="radiogroup" aria-label={question.text}>
        {LIKERT_OPTIONS.map(opt => {
          const selected = value === opt.value;
          
          return (
            <motion.button
              key={opt.value}
              type="button"
              onClick={() => handleAnswer(opt)}
              role="radio"
              aria-checked={selected}
              aria-label={`${opt.label}`}
              whileTap={{ scale: 0.95 }}
              className={cn(
                "flex flex-1 flex-col items-center justify-center gap-1 rounded-lg border-2 px-2 py-2 text-center transition-all duration-200 min-h-[48px]",
                selected
                  ? "bg-primary/15 border-primary text-primary font-semibold"
                  : "bg-background border-border/50 text-foreground hover:border-primary/30 hover:bg-primary/5"
              )}
            >
              {/* Emoji - smaller for radio style */}
              <span className="text-lg leading-none">{opt.emoji}</span>
              {/* Label - readable text */}
              <span className="text-xs sm:text-sm font-medium leading-tight">
                {opt.label}
              </span>
            </motion.button>
          );
        })}
      </div>
    </motion.div>
  );
}