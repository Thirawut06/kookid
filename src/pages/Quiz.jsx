import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { ArrowLeft, ArrowRight, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { SECTIONS, allQuestions, getQuestionsBySection } from "@/lib/quizData";
import { computeMatches } from "@/lib/matchingEngine";
import { computeProfile } from "@/lib/scoringEngine";
import { generatePersonalitySummary, generateWhyMatch } from "@/lib/summaryGenerator";
import { trackEvent } from "@/lib/analyticsApi";
import { appName } from "@/lib/app-params";
import { getOrCreateActiveProfileId, getStoredLeadProfile, upsertQuizResult } from "@/lib/leadCaptureApi";

import SectionStepper from "@/components/quiz/SectionStepper";
import ProgressBar from "@/components/quiz/ProgressBar";
import LikertQuestion from "@/components/quiz/LikertQuestion";
import MultiChoiceQuestion from "@/components/quiz/MultiChoiceQuestion";

const INTEREST_PAGE_SIZE = 6;

/**
 * @typedef {string | number | Array<string | number> | null | undefined} QuizAnswer
 * @typedef {Record<string, QuizAnswer>} QuizAnswerMap
 * @typedef {{ dimension: string, normalizedScore: number, rawScore?: number }} TraitScore
 * @typedef {{ traitScores: TraitScore[], hollandCode?: string }} QuizProfile
 * @typedef {{ careerId: string, clusterId: string, nameTh: string, whyMatch?: string }} QuizCareer
 * @typedef {{ summaryText: string, bulletPoints: string[], topTraits: Array<{ dimension: string, label: string, description: string, score: number }>, acadMathScore?: number, acadSciScore?: number }} QuizSummary
 * @typedef {{ profile: QuizProfile, hollandCode?: string, clusters: QuizCareer[], majors: Array<any>, summary: QuizSummary, answers: QuizAnswerMap, userProfileId: string }} QuizResult
 */

export default function Quiz() {
  const navigate = useNavigate();
  const [profileId] = useState(() => getOrCreateActiveProfileId());
  const leadProfile = getStoredLeadProfile(profileId);
  const nickname = leadProfile?.nickname || "";

  const [sectionIndex, setSectionIndex] = useState(0);
  const [interestPage, setInterestPage] = useState(0);
  const [answers, setAnswers] = useState(/** @type {QuizAnswerMap} */ ({}));
  const [computing, setComputing] = useState(false);
  const [pageStartTime, setPageStartTime] = useState(() => Date.now());

  React.useEffect(() => {
    trackEvent("quiz_started", {
      page: "quiz",
    });
  }, []);

  const currentSection = SECTIONS[sectionIndex];
  const sectionQuestions = useMemo(() => getQuestionsBySection(currentSection.id), [currentSection.id]);

  const isInterests = currentSection.id === "interests";
  const totalInterestPages = isInterests ? Math.ceil(sectionQuestions.length / INTEREST_PAGE_SIZE) : 1;
  const visibleQuestions = isInterests
    ? sectionQuestions.slice(interestPage * INTEREST_PAGE_SIZE, (interestPage + 1) * INTEREST_PAGE_SIZE)
    : sectionQuestions;

  const answeredCount = allQuestions.filter(question => answers[question.id] !== undefined).length;
  const totalCount = allQuestions.length;

  /** @param {string} questionId @param {QuizAnswer} value */
  const handleAnswer = (questionId, value) => {
    setAnswers(prev => ({ ...prev, [questionId]: value }));
  };

  const currentPageComplete = visibleQuestions.every(question => {
    const answer = answers[question.id];
    if (answer === undefined || answer === null) return false;
    if (Array.isArray(answer) && answer.length === 0) return false;
    if (answer === "other") {
      const otherText = answers[`${question.id}_other`];
      if (!otherText || !String(otherText).trim()) return false;
    }
    if (Array.isArray(answer) && answer.includes("other")) {
      const otherText = answers[`${question.id}_other`];
      if (!otherText || !String(otherText).trim()) return false;
    }
    return true;
  });

  const handleNext = () => {
    const timeSpentMs = Date.now() - pageStartTime;
    trackEvent("quiz_page_completed", {
      section_index: sectionIndex,
      interest_page: interestPage,
      time_spent_ms: timeSpentMs,
      question_count: visibleQuestions.length,
    });
    setPageStartTime(Date.now());

    if (isInterests && interestPage < totalInterestPages - 1) {
      setInterestPage(page => page + 1);
      window.scrollTo(0, 0);
      return;
    }

    if (sectionIndex < SECTIONS.length - 1) {
      setSectionIndex(index => index + 1);
      setInterestPage(0);
      window.scrollTo(0, 0);
      return;
    }

    handleSubmit();
  };

  const handleBack = () => {
    setPageStartTime(Date.now()); // reset timer when going back
    if (isInterests && interestPage > 0) {
      setInterestPage(page => page - 1);
      window.scrollTo(0, 0);
      return;
    }

    if (sectionIndex > 0) {
      const previousSectionId = SECTIONS[sectionIndex - 1].id;
      setSectionIndex(index => index - 1);
      if (previousSectionId === "interests") {
        const previousQuestions = getQuestionsBySection("interests");
        setInterestPage(Math.ceil(previousQuestions.length / INTEREST_PAGE_SIZE) - 1);
      }
      window.scrollTo(0, 0);
    }
  };

  const handleSubmit = () => {
    setComputing(true);

    setTimeout(() => {
      const profile = /** @type {QuizProfile & { hollandCode: string }} */ (computeProfile(answers));
      const { clusters, majors } = computeMatches(profile);
      const summary = generatePersonalitySummary(profile.traitScores);
      const clustersWithWhy = /** @type {Array<QuizCareer & { whyMatch: string }>} */ (
        clusters.map(cluster => ({
          ...cluster,
          whyMatch: generateWhyMatch(cluster, summary.topTraits),
        }))
      );

      /** @type {QuizResult} */
      const result = {
        profile,
        hollandCode: profile.hollandCode,
        clusters: clustersWithWhy,
        majors,
        summary,
        answers,
        userProfileId: profileId,
      };

      trackEvent("quiz_completed", {
        page: "quiz",
        userProfileId: profileId,
        topClusterIds: clustersWithWhy.slice(0, 3).map(cluster => cluster.clusterId),
      });

      sessionStorage.setItem("tcas_quiz_result", JSON.stringify(result));
      upsertQuizResult(profileId, result).catch((error) => {
        console.error("Quiz result persistence skipped:", error);
      });
      navigate("/results");
    }, 800);
  };

  const isLastStep = sectionIndex === SECTIONS.length - 1 && (!isInterests || interestPage === totalInterestPages - 1);
  const canGoBack = sectionIndex > 0 || (isInterests && interestPage > 0);

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto px-4 py-6 sm:py-10">
        <Card className="mb-6 p-4 sm:p-5 border border-primary/20 bg-primary/5">
          <p className="text-sm font-medium text-foreground">
            ลุยเลย{nickname ? ` น้อง ${nickname}` : ""}!
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            พร้อมแล้ว มาดูว่า{appName} จะพาคุณไปเจอตัวตนของคุณกัน
          </p>
        </Card>

        <SectionStepper sections={SECTIONS} activeIndex={sectionIndex} />

        <div className="mt-6">
          <ProgressBar current={answeredCount} total={totalCount} sectionLabel={currentSection.label} />
        </div>

        <div className="mt-8 space-y-4">
          <AnimatePresence>
            {visibleQuestions.map((question, _visibleIndex) => {
              const globalIndex = allQuestions.findIndex(allQuestion => allQuestion.id === question.id);
              const questionIndex = globalIndex; // use global index so numbering is sequential across pages
              const answer = answers[question.id];

              return (
                <div key={`${question.id}-${sectionIndex}-${interestPage}`}>
                  {question.type === "likert" ? (
                    <LikertQuestion
                      question={question}
                      value={/** @type {number | undefined} */ (answer)}
                      onChange={handleAnswer}
                      index={questionIndex}
                    />
                  ) : (
                    <MultiChoiceQuestion
                      question={question}
                      value={answer}
                      onChange={handleAnswer}
                      index={questionIndex}
                    />
                  )}
                </div>
              );
            })}
          </AnimatePresence>
        </div>

        <div className="mt-8 flex items-center justify-between gap-3">
          <Button type="button" variant="outline" onClick={handleBack} disabled={!canGoBack || computing} className="rounded-xl">
            <ArrowLeft className="w-4 h-4 mr-1" />
            ย้อนกลับ
          </Button>
          <Button type="button" onClick={handleNext} disabled={!currentPageComplete || computing} className="rounded-xl">
            {computing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                กำลังประมวลผล...
              </>
            ) : (
              <>
                {isLastStep ? "ดูผลลัพธ์" : "ถัดไป"}
                <ArrowRight className="w-4 h-4 ml-1" />
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}