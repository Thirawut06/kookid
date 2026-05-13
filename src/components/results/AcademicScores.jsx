import React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

const ACADEMIC_LABELS = {
  Academic_Math: "คณิตศาสตร์",
  Academic_Sci: "วิทยาศาสตร์",
};

export default function AcademicScores({ traitScores }) {
  const academic = traitScores.filter(ts =>
    ["Academic_Math", "Academic_Sci"].includes(ts.dimension)
  );

  return (
    <div>
      <div className="flex gap-4">
      {academic.map((ts, i) => (
        <motion.div
          key={ts.dimension}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 + i * 0.15 }}
          className="flex-1 bg-muted/50 rounded-xl p-4 text-center"
        >
          <p className="text-sm text-muted-foreground mb-2">
            {ACADEMIC_LABELS[ts.dimension]}
          </p>
          <p className={cn(
            "text-3xl font-bold",
            ts.normalizedScore >= 70 ? "text-primary" :
            ts.normalizedScore >= 40 ? "text-foreground" :
            "text-muted-foreground"
          )}>
            {ts.normalizedScore}
          </p>
          <p className="text-xs text-muted-foreground mt-1">/100</p>
        </motion.div>
      ))}
      </div>
      {/* Explanatory note — clarifies these scores come from self-assessment, not real exams */}
      <p className="text-xs text-muted-foreground mt-3 leading-relaxed">
        💡 คะแนนนี้มาจากคำตอบในแบบทดสอบ (ความมั่นใจของคุณในแต่ละวิชา) ไม่ใช่เกรดหรือคะแนนสอบจริง
        ใช้ช่วยดูภาพรวมว่าคุณเหมาะกับสาขาที่ใช้เลขหรือวิทยาศาสตร์มากน้อยแค่ไหน
      </p>
    </div>
  );
}