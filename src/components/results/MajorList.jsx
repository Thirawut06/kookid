import React from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { GraduationCap, Building2, Gift } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

/**
 * @typedef {{
 *   id: string,
 *   nameTh: string,
 *   facultyNameTh?: string,
 *   clusterId: string,
 *   universityNameTh?: string,
 *   universityShortName?: string,
 *   universityId?: string,
 * }} MajorItem
 * @typedef {{
 *   clusterId: string,
 *   nameTh: string,
 *   majors: MajorItem[],
 * }} MajorGroup
 */

/**
 * @param {{
 *   majors: MajorItem[],
 *   topCareers: Array<{ clusterId: string, nameTh: string }>,
 *   onProgramInterest?: (major: MajorItem) => void,
 *   requestedMajorIds?: Record<string, boolean>,
 *   hasCapturedLead?: boolean,
 *   onUnlockLead?: () => void,
 * }} props
 */
export default function MajorList({
  majors,
  topCareers,
  onProgramInterest,
  requestedMajorIds,
  hasCapturedLead = false,
  onUnlockLead,
}) {
  /** @type {Record<string, MajorGroup>} */
  const clusterMap = {};
  topCareers.forEach((career) => {
    if (!clusterMap[career.clusterId]) {
      clusterMap[career.clusterId] = {
        ...career,
        majors: majors.filter((major) => major.clusterId === career.clusterId),
      };
    }
  });

  const groups = Object.values(clusterMap).slice(0, 3);
  const visibleSlots = hasCapturedLead ? Infinity : 2;
  let renderedCount = 0;

  return (
    <div className="space-y-5">
      {groups.map((group, groupIndex) => (
        <motion.div
          key={group.clusterId}
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: groupIndex * 0.15 }}
        >
          <h3 className="text-sm font-semibold text-muted-foreground mb-3 flex items-center gap-2">
            <Building2 className="w-4 h-4" />
            {group.nameTh}
          </h3>

          <div className="grid gap-2">
            {group.majors.map((major) => {
              const alreadyRequested = Boolean(requestedMajorIds?.[major.id]);
              const isUnlocked = hasCapturedLead || renderedCount < visibleSlots;
              renderedCount += 1;

              return (
                <div key={major.id} className="relative">
                  <Card
                    className={cn(
                      "p-3 sm:p-4 border border-border/50 transition-all",
                      !isUnlocked && "opacity-40 blur-[2px] select-none"
                    )}
                  >
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

                    <div className={cn(!isUnlocked && "pointer-events-none") }>
                      <div className="mt-3 pt-3 border-t border-border/50 space-y-2">
                        <Button
                          type="button"
                          size="sm"
                          disabled={alreadyRequested}
                          className="w-full rounded-xl h-auto py-2.5 px-3 bg-orange-600 hover:bg-orange-700 text-white font-semibold shadow-md disabled:bg-orange-100 disabled:text-muted-foreground disabled:opacity-100"
                          onClick={() => onProgramInterest?.(major)}
                        >
                          <Gift className="w-4 h-4 mr-1.5 shrink-0" />
                          {alreadyRequested
                            ? "ส่งคำขอแล้ว"
                            : "🔥 รับสิทธิ์โควต้า/ทุน (มหาลัยติดต่อกลับ)"}
                        </Button>
                        <p className="text-[11px] text-muted-foreground leading-relaxed">
                          กดปุ่มนี้ถ้าคุณอยากให้มหาวิทยาลัยส่งข้อมูลโควต้า/ทุนที่ตรงกับผลของคุณมาให้ (ไม่มีค่าใช้จ่าย)
                        </p>
                      </div>
                    </div>
                  </Card>

                  {!hasCapturedLead && !isUnlocked && (
                    <button
                      type="button"
                      onClick={onUnlockLead}
                      className="absolute inset-0 flex items-center justify-center rounded-2xl border border-dashed border-primary/30 bg-background/75 p-4 text-center backdrop-blur-sm transition-all hover:bg-background/85"
                    >
                      <span className="inline-flex max-w-[90%] items-center justify-center rounded-full bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground shadow-lg sm:text-base">
                        🔒 ยืนยันข้อมูลเบื้องต้น เพื่อปลดล็อกโควต้ามหาวิทยาลัยทั้งหมดฟรี
                      </span>
                    </button>
                  )}
                </div>
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
