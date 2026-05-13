import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ChevronDown, ChevronUp, Trophy } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import CareerFeedbackRow from "@/components/feedback/CareerFeedbackRow";
import { getCareerClusters } from "@/lib/dataLoader";

// Build a lookup map once at module load — no runtime fetching
const CLUSTER_MAP = Object.fromEntries(getCareerClusters().map(c => [c.id, c]));

const RANK_STYLES = [
  "border-amber-400/50 bg-gradient-to-br from-amber-50 to-card",
  "border-slate-300/50 bg-gradient-to-br from-slate-50 to-card",
  "border-orange-300/50 bg-gradient-to-br from-orange-50 to-card",
  "border-border/50",
  "border-border/50",
];

export default function CareerCard({ career, rank, feedbackValue, onFeedback }) {
  const [expanded, setExpanded] = useState(rank === 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: rank * 0.1 }}
    >
      <Card
        className={cn(
          "overflow-hidden cursor-pointer transition-shadow hover:shadow-md border-2",
          RANK_STYLES[rank] || RANK_STYLES[3]
        )}
        onClick={() => setExpanded(!expanded)}
      >
        <div className="p-4 sm:p-5">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className={cn(
                "w-8 h-8 rounded-lg flex items-center justify-center shrink-0 text-sm font-bold",
                rank === 0 ? "bg-amber-100 text-amber-700" :
                rank === 1 ? "bg-slate-100 text-slate-600" :
                rank === 2 ? "bg-orange-100 text-orange-600" :
                "bg-muted text-muted-foreground"
              )}>
                {rank < 3 ? <Trophy className="w-4 h-4" /> : rank + 1}
              </div>
              <div>
                <h3 className="font-semibold text-foreground text-base sm:text-lg">
                  {career.nameTh}
                </h3>
                <Badge variant="secondary" className="mt-1 text-xs">
                  ความเหมาะสม {career.matchScore}%
                </Badge>
              </div>
            </div>
            {expanded ? (
              <ChevronUp className="w-5 h-5 text-muted-foreground shrink-0" />
            ) : (
              <ChevronDown className="w-5 h-5 text-muted-foreground shrink-0" />
            )}
          </div>

          <AnimatePresence>
            {expanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="mt-4 pt-4 border-t border-border/50">
                  <p className="text-sm text-muted-foreground leading-relaxed mb-3">
                    {career.descriptionTh}
                  </p>
                  {/* Example careers from careerClusters.json */}
                  {CLUSTER_MAP[career.clusterId]?.exampleCareers?.length > 0 && (
                    <p className="text-xs text-muted-foreground mb-3">
                      <span className="font-medium text-foreground/70">ตัวอย่างอาชีพ:</span>{" "}
                      {CLUSTER_MAP[career.clusterId].exampleCareers.slice(0, 3).join(", ")}
                    </p>
                  )}
                  <div className="bg-primary/5 rounded-xl p-3">
                    <p className="text-sm font-medium text-primary/80">
                      💡 ทำไมถึงเหมาะกับคุณ?
                    </p>
                    <p className="text-sm text-foreground/80 mt-1 leading-relaxed">
                      {career.whyMatch}
                    </p>
                  </div>
                  {/* Per-career feedback — decoupled component */}
                  <CareerFeedbackRow
                    clusterId={career.clusterId}
                    value={feedbackValue}
                    onChange={onFeedback}
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </Card>
    </motion.div>
  );
}