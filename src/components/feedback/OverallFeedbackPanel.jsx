import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { Heart } from "lucide-react";

// 1–5 emoji scale (change here to update icons/labels)
const FIT_SCORES = [
  { value: 1, emoji: "😞", label: "ไม่ตรงเลย" },
  { value: 2, emoji: "😕", label: "ไม่ค่อยตรง" },
  { value: 3, emoji: "😐", label: "พอตรง" },
  { value: 4, emoji: "😊", label: "ตรงดี" },
  { value: 5, emoji: "🤩", label: "ตรงมาก" },
];

// Dropdown options for "which part felt off"
const ISSUE_OPTIONS = [
  { value: "career_not_fit", label: "อาชีพที่แนะนำ" },
  { value: "major_not_fit", label: "คณะที่แนะนำ" },
  { value: "personality_not_fit", label: "คำอธิบายตัวตน/บุคลิกภาพ" },
  { value: "dont_know", label: "ไม่แน่ใจ" },
];

/**
 * Overall feedback panel shown at the bottom of the Results page.
 * @param {{ onSubmit: (overallFitScore: number, selectedIssue: string | null, comment: string | null) => void, isSubmitting: boolean, submitted: boolean }} props
 */
export default function OverallFeedbackPanel({ onSubmit, isSubmitting, submitted }) {
  const [fitScore, setFitScore] = useState(null);
  const [issue, setIssue] = useState("");
  const [comment, setComment] = useState("");

  const showIssueDropdown = fitScore !== null && fitScore <= 3;

  const handleSubmit = () => {
    if (!fitScore) return; // require a score
    onSubmit(fitScore, issue || null, comment.trim() || null);
  };

  if (submitted) {
    return (
      <Card className="p-5 sm:p-6 border-2 border-primary/20 text-center bg-gradient-to-br from-primary/5 to-card">
        <p className="text-3xl mb-3">💖</p>
        <p className="font-semibold text-foreground text-lg">ขอบคุณที่ช่วยเป็น Beta Tester ให้พี่ๆ น้า!</p>
        <p className="text-sm text-muted-foreground mt-1.5">
          Feedback ของน้องมีค่ามาก พี่ๆ จะรีบเอาไปปรับปรุงเว็บให้เป๊ะขึ้นไปอีก
        </p>
      </Card>
    );
  }

  return (
    <Card className="p-5 sm:p-6 border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-card relative overflow-hidden">
      <div className="absolute -right-4 -top-4 w-24 h-24 bg-primary/5 rounded-full blur-2xl pointer-events-none" />
      
      <div className="mb-4 bg-white/60 dark:bg-black/20 border border-primary/20 rounded-xl p-3.5">
        <p className="text-sm font-bold text-primary flex items-center gap-2">
          <span className="text-lg">🛠️</span> เว็บนี้พี่ๆ เพิ่งทำมาช่วยน้องๆ เลย!
        </p>
        <p className="text-xs text-foreground/80 mt-1.5 leading-relaxed">
          ผลลัพธ์ตรงหรือไม่ตรง กด Feedback บอกกันได้เลยน้า พี่ๆ จะได้เอาไปพัฒนาต่อให้แม่นยำขึ้น ถือซะว่ามาเป็น Beta Tester ให้พวกเรานะ 😊
        </p>
      </div>

      <h2 className="text-[15px] sm:text-base font-semibold text-foreground mb-4 flex items-center gap-2">
        <Heart className="w-5 h-5 text-primary" />
        แล้วผลลัพธ์ที่ได้ ตรงกับตัวเองแค่ไหนเอ่ย?
      </h2>

      {/* 1–5 fit score */}
      <div className="flex gap-2 sm:gap-3 justify-center mb-4">
        {FIT_SCORES.map(opt => (
          <button
            key={opt.value}
            onClick={() => { setFitScore(opt.value); setIssue(""); }}
            className={cn(
              "flex flex-col items-center gap-1 px-3 py-2 rounded-xl border-2 transition-all flex-1",
              fitScore === opt.value
                ? "border-primary bg-primary/10"
                : "border-border/50 hover:border-primary/30 hover:bg-primary/5"
            )}
          >
            <span className="text-2xl">{opt.emoji}</span>
            <span className={cn(
              "text-[10px] font-medium text-center leading-tight",
              fitScore === opt.value ? "text-primary" : "text-muted-foreground"
            )}>{opt.label}</span>
          </button>
        ))}
      </div>

      {/* Issue dropdown — only shows if score ≤ 3 */}
      <AnimatePresence>
        {showIssueDropdown && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <p className="text-sm font-medium text-foreground mb-2">
              กระซิบหน่อย คิดว่าส่วนไหนที่ระบบวิเคราะห์พลาดไป? 🤫
            </p>
            <div className="flex flex-wrap gap-2 mb-4">
              {ISSUE_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => setIssue(issue === opt.value ? "" : opt.value)}
                  className={cn(
                    "px-3 py-1.5 rounded-lg border text-sm transition-all",
                    issue === opt.value
                      ? "bg-primary text-primary-foreground border-primary"
                      : "border-border/50 text-muted-foreground hover:border-primary/40"
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Optional comment box */}
      {fitScore !== null && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <Textarea
            placeholder="อยากอธิบายเพิ่ม (ไม่บังคับ)"
            value={comment}
            onChange={e => setComment(e.target.value.slice(0, 200))}
            className="mb-4 text-sm resize-none h-20"
          />
          <p className="text-[10px] text-muted-foreground text-right mb-4">{comment.length}/200</p>
        </motion.div>
      )}

      <Button
        onClick={handleSubmit}
        disabled={!fitScore || isSubmitting}
        className="w-full rounded-xl"
      >
        {isSubmitting ? "กำลังบันทึก..." : "บันทึก Feedback"}
      </Button>
    </Card>
  );
}