import React from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { GraduationCap, Building2 } from "lucide-react";
import { motion } from "framer-motion";
import MajorFeedbackButton from "@/components/feedback/MajorFeedbackButton";

export default function MajorList({ majors, topCareers, majorFeedback, onMajorFeedback, onProgramInterest }) {
  // Group majors by clusterId (matches field in majors.json)
  const clusterMap = {};
  topCareers.slice(0, 3).forEach(c => {
    clusterMap[c.clusterId] = {
      ...c,
      majors: majors.filter(m => m.clusterId === c.clusterId),
    };
  });

  return (
    <div className="space-y-5">
      {Object.values(clusterMap).map((group, gi) => (
        <motion.div
          key={group.clusterId}
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: gi * 0.15 }}
        >
          <h3 className="text-sm font-semibold text-muted-foreground mb-3 flex items-center gap-2">
            <Building2 className="w-4 h-4" />
            {group.nameTh}
          </h3>
          <div className="grid gap-2">
          {group.majors.map((major, mi) => (
            <Card key={major.id} className="p-3 sm:p-4 border border-border/50 hover:shadow-sm transition-shadow">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-start gap-2.5">
                  <GraduationCap className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-foreground">{major.nameTh}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{major.facultyNameTh}</p>
                    <p className="text-xs text-muted-foreground/70">{major.universityNameTh}</p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-1 justify-end">
                  {major.universityShortName && (
                    <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                      {major.universityShortName}
                    </Badge>
                  )}
                </div>
              </div>
              {/* Per-major feedback — only for top 3 majors per group */}
              {mi < 3 && (
                <MajorFeedbackButton
                  majorId={major.id}
                  value={majorFeedback?.[major.id]}
                  onChange={onMajorFeedback}
                />
              )}
              <div className="mt-3 pt-3 border-t border-border/50 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div className="text-[11px] text-muted-foreground leading-relaxed">
                  พื้นที่สำหรับข้อมูลโควต้าและทุนจากมหาวิทยาลัยนี้
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="w-full sm:w-auto rounded-full border-primary/20 text-primary hover:bg-primary/5"
                  onClick={() => onProgramInterest?.(major)}
                >
                  ขอข้อมูลโควต้า/ทุนจากมหาวิทยาลัยนี้
                </Button>
              </div>
            </Card>
          ))}
            {group.majors.length === 0 && (
              <p className="text-xs text-muted-foreground italic">ไม่มีสาขาที่จับคู่ในกลุ่มนี้</p>
            )}
          </div>
        </motion.div>
      ))}
    </div>
  );
}