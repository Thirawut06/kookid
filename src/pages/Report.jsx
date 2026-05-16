/**
 * Report — A4-optimised printable report page.
 * Route: /report/:profileId
 * Reads quiz result from sessionStorage and renders a one-page print layout.
 */
import React, { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getCareerClusters } from "@/lib/dataLoader";
import LeadCaptureForm from "@/components/lead/LeadCaptureForm";
import { hasLeadCapture, getStoredQuizResult, upsertLeadCapture } from "@/lib/leadCaptureApi";
import { trackEvent } from "@/lib/analyticsApi";

const RIASEC_LABELS = { R: "Realistic", I: "Investigative", A: "Artistic", S: "Social", E: "Enterprising", C: "Conventional" };
const RIASEC_COLORS = { R: "#6366f1", I: "#0ea5e9", A: "#f59e0b", S: "#22c55e", E: "#ef4444", C: "#8b5cf6" };
const ACAD_LABELS = { Academic_Math: "คณิตศาสตร์", Academic_Sci: "วิทยาศาสตร์" };

// Build a lookup map from careerClusters.json by id → cluster data
const CLUSTER_MAP = Object.fromEntries(getCareerClusters().map(c => [c.id, c]));

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

    if (!parsedResult) {
      navigate("/results");
      return;
    }

    setResult(parsedResult);
    setLeadUnlocked(Boolean(profileId && hasLeadCapture(profileId)));
    setIsReady(true);

    trackEvent("report_viewed", {
      page: "report",
      userProfileId: profileId || null,
      hasLead: Boolean(profileId && hasLeadCapture(profileId)),
    });
  }, [navigate, profileId]);

  // Auto-trigger print dialog once content is loaded
  useEffect(() => {
    if (!result || !leadUnlocked) return;
    const timer = setTimeout(() => window.print(), 800);
    return () => clearTimeout(timer);
  }, [result, leadUnlocked]);

  const handleLeadSubmit = async (leadData) => {
    const nextProfileId = await upsertLeadCapture({
      userProfileId: profileId,
      result,
      ...leadData,
    });

    trackEvent("lead_submitted", {
      page: "report",
      userProfileId: nextProfileId,
    });

    const nextResult = { ...result, userProfileId: nextProfileId };
    sessionStorage.setItem("tcas_quiz_result", JSON.stringify(nextResult));
    setResult(nextResult);
    setLeadUnlocked(true);
  };

  if (!isReady || !result) return null;

  if (!leadUnlocked) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4 py-10">
        <Card className="w-full max-w-2xl p-5 sm:p-7 border-border/60 shadow-sm">
          <div className="text-center mb-6">
            <div className="text-xs font-semibold tracking-widest text-primary/60 uppercase mb-2">คู่คิด KooKid</div>
            <h1 className="text-2xl font-bold text-foreground">ยืนยันข้อมูลก่อนดูรายงานฉบับเต็ม</h1>
            <p className="mt-3 text-sm text-muted-foreground">
              รายงานฉบับนี้จะแสดงได้หลังจากยืนยันข้อมูลติดต่อและความยินยอม PDPA ตามความสมัครใจ
            </p>
          </div>
          <LeadCaptureForm
            onSubmit={handleLeadSubmit}
            submitLabel="ยืนยันและดูรายงาน"
            compact
            className="space-y-5"
          />
          <div className="mt-4 text-center">
            <Button asChild variant="ghost" size="sm">
              <Link to="/results">กลับไปหน้าผลการทดสอบ</Link>
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  const { profile, clusters, careers, summary } = result;
  const topClusters = (clusters ?? careers ?? []).slice(0, 3);

  const riasecScores = profile.traitScores
    .filter(ts => ["R", "I", "A", "S", "E", "C"].includes(ts.dimension))
    .sort((a, b) => b.normalizedScore - a.normalizedScore);

  const acadScores = profile.traitScores
    .filter(ts => ["Academic_Math", "Academic_Sci"].includes(ts.dimension));

  const topDims = summary.topTraits?.map(t => t.dimension) ?? [];
  const acadMath = acadScores.find(t => t.dimension === "Academic_Math")?.normalizedScore ?? 0;
  const acadSci  = acadScores.find(t => t.dimension === "Academic_Sci")?.normalizedScore ?? 0;

  return (
    <>
      {/* ── Screen view: header + close hint ────────────────────── */}
      <div className="no-print text-sm px-6 py-3 flex items-center justify-between" style={{background:"#eff6ff",color:"#1a4fba"}}>
        <span className="font-medium"><span className="font-bold mr-2">คู่คิด KooKid</span>รายงานสรุปผล — กด <kbd className="border rounded px-1.5 py-0.5 text-xs font-mono" style={{borderColor:"#93c5fd"}}>Ctrl+P</kbd> หรือ <kbd className="border rounded px-1.5 py-0.5 text-xs font-mono" style={{borderColor:"#93c5fd"}}>⌘P</kbd> เพื่อพิมพ์ / บันทึก PDF</span>
        <button onClick={() => window.close()} className="text-xs underline opacity-70 hover:opacity-100">ปิดหน้าต่าง</button>
      </div>

      {/* ── Printable body ─────────────────────────────────────── */}
      <div id="report-root" className="report-page font-thai text-gray-900 bg-white px-10 py-8 max-w-[210mm] mx-auto">

        {/* Header */}
        <div className="border-b-2 pb-3 mb-5 flex items-end justify-between" style={{borderColor:"#1a4fba"}}>
          <div>
            <h1 className="text-xl font-bold leading-tight" style={{color:"#1a4fba"}}>ผลการวิเคราะห์บุคลิกภาพและแนวทางการเรียน TCAS</h1>
            <p className="text-xs text-gray-400 mt-0.5">คู่คิด KooKid · อ้างอิง TCAS67–68 · วันที่ {new Date().toLocaleDateString("th-TH")}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-500 font-medium">ผลของคุณ</p>
            <p className="text-lg font-bold" style={{color:"#1a4fba"}}>{summary.topTraits?.[0]?.label ?? ""}</p>
          </div>
        </div>

        {/* Section 1 — Personality */}
        <section className="mb-5">
          <h2 className="report-section-title">บุคลิกภาพหลัก</h2>
          <p className="text-sm text-gray-700 leading-relaxed mb-2">{summary.summaryText}</p>
          {summary.bulletPoints?.length > 0 && (
            <ul className="space-y-1">
              {summary.bulletPoints.map((bp, i) => (
                <li key={i} className="flex items-start gap-1.5 text-xs text-gray-600">
                <span className="mt-0.5 shrink-0" style={{color:"#1a4fba"}}>•</span>{bp}
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Section 2 — Scores table */}
        <section className="mb-5">
          <h2 className="report-section-title">คะแนน RIASEC และวิชาการ</h2>
          <div className="grid grid-cols-2 gap-x-6">
            {/* RIASEC bars */}
            <div className="space-y-1.5">
              {riasecScores.map(ts => (
                <div key={ts.dimension} className="flex items-center gap-2">
                  <span className="w-28 text-xs text-gray-600 shrink-0">{ts.dimension} — {RIASEC_LABELS[ts.dimension]}</span>
                  <div className="flex-1 bg-gray-100 rounded-full h-2.5 overflow-hidden">
                    <div className="h-2.5 rounded-full" style={{ width: `${ts.normalizedScore}%`, backgroundColor: RIASEC_COLORS[ts.dimension] ?? "#6366f1" }} />
                  </div>
                  <span className="w-7 text-right text-xs font-semibold text-gray-700">{ts.normalizedScore}</span>
                </div>
              ))}
            </div>
            {/* Academic table */}
            <div>
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="text-left px-2 py-1 border border-gray-200 text-gray-600">วิชา</th>
                    <th className="text-center px-2 py-1 border border-gray-200 text-gray-600">คะแนน (self-assess)</th>
                  </tr>
                </thead>
                <tbody>
                  {acadScores.map(ts => (
                    <tr key={ts.dimension}>
                      <td className="px-2 py-1 border border-gray-200">{ACAD_LABELS[ts.dimension] ?? ts.dimension}</td>
                      <td className="px-2 py-1 border border-gray-200 text-center font-semibold">{ts.normalizedScore}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p className="text-[10px] text-gray-400 mt-1">* คะแนนวิชาการมาจากการประเมินตนเอง ไม่ใช่คะแนนสอบจริง</p>
            </div>
          </div>
        </section>

        {/* Section 3 — Top 3 career clusters */}
        <section className="mb-5">
          <h2 className="report-section-title">กลุ่มอาชีพที่เหมาะสม (Top 3)</h2>
          <div className="grid grid-cols-3 gap-3">
            {topClusters.map((c, i) => {
              const clusterData = CLUSTER_MAP[c.clusterId];
              const examples = clusterData?.exampleCareers?.slice(0, 3) ?? [];
              return (
                <div key={c.clusterId} className="border border-gray-200 rounded-lg p-2.5 bg-gray-50">
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className="text-xs font-bold" style={{color:"#1a4fba"}}>#{i + 1}</span>
                    <span className="text-xs font-semibold text-gray-800 leading-tight">{c.nameTh}</span>
                  </div>
                  <span className="inline-block text-[10px] px-1.5 py-0.5 rounded-full font-semibold mb-1.5" style={{background:"#dbeafe",color:"#1a4fba"}}>{c.matchScore}% ความเหมาะสม</span>
                  {c.whyMatch && <p className="text-[10px] text-gray-500 leading-snug mb-1.5">{c.whyMatch}</p>}
                  {examples.length > 0 && (
                    <p className="text-[10px] text-gray-600">
                      <span className="font-medium">ตัวอย่างอาชีพ:</span> {examples.join(", ")}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* Section 4 — Action Plan (plain list for print) */}
        <section className="mb-5">
          <h2 className="report-section-title">แผนการต่อไป</h2>
          <ActionPlanPrint
            topClusters={topClusters}
          />
        </section>

        {/* Footer */}
        <p className="text-[10px] text-gray-400 border-t pt-2 mt-4 leading-relaxed">
          คู่คิด KooKid · ผลนี้ใช้เพื่อเป็นแนวทางเบื้องต้นเท่านั้น อ้างอิงข้อมูล TCAS67–68 และตลาดแรงงานไทย
          ควรปรึกษาครูแนะแนวหรือผู้ปกครองก่อนตัดสินใจ
        </p>
      </div>

      {/* ── Print-only CSS injected via style tag ─────────────── */}
      <style>{`
        @media print {
          @page { size: A4 portrait; margin: 0; }
          body { margin: 0; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .no-print { display: none !important; }
          #report-root { max-width: 100% !important; padding: 12mm 14mm !important; font-size: 10pt; }
          section { page-break-inside: avoid; }
        }
        @media screen {
          #report-root { box-shadow: 0 0 0 1px #e5e7eb; margin-top: 0; }
        }
        .report-section-title {
          font-size: 0.85rem;
          font-weight: 700;
          color: #1a4fba;
          margin-bottom: 0.5rem;
          padding-bottom: 0.25rem;
          border-bottom: 1px solid #dbeafe;
        }
      `}</style>
    </>
  );
}

/**
 * Inline stripped-down Action Plan for print (no framer-motion, no Card wrapper).
 * Re-implements the same rule logic but outputs plain <li> items.
 */
function ActionPlanPrint({ topClusters }) {
  const clusterIds = topClusters.map(c => c.clusterId);

  const rules = [
    { id: "start", text: "ศึกษาข้อมูลคณะ/สาขาที่สนใจจากเว็บไซต์ TCAS (mytcas.com) และอ่านเกณฑ์รับสมัคร TCAS68 ของแต่ละมหาวิทยาลัย", always: true },
    { id: "eng_it", text: "ฝึกทักษะด้านคณิตศาสตร์และวิทยาศาสตร์เพิ่มเติม — พิจารณาเรียนพิเศษหรือใช้แหล่งเรียนรู้ออนไลน์ เช่น Khan Academy หรือ IPST", condition: () => clusterIds.some(id => ["CLUSTER_ENGINEERING_IT_DATA", "CLUSTER_SCIENCE_RESEARCH", "CLUSTER_HEALTH_MEDICINE_PHARMA"].includes(id)) },
    { id: "health", text: "ตรวจสอบเกณฑ์แพทย์/พยาบาล เช่น คะแนน BMAT, GAT/PAT, TPAT และเตรียมสมัครค่ายโรงพยาบาลหรือโครงการแพทย์ชนบท", condition: () => clusterIds.some(id => ["CLUSTER_HEALTH_MEDICINE_PHARMA", "CLUSTER_HEALTH_NURSING_ALLIED"].includes(id)) },
    { id: "social", text: "พัฒนาทักษะการเขียนและการพูด — เข้าร่วมกิจกรรมโต้วาที อ่านข่าว และฝึกเขียน Essay เพื่อเตรียมสอบ TCAS สายสังคม/กฎหมาย", condition: () => clusterIds.some(id => ["CLUSTER_SOCIAL_LAW_MEDIA", "CLUSTER_EDUCATION_TEACHING"].includes(id)) },
    { id: "biz", text: "ลองทำธุรกิจขนาดเล็กหรือเข้าร่วมโครงการ Young Entrepreneur เพื่อสร้างประสบการณ์และ Portfolio", condition: () => clusterIds.includes("CLUSTER_BUSINESS_ACCOUNTING_ECON") },
    { id: "end", text: "จดบันทึกมหาวิทยาลัยและสาขาที่สนใจอย่างน้อย 3 อันดับ พร้อมตรวจสอบปฏิทิน TCAS68 และเตรียมเอกสารให้พร้อม", always: true },
  ];

  const steps = rules
    .filter(r => r.always || (r.condition && r.condition()))
    .slice(0, 4);

  return (
    <ol className="space-y-1.5">
      {steps.map((s, i) => (
        <li key={s.id} className="flex items-start gap-2 text-xs text-gray-700">
          <span className="shrink-0 w-4 h-4 rounded-full text-[10px] font-bold flex items-center justify-center mt-0.5" style={{background:"#dbeafe",color:"#1a4fba"}}>{i + 1}</span>
          {s.text}
        </li>
      ))}
    </ol>
  );
}