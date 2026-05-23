import React from "react";
import { Card } from "@/components/ui/card";
import { CheckCircle2 } from "lucide-react";
import { motion } from "framer-motion";

/** @typedef {{ clusterId: string }} TopCluster */
/** @typedef {{ dimension: string }} TopDim */
/** @typedef {(clusterIds: string[], topDims: string[]) => boolean} ActionPlanRuleCheck */

// ---------------------------------------------------------------------------
// ACTION PLAN RULES
// Each rule: { check: (clusterIds, topDims) => bool, text }
// Evaluated in order; first 4 matching rules are shown.
// ---------------------------------------------------------------------------
const ACTION_RULES = [
  // Always shown — generic first step
  {
    /** @type {ActionPlanRuleCheck} */
    check: (_clusterIds, _topDims) => true,
    text: "เลือก 2–3 สาขาที่สนใจจากลิสต์ด้านบน แล้วเข้าไปอ่านรายละเอียดหลักสูตรในเว็บมหาวิทยาลัย",
  },
  {
    /** @type {ActionPlanRuleCheck} */
    check: (clusterIds, topDims) =>
      clusterIds.includes("CLUSTER_IT_ENGINEERING") || topDims.includes("R") || topDims.includes("I"),
    text: "ฝึกทักษะการคิดเป็นระบบและทำโปรเจกต์เล็ก ๆ เช่น Coding เบื้องต้น หรือการทดลองแก้ปัญหาจริง",
  },
  {
    /** @type {ActionPlanRuleCheck} */
    check: (clusterIds, topDims) =>
      clusterIds.includes("CLUSTER_BUSINESS") || topDims.includes("E") || topDims.includes("C"),
    text: "ลองศึกษาเรื่องการจัดการ การเงินพื้นฐาน หรือทำ Mini Project ที่สะท้อนความเป็นผู้นำและการจัดระบบ",
  },
  {
    /** @type {ActionPlanRuleCheck} */
    check: (clusterIds, _topDims) =>
      clusterIds.includes("CLUSTER_HEALTH"),
    text: "ลองอาสาสมัครงานด้านสุขภาพ หรือคุยกับพยาบาล/แพทย์ในครอบครัวหรือชุมชน เพื่อเข้าใจงานจริง",
  },
  {
    /** @type {ActionPlanRuleCheck} */
    check: (clusterIds, _topDims) => clusterIds.includes("CLUSTER_SCIENCE"),
    text: "ฝึกทักษะการคิดแบบวิทยาศาสตร์ เช่น ทำ Project ทดลองง่าย ๆ หรืออ่านบทความวิทย์ภาษาไทย",
  },
  {
    /** @type {ActionPlanRuleCheck} */
    check: (clusterIds, _topDims) => clusterIds.includes("CLUSTER_MEDIA") || clusterIds.includes("CLUSTER_LAW"),
    text: "ลองฝึกทักษะการพูดและการเขียน เช่น เข้าร่วมชมรมโต้วาที ทำ Content บน Social Media หรืออาสาสมัครในชุมชน",
  },
  {
    /** @type {ActionPlanRuleCheck} */
    check: (clusterIds, _topDims) => clusterIds.includes("CLUSTER_EDUCATION"),
    text: "ลองสอนพิเศษน้อง ๆ หรือเป็นผู้ช่วยสอนในโรงเรียน เพื่อทดสอบว่าชอบงานสอนจริงหรือเปล่า",
  },
  {
    /** @type {ActionPlanRuleCheck} */
    check: (clusterIds, _topDims) => clusterIds.includes("CLUSTER_HOSPITALITY"),
    text: "ลองฝึกงานในโรงแรม ร้านอาหาร หรือฟาร์ม/สวนเกษตรช่วงปิดเทอม เพื่อสัมผัสบรรยากาศงานจริง",
  },
  {
    /** @type {ActionPlanRuleCheck} */
    check: (_clusterIds, _topDims) => true,
    text: "เข้าไปอ่านข้อมูล TCAS ล่าสุดที่ mytcas.com และปรึกษาครูแนะแนวหรือผู้ปกครองก่อนตัดสินใจ",
  },
];

/**
 * ActionPlan component — shows deterministic next-step suggestions
 * based on matched clusters and top RIASEC dimensions.
 *
 * @param {{ topClusters: TopCluster[], topDims: string[] }} props
 */
export default function ActionPlan({ topClusters, topDims }) {
  const clusterIds = topClusters.map((c) => c.clusterId);

  // Evaluate rules; deduplicate text; keep first 4
  const seen = new Set();
  const bullets = ACTION_RULES.filter(rule => {
    if (!rule.check(clusterIds, topDims)) return false;
    if (seen.has(rule.text)) return false;
    seen.add(rule.text);
    return true;
  }).slice(0, 4).map(r => r.text);

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <Card className="p-5 sm:p-6 border border-border/50 bg-gradient-to-br from-accent/5 to-card">
        <h3 className="text-base font-semibold text-foreground mb-4 flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-accent" />
          สิ่งที่คุณทำต่อได้จากตรงนี้
        </h3>
        <ul className="space-y-3">
          {bullets.map((text, i) => (
            <li key={i} className="flex items-start gap-2.5">
              <span className="mt-0.5 flex-shrink-0 w-5 h-5 rounded-full bg-accent/20 text-accent text-xs font-bold flex items-center justify-center">
                {i + 1}
              </span>
              <p className="text-sm text-foreground/80 leading-relaxed">{text}</p>
            </li>
          ))}
        </ul>
      </Card>
    </motion.div>
  );
}