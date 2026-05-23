import React, { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ArrowLeft, RotateCcw, Sparkles, BarChart3, Briefcase, GraduationCap, Download } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { trackEvent } from "@/lib/analyticsApi";

import RIASECChart from "../components/results/RIASECChart.jsx";
import CareerCard from "@/components/results/CareerCard";
import MajorList from "../components/results/MajorList.jsx";
import OverallFeedbackPanel from "@/components/feedback/OverallFeedbackPanel";
import ActionPlan from "@/components/results/ActionPlan";
import { submitCareerFeedback, submitResultFeedback } from "@/lib/feedbackApi";
import LeadCaptureForm from "@/components/lead/LeadCaptureForm";
import { buildHollandCode } from "@/lib/scoringEngine";
import {
  getStoredUserProfileId,
  hasLeadCapture,
  upsertQuizResult,
  recordProgramInterest,
  getStoredLeadProfile,
} from "@/lib/leadCaptureApi";

const DialogContentAny = /** @type {any} */ (DialogContent);
const DialogHeaderAny = /** @type {any} */ (DialogHeader);
const DialogTitleAny = /** @type {any} */ (DialogTitle);
const DialogDescriptionAny = /** @type {any} */ (DialogDescription);

function getOrCreateSessionProfileId() {
  const key = "tcas_profile_id";
  let id = sessionStorage.getItem(key);
  if (!id) {
    id = "prof_" + Math.random().toString(36).slice(2, 11) + "_" + Date.now();
    sessionStorage.setItem(key, id);
  }
  return id;
}

/** @typedef {{ dimension: string, label?: string, description?: string, score?: number }} TopTrait */
/** @typedef {{ summaryText: string, bulletPoints: string[], topTraits: TopTrait[], acadMathScore?: number, acadSciScore?: number }} SummaryData */
/** @typedef {'R' | 'I' | 'A' | 'S' | 'E' | 'C'} RiasecDimension */
/** @typedef {{ traitScores: Array<{ dimension: RiasecDimension, normalizedScore: number, rawScore?: number }>, hollandCode?: string }} QuizProfile */
/** @typedef {{ careerId: string, clusterId: string, nameTh: string, descriptionTh?: string, whyMatch?: string }} TopCareer */
/** @typedef {{ id: string, nameTh: string, facultyNameTh?: string, clusterId: string, universityId?: string, universityNameTh?: string, universityShortName?: string }} MajorItem */
/** @typedef {{ profile: QuizProfile, clusters: Array<TopCareer>, majors: Array<MajorItem>, summary: SummaryData, hollandCode?: string }} QuizResultData */

export default function Results() {
  const navigate = useNavigate();
  const [result, setResult] = useState(/** @type {QuizResultData | null} */ (null));
  const [leadProfileId, setLeadProfileId] = useState(() => getStoredUserProfileId());
  const [sessionProfileId] = useState(() => getOrCreateSessionProfileId());
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [leadDialogOpen, setLeadDialogOpen] = useState(false);
  const [requestedMajorIds, setRequestedMajorIds] = useState(/** @type {Record<string, boolean>} */ (readRequestedMajors()));
  const [expandedCareerMajors, setExpandedCareerMajors] = useState(/** @type {Record<string, boolean>} */ ({}));

  // Feedback state — keyed by careerId → interestLevel
  const [careerFeedback, setCareerFeedback] = useState(/** @type {Record<string, number>} */ ({}));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);

  useEffect(() => {
    const raw = sessionStorage.getItem("tcas_quiz_result");
    if (!raw) { navigate("/"); return; }
    setResult(JSON.parse(raw));
  }, [navigate]);

  useEffect(() => {
    if (!result || !leadProfileId || !hasLeadCapture(leadProfileId)) return;
    upsertQuizResult(leadProfileId, result).catch((error) => {
      console.error("Results quiz sync failed:", error);
    });
  }, [result, leadProfileId]);

  useEffect(() => {
    if (leadProfileId && hasLeadCapture(leadProfileId)) {
      setIsUnlocked(true);
    }
  }, [leadProfileId]);

  useEffect(() => {
    trackEvent("results_viewed", {
      page: "results",
      hasLead: Boolean(leadProfileId && hasLeadCapture(leadProfileId)),
    });
  }, [leadProfileId]);

  if (!result) return null;

  const typedResult = /** @type {QuizResultData} */ (result);
  const { profile, clusters, majors, summary } = typedResult;
  // Use clusters directly from computeMatches
  const topClusters = clusters ?? [];
  const userProfileId = leadProfileId;
  const hasCapturedLead = isUnlocked || Boolean(userProfileId && hasLeadCapture(userProfileId));
  const leadProfile = userProfileId ? getStoredLeadProfile(userProfileId) : null;
  const hollandCode = typedResult.hollandCode || profile.hollandCode || buildHollandCode(profile.traitScores || []);

  const openReport = () => {
    trackEvent("report_open_clicked", {
      page: "results",
      hasLead: hasCapturedLead,
      userProfileId: userProfileId || null,
    });

    if (!userProfileId || !hasCapturedLead) {
      setLeadDialogOpen(true);
      return;
    }
    window.open(`/report/${userProfileId}`, "_blank");
  };

  /** @param {MajorItem} major */
  const handleProgramInterest = (major) => {
    trackEvent("program_interest_clicked", {
      page: "results",
      userProfileId: userProfileId || null,
      majorId: major.id,
    });

    if (requestedMajorIds?.[major.id]) return;

    if (!userProfileId || !hasCapturedLead) {
      setLeadDialogOpen(true);
      return;
    }

    recordProgramInterest({
      userProfileId,
      majorId: major.id,
      universityId: major.universityId,
      interestLevel: "request_info",
    })
      .then(() => {
        setRequestedMajorIds(prev => {
          const next = { ...prev, [major.id]: true };
          sessionStorage.setItem("kookid_requested_majors", JSON.stringify(next));
          return next;
        });
        trackEvent("program_interest_submitted", {
          page: "results",
          userProfileId,
          majorId: major.id,
        });
        toast.success("เราได้รับคำขอข้อมูลจากคุณแล้ว หากมีโควต้าหรือทุนที่ตรงกับผลของคุณ เราจะติดต่อกลับผ่านข้อมูลที่ให้ไว้");
      })
      .catch((error) => {
        console.error("Program interest submit failed:", error);
        toast.error("บันทึกคำขอข้อมูลไม่สำเร็จ กรุณาลองอีกครั้ง");
      });
  };

  const handleUnlockMajors = () => {
    trackEvent("lead_gate_clicked", {
      page: "results",
      source: "major_teaser",
      userProfileId: userProfileId || null,
    });
    setLeadDialogOpen(true);
  };

  const handleLeadSubmitSuccess = () => {
    setIsUnlocked(true);
    setLeadDialogOpen(false);
    setLeadProfileId(getStoredUserProfileId());
    toast.success("บันทึกข้อมูลเรียบร้อย คุณสามารถดูรายงานฉบับเต็มได้แล้ว");
  };

  /** @param {string} careerId @param {number} level */
  const handleCareerFeedback = (careerId, level) => {
    setCareerFeedback(prev => ({ ...prev, [careerId]: level }));
  };

  /** @param {{ careerId?: string, clusterId?: string, nameTh?: string }} career */
  const handleCareerViewed = (career) => {
    trackEvent("career_viewed", {
      page: "results",
      userProfileId: userProfileId || null,
      careerId: career.careerId || career.clusterId || null,
      careerName: career.nameTh || null,
      clusterId: career.clusterId || null,
    });
  };

  /**
   * Called by OverallFeedbackPanel when user clicks "บันทึก Feedback".
   * Batches all three API calls; errors are non-blocking.
   */
  /** @param {number} overallFitScore @param {string | null} selectedIssue @param {string | null} comment */
  const handleFeedbackSubmit = async (overallFitScore, selectedIssue, comment) => {
    setIsSubmitting(true);
    const careerItems = topClusters.reduce((items, career) => {
      const interestLevel = careerFeedback[career.careerId];
      if (!interestLevel) return items;
      items.push({
        careerClusterId: career.clusterId,
        interestLevel,
      });
      return items;
    }, /** @type {Array<{ careerClusterId: string, interestLevel: number }>} */ ([]));

    try {
      await Promise.all([
        careerItems.length > 0 ? submitCareerFeedback(sessionProfileId, careerItems) : Promise.resolve(),
        submitResultFeedback(sessionProfileId, overallFitScore, selectedIssue, comment),
      ]);
      setFeedbackSubmitted(true);
      toast.success("ขอบคุณสำหรับ Feedback! เราจะใช้ข้อมูลนี้เพื่อปรับการแนะนำให้ดีขึ้นสำหรับคุณและรุ่นน้อง");
    } catch (err) {
      console.error("Feedback submission error:", err);
      toast.error("เกิดข้อผิดพลาดเล็กน้อยในการบันทึก Feedback แต่ผลการทดสอบยังคงอยู่");
    } finally {
      setIsSubmitting(false);
    }
  };

  const topMatch = topClusters[0];
  const remainingCareers = topClusters.slice(1, 5);
  const hasStoredLead = Boolean(userProfileId && hasLeadCapture(userProfileId));
  const unlocked = isUnlocked || hasStoredLead;

  /** @param {string} careerId */
  const toggleCareerMajors = (careerId) => {
    setExpandedCareerMajors((prev) => ({
      ...prev,
      [careerId]: !prev[careerId],
    }));
  };

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      <div className="max-w-5xl mx-auto px-4 py-6 sm:py-10">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-10"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
            <Sparkles className="w-4 h-4" />
            ผลการวิเคราะห์ของคุณ
          </div>
          <div className="text-xs font-semibold tracking-widest text-primary/60 uppercase mb-1">คู่คิด KooKid</div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">สรุปผลแบบทดสอบ</h1>
          {leadProfile?.nickname && leadProfile?.gradeAndSchool && (
            <p className="mt-2 text-sm text-muted-foreground">
              สวัสดี {leadProfile.nickname} จาก {leadProfile.gradeAndSchool}
            </p>
          )}
          <button
            onClick={openReport}
            className="mt-4 inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full border border-border text-sm text-muted-foreground hover:text-foreground hover:border-primary/40 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            ดาวน์โหลดผลเป็น PDF
          </button>
          {!hasStoredLead && (
            <p className="mt-2 text-xs text-muted-foreground">
              กรุณายืนยันข้อมูลติดต่อก่อนเพื่อปลดล็อกรายงานฉบับเต็ม
            </p>
          )}
        </motion.div>

        {/* Section 1: Identity */}
        <section className="flex flex-col gap-6 mb-12 pb-8 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-primary" />
            <h2 className="text-2xl font-bold text-foreground">บุคลิกภาพของคุณ</h2>
          </div>
          <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr] items-start">
            <div className="space-y-4">
              <div>
                <p className="text-xs uppercase tracking-widest text-primary/70 font-semibold">Holland Code</p>
                <p className="mt-1 text-4xl font-bold tracking-[0.2em] text-primary">{hollandCode}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-widest text-primary/70 font-semibold">Archetype</p>
                <p className="mt-1 text-xl font-bold text-foreground">{getArchetypeLabel(hollandCode)}</p>
              </div>
              <p className="text-sm sm:text-base text-foreground/80 leading-relaxed">{summary.summaryText}</p>
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
              <div className="flex flex-wrap gap-2">
                {summary.topTraits.map((t) => (
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

        {/* Section 2: Top Match Hook */}
        <section className="flex flex-col gap-6 mb-12 pb-8 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <Briefcase className="w-5 h-5 text-primary" />
            <h2 className="text-2xl font-bold">🌟 อันดับ 1: {topMatch?.nameTh || "-"}</h2>
          </div>

          {topMatch && (
            <div className="flex flex-col gap-3">
              <CareerCard
                career={topMatch}
                rank={0}
                feedbackValue={careerFeedback[topMatch.careerId]}
                onFeedback={handleCareerFeedback}
                onCareerViewed={handleCareerViewed}
                showMatchScore={false}
                showFeedback={false}
              />

              <div className="space-y-3">
                <h3 className="text-lg font-semibold text-foreground">สาขาวิชา/มหาวิทยาลัยที่เกี่ยวข้องกับอันดับ 1</h3>
                <MajorList
                  majors={majors}
                  topCareers={[topMatch]}
                  onProgramInterest={handleProgramInterest}
                  requestedMajorIds={requestedMajorIds}
                  hasCapturedLead={true}
                  hideFeedback={true}
                />
              </div>
            </div>
          )}
        </section>

        {/* Section 3: Paywall & Remaining Careers */}
        <section className="flex flex-col gap-8 mb-12">
          <div className="flex items-center gap-2">
            <GraduationCap className="w-5 h-5 text-primary" />
            <h2 className="text-2xl font-bold text-foreground">อาชีพและโอกาสที่เหลือ</h2>
          </div>

          {!unlocked ? (
            <div className="relative mt-8 rounded-2xl border border-slate-200 bg-slate-50/50 p-6 sm:p-8 text-center flex flex-col items-center justify-center gap-6 overflow-hidden">
              <div
                className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.55),rgba(248,250,252,0.88)_58%,rgba(248,250,252,0.98))]"
                aria-hidden="true"
              />
              <div className="absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-white/85 to-transparent" aria-hidden="true" />
              <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-slate-50 to-transparent" aria-hidden="true" />
              <div className="relative z-10 w-full max-w-3xl space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 select-none pointer-events-none">
                  {remainingCareers.map((career, index) => (
                    <div
                      key={career.careerId || `${career.clusterId}-${index}`}
                      className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white/85 p-4 text-left shadow-sm"
                    >
                      <div className="space-y-2 blur-[2px] opacity-55">
                        <p className="text-sm font-semibold text-slate-700">อันดับ {index + 2}: {career.nameTh}</p>
                        <p className="text-sm text-slate-500">{career.descriptionTh}</p>
                      </div>
                      <div className="absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-white via-white/95 to-transparent" aria-hidden="true" />
                      <div className="absolute inset-x-3 bottom-3 rounded-full border border-slate-200 bg-white/90 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500 shadow-sm">
                        Preview
                      </div>
                    </div>
                  ))}
                </div>
                <Button
                  type="button"
                  size="lg"
                  onClick={handleUnlockMajors}
                  className="rounded-full px-8 py-6 text-base sm:text-lg font-bold text-white bg-gradient-to-r from-primary to-indigo-500 shadow-[0_18px_50px_rgba(79,70,229,0.35)]"
                >
                  🔒 ยืนยันข้อมูลเพื่อปลดล็อกอีก 4 อาชีพ และโควต้ามหาวิทยาลัยทั้งหมด ฟรี!
                </Button>
              </div>
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25 }}
              className="flex flex-col gap-8"
            >
              {remainingCareers.map((career, index) => {
                const careerKey = career.careerId || `${career.clusterId}-${index}`;
                const isMajorsOpen = Boolean(expandedCareerMajors[careerKey]);

                return (
                  <div key={careerKey} className="flex flex-col gap-4 pb-8 border-b border-slate-200 last:border-b-0 last:pb-0">
                    <h3 className="text-xl font-bold text-slate-800 mt-8">อันดับ {index + 2}: {career.nameTh}</h3>
                    <CareerCard
                      career={career}
                      rank={index + 1}
                      feedbackValue={careerFeedback[career.careerId]}
                      onFeedback={handleCareerFeedback}
                      onCareerViewed={handleCareerViewed}
                      showMatchScore={false}
                      showFeedback={false}
                    />
                    <div className="space-y-3">
                      <Button
                        type="button"
                        variant="secondary"
                        className="w-full justify-between rounded-xl border border-border/60 bg-secondary/70 px-4 py-3 text-left text-sm font-semibold text-foreground hover:bg-secondary"
                        onClick={() => toggleCareerMajors(careerKey)}
                        aria-expanded={isMajorsOpen}
                      >
                        <span>🔽 ดูสาขาวิชาและมหาวิทยาลัยที่รองรับ ของอันดับนี้</span>
                        <span className="text-xs font-medium text-muted-foreground">
                          {isMajorsOpen ? "ซ่อน" : "แสดง"}
                        </span>
                      </Button>

                      {isMajorsOpen && (
                        <div className="space-y-3">
                          <h4 className="text-sm font-semibold text-foreground">สาขาวิชา/มหาวิทยาลัยที่เกี่ยวข้อง</h4>
                          <MajorList
                            majors={majors}
                            topCareers={[career]}
                            onProgramInterest={handleProgramInterest}
                            requestedMajorIds={requestedMajorIds}
                            hasCapturedLead={true}
                            hideFeedback={true}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </motion.div>
          )}
        </section>

        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="mb-10">
          <ActionPlan
            topClusters={topClusters.slice(0, 3)}
            topDims={summary.topTraits?.map((t) => t.dimension) ?? []}
          />
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.26 }} className="mb-10">
          <OverallFeedbackPanel
            onSubmit={handleFeedbackSubmit}
            isSubmitting={isSubmitting}
            submitted={feedbackSubmitted}
          />
        </motion.div>

        <div className="flex flex-wrap items-center justify-center gap-3 pb-10">
          <Link to="/">
            <Button variant="outline" className="rounded-xl">
              <ArrowLeft className="w-4 h-4 mr-1" />
              กลับหน้าแรก
            </Button>
          </Link>
          <Link to="/quiz">
            <Button variant="outline" className="rounded-xl">
              <RotateCcw className="w-4 h-4 mr-1" />
              ทำแบบทดสอบอีกครั้ง
            </Button>
          </Link>
        </div>
      </div>

      <Dialog open={leadDialogOpen} onOpenChange={setLeadDialogOpen}>
        <DialogContentAny className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeaderAny>
            <DialogTitleAny className="text-xl">ยืนยันข้อมูลเพื่อปลดล็อกรายงานและโควต้ามหาวิทยาลัย</DialogTitleAny>
            <DialogDescriptionAny>
              กรอกข้อมูลสั้น ๆ เพื่อปลดล็อกรายการคณะทั้งหมด รับข้อมูลโควต้า ทุนการศึกษา และรายงานที่เหมาะกับคุณได้ครบถ้วน
            </DialogDescriptionAny>
          </DialogHeaderAny>
          <p className="text-xs text-muted-foreground">
            เราจะไม่ส่งข้อมูลของคุณให้มหาวิทยาลัยแบบสุ่ม ข้อมูลจะถูกใช้กับมหาวิทยาลัยที่เกี่ยวข้องกับผลการประเมินของคุณเท่านั้น
          </p>
          <LeadCaptureForm
            onSubmitSuccess={handleLeadSubmitSuccess}
            onCancel={() => setLeadDialogOpen(false)}
            submitLabel="ยืนยัน"
            prefill={leadProfile || undefined}
            className="space-y-4"
          />
        </DialogContentAny>
      </Dialog>
    </div>
  );
}

/** @param {string | undefined | null} hollandCode */
function getArchetypeLabel(hollandCode) {
  const leading = String(hollandCode || "").charAt(0).toUpperCase();
  /** @type {Record<string, string>} */
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

function readRequestedMajors() {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(sessionStorage.getItem("kookid_requested_majors") || "{}");
  } catch {
    return {};
  }
}