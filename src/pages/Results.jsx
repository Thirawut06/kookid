import React, { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ArrowLeft, RotateCcw, Sparkles, BarChart3, Briefcase, GraduationCap, Download, ListChecks } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { trackEvent } from "@/lib/analyticsApi";

import RIASECChart from "@/components/results/RIASECChart";
import AcademicScores from "@/components/results/AcademicScores";
import CareerCard from "@/components/results/CareerCard";
import MajorList from "@/components/results/MajorList";
import OverallFeedbackPanel from "@/components/feedback/OverallFeedbackPanel";
import ActionPlan from "@/components/results/ActionPlan";
import { submitCareerFeedback, submitMajorFeedback, submitResultFeedback } from "@/lib/feedbackApi";
import LeadCaptureForm from "@/components/lead/LeadCaptureForm";
import { buildHollandCode } from "@/lib/scoringEngine";
import {
  getStoredUserProfileId,
  hasLeadCapture,
  upsertLeadCapture,
  upsertQuizResult,
  recordProgramInterest,
  getStoredLeadProfile,
} from "@/lib/leadCaptureApi";

function getOrCreateSessionProfileId() {
  const key = "tcas_profile_id";
  let id = sessionStorage.getItem(key);
  if (!id) {
    id = "prof_" + Math.random().toString(36).slice(2, 11) + "_" + Date.now();
    sessionStorage.setItem(key, id);
  }
  return id;
}

export default function Results() {
  const navigate = useNavigate();
  const [result, setResult] = useState(null);
  const [leadProfileId, setLeadProfileId] = useState(() => getStoredUserProfileId());
  const [sessionProfileId] = useState(() => getOrCreateSessionProfileId());
  const [leadDialogOpen, setLeadDialogOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState(null);
  const [requestedMajorIds, setRequestedMajorIds] = useState(() => readRequestedMajors());

  // Feedback state — keyed by clusterId / majorId → interestLevel
  const [careerFeedback, setCareerFeedback] = useState({});
  const [majorFeedback, setMajorFeedback] = useState({});
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
    trackEvent("results_viewed", {
      page: "results",
      hasLead: Boolean(leadProfileId && hasLeadCapture(leadProfileId)),
    });
  }, [leadProfileId]);

  if (!result) return null;

  const { profile, clusters, majors, summary } = result;
  // Use clusters directly from computeMatches
  const topClusters = clusters ?? [];
  const userProfileId = leadProfileId;
  const hasCapturedLead = Boolean(userProfileId && hasLeadCapture(userProfileId));
  const leadProfile = userProfileId ? getStoredLeadProfile(userProfileId) : null;
  const hollandCode = result.hollandCode || profile.hollandCode || buildHollandCode(profile.traitScores || []);

  const openReport = () => {
    trackEvent("report_open_clicked", {
      page: "results",
      hasLead: hasCapturedLead,
      userProfileId: userProfileId || null,
    });

    if (!userProfileId || !hasCapturedLead) {
      setPendingAction({ type: "report" });
      setLeadDialogOpen(true);
      return;
    }
    window.open(`/report/${userProfileId}`, "_blank");
  };

  const handleProgramInterest = (major) => {
    trackEvent("program_interest_clicked", {
      page: "results",
      userProfileId: userProfileId || null,
      majorId: major.id,
    });

    if (requestedMajorIds?.[major.id]) return;

    if (!userProfileId || !hasCapturedLead) {
      setPendingAction({ type: "program_interest", majorId: major.id, universityId: major.universityId });
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

  const handleLeadSubmit = async (leadData) => {
    const nextProfileId = await upsertLeadCapture({
      userProfileId,
      result,
      ...leadData,
    });

    trackEvent("lead_submitted", {
      page: "results",
      userProfileId: nextProfileId,
    });

    setLeadProfileId(nextProfileId);
    sessionStorage.setItem("tcas_quiz_result", JSON.stringify({ ...result, userProfileId: nextProfileId }));

    if (pendingAction?.type === "program_interest") {
      await recordProgramInterest({
        userProfileId: nextProfileId,
        majorId: pendingAction.majorId,
        universityId: pendingAction.universityId,
        interestLevel: "request_info",
      });
      setRequestedMajorIds(prev => {
        const next = { ...prev, [pendingAction.majorId]: true };
        sessionStorage.setItem("kookid_requested_majors", JSON.stringify(next));
        return next;
      });
      trackEvent("program_interest_submitted", {
        page: "results",
        userProfileId: nextProfileId,
        majorId: pendingAction.majorId,
      });
      toast.success("เราได้รับคำขอข้อมูลจากคุณแล้ว หากมีโควต้าหรือทุนที่ตรงกับผลของคุณ เราจะติดต่อกลับผ่านข้อมูลที่ให้ไว้");
    } else if (pendingAction?.type === "report") {
      window.open(`/report/${nextProfileId}`, "_blank");
      toast.success("บันทึกข้อมูลเรียบร้อย คุณสามารถดูรายงานฉบับเต็มได้แล้ว");
    } else {
      toast.success("บันทึกข้อมูลเรียบร้อย คุณสามารถดูรายงานฉบับเต็มได้แล้ว");
    }
    setPendingAction(null);
    setLeadDialogOpen(false);
  };

  const handleCareerFeedback = (clusterId, level) => {
    setCareerFeedback(prev => ({ ...prev, [clusterId]: level }));
  };

  const handleMajorFeedback = (majorId, level) => {
    setMajorFeedback(prev => ({ ...prev, [majorId]: level }));
  };

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
  const handleFeedbackSubmit = async (overallFitScore, selectedIssue, comment) => {
    setIsSubmitting(true);
    const careerItems = Object.entries(careerFeedback).map(([careerClusterId, interestLevel]) => ({
      careerClusterId, interestLevel,
    }));
    const majorItems = Object.entries(majorFeedback).map(([majorId, interestLevel]) => ({
      majorId, interestLevel,
    }));

    try {
      await Promise.all([
        careerItems.length > 0 ? submitCareerFeedback(sessionProfileId, careerItems) : Promise.resolve(),
        majorItems.length > 0 ? submitMajorFeedback(sessionProfileId, majorItems) : Promise.resolve(),
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

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-4 py-6 sm:py-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
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
          {!hasCapturedLead && (
            <p className="mt-2 text-xs text-muted-foreground">
              กรุณายืนยันข้อมูลติดต่อก่อนเพื่อปลดล็อกรายงานฉบับเต็ม
            </p>
          )}
        </motion.div>

        {/* Personality Summary */}
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card className="p-5 sm:p-6 border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-card mb-8">
            <h2 className="text-lg font-semibold text-foreground mb-3 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              บุคลิกภาพของคุณ
            </h2>
            <div className="mb-4 rounded-2xl border border-primary/20 bg-background/80 px-4 py-3">
              <p className="text-sm text-muted-foreground">รหัสบุคลิกภาพ Holland Code ของคุณคือ</p>
              <p className="mt-1 text-2xl sm:text-3xl font-bold tracking-[0.2em] text-primary">{hollandCode}</p>
            </div>
            <p className="text-sm sm:text-base text-foreground/80 leading-relaxed">{summary.summaryText}</p>
            {/* Bullet points from rule-based personality analysis */}
            {summary.bulletPoints?.length > 0 && (
              <ul className="mt-3 space-y-1.5">
                {summary.bulletPoints.map((bp, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-foreground/75">
                    <span className="mt-0.5 text-primary">•</span>
                    {bp}
                  </li>
                ))}
              </ul>
            )}
            <div className="flex flex-wrap gap-2 mt-4">
              {summary.topTraits.map(t => (
                <span key={t.dimension} className="inline-flex items-center px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium">
                  {t.label} ({t.score})
                </span>
              ))}
            </div>
          </Card>
        </motion.div>

        {/* RIASEC Chart */}
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="mb-8">
          <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-primary" />
            คะแนน RIASEC ของคุณ
          </h2>
          <Card className="p-5 sm:p-6 border border-border/50">
            <RIASECChart traitScores={profile.traitScores} hollandCode={hollandCode} />
          </Card>
        </motion.div>

        {/* Academic Scores */}
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="mb-8">
          <h2 className="text-lg font-semibold text-foreground mb-4">📊 คะแนนด้านวิชาการ</h2>
          <AcademicScores traitScores={profile.traitScores} />
        </motion.div>

        {/* Top Career Clusters — with per-career feedback */}
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="mb-8">
          <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
            <Briefcase className="w-5 h-5 text-primary" />
            กลุ่มอาชีพที่เหมาะกับคุณ (Top 5)
          </h2>
          <div className="space-y-3">
            {topClusters.map((c, i) => (
              <CareerCard
                key={c.clusterId}
                career={c}
                rank={i}
                feedbackValue={careerFeedback[c.clusterId]}
                onFeedback={handleCareerFeedback}
                onCareerViewed={handleCareerViewed}
              />
            ))}
          </div>
        </motion.div>

        {/* Suggested Majors — with per-major feedback */}
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="mb-8">
          <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
            <GraduationCap className="w-5 h-5 text-primary" />
            สาขาวิชาที่แนะนำ
          </h2>
          <p className="text-xs text-muted-foreground mb-3">
            เราจะไม่ส่งข้อมูลของคุณให้มหาวิทยาลัยแบบสุ่ม ข้อมูลจะถูกใช้กับมหาวิทยาลัยที่เกี่ยวข้องกับผลการประเมินของคุณเท่านั้น
          </p>
          <Card className="p-5 sm:p-6 border border-border/50">
            <MajorList
              majors={majors}
              topCareers={topClusters}
              majorFeedback={majorFeedback}
              onMajorFeedback={handleMajorFeedback}
              onProgramInterest={handleProgramInterest}
              requestedMajorIds={requestedMajorIds}
            />
          </Card>
        </motion.div>

        {/* Action Plan — below majors, above feedback */}
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }} className="mb-8">
          <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
            <ListChecks className="w-5 h-5 text-primary" />
            แผนการต่อไปของคุณ
          </h2>
          <ActionPlan
            topClusters={topClusters.slice(0, 3)}
            acadMathScore={summary.acadMathScore ?? 0}
            acadSciScore={summary.acadSciScore ?? 0}
            topDims={summary.topTraits?.map(t => t.dimension) ?? []}
          />
        </motion.div>

        {/* Overall Feedback Panel */}
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="mb-10">
          <OverallFeedbackPanel
            onSubmit={handleFeedbackSubmit}
            isSubmitting={isSubmitting}
            submitted={feedbackSubmitted}
          />
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.55 }} className="mb-10">
          <Card className="p-5 sm:p-6 border border-border/50">
            <h3 className="text-base font-semibold text-foreground mb-3">คำถามที่พบบ่อย</h3>
            <div className="space-y-3 text-sm">
              <div>
                <p className="font-medium text-foreground">ข้อมูลของฉันถูกใช้ทำอะไร?</p>
                <p className="text-muted-foreground mt-1">ใช้เพื่อแนะนำโควต้า ทุนการศึกษา และข้อมูลที่สอดคล้องกับผลการประเมินของคุณเท่านั้น</p>
              </div>
              <div>
                <p className="font-medium text-foreground">ต้องเสียเงินไหม?</p>
                <p className="text-muted-foreground mt-1">ไม่มีค่าใช้จ่าย คุณสามารถขอข้อมูลโควต้า/ทุนได้ฟรี</p>
              </div>
              <div>
                <p className="font-medium text-foreground">มหาวิทยาลัยจะติดต่อมาเมื่อไหร่?</p>
                <p className="text-muted-foreground mt-1">โดยทั่วไปจะมีการติดต่อเมื่อมีโควต้าหรือทุนที่ตรงกับผลของคุณผ่านช่องทางที่คุณให้ไว้</p>
              </div>
              <div>
                <p className="font-medium text-foreground">ต้องกรอกข้อมูลซ้ำทุกครั้งไหม?</p>
                <p className="text-muted-foreground mt-1">หากใช้อุปกรณ์เดิม ระบบจะจำข้อมูลที่ยืนยันแล้วและไม่ต้องกรอกใหม่บ่อยครั้ง</p>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Navigation Actions */}
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
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl">ยืนยันข้อมูลเพื่อปลดล็อกรายงานฉบับเต็ม</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            กรอกข้อมูลสั้น ๆ เพื่อให้คู่คิด KooKid ส่งต่อข้อมูลโควต้า ทุนการศึกษา หรือรายงานที่เหมาะกับคุณได้ครบถ้วน
          </p>
          <p className="text-xs text-muted-foreground">
            เราจะไม่ส่งข้อมูลของคุณให้มหาวิทยาลัยแบบสุ่ม ข้อมูลจะถูกใช้กับมหาวิทยาลัยที่เกี่ยวข้องกับผลการประเมินของคุณเท่านั้น
          </p>
          <LeadCaptureForm
            onSubmit={handleLeadSubmit}
            submitLabel="ยืนยัน"
            prefill={leadProfile || undefined}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}

function readRequestedMajors() {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(sessionStorage.getItem("kookid_requested_majors") || "{}");
  } catch {
    return {};
  }
}