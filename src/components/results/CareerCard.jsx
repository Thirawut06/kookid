import React from "react";
import { Badge } from "@/components/ui/badge";
import { Trophy } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import CareerFeedbackRow from "@/components/feedback/CareerFeedbackRow";
import { getCareerClusters } from "@/lib/dataLoader";

// Build a lookup map once at module load — no runtime fetching
const CLUSTER_MAP = Object.fromEntries(getCareerClusters().map(c => [c.id, c]));

const RANK_STYLES = [
  "",
  "",
  "",
  "",
  "",
];

export default function CareerCard({
  career,
  rank,
  feedbackValue,
  onFeedback,
  onCareerViewed,
  showMatchScore = true,
  showFeedback = true,
}) {
  // This component is intentionally minimal — Results.jsx renders the title.
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: rank * 0.06 }}
    >
      <div className="w-full">
        <div className="flex items-start justify-between gap-3 p-0">
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
            <div className="min-w-0">
              {showMatchScore && (
                <Badge variant="secondary" className="text-xs">
                  ความเหมาะสม {career.matchScore}%
                </Badge>
              )}
            </div>
          </div>
        </div>

        <div className="mt-3">
          <div className="bg-primary/5 rounded-xl p-3">
            <p className="text-sm text-muted-foreground leading-relaxed mb-2">
              {career.descriptionTh}
            </p>
            <p className="text-sm font-medium text-primary/80">💡 ทำไมถึงเหมาะกับคุณ?</p>
            <p className="text-sm text-foreground/80 mt-1 leading-relaxed">
              {career.whyMatch}
            </p>
          </div>

          {showFeedback && (
            <div className="mt-3">
              <CareerFeedbackRow
                clusterId={career.clusterId}
                value={feedbackValue}
                onChange={onFeedback}
              />
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}