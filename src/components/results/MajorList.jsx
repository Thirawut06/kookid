import React from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { GraduationCap, Building2 } from "lucide-react";
import { motion } from "framer-motion";

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
 * @param {{
 *   majors: MajorItem[],
 *   topCareers: any[],
 *   hasCapturedLead?: boolean,
 *   onUnlockLead?: () => void,
 * }} props
 */

export default function MajorList({
  majors,
  topCareers,
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
            {(() => {
              const unlocked = group.majors.slice(0, visibleSlots);
              const locked = group.majors.slice(visibleSlots);

              return (
                <>
                  {unlocked.map((major) => {
                    return (
                      <div key={major.id} className="relative">
                        <Card className="flex h-full flex-col overflow-hidden rounded-[18px] border border-border/50 bg-white/72 p-5 shadow-[0_6px_20px_rgba(0,0,0,0.04)] transition-all">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex min-w-0 items-start gap-2.5">
                              <GraduationCap className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                              <div className="min-w-0 break-words whitespace-normal">
                                <p className="text-sm font-semibold leading-5 text-foreground">{major.nameTh}</p>
                              </div>
                            </div>
                            <div className="flex shrink-0 flex-wrap justify-end gap-1">
                              {major.universityShortName && (
                                <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                                  {major.universityShortName}
                                </Badge>
                              )}
                            </div>
                          </div>

                          <div className="mt-3 space-y-1.5">
                            <p className="text-xs text-muted-foreground line-clamp-1">{major.facultyNameTh}</p>
                            <p className="text-xs text-muted-foreground/70 line-clamp-2 leading-5">{major.universityNameTh}</p>
                          </div>
                        </Card>
                      </div>
                    );
                  })}

                  {locked.length > 0 && !hasCapturedLead && (
                    <div className="col-span-1 md:col-span-2">
                      <div className="rounded-[18px] border border-border/50 bg-white/90 p-4 flex items-center justify-between gap-4">
                        <div>
                            <p className="text-xs text-muted-foreground">มี {locked.length} สาขาที่ถูกซ่อนไว้ ตัวอย่าง: {locked.slice(0,2).map(m => m.nameTh).join(' • ')}{locked.length > 2 ? ' • …' : ''}</p>
                          </div>
                        <div className="flex items-center gap-3">
                          <Button size="sm" variant="ghost" onClick={onUnlockLead} className="rounded-full">
                            🔒 ดูสาขาทั้งหมด (รวมอยู่ในแพ็กเกจ 59 บาท)
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              );
            })()}

            {group.majors.length === 0 && (
              <p className="text-xs text-muted-foreground italic">ไม่มีสาขาที่จับคู่ในกลุ่มนี้</p>
            )}
          </div>
        </motion.div>
      ))}
    </div>
  );
}
