import React, { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, RotateCcw, Sparkles, BarChart3, Briefcase, GraduationCap, Download, ListChecks } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";

import RIASECChart from "@/components/results/RIASECChart";
import AcademicScores from "@/components/results/AcademicScores";
import CareerCard from "@/components/results/CareerCard";
import MajorList from "@/components/results/MajorList";
import OverallFeedbackPanel from "@/components/feedback/OverallFeedbackPanel";
import ActionPlan from "@/components/results/ActionPlan";
import { submitCareerFeedback, submitMajorFeedback, submitResultFeedback } from "@/lib/feedbackApi";

// Generates a stable session-scoped profile ID (stored in sessionStorage)
function getOrCreateProfileId() {
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

  if (!result) return null;

  const { profile, clusters, majors, summary } = result;
  // Use clusters directly from computeMatches
  const topClusters = clusters ?? [];
  const userProfileId = getOrCreateProfileId();

  const handleCareerFeedback = (clusterId, level) => {
    setCareerFeedback(prev => ({ ...prev, [clusterId]: level }));
  };

  const handleMajorFeedback = (majorId, level) => {
    setMajorFeedback(prev => ({ ...prev, [majorId]: level }));
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
        careerItems.length > 0 ? submitCareerFeedback(userProfileId, careerItems) : Promise.resolve(),
        majorItems.length > 0 ? submitMajorFeedback(userProfileId, majorItems) : Promise.resolve(),
        submitResultFeedback(userProfileId, overallFitScore, selectedIssue, comment),
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
          {/* Download PDF button — opens printable report in new tab */}
          <button
            onClick={() => window.open(`/report/${userProfileId}`, "_blank")}
            className="mt-4 inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full border border-border text-sm text-muted-foreground hover:text-foreground hover:border-primary/40 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            ดาวน์โหลดผลเป็น PDF
          </button>
        </motion.div>

        {/* Personality Summary */}
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card className="p-5 sm:p-6 border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-card mb-8">
            <h2 className="text-lg font-semibold text-foreground mb-3 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              บุคลิกภาพของคุณ
            </h2>
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
            <RIASECChart traitScores={profile.traitScores} />
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
          <Card className="p-5 sm:p-6 border border-border/50">
            <MajorList
              majors={majors}
              topCareers={topClusters}
              majorFeedback={majorFeedback}
              onMajorFeedback={handleMajorFeedback}
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
    </div>
  );
}