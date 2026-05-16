import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight, Loader2 } from "lucide-react";
import { AnimatePresence } from "framer-motion";

import { SECTIONS, getQuestionsBySection, allQuestions } from "@/lib/quizData";
import { computeProfile } from "@/lib/scoringEngine";
import { computeMatches } from "@/lib/matchingEngine";
import { generatePersonalitySummary, generateWhyMatch } from "@/lib/summaryGenerator";
import { trackEvent } from "@/lib/analyticsApi";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  getOrCreateActiveProfileId,
  getStoredLeadProfile,
  savePreQuizInfo,
} from "@/lib/leadCaptureApi";

import SectionStepper from "@/components/quiz/SectionStepper";
import ProgressBar from "@/components/quiz/ProgressBar";
import LikertQuestion from "@/components/quiz/LikertQuestion";
import MultiChoiceQuestion from "@/components/quiz/MultiChoiceQuestion";

// How many questions to show per page in the interests section
const INTEREST_PAGE_SIZE = 6;

/**
 * @typedef {string | number | Array<string | number> | null | undefined} QuizAnswer
 * @typedef {Record<string, QuizAnswer>} QuizAnswerMap
 */

export default function Quiz() {
  const navigate = useNavigate();
  const [profileId] = useState(() => getOrCreateActiveProfileId());
  const [profileInfo, setProfileInfo] = useState(() => {
    const stored = getStoredLeadProfile(profileId);
    return {
      nickname: stored?.nickname || "",
      gradeAndSchool: stored?.gradeAndSchool || "",
    };
  });
  const [preQuizSubmitted, setPreQuizSubmitted] = useState(() => Boolean(profileInfo.nickname && profileInfo.gradeAndSchool));
  const [preQuizError, setPreQuizError] = useState("");
  const [sectionIndex, setSectionIndex] = useState(0);
  const [interestPage, setInterestPage] = useState(0);
  const [answers, setAnswers] = useState(/** @type {QuizAnswerMap} */ ({}));
  const [computing, setComputing] = useState(false);

  React.useEffect(() => {
    trackEvent("quiz_started", {
      page: "quiz",
    });
  }, []);

  const currentSection = SECTIONS[sectionIndex];
  const sectionQuestions = useMemo(
    () => getQuestionsBySection(currentSection.id),
    [currentSection.id]
  );

  // For interests section, paginate in chunks
  const isInterests = currentSection.id === "interests";
  const totalInterestPages = isInterests ? Math.ceil(sectionQuestions.length / INTEREST_PAGE_SIZE) : 1;
  const visibleQuestions = isInterests
    ? sectionQuestions.slice(interestPage * INTEREST_PAGE_SIZE, (interestPage + 1) * INTEREST_PAGE_SIZE)
    : sectionQuestions;

  // Global progress
  const answeredCount = allQuestions.filter(q => answers[q.id] !== undefined).length;
  const totalCount = allQuestions.length;

  /**
   * @param {string} questionId
   * @param {QuizAnswer} value
   */
  const handleAnswer = (questionId, value) => {
    setAnswers(prev => ({ ...prev, [questionId]: value }));
  };

  // Check if current page is fully answered
  const currentPageComplete = visibleQuestions.every(q => {
    const a = answers[q.id];
    if (a === undefined || a === null) return false;
    if (Array.isArray(a) && a.length === 0) return false;
    return true;
  });

  const handleNext = () => {
    if (isInterests && interestPage < totalInterestPages - 1) {
      setInterestPage(p => p + 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    if (sectionIndex < SECTIONS.length - 1) {
      setSectionIndex(i => i + 1);
      setInterestPage(0);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      handleSubmit();
    }
  };

  const handleBack = () => {
    if (isInterests && interestPage > 0) {
      setInterestPage(p => p - 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    if (sectionIndex > 0) {
      const prevSectionId = SECTIONS[sectionIndex - 1].id;
      setSectionIndex(i => i - 1);
      if (prevSectionId === "interests") {
        const prevQuestions = getQuestionsBySection("interests");
        setInterestPage(Math.ceil(prevQuestions.length / INTEREST_PAGE_SIZE) - 1);
      }
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleSubmit = () => {
    setComputing(true);
    // Small delay for UX feel
    setTimeout(() => {
      const profile = computeProfile(answers);
      const { clusters, majors } = computeMatches(profile);
      const summary = generatePersonalitySummary(profile.traitScores);
      const clustersWithWhy = clusters.map(c => ({
        ...c,
        whyMatch: generateWhyMatch(c, summary.topTraits),
      }));

      const result = {
        profile,
        clusters: clustersWithWhy,
        majors,
        summary,
        answers,
        userProfileId: profileId,
      };

      trackEvent("quiz_completed", {
        page: "quiz",
        userProfileId: profileId,
        topClusterIds: clustersWithWhy.slice(0, 3).map(c => c.clusterId),
      });

      // Store in sessionStorage so Results page can read it
      sessionStorage.setItem("tcas_quiz_result", JSON.stringify(result));
      navigate("/results");
    }, 800);
  };

  const isLastStep = sectionIndex === SECTIONS.length - 1 && (!isInterests || interestPage === totalInterestPages - 1);
  const canGoBack = sectionIndex > 0 || (isInterests && interestPage > 0);

  const handlePreQuizSubmit = (event) => {
    event.preventDefault();

    const nickname = profileInfo.nickname.trim();
    const gradeAndSchool = profileInfo.gradeAndSchool.trim();

    if (!nickname || !gradeAndSchool) {
      setPreQuizError("กรุณากรอกชื่อเล่นและระดับชั้น / สายการเรียนให้ครบก่อนเริ่มทำแบบทดสอบ");
      return;
    }

    savePreQuizInfo({ nickname, gradeAndSchool });
    setPreQuizSubmitted(true);
    setPreQuizError("");

    trackEvent("quiz_prequest_info_submitted", {
      page: "quiz",
      userProfileId: profileId,
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto px-4 py-6 sm:py-10">
        {!preQuizSubmitted ? (
          <Card className="p-5 sm:p-6 border border-border/60 bg-card shadow-sm">
            <div className="mb-4">
              <div className="text-xs font-semibold tracking-widest text-primary/60 uppercase mb-1">คู่คิด KooKid</div>
              <h1 className="text-xl sm:text-2xl font-bold text-foreground">เริ่มต้นด้วยข้อมูลสั้น ๆ ก่อนทำแบบทดสอบ</h1>
              <p className="mt-2 text-sm text-muted-foreground">ใช้เพื่อปรับเนื้อหาผลลัพธ์ให้ตรงกับคุณมากขึ้น (ยังไม่บันทึกข้อมูลติดต่อ)</p>
            </div>

            <form onSubmit={handlePreQuizSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="preNickname">ชื่อเล่น <span className="text-destructive">*</span></Label>
                <Input
                  id="preNickname"
                  value={profileInfo.nickname}
                  onChange={(e) => setProfileInfo(prev => ({ ...prev, nickname: e.target.value }))}
                  placeholder="เช่น ใบเตย"
                  autoComplete="nickname"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="preGradeAndSchool">ระดับชั้น / สายการเรียน <span className="text-destructive">*</span></Label>
                <Input
                  id="preGradeAndSchool"
                  value={profileInfo.gradeAndSchool}
                  onChange={(e) => setProfileInfo(prev => ({ ...prev, gradeAndSchool: e.target.value }))}
                  placeholder="เช่น ม.5 วิทย์-คณิต"
                  autoComplete="organization"
                />
              </div>

              {preQuizError && <p className="text-sm text-destructive">{preQuizError}</p>}

              <div className="flex justify-end">
                <Button type="submit" className="rounded-xl">
                  เริ่มทำแบบทดสอบ
                  <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </form>
          </Card>
        ) : (
          <>
            <Card className="mb-6 p-4 sm:p-5 border border-primary/20 bg-primary/5">
              <p className="text-sm font-medium text-foreground">
                สวัสดี {profileInfo.nickname} จาก {profileInfo.gradeAndSchool}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                พร้อมแล้ว มาดูว่าคู่คิด KooKid จะพาคุณไปเจอสายเรียนและอาชีพแบบไหนที่ใช่ที่สุด
              </p>
            </Card>

            {/* Stepper */}
            <SectionStepper sections={SECTIONS} activeIndex={sectionIndex} />

            {/* Progress */}
            <div className="mt-6">
              <ProgressBar
                current={answeredCount}
                total={totalCount}
                sectionLabel={currentSection.label}
              />
            </div>

            {/* Questions */}
            <div className="mt-8 space-y-4">
              <AnimatePresence mode="wait">
                {visibleQuestions.map((q) => {
                  const globalIdx = allQuestions.findIndex(aq => aq.id === q.id);
                  if (q.type === "likert") {
                    return (
                      <LikertQuestion
                        key={q.id}
                        question={q}
                        value={answers[q.id]}
                        onChange={handleAnswer}
                        index={globalIdx}
                      />
                    );
                  }
                  if (q.type === "multiple_choice") {
                    const isMulti = q.id === "Q_AC_1"; // Subject question is multi-select
                    return (
                      <MultiChoiceQuestion
                        key={q.id}
                        question={q}
                        value={answers[q.id]}
                        onChange={handleAnswer}
                        index={globalIdx}
                        multiSelect={isMulti}
                      />
                    );
                  }
                  return null;
                })}
              </AnimatePresence>
            </div>

            {/* Navigation */}
            <div className="flex items-center justify-between mt-8 pb-10">
              <Button
                variant="outline"
                onClick={handleBack}
                disabled={!canGoBack}
                className="rounded-xl"
              >
                <ArrowLeft className="w-4 h-4 mr-1" />
                ย้อนกลับ
              </Button>

              {computing ? (
                <Button disabled className="rounded-xl">
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  กำลังวิเคราะห์...
                </Button>
              ) : (
                <Button
                  onClick={handleNext}
                  disabled={!currentPageComplete}
                  className="rounded-xl"
                >
                  {isLastStep ? "ดูผลลัพธ์" : "ถัดไป"}
                  {!isLastStep && <ArrowRight className="w-4 h-4 ml-1" />}
                </Button>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}