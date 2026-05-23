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
 *   hideFeedback?: boolean,
 * }} props
 */
export default function MajorList({
  majors,
  topCareers,
  onProgramInterest,
  requestedMajorIds,
  hasCapturedLead = false,
  onUnlockLead,
  hideFeedback = false,
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {group.majors.map((major) => {
              const alreadyRequested = Boolean(requestedMajorIds?.[major.id]);
              const isUnlocked = hasCapturedLead || renderedCount < visibleSlots;
              renderedCount += 1;

              return (
                <div key={major.id} className="relative">
                  <Card
                    className={cn(
                        "flex h-full flex-col overflow-hidden rounded-[18px] border border-border/50 bg-white/72 p-5 shadow-[0_6px_20px_rgba(0,0,0,0.04)] transition-all",
                        !isUnlocked && "bg-white/68"
                    )}
                  >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex min-w-0 items-start gap-2.5">
                          <GraduationCap className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                          <div className={cn("min-w-0 break-words whitespace-normal", !isUnlocked && "blur-[3px] opacity-80") }>
                            <p className="text-sm font-semibold leading-5 text-foreground">{major.nameTh}</p>
                          </div>
                        </div>
                        <div className="flex shrink-0 flex-wrap justify-end gap-1">
                          {!isUnlocked ? (
                            <Badge
                              variant="outline"
                              className="rounded-full border-border/60 bg-white/90 px-2.5 py-1 text-[10px] uppercase tracking-[0.08em] text-muted-foreground"
                            >
                              Preview
                            </Badge>
                          ) : (
                            major.universityShortName && (
                              <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                                {major.universityShortName}
                              </Badge>
                            )
                          )}
                        </div>
                      </div>

                      <div className={cn("mt-3 space-y-1.5", !isUnlocked && "blur-[4px] opacity-75") }>
                        <p className="text-xs text-muted-foreground line-clamp-1">{major.facultyNameTh}</p>
                        <p className="text-xs text-muted-foreground/70 line-clamp-2 leading-5">{major.universityNameTh}</p>
                      </div>

                      <div className="mt-auto pt-4">
                        <div className={cn("space-y-2", !isUnlocked && "pointer-events-none")}>
                        <Button
                          type="button"
                          size="sm"
                          disabled={alreadyRequested}
                          className="h-auto w-full rounded-xl bg-orange-600 px-3 py-2.5 font-semibold text-white shadow-md hover:bg-orange-700 disabled:bg-orange-100 disabled:text-muted-foreground disabled:opacity-100"
                          onClick={() => onProgramInterest?.(major)}
                        >
                          <Gift className="w-4 h-4 mr-1.5 shrink-0" />
                          {alreadyRequested
                            ? "ส่งคำขอแล้ว"
                            : "รับสิทธิ์โควต้า/ทุน"}
                        </Button>
                        {!hideFeedback && (
                          <p className="text-[11px] text-muted-foreground leading-relaxed">
                            กดปุ่มนี้ถ้าคุณอยากให้มหาวิทยาลัยส่งข้อมูลโควต้า/ทุนที่ตรงกับผลของคุณมาให้ (ไม่มีค่าใช้จ่าย)
                          </p>
                        )}
                      </div>
                    </div>
                  </Card>

                  {!hasCapturedLead && !isUnlocked && (
                    <button
                      type="button"
                      onClick={onUnlockLead}
                      className="absolute inset-0 rounded-[18px] bg-[linear-gradient(180deg,rgba(255,255,255,0.08),rgba(255,255,255,0.4)_58%,rgba(255,255,255,0.88))] text-left transition-all hover:bg-[linear-gradient(180deg,rgba(255,255,255,0.12),rgba(255,255,255,0.46)_58%,rgba(255,255,255,0.92))]"
                    >
                      <span className="absolute left-4 top-4 inline-flex items-center rounded-full border border-border/60 bg-white/90 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground shadow-sm">
                        Preview
                      </span>
                      <span className="absolute inset-x-4 bottom-4 inline-flex items-center justify-center rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-lg">
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
