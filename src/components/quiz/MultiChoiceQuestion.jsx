import React from "react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { Check } from "lucide-react";

/**
 * Multiple choice question — supports single or multi select.
 * For multi-select (like subject preferences), the value is an array.
 * For single-select (like constraint questions), the value is a string.
 */
export default function MultiChoiceQuestion({ question, value, onChange, index, multiSelect = false }) {
  const selected = multiSelect
    ? (Array.isArray(value) ? value : [])
    : value;

  const handleClick = (optId) => {
    if (multiSelect) {
      const arr = Array.isArray(value) ? [...value] : [];
      if (arr.includes(optId)) {
        onChange(question.id, arr.filter(v => v !== optId));
      } else {
        onChange(question.id, [...arr, optId]);
      }
    } else {
      onChange(question.id, optId);
    }
  };

  const isSelected = (optId) => {
    if (multiSelect) return Array.isArray(selected) && selected.includes(optId);
    return selected === optId;
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3 }}
      className="bg-card rounded-2xl border border-border/50 p-5 sm:p-6 shadow-sm"
    >
      <p className="text-base sm:text-lg font-medium text-foreground mb-1 leading-relaxed">
        <span className="text-primary/60 text-sm mr-2">Q{index + 1}</span>
        {question.text}
      </p>
      {multiSelect && (
        <p className="text-xs text-muted-foreground mb-4">(เลือกได้หลายข้อ)</p>
      )}
      {!multiSelect && <div className="mb-4" />}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {question.options.map(opt => {
          const active = isSelected(opt.id);
          return (
            <button
              key={opt.id}
              onClick={() => handleClick(opt.id)}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-xl border-2 text-left transition-all",
                active
                  ? "border-primary bg-primary/10"
                  : "border-border/50 bg-background hover:border-primary/30 hover:bg-primary/5"
              )}
            >
              <div className={cn(
                "w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-colors",
                active ? "border-primary bg-primary" : "border-muted-foreground/30"
              )}>
                {active && <Check className="w-3 h-3 text-primary-foreground" />}
              </div>
              <span className={cn(
                "text-sm font-medium",
                active ? "text-foreground" : "text-muted-foreground"
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