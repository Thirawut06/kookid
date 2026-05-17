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
        <Card className="border-primary/20 bg-primary/5 px-4 py-3">
          <p className="text-sm text-muted-foreground">รหัสบุคลิกภาพ Holland Code ของคุณคือ</p>
          <p className="mt-1 text-2xl sm:text-3xl font-bold tracking-[0.2em] text-primary">{hollandCode}</p>
        </Card>
      )}
      {riasec.map((ts, i) => (
        <div key={ts.dimension} className="flex items-center gap-3">
          <span className="text-xs font-semibold w-28 sm:w-36 text-right text-muted-foreground shrink-0">
            {DIMENSION_LABELS[ts.dimension]}
          </span>
          <div className="flex-1 h-7 bg-muted rounded-lg overflow-hidden relative">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${ts.normalizedScore}%` }}
              transition={{ delay: i * 0.1, duration: 0.6, ease: "easeOut" }}
              className={cn("h-full rounded-lg", DIMENSION_COLORS[ts.dimension])}
            />
            <span className="absolute inset-y-0 right-2 flex items-center text-xs font-bold text-foreground">
              {ts.normalizedScore}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}