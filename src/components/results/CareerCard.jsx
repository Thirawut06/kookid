import React from "react";
import { motion } from "framer-motion";
import CareerFeedbackRow from "@/components/feedback/CareerFeedbackRow";
import { appName } from "@/lib/app-params";

export default function CareerCard({
  career,
  rank,
  feedbackValue,
  onFeedback,
  onCareerViewed, // รับค่าไว้ไม่ให้ React แจ้งเตือน
  showMatchScore = true, // รับค่าไว้ไม่ให้ React แจ้งเตือน
  showFeedback = true,
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: rank * 0.06 }}
      className="w-full"
    >
      <div className="mt-2">
        <div className="flex items-center gap-2 mb-2">
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-primary/10 text-primary font-medium">สำหรับคุณ</span>
          <span className="text-xs text-muted-foreground">ข้อมูลสรุปโดย {appName}</span>
        </div>

        <p className="text-sm text-foreground/80 leading-relaxed">{career.descriptionTh}</p>

        <div className="mt-4 border-b border-border/50" />
      </div>
      {/* ระบบ Feedback (ถ้ามีการเปิดใช้) */}
      {showFeedback && (
        <div className="mt-3">
          <CareerFeedbackRow
            clusterId={career.clusterId}
            value={feedbackValue}
            onChange={onFeedback}
          />
        </div>
      )}
    </motion.div>
  );
}