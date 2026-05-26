import React, { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Download, Sparkles, BarChart3, Briefcase, GraduationCap, Target } from "lucide-react";

import { getStoredQuizResult, getStoredLeadProfile, hasLeadCapture } from "@/lib/leadCaptureApi";
import { trackEvent } from "@/lib/analyticsApi";
import { appName, appNameFull } from "@/lib/app-params";
import { buildHollandCode } from "@/lib/scoringEngine";

import RIASECChart from "../components/results/RIASECChart.jsx";
import CareerCard from "@/components/results/CareerCard";
import MajorList from "../components/results/MajorList.jsx";
import LeadCaptureForm from "@/components/lead/LeadCaptureForm";
import reportContent from "@/data/reportContent.json";

const { ARCHETYPE_MAP, SALARY_ESTIMATES, SKILL_SUGGESTIONS, PAINPOINT_ADVICE } = reportContent;

export default function Report() {
  const navigate = useNavigate();
  const { profileId } = useParams();
  const [result, setResult] = useState(null);
  const [leadUnlocked, setLeadUnlocked] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const leadProfile = profileId ? getStoredLeadProfile(profileId) : null;

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

  if (!isReady || !result) return null;

  const typedResult = /** @type {any} */ (result);

  if (!leadUnlocked) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4 py-10">
        <Card className="w-full max-w-2xl p-5 sm:p-7 border-border/60 shadow-sm">
          <div className="text-center mb-6">
            <div className="text-xs font-semibold tracking-widest text-primary/60 uppercase mb-2">{appNameFull}</div>
            <h1 className="text-2xl font-bold text-foreground">🚨 รายงานนี้สงวนสิทธิ์เฉพาะผู้ใช้ Premium (59 บาท)</h1>
            <p className="mt-3 text-sm text-muted-foreground">
              ขออภัย ระบบชำระเงินกำลังปิดปรับปรุงชั่วคราว เราจึงเปิดให้คุณลงทะเบียนเพื่อรับสิทธิ์ดู Report ฉบับเต็มได้ <strong>ฟรี</strong> ด้านล่างนี้
            </p>
          </div>
          <LeadCaptureForm
            onSubmitSuccess={() => {
              setLeadUnlocked(true);
              trackEvent("lead_submitted", { page: "report", userProfileId: profileId || null });
            }}
            submitLabel="ยืนยันและดูรายงาน"
            prefill={leadProfile || undefined}
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

  const { profile, clusters, careers, majors, summary, answers = {} } = typedResult;
  const topClusters = (clusters ?? careers ?? []).slice(0, 5);
  const hollandCode = typedResult.hollandCode || profile.hollandCode || buildHollandCode(profile.traitScores || []);
  const leading = String(hollandCode || "").charAt(0).toUpperCase();
  const archetype = ARCHETYPE_MAP[leading] || { label: "The Explorer", emoji: "🌍", desc: "คุณคือนักสำรวจ พร้อมเปิดรับโอกาสใหม่ๆ เสมอ" };
  
  // Painpoint
  const painpointAnswer = answers?.Q_CON_PAINPOINT;
  const painKeys = Array.isArray(painpointAnswer) ? painpointAnswer : painpointAnswer ? [painpointAnswer] : [];
  const topCareerName = topClusters[0]?.nameTh || "อาชีพอันดับ 1 ของคุณ";
  const painAdvice = painKeys.map(key => {
    const rawAdvice = PAINPOINT_ADVICE[key];
    if (!rawAdvice) return null;
    return {
      title: rawAdvice.title.replace(/\{careerName\}/g, topCareerName),
      items: rawAdvice.items.map(item => item.replace(/\{careerName\}/g, topCareerName))
    };
  }).filter(Boolean);

  const handlePrint = () => window.print();

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      {/* ── Screen header (Hidden when printing) ────────────────── */}
      <div className="no-print bg-gradient-to-r from-blue-50 to-indigo-50 px-4 sm:px-6 py-3 flex flex-col sm:flex-row items-center justify-between gap-2 border-b border-blue-100">
        <span className="text-sm font-medium text-blue-800">
          <span className="font-bold mr-2">{appNameFull}</span>รายงานวิเคราะห์ฉบับเต็ม
        </span>
        <div className="flex items-center gap-3">
          <Button size="sm" onClick={handlePrint} className="rounded-xl gap-2">
            <Download className="w-4 h-4" />
            ดาวน์โหลด PDF
          </Button>
          <button onClick={() => window.close()} className="text-xs underline text-blue-600 opacity-70 hover:opacity-100">ปิดหน้าต่าง</button>
        </div>
      </div>

      <div id="report-root" className="max-w-4xl mx-auto px-4 sm:px-8 py-6 sm:py-10 bg-white">
        
        {/* Report Header */}
        <div className="text-center mb-10 pb-6 border-b border-slate-200">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
            <Sparkles className="w-4 h-4" />
            รายงานวิเคราะห์เชิงลึก (Premium)
          </div>
          <div className="text-xs font-semibold tracking-widest text-primary/60 uppercase mb-1">{appName}</div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">สรุปผลการวิเคราะห์ตัวตนแบบละเอียด</h1>
          {leadProfile?.nickname && leadProfile?.gradeAndSchool && (
            <p className="mt-2 text-sm text-muted-foreground">
              ของ {leadProfile.nickname} จาก {leadProfile.gradeAndSchool}
            </p>
          )}
        </div>

        {/* Section 1: Executive Identity */}
        <section className="flex flex-col gap-6 mb-12 pb-8 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-primary" />
            <h2 className="text-2xl font-bold text-foreground">1. บทสรุปตัวตน (Executive Identity)</h2>
          </div>
          <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr] items-start">
            <div className="space-y-4">
              <div>
                <p className="text-xs uppercase tracking-widest text-primary/70 font-semibold">Holland Code</p>
                <p className="mt-1 text-4xl font-bold tracking-[0.2em] text-primary">{hollandCode}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-widest text-primary/70 font-semibold">Archetype</p>
                <p className="mt-1 text-xl font-bold text-foreground">{archetype.label} {archetype.emoji}</p>
                <p className="text-sm text-muted-foreground mt-1">{archetype.desc}</p>
              </div>
              <p className="text-sm sm:text-base text-foreground/80 leading-relaxed mt-4">{summary.summaryText}</p>
              {summary.bulletPoints?.length > 0 && (
                <ul className="space-y-1.5">
                  {summary.bulletPoints.map((bp, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-foreground/75">
                      <span className="mt-0.5 text-primary">•</span>
                      {bp}
                    </li>
                  ))}
                </ul>
              )}
              <div className="flex flex-wrap gap-2 mt-2">
                {summary.topTraits?.map((t) => (
                  <span key={t.dimension} className="inline-flex items-center px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium">
                    {t.label}
                  </span>
                ))}
              </div>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50/50 p-4">
              <RIASECChart traitScores={profile.traitScores} hollandCode={hollandCode} />
            </div>
          </div>
        </section>

        {/* Section 2: Deep Match */}
        <section className="flex flex-col gap-6 mb-12 pb-8 border-b border-slate-200 print-break-inside-avoid">
          <div className="flex items-center gap-2">
            <Briefcase className="w-5 h-5 text-primary" />
            <h2 className="text-2xl font-bold text-foreground">2. อาชีพที่เหมาะสมที่สุด 5 อันดับ (Deep Match)</h2>
          </div>
          
          <div className="flex flex-col gap-8">
            {topClusters.map((career, index) => {
              const salary = SALARY_ESTIMATES[career.clusterId] || "ขึ้นอยู่กับประสบการณ์และองค์กร";
              const skills = SKILL_SUGGESTIONS[career.clusterId] || { hard: [], soft: [] };

              return (
                <div key={career.careerId || `${career.clusterId}-${index}`} className="flex flex-col gap-4">
                  <h3 className="text-lg font-bold text-slate-800">อันดับ {index + 1}: {career.nameTh}</h3>
                  <CareerCard
                    career={career}
                    rank={index}
                    feedbackValue={undefined}
                    onFeedback={() => {}}
                    onCareerViewed={() => {}}
                    showMatchScore={false}
                    showFeedback={false}
                  />
                  
                  {/* Add Salary & Skills details for the report */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <Card className="p-3 bg-slate-50/50 shadow-sm border-slate-200">
                      <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider mb-1">💰 เงินเดือนเฉลี่ย (เริ่มต้น)</p>
                      <p className="text-sm font-semibold text-foreground">{salary}</p>
                    </Card>
                    <Card className="p-3 bg-slate-50/50 shadow-sm border-slate-200">
                      <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider mb-1">🛠 Hard Skills</p>
                      <p className="text-sm text-foreground/80">{skills.hard.join(", ") || "-"}</p>
                    </Card>
                    <Card className="p-3 bg-slate-50/50 shadow-sm border-slate-200">
                      <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider mb-1">🤝 Soft Skills</p>
                      <p className="text-sm text-foreground/80">{skills.soft.join(", ") || "-"}</p>
                    </Card>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Section 3: Target Lock */}
        <section className="flex flex-col gap-6 mb-12 pb-8 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <GraduationCap className="w-5 h-5 text-primary" />
            <h2 className="text-2xl font-bold text-foreground">3. ลายแทงคณะและมหาวิทยาลัย (Target Lock)</h2>
          </div>
          <p className="text-sm text-muted-foreground mb-2">สาขาวิชาและมหาวิทยาลัยที่รองรับอาชีพทั้ง 5 อันดับของคุณ</p>
          <MajorList
            majors={majors}
            topCareers={topClusters}
            hasCapturedLead={true}
            hideFeedback={true}
          />
        </section>

        {/* Section 4: Painkiller */}
        <section className="flex flex-col gap-6 mb-12 print-break-inside-avoid">
          <div className="flex items-center gap-2">
            <Target className="w-5 h-5 text-primary" />
            <h2 className="text-2xl font-bold text-foreground">4. กลยุทธ์แก้ปัญหาเฉพาะคุณ (Painkiller)</h2>
          </div>
          
          <div className="space-y-4">
            {painAdvice.length > 0 ? (
              painAdvice.map((advice, idx) => (
                <Card key={idx} className="p-5 bg-amber-50/40 border-amber-200/60 shadow-sm">
                  <h3 className="text-base font-bold text-amber-800 mb-3">{advice.title}</h3>
                  <ol className="space-y-2.5">
                    {advice.items.map((item, j) => (
                      <li key={j} className="flex items-start gap-2.5 text-sm text-slate-700">
                        <span className="shrink-0 w-5 h-5 rounded-full text-xs font-bold flex items-center justify-center mt-0.5 bg-amber-200 text-amber-800">
                          {j + 1}
                        </span>
                        <span className="leading-relaxed">{item}</span>
                      </li>
                    ))}
                  </ol>
                </Card>
              ))
            ) : (
              <Card className="p-5 bg-blue-50/40 border-blue-200/60 shadow-sm">
                <h3 className="text-base font-bold text-blue-800 mb-3">📌 คำแนะนำทั่วไปสำหรับเตรียมสอบ TCAS</h3>
                <ol className="space-y-2.5">
                  <li className="flex items-start gap-2.5 text-sm text-slate-700">
                    <span className="shrink-0 w-5 h-5 rounded-full text-xs font-bold flex items-center justify-center mt-0.5 bg-blue-200 text-blue-800">1</span>
                    เข้า mytcas.com ดู TCAS Calendar ล่าสุด จด deadline รอบ 1–4 ลงปฏิทิน
                  </li>
                  <li className="flex items-start gap-2.5 text-sm text-slate-700">
                    <span className="shrink-0 w-5 h-5 rounded-full text-xs font-bold flex items-center justify-center mt-0.5 bg-blue-200 text-blue-800">2</span>
                    ตรวจสอบเกณฑ์ขั้นต่ำ (GPAX, คะแนนสอบ) ของคณะที่สนใจ เทียบกับคะแนนตัวเอง
                  </li>
                  <li className="flex items-start gap-2.5 text-sm text-slate-700">
                    <span className="shrink-0 w-5 h-5 rounded-full text-xs font-bold flex items-center justify-center mt-0.5 bg-blue-200 text-blue-800">3</span>
                    สมัครอย่างน้อย 3 อันดับ กระจายรอบ TCAS เพื่อเพิ่มโอกาสติด
                  </li>
                </ol>
              </Card>
            )}
          </div>
        </section>

      </div>
      
      {/* Print styles */}
      <style>{`
        @media print {
          @page { size: A4 portrait; margin: 10mm; }
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .no-print { display: none !important; }
          #report-root { padding: 0 !important; max-width: 100% !important; }
          .print-break-inside-avoid { page-break-inside: avoid; }
          
          /* Hide animations when printing */
          * { animation: none !important; transition: none !important; }
        }
      `}</style>
    </div>
  );
}