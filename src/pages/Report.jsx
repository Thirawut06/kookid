import React, { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

import { getStoredQuizResult, hasLeadCapture } from "@/lib/leadCaptureApi";
import { trackEvent } from "@/lib/analyticsApi";
import { appName } from "@/lib/app-params";

// --- ACTION PLAN RULES (from original) ---
const ACTION_RULES = [
  { check: () => true, text: "เลือก 2–3 สาขาที่สนใจจากลิสต์ด้านบน แล้วเข้าไปอ่านรายละเอียดหลักสูตรในเว็บมหาวิทยาลัย" },
  { check: (c, t) => c.includes("CLUSTER_IT_ENGINEERING") || t.includes("R") || t.includes("I"), text: "ฝึกทักษะการคิดเป็นระบบและทำโปรเจกต์เล็ก ๆ เช่น Coding เบื้องต้น หรือการทดลองแก้ปัญหาจริง" },
  { check: (c, t) => c.includes("CLUSTER_BUSINESS") || t.includes("E") || t.includes("C"), text: "ลองศึกษาเรื่องการจัดการ การเงินพื้นฐาน หรือทำ Mini Project ที่สะท้อนความเป็นผู้นำและการจัดระบบ" },
  { check: (c) => c.includes("CLUSTER_HEALTH"), text: "ลองอาสาสมัครงานด้านสุขภาพ หรือคุยกับพยาบาล/แพทย์ในครอบครัวหรือชุมชน เพื่อเข้าใจงานจริง" },
  { check: (c) => c.includes("CLUSTER_SCIENCE"), text: "ฝึกทักษะการคิดแบบวิทยาศาสตร์ เช่น ทำ Project ทดลองง่าย ๆ หรืออ่านบทความวิทย์ภาษาไทย" },
  { check: (c) => c.includes("CLUSTER_MEDIA") || c.includes("CLUSTER_LAW"), text: "ลองฝึกทักษะการพูดและการเขียน เช่น เข้าร่วมชมรมโต้วาที ทำ Content บน Social Media หรืออาสาสมัครในชุมชน" },
  { check: (c) => c.includes("CLUSTER_EDUCATION"), text: "ลองสอนพิเศษน้อง ๆ หรือเป็นผู้ช่วยสอนในโรงเรียน เพื่อทดสอบว่าชอบงานสอนจริงหรือเปล่า" },
  { check: (c) => c.includes("CLUSTER_HOSPITALITY"), text: "ลองฝึกงานในโรงแรม ร้านอาหาร หรือฟาร์ม/สวนเกษตรช่วงปิดเทอม เพื่อสัมผัสบรรยากาศงานจริง" },
  { check: () => true, text: "เข้าไปอ่านข้อมูลรับสมัครล่าสุดที่ mytcas.com และปรึกษาครูแนะแนวหรือผู้ปกครองก่อนตัดสินใจ" },
];

const RIASEC_META = {
  R: { en: "Realistic", color: "#EF4444" },
  I: { en: "Investigative", color: "#3B82F6" },
  A: { en: "Artistic", color: "#8B5CF6" },
  S: { en: "Social", color: "#10B981" },
  E: { en: "Enterprising", color: "#F59E0B" },
  C: { en: "Conventional", color: "#06B6D4" },
};

export default function Report() {
  const navigate = useNavigate();
  const { profileId } = useParams();
  const [result, setResult] = useState(null);
  const [leadUnlocked, setLeadUnlocked] = useState(false);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const sessionRaw = sessionStorage.getItem("tcas_quiz_result");
    let parsedResult = null;
    if (sessionRaw) {
      parsedResult = JSON.parse(sessionRaw);
    } else if (profileId) {
      parsedResult = getStoredQuizResult(profileId);
    }
    if (!parsedResult) { navigate("/results"); return; }
    setResult(parsedResult);
    setLeadUnlocked(Boolean(profileId && hasLeadCapture(profileId)));
    setIsReady(true);
    trackEvent("report_viewed", { page: "report", userProfileId: profileId || null, hasLead: Boolean(profileId && hasLeadCapture(profileId)) });
  }, [navigate, profileId]);

  if (!isReady || !result) return null;

  // ── Lead gate ──
  if (!leadUnlocked) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center px-4 py-10">
        <h1 className="text-2xl font-bold mb-4">รายงานนี้สงวนสิทธิ์เฉพาะผู้ใช้ที่ลงทะเบียน</h1>
        <p className="mb-6 text-slate-600">กรุณากลับไปหน้าผลลัพธ์เพื่อกรอกข้อมูลก่อนเข้าดู PDF</p>
        <Link to="/results" className="text-blue-600 underline">กลับไปหน้าผลลัพธ์</Link>
      </div>
    );
  }

  // ── Extract Data ──
  const typedResult = /** @type {any} */ (result);
  const { profile, clusters, careers, majors, summary } = typedResult;
  
  const topClusters = (clusters ?? careers ?? []).slice(0, 3);
  const clusterIds = topClusters.map(c => c.clusterId);
  const topDims = profile?.traitScores ? profile.traitScores.slice(0, 3).map(t => t.dimension) : [];
  
  // Sort traits by score
  const sortedTraits = [...(profile?.traitScores || [])]
    .filter(t => ["R","I","A","S","E","C"].includes(t.dimension))
    .sort((a, b) => (b.normalizedScore || 0) - (a.normalizedScore || 0));

  // Top Trait details
  const leadingTrait = sortedTraits[0] || { dimension: "I", label: "Investigative (นักวิเคราะห์)" };
  const leadingFull = leadingTrait.label || `${leadingTrait.dimension} - ${RIASEC_META[leadingTrait.dimension]?.en}`;

  // Action rules
  const seen = new Set();
  const actionBullets = ACTION_RULES.filter(rule => {
    if (!rule.check(clusterIds, topDims)) return false;
    if (seen.has(rule.text)) return false;
    seen.add(rule.text);
    return true;
  }).slice(0, 4).map(r => r.text);

  // Date
  const reportDate = new Date().toLocaleDateString('th-TH', { year: 'numeric', month: '2-digit', day: '2-digit' });

  return (
    <div className="min-h-screen bg-slate-100 flex justify-center py-8 print:py-0 print:bg-white overflow-x-hidden">
      
      {/* Screen Toolbar */}
      <div className="fixed top-4 right-4 no-print flex gap-2">
        <button onClick={() => window.print()} className="px-4 py-2 bg-blue-600 text-white rounded text-sm font-semibold shadow hover:bg-blue-700">พิมพ์ / บันทึก PDF</button>
        <button onClick={() => window.close()} className="px-4 py-2 bg-white border border-slate-300 text-slate-600 rounded text-sm hover:bg-slate-50">ปิดหน้าต่าง</button>
      </div>

      {/* A4 Document */}
      <div className="document-a4 bg-white relative">
        
        {/* HEADER */}
        <div className="flex justify-between items-end pb-3 mb-5 border-b-[2px] border-blue-800">
          <div>
            <h1 className="text-[18px] font-bold text-blue-900 leading-none mb-2">ผลการวิเคราะห์บุคลิกภาพและแนวทางการเรียนในอนาคต</h1>
            <p className="text-[10px] text-slate-500">ผู้จัดทำ {appName} · อ้างอิง TCAS67-68 · วันที่ {reportDate}</p>
          </div>
          <div className="text-right">
            <p className="text-[9px] text-slate-500 mb-1">บุคลิกของคุณ</p>
            <p className="text-[14px] font-bold text-blue-800">{leadingFull}</p>
          </div>
        </div>

        {/* SECTION 1: บุคลิกภาพหลัก */}
        <div className="mb-6">
          <h2 className="text-[13px] font-bold text-blue-800 mb-3">บุคลิกภาพหลัก</h2>
          <p className="text-[11.5px] text-slate-700 leading-relaxed mb-3">{summary?.summaryText}</p>
          <ul className="space-y-1.5 pl-1">
            {summary?.bulletPoints?.map((bp, i) => (
              <li key={i} className="text-[11px] text-slate-700 flex items-start gap-2">
                <span className="text-blue-500 font-bold mt-[-1px]">•</span>
                {bp}
              </li>
            ))}
          </ul>
        </div>

        {/* SECTION 2: คะแนน RIASEC */}
        <div className="mb-6">
          <h2 className="text-[13px] font-bold text-blue-800 mb-4">คะแนน RIASEC</h2>
          <div className="w-[60%]">
            {sortedTraits.map(t => {
              const meta = RIASEC_META[t.dimension];
              const score = Math.round(t.normalizedScore || 0);
              return (
                <div key={t.dimension} className="flex items-center gap-3 mb-2.5">
                  <span className="w-[110px] text-[10.5px] font-semibold text-slate-700 shrink-0">
                    {t.dimension} — {meta?.en}
                  </span>
                  <div className="flex-1 h-[7px] bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${score}%`, backgroundColor: meta?.color || '#3B82F6' }} />
                  </div>
                  <span className="w-[20px] text-right text-[10.5px] font-bold text-slate-800">{score}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* SECTION 3: อาชีพ */}
        <div className="mb-6">
          <h2 className="text-[13px] font-bold text-blue-800 mb-3">กลุ่มอาชีพที่เหมาะสม (Top 3)</h2>
          <div className="grid grid-cols-3 gap-4 mb-4">
            {topClusters.map((career, idx) => (
              <div key={idx} className="border border-blue-100 rounded-lg p-3 relative bg-blue-50/30">
                <div className="absolute -top-2 -left-2 w-5 h-5 bg-blue-100 text-blue-800 rounded-full flex items-center justify-center text-[10px] font-bold">
                  {idx + 1}
                </div>
                <h3 className="text-[11.5px] font-bold text-blue-900 mb-2 mt-1">{career.nameTh}</h3>
                <p className="text-[10px] text-slate-600 leading-[1.5] line-clamp-4">{career.descriptionTh || career.description}</p>
              </div>
            ))}
          </div>

          {/* Majors for Top 1 */}
          {topClusters[0] && majors && majors.length > 0 && (
            <div className="pl-1">
              <h3 className="text-[11px] font-bold text-slate-800 mb-2">ตัวอย่างคณะ/สาขาเป้าหมาย (สำหรับอันดับ 1)</h3>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
                {majors.filter(m => m.clusterId === topClusters[0].clusterId).slice(0, 6).map(m => (
                  <div key={m.id} className="text-[10px] text-slate-600 flex items-start gap-1.5">
                    <span className="text-slate-400 mt-[-1px]">-</span>
                    <span>
                      <span className="font-semibold text-slate-700">{m.nameTh}</span> 
                      {m.universityNameTh && <span className="text-slate-500">, {m.universityNameTh}</span>}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* SECTION 4: Action Plan */}
        <div>
          <h2 className="text-[13px] font-bold text-blue-800 mb-3">แผนการต่อไป</h2>
          <div className="space-y-2.5">
            {actionBullets.map((text, i) => (
              <div key={i} className="flex items-start gap-2.5">
                <span className="w-4 h-4 rounded-full bg-blue-100 text-blue-800 flex items-center justify-center text-[9px] font-bold shrink-0 mt-[1px]">
                  {i + 1}
                </span>
                <span className="text-[11px] text-slate-700 leading-snug">{text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* FOOTER */}
        <div className="absolute bottom-[20px] left-[30px] right-[30px] border-t border-slate-200 pt-2 text-[8px] text-slate-400 flex justify-between">
          <span>ผู้จัดทำ {appName} · เอกสารนี้เป็นเพียงแนวทางเบื้องต้น ควรปรึกษาผู้เชี่ยวชาญก่อนตัดสินใจ</span>
          <span>หน้า 1/1</span>
        </div>

      </div>

      {/* STYLES */}
      <style>{`
        .document-a4 {
          width: 210mm;
          min-height: 297mm;
          padding: 30mm 20mm; /* A4 standard margins */
          box-sizing: border-box;
          box-shadow: 0 4px 15px rgba(0,0,0,0.1);
        }

        @media print {
          @page { size: A4 portrait; margin: 0; }
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; background: white; margin: 0; padding: 0; }
          .no-print { display: none !important; }
          .document-a4 { box-shadow: none; padding: 15mm 20mm; min-height: auto; }
        }
      `}</style>
    </div>
  );
}