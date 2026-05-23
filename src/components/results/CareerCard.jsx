import React from "react";
import { motion } from "framer-motion";
import CareerFeedbackRow from "@/components/feedback/CareerFeedbackRow";

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
      <div className="bg-primary/5 rounded-2xl p-4 sm:p-5 mt-2 border border-primary/10">
        {/* คำอธิบายอาชีพ */}
        <p className="text-sm text-foreground/80 leading-relaxed">
          {career.descriptionTh}
        </p>
        
        {/* Option B: เส้นคั่นมินิมอล (The Minimal Quote) ลดความอึดอัด */}
        <div className="mt-4 pl-3 sm:pl-4 border-l-4 border-primary/40">
          <p className="text-sm font-bold text-primary mb-1">💡 ทำไมถึงเหมาะกับคุณ?</p>
          <p className="text-sm text-slate-700 leading-relaxed">
            {career.whyMatch}
          </p>
        </div>

        {/* ระบบ Feedback (ถ้ามีการเปิดใช้) */}
        {showFeedback && (
          <div className="mt-4 pt-4 border-t border-primary/10">
            <CareerFeedbackRow
              clusterId={career.clusterId}
              value={feedbackValue}
              onChange={onFeedback}
            />
          </div>
        )}
      </div>
    </motion.div>
  );
}