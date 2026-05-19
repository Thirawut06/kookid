/**
 * PrintableReport — a compact one-page summary rendered for print/PDF export.
 * Displayed via the /report route. Users can Ctrl+P / Save as PDF from browser.
 * Print CSS hides everything except this component's content.
 */
import React from "react";

const RIASEC_COLOR = { R: "#6366f1", I: "#0ea5e9", A: "#f59e0b", S: "#22c55e", E: "#ef4444", C: "#8b5cf6" };

export default function PrintableReport({ result }) {
  if (!result) return null;
  const { profile, clusters, majors, summary } = result;

  const riasecScores = profile.traitScores.filter(ts =>
    ["R", "I", "A", "S", "E", "C"].includes(ts.dimension)
  ).sort((a, b) => b.normalizedScore - a.normalizedScore);

  const top3Clusters = clusters?.slice(0, 3) ?? [];
  const top3Majors = majors?.slice(0, 5) ?? [];

  return (
    <div className="print-report p-8 max-w-2xl mx-auto font-thai text-sm text-gray-800">
      {/* Header */}
      <div className="border-b-2 border-indigo-600 pb-3 mb-5">
        <h1 className="text-xl font-bold text-indigo-700">ผลการวิเคราะห์บุคลิกภาพและแนวทางการเรียน TCAS</h1>
        <p className="text-xs text-gray-500 mt-1">สร้างโดย TCAS Career Quiz · ข้อมูลอ้างอิง TCAS67–68</p>
      </div>

      {/* Personality summary */}
      <section className="mb-5">
        <h2 className="text-base font-semibold text-gray-700 mb-1">บุคลิกภาพหลัก</h2>
        <p className="text-sm text-gray-700 mb-2">{summary.summaryText}</p>
        <ul className="list-disc list-inside space-y-1 text-sm text-gray-600">
          {summary.bulletPoints?.map((bp, i) => <li key={i}>{bp}</li>)}
        </ul>
      </section>

      {/* RIASEC bars */}
      <section className="mb-5">
        <h2 className="text-base font-semibold text-gray-700 mb-2">คะแนน RIASEC</h2>
        <div className="space-y-1.5">
          {riasecScores.map(ts => (
            <div key={ts.dimension} className="flex items-center gap-2">
              <span className="w-28 text-xs text-gray-600 shrink-0">{ts.dimension}</span>
              <div className="flex-1 bg-gray-100 rounded h-3 overflow-hidden">
                <div
                  className="h-3 rounded"
                  style={{ width: `${ts.normalizedScore}%`, backgroundColor: RIASEC_COLOR[ts.dimension] ?? "#6366f1" }}
                />
              </div>
              <span className="w-8 text-right text-xs text-gray-600">{ts.normalizedScore}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Top clusters */}
      <section className="mb-5">
        <h2 className="text-base font-semibold text-gray-700 mb-2">กลุ่มอาชีพที่เหมาะสม (Top 3)</h2>
        <div className="space-y-2">
          {top3Clusters.map((c, i) => (
            <div key={c.careerId || `${c.clusterId}-${i}`} className="border border-gray-200 rounded p-2.5">
              <div className="flex items-center justify-between">
                <p className="font-medium text-gray-800 text-sm">{i + 1}. {c.nameTh}</p>
                <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full font-semibold">{c.matchScore}%</span>
              </div>
              {c.whyMatch && <p className="text-xs text-gray-500 mt-1">{c.whyMatch}</p>}
            </div>
          ))}
        </div>
      </section>

      {/* Top majors */}
      <section className="mb-5">
        <h2 className="text-base font-semibold text-gray-700 mb-2">สาขาวิชาที่แนะนำ</h2>
        <table className="w-full text-xs border-collapse">
          <thead>
            <tr className="bg-gray-50">
              <th className="text-left p-1.5 border border-gray-200">สาขา</th>
              <th className="text-left p-1.5 border border-gray-200">คณะ</th>
              <th className="text-left p-1.5 border border-gray-200">มหาวิทยาลัย</th>
            </tr>
          </thead>
          <tbody>
            {top3Majors.map(m => (
              <tr key={m.id}>
                <td className="p-1.5 border border-gray-200">{m.nameTh}</td>
                <td className="p-1.5 border border-gray-200">{m.facultyNameTh}</td>
                <td className="p-1.5 border border-gray-200">{m.universityShortName ?? m.universityNameTh}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {/* Disclaimer */}
      <p className="text-xs text-gray-400 border-t pt-3 mt-4">
        ผลนี้ใช้เพื่อเป็นแนวทางเบื้องต้นเท่านั้น ข้อมูลอ้างอิง TCAS67–68 และตลาดแรงงานไทย
        ควรปรึกษาครูแนะแนวหรือผู้ปกครองก่อนตัดสินใจ
      </p>
    </div>
  );
}