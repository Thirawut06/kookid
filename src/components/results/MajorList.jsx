import React from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { GraduationCap, Building2, Gift } from "lucide-react";
import { motion } from "framer-motion";
import MajorFeedbackButton from "@/components/feedback/MajorFeedbackButton";

export default function MajorList({
  majors,
  topCareers,
  majorFeedback,
  onMajorFeedback,
  onProgramInterest,
  requestedMajorIds,
}) {
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
            {group.majors.map((major, mi) => {
              const alreadyRequested = Boolean(requestedMajorIds?.[major.id]);
              return (
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
              <div className="mt-3 pt-3 border-t border-border/50 space-y-2">
                <Button
                  type="button"
                  size="sm"
                  disabled={alreadyRequested}
                  className="w-full rounded-xl h-auto py-2.5 px-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-sm disabled:bg-blue-100 disabled:text-muted-foreground disabled:opacity-100"
                  onClick={() => onProgramInterest?.(major)}
                >
                  <Gift className="w-4 h-4 mr-1.5 shrink-0" />
                  {alreadyRequested
                    ? "ส่งคำขอแล้ว"
                    : "สนใจให้มหาวิทยาลัยนี้ติดต่อกลับ (ข้อมูลโควต้า/ทุน)"}
                </Button>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  กดปุ่มนี้ถ้าคุณอยากให้มหาวิทยาลัยส่งข้อมูลโควต้า/ทุนที่ตรงกับผลของคุณมาให้ (ไม่มีค่าใช้จ่าย)
                </p>
              </div>
            </Card>
              );
            })}
            {group.majors.length === 0 && (
              <p className="text-xs text-muted-foreground italic">ไม่มีสาขาที่จับคู่ในกลุ่มนี้</p>
            )}
          </div>
        </motion.div>
      ))}
    </div>
  );
}