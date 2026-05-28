import React, { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Loader2 } from "lucide-react";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";

import { getStoredQuizResult, hasLeadCapture, getStoredLeadProfile } from "@/lib/leadCaptureApi";
import { trackEvent } from "@/lib/analyticsApi";
import { appName } from "@/lib/app-params";
import reportContent from "@/data/reportContent.json";

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
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  const handleDownloadPDF = async () => {
    setIsGeneratingPdf(true);
    try {
      const element = document.getElementById("report-pdf-content");
      if (!element) return;
      
      // Ensure fonts are loaded before capturing
      if (document.fonts) {
        await document.fonts.ready;
      }
      
      const originalScrollY = window.scrollY;
      window.scrollTo(0, 0);
      
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        windowWidth: 1024,
        scrollY: 0,
        onclone: (documentClone) => {
          const clonedElement = documentClone.getElementById("report-pdf-content");
          if (clonedElement) {
            // Force exact A4 width and align left to prevent right-side cropping
            clonedElement.style.width = "794px";
            clonedElement.style.maxWidth = "794px";
            clonedElement.style.margin = "0"; // Override 'margin: 0 auto'
            clonedElement.style.boxShadow = "none";
            
            // Fix Thai font baseline offset by overriding font-family and line-height during snapshot
            const style = documentClone.createElement("style");
            style.innerHTML = `
              #report-pdf-content, #report-pdf-content * {
                font-family: Tahoma, "Sarabun", sans-serif !important;
                line-height: 1.5 !important;
              }
            `;
            documentClone.head.appendChild(style);
          }
        }
      });
      
      window.scrollTo(0, originalScrollY);
      
      const imgData = canvas.toDataURL("image/jpeg", 0.95);
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });
      
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      
      pdf.addImage(imgData, "JPEG", 0, 0, pdfWidth, pdfHeight);
      
      const pdfBlob = pdf.output("blob");
      const fileName = `KooKid-Report.pdf`;

      const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

      // Use Web Share API only on mobile devices
      if (isMobile && navigator.share && navigator.canShare && navigator.canShare({ files: [new File([pdfBlob], fileName, { type: 'application/pdf' })] })) {
        try {
          await navigator.share({
            files: [new File([pdfBlob], fileName, { type: 'application/pdf' })],
            title: 'KooKid Report',
          });
        } catch (shareError) {
          console.log("Share cancelled or failed", shareError);
          // Fallback if share fails but was initiated
        }
      } else {
        pdf.save(fileName);
      }
      
    } catch (error) {
      console.error("PDF generation failed", error);
      alert("เกิดข้อผิดพลาดในการสร้าง PDF กรุณาลองใหม่อีกครั้ง");
    } finally {
      setIsGeneratingPdf(false);
    }
  };

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
  const leadProfile = profileId ? getStoredLeadProfile(profileId) : null;
  const userName = leadProfile?.nickname;
  const userSchool = leadProfile?.gradeAndSchool;
  
  const topClusters = (clusters ?? careers ?? []).slice(0, 3);
  const clusterIds = topClusters.map(c => c.clusterId);
  
  // Sort traits by score from actual data
  const sortedTraits = [...(profile?.traitScores || [])]
    .filter(t => ["R","I","A","S","E","C"].includes(t.dimension))
    .sort((a, b) => (b.normalizedScore || 0) - (a.normalizedScore || 0));

  const topDims = sortedTraits.slice(0, 3).map(t => t.dimension);
  const hollandCode3 = typedResult.hollandCode || profile?.hollandCode || topDims.join("");
  
  // Top Trait details
  const leadingTrait = sortedTraits[0] || { dimension: "I", label: "Investigative (นักวิเคราะห์)" };
  const leadingFull = leadingTrait.label || `${leadingTrait.dimension} - ${RIASEC_META[leadingTrait.dimension]?.en}`;

  // Balanced Majors for Top 3
  const displayMajors = [];
  if (majors && topClusters.length > 0) {
    topClusters.forEach(cluster => {
      const clusterMajors = majors.filter(m => m.clusterId === cluster.clusterId);
      displayMajors.push(...clusterMajors.slice(0, 2));
    });
    if (displayMajors.length < 6) {
      const existingIds = new Set(displayMajors.map(m => m.id));
      const extra = majors.filter(m => clusterIds.includes(m.clusterId) && !existingIds.has(m.id));
      displayMajors.push(...extra.slice(0, 6 - displayMajors.length));
    }
  }

  // Action rules (from PAINPOINT_ADVICE)
  const topCareerName = topClusters[0]?.nameTh || "สาขาที่คุณสนใจ";
  const actionBullets = [];
  if (reportContent.PAINPOINT_ADVICE) {
    const adv = reportContent.PAINPOINT_ADVICE;
    if (adv.portfolio) actionBullets.push(adv.portfolio.items[0].replace(/{careerName}/g, topCareerName));
    if (adv.interview) actionBullets.push(adv.interview.items[0].replace(/{careerName}/g, topCareerName));
    if (adv.finding_info) actionBullets.push(adv.finding_info.items[0].replace(/{careerName}/g, topCareerName));
  }

  // Date
  const reportDate = new Date().toLocaleDateString('th-TH', { year: 'numeric', month: '2-digit', day: '2-digit' });

  return (
    <div className="min-h-screen bg-slate-50 print:bg-white flex flex-col items-center">
      
      {/* Screen Toolbar (Standard Sticky Top Bar) */}
      <div className="w-full bg-white border-b border-slate-200 p-3 sm:p-4 sticky top-0 z-50 no-print flex justify-center sm:justify-between items-center shadow-sm">
        <div className="text-sm font-bold text-slate-800 hidden sm:block pl-2">รายงานผล KooKid</div>
        <div className="flex gap-2 w-full sm:w-auto">
          <button onClick={() => window.close()} className="flex-1 sm:flex-none px-4 py-2.5 sm:py-2 bg-white border border-slate-300 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-50">ปิดหน้าต่าง</button>
          <button 
            onClick={handleDownloadPDF} 
            disabled={isGeneratingPdf}
            className="flex-1 sm:flex-none px-4 py-2.5 sm:py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold shadow hover:bg-blue-700 disabled:opacity-70 flex items-center justify-center"
          >
            {isGeneratingPdf ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                กำลังสร้าง PDF...
              </>
            ) : (
              "ดาวน์โหลด PDF"
            )}
          </button>
        </div>
      </div>

      <div className="w-full flex justify-center p-0 sm:p-8 print:p-0">
        {/* A4 Document */}
        <div id="report-pdf-content" className="document-a4 bg-white relative">
        
        {/* HEADER */}
        <div className="flex flex-col sm:flex-row print:flex-row justify-between items-start sm:items-end print:items-end pb-4 mb-4 border-b-[2px] border-blue-800 gap-4 sm:gap-0 print:gap-0">
          <div>
            <h1 className="text-[19px] font-bold text-blue-900 leading-tight mb-2">ผลการวิเคราะห์บุคลิกภาพและแนวทางการเรียนในอนาคต</h1>
            <p className="text-[11.5px] text-slate-500 font-medium">ผู้จัดทำ {appName} · อ้างอิงรายชื่อคณะและสาขาจากระบบ TCAS · วันที่ {reportDate}</p>
          </div>
          <div className="text-left sm:text-right print:text-right shrink-0">
            {userName ? (
              <>
                <p className="text-[13px] font-bold text-blue-800 mb-0.5">คุณ {userName}</p>
                {userSchool && <p className="text-[11px] font-medium text-slate-600">{userSchool}</p>}
              </>
            ) : null}
          </div>
        </div>

        {/* SECTION 1: บุคลิกภาพหลัก */}
        <div className="mb-4 border-b border-slate-100 pb-4 flex flex-col sm:flex-row print:flex-row gap-6">
          <div className="flex-1">
            <h2 className="text-[14.5px] font-bold text-blue-800 mb-2.5 flex items-center gap-2">
              <span className="w-1.5 h-3.5 bg-blue-600 rounded-full"></span>
              สรุปบุคลิกภาพหลักของคุณ
            </h2>
            <p className="text-[13px] text-slate-700 leading-relaxed mb-3">{summary?.summaryText}</p>
            <ul className="space-y-2 pl-2">
              {summary?.bulletPoints?.map((bp, i) => (
                <li key={i} className="text-[12.5px] text-slate-700 flex items-start gap-2">
                  <span className="text-blue-500 font-bold mt-[1px]">•</span>
                  {bp}
                </li>
              ))}
            </ul>
          </div>
          <div className="w-full sm:w-[30%] print:w-[30%] shrink-0 sm:border-l-[2px] print:border-l-[2px] border-slate-100 sm:pl-6 print:pl-6 py-1 flex flex-col justify-center">
            <p className="text-[10px] text-slate-500 mb-1.5 uppercase tracking-wider font-bold">Holland Code</p>
            <p className="text-[36px] font-black text-blue-900 mb-0.5 tracking-[0.1em] leading-none">{hollandCode3}</p>
            <p className="text-[13.5px] font-bold text-blue-600 mb-2.5">{getArchetypeLabel(hollandCode3)}</p>
            <div className="pt-2 border-t border-slate-100">
              <p className="text-[10.5px] text-slate-500 mb-0.5 font-medium">บุคลิกภาพหลักที่โดดเด่นที่สุด</p>
              <p className="text-[12px] font-bold text-slate-800">{leadingFull}</p>
            </div>
          </div>
        </div>

        {/* SECTION 2: คะแนน RIASEC */}
        <div className="mb-4 border-b border-slate-100 pb-4">
          <h2 className="text-[14.5px] font-bold text-blue-800 mb-3 flex items-center gap-2">
            <span className="w-1.5 h-3.5 bg-blue-600 rounded-full"></span>
            ผลคะแนนความถนัด RIASEC
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 print:grid-cols-2 gap-x-12 gap-y-3">
            {sortedTraits.map(t => {
              const meta = RIASEC_META[t.dimension];
              const score = Math.round(t.normalizedScore || 0);
              return (
                <div key={t.dimension} className="flex items-center gap-3">
                  <span className="w-[130px] text-[12px] font-semibold text-slate-700 shrink-0">
                    {t.dimension} — {meta?.en}
                  </span>
                  <div className="flex-1 h-[6px] bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${score}%`, backgroundColor: meta?.color || '#3B82F6' }} />
                  </div>
                  <span className="w-[24px] text-right text-[12.5px] font-bold text-slate-800">{score}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* SECTION 3: อาชีพ */}
        <div className="mb-4 border-b border-slate-100 pb-4">
          <h2 className="text-[14.5px] font-bold text-blue-800 mb-3 flex items-center gap-2">
            <span className="w-1.5 h-3.5 bg-blue-600 rounded-full"></span>
            กลุ่มอาชีพที่เหมาะสมกับคุณ (Top 3)
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 print:grid-cols-3 gap-5 mb-4">
            {topClusters.map((career, idx) => (
              <div key={idx} className="border border-slate-200 rounded-lg p-3.5 relative flex flex-col justify-between">
                <div className="absolute -top-2.5 -left-2.5 w-6 h-6 bg-slate-800 text-white rounded-full flex items-center justify-center text-[11.5px] font-bold shadow-sm">
                  {idx + 1}
                </div>
                <div>
                  <h3 className="text-[13px] font-bold text-slate-900 mb-1.5 mt-0.5 leading-tight break-words">{career.nameTh}</h3>
                  <div className="text-[10.5px] font-bold text-emerald-700 mb-1.5 flex items-start gap-1">
                    <span className="mt-[1px]">💰</span> <span className="leading-tight">{reportContent.SALARY_ESTIMATES?.[career.clusterId] || "ตามประสบการณ์"}</span>
                  </div>
                  <p className="text-[10.5px] text-slate-600 leading-snug break-words">
                    <span className="font-semibold text-slate-700">Skills: </span> 
                    {reportContent.SKILL_SUGGESTIONS?.[career.clusterId]?.hard?.join(", ") || "-"}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Balanced Majors */}
          {displayMajors.length > 0 && (
            <div className="pl-1 mt-4">
              <h3 className="text-[13px] font-bold text-slate-800 mb-2.5">ตัวอย่างคณะ/สาขาเป้าหมายที่เกี่ยวข้อง</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 print:grid-cols-2 gap-x-6 gap-y-2">
                {displayMajors.map((m, idx) => (
                  <div key={`${m.id}-${idx}`} className="text-[11.5px] text-slate-600 flex items-start gap-1.5">
                    <span className="text-slate-400 font-bold mt-[0px]">-</span>
                    <span className="leading-snug">
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
        <div className="mb-2">
          <h2 className="text-[14.5px] font-bold text-blue-800 mb-2.5 flex items-center gap-2">
            <span className="w-1.5 h-3.5 bg-blue-600 rounded-full"></span>
            แผนการเตรียมตัวต่อไป (Action Plan)
          </h2>
          <div className="space-y-2 pl-1">
            {actionBullets.map((text, i) => (
              <div key={i} className="flex items-start gap-2">
                <span className="text-blue-600 font-bold mt-[1px]">{i + 1}.</span>
                <span className="text-[12px] text-slate-700 leading-relaxed">{text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* FOOTER */}
        <div className="absolute bottom-[20px] sm:bottom-[15mm] left-[20px] sm:left-[15mm] right-[20px] sm:right-[15mm] border-t-2 border-slate-100 pt-3 flex justify-center text-center text-[10px] text-slate-500">
          <span>© {new Date().getFullYear()} {appName} · เอกสารนี้เป็นเพียงแนวทางเบื้องต้น ผู้ใช้งานต้องตรวจสอบระเบียบการรับสมัครอย่างเป็นทางการของมหาวิทยาลัยอีกครั้งก่อนตัดสินใจ</span>
        </div>

        </div>
      </div>

      {/* STYLES */}
      <style>{`
        .document-a4 {
          width: 100%;
          max-width: 210mm;
          min-height: 297mm;
          padding: 24px; 
          padding-bottom: 80px;
          box-sizing: border-box;
          box-shadow: none;
          margin: 0 auto;
        }

        @media (min-width: 640px) {
          .document-a4 {
            padding: 15mm; 
            box-shadow: 0 4px 15px rgba(0,0,0,0.05);
          }
        }

        @media print {
          @page { size: A4 portrait; margin: 0; }
          body { 
            -webkit-print-color-adjust: exact !important; 
            print-color-adjust: exact !important; 
            background: white !important; 
            margin: 0; 
            padding: 0; 
          }
          .no-print { display: none !important; }
          .document-a4 { 
            width: 210mm !important;
            max-width: 210mm !important;
            box-shadow: none !important; 
            margin: 0 !important; 
            border: none !important;
            padding: 15mm !important;
          }
        }
      `}</style>
    </div>
  );
}

function getArchetypeLabel(hollandCode) {
  const leading = String(hollandCode || "").charAt(0).toUpperCase();
  const archetypes = {
    E: "The Leader",
    I: "The Thinker",
    A: "The Creator",
    S: "The Helper",
    R: "The Builder",
    C: "The Organizer",
  };
  return archetypes[leading] || "The Explorer";
}