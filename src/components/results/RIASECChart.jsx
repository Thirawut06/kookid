import React from "react";

const DIMENSION_DETAILS = {
  R: { label: "R — Realistic (นักปฏิบัติ)", color: "bg-red-500" },
  I: { label: "I — Investigative (นักวิเคราะห์)", color: "bg-blue-500" },
  A: { label: "A — Artistic (The Creator/ศิลปิน)", color: "bg-purple-500" },
  S: { label: "S — Social (นักบริการสังคม)", color: "bg-green-500" },
  E: { label: "E — Enterprising (นักบริหาร/ผู้นำ)", color: "bg-amber-500" },
  C: { label: "C — Conventional (นักจัดระบบ)", color: "bg-cyan-500" },
};

const RIASEC_ORDER = ["R", "I", "A", "S", "E", "C"];

export default function RIASECChart({ traitScores = [], hollandCode = "" }) {
  // กรองเอาเฉพาะมิติที่เป็น RIASEC หลัก 6 ด้านมาแสดงผล (ไม่เอาตัวแปร Academic)
  const riasecData = traitScores
    .filter((item) => RIASEC_ORDER.includes(item.dimension))
    .sort((a, b) => RIASEC_ORDER.indexOf(a.dimension) - RIASEC_ORDER.indexOf(b.dimension));

  return (
    <div className="w-full space-y-4">
      <div className="space-y-1">
        <h3 className="text-sm font-semibold text-muted-foreground">
          คะแนนจำแนกตามมิติบุคลิกภาพ (RIASEC)
        </h3>
        {hollandCode && (
          <p className="text-xs text-muted-foreground">
            Holland Code: <span className="font-semibold text-foreground">{hollandCode}</span>
          </p>
        )}
      </div>

      <div className="space-y-3.5">
        {riasecData.map((item) => {
          const detail = DIMENSION_DETAILS[item.dimension] || {
            label: item.dimension,
            color: "bg-primary",
          };
          const score = Number(item.normalizedScore ?? 0);
          const safeScore = Number.isFinite(score) ? Math.max(0, Math.min(100, score)) : 0;
          const isTopTrait = hollandCode.includes(item.dimension);

          return (
            <div key={item.dimension} className="space-y-1">
              <div className="flex items-center justify-between gap-3 text-xs sm:text-sm">
                <span
                  className={[
                    "min-w-0 truncate font-medium",
                    isTopTrait ? "text-foreground font-bold" : "text-muted-foreground",
                  ].join(" ")}
                >
                  {detail.label}
                </span>
                <span className="shrink-0 font-bold text-slate-700">{safeScore}%</span>
              </div>

              <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
                <div
                  className={`h-full rounded-full transition-all duration-1000 ease-out ${detail.color}`}
                  style={{ width: `${safeScore}%` }}
                />
              </div>
            </div>
          );
        })}

        {riasecData.length === 0 && (
          <p className="text-sm text-muted-foreground">ยังไม่มีข้อมูลคะแนน RIASEC สำหรับแสดงผล</p>
        )}
      </div>
    </div>
  );
}