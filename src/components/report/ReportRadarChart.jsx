import React from "react";

const SIZE = 200;
const CENTER = SIZE / 2;
const RADIUS = 72;

const DIMS = [
  { key: "R", label: "Realistic", th: "นักปฏิบัติ", color: "#EF4444" },
  { key: "I", label: "Investigative", th: "นักวิเคราะห์", color: "#3B82F6" },
  { key: "A", label: "Artistic", th: "นักสร้างสรรค์", color: "#8B5CF6" },
  { key: "S", label: "Social", th: "นักสังคม", color: "#10B981" },
  { key: "E", label: "Enterprising", th: "นักบริหาร", color: "#F59E0B" },
  { key: "C", label: "Conventional", th: "นักจัดระบบ", color: "#06B6D4" },
];

function polar(angleDeg, r) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return { x: CENTER + r * Math.cos(rad), y: CENTER + r * Math.sin(rad) };
}

/**
 * Compact radar chart for A4 report.
 * @param {{ traitScores: Array<{dimension:string, normalizedScore:number}>, hollandCode?: string }} props
 */
export default function ReportRadarChart({ traitScores = [], hollandCode = "" }) {
  const order = ["R", "I", "A", "S", "E", "C"];
  const scores = order.map(d => {
    const t = traitScores.find(s => s.dimension === d);
    return t ? Math.max(0, Math.min(100, t.normalizedScore ?? 0)) : 0;
  });

  const rings = [25, 50, 75, 100];

  const dataPoints = scores.map((v, i) => {
    const angle = (360 / 6) * i;
    return polar(angle, (v / 100) * RADIUS);
  });

  return (
    <svg viewBox={`0 0 ${SIZE} ${SIZE}`} className="w-full h-full" aria-label="RIASEC Chart">
      {/* Grid rings */}
      {rings.map(rv => (
        <polygon
          key={rv}
          points={order.map((_, i) => { const p = polar((360/6)*i, (rv/100)*RADIUS); return `${p.x},${p.y}`; }).join(" ")}
          fill="none" stroke="#E2E8F0" strokeWidth={rv === 100 ? 1 : 0.5}
        />
      ))}

      {/* Axes */}
      {order.map((_, i) => {
        const p = polar((360/6)*i, RADIUS);
        return <line key={i} x1={CENTER} y1={CENTER} x2={p.x} y2={p.y} stroke="#E2E8F0" strokeWidth={0.5} />;
      })}

      {/* Data fill */}
      <polygon
        points={dataPoints.map(p => `${p.x},${p.y}`).join(" ")}
        fill="rgba(99,102,241,0.15)" stroke="#6366F1" strokeWidth={1.5} strokeLinejoin="round"
      />

      {/* Data dots */}
      {dataPoints.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r={2.5} fill={DIMS[i].color} stroke="white" strokeWidth={1.5} />
      ))}

      {/* Labels */}
      {DIMS.map((dim, i) => {
        const p = polar((360/6)*i, RADIUS + 18);
        const isTop = hollandCode.includes(dim.key);
        return (
          <text key={dim.key} x={p.x} y={p.y + 1} textAnchor="middle" dominantBaseline="middle"
            className="text-[8px]" fill={isTop ? dim.color : "#94A3B8"} fontWeight={isTop ? 700 : 500}
          >
            {dim.key}
          </text>
        );
      })}
    </svg>
  );
}
