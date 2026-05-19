import React from "react";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const DIMENSION_COLORS = {
  R: "bg-red-500",
  I: "bg-blue-500",
  A: "bg-purple-500",
  S: "bg-green-500",
  E: "bg-amber-500",
  C: "bg-cyan-500",
};

const DIMENSION_LABELS = {
  R: "R — Realistic",
  I: "I — Investigative",
  A: "A — Artistic",
  S: "S — Social",
  E: "E — Enterprising",
  C: "C — Conventional",
};

const ARCHETYPE_LABELS = {
  R: "The Builder",
  I: "The Thinker",
  A: "The Creator",
  S: "The Helper",
  E: "The Leader",
  C: "The Organizer",
};

export default function RIASECChart({ traitScores, hollandCode }) {
  const riasec = traitScores
    .filter(ts => ["R", "I", "A", "S", "E", "C"].includes(ts.dimension))
    .sort((a, b) => {
      const order = ["R", "I", "A", "S", "E", "C"];
      return order.indexOf(a.dimension) - order.indexOf(b.dimension);
    });

  return (
    <div className="space-y-4">
      {hollandCode && (
        <Card className="border-primary/20 bg-gradient-to-br from-primary/10 to-background px-4 py-4">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-primary/70">Archetype</p>
          <p className="mt-1 text-xl sm:text-2xl font-bold text-foreground">
            {ARCHETYPE_LABELS[hollandCode[0]] || "The Explorer"}
          </p>
          <p className="mt-2 text-sm text-muted-foreground">รหัส Holland Code ของคุณ</p>
          <p className="mt-1 text-3xl sm:text-4xl font-extrabold tracking-[0.25em] text-primary">{hollandCode}</p>
        </Card>
      )}
      {riasec.map((ts, i) => (
        <div key={ts.dimension} className="flex items-center gap-3">
          <span className="text-xs font-semibold w-28 sm:w-36 text-right text-muted-foreground shrink-0">
            {DIMENSION_LABELS[ts.dimension]}
          </span>
          <div className="flex-1 h-6 bg-muted rounded-full overflow-hidden relative">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${ts.normalizedScore}%` }}
              transition={{ delay: i * 0.1, duration: 0.6, ease: "easeOut" }}
              className={cn("h-full rounded-full", DIMENSION_COLORS[ts.dimension])}
            />
          </div>
        </div>
      ))}
    </div>
  );
}