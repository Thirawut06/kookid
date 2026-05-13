// ============================================================
// TCAS Career Quiz — Summary Text Generator
// All text is Thai-language, rule-based only. No external AI calls.
// ============================================================

const RIASEC_LABELS = {
  R: { name: "Realistic (นักปฏิบัติ)", desc: "ชอบลงมือทำ ใช้เครื่องมือ ทำงานเชิงเทคนิค" },
  I: { name: "Investigative (นักวิเคราะห์)", desc: "ชอบค้นคว้า วิเคราะห์ ตั้งคำถาม แก้ปัญหา" },
  A: { name: "Artistic (นักสร้างสรรค์)", desc: "ชอบออกแบบ สร้างสรรค์ มีจินตนาการ" },
  S: { name: "Social (นักสังคม)", desc: "ชอบช่วยเหลือ สอน ดูแลผู้อื่น" },
  E: { name: "Enterprising (นักบริหาร)", desc: "ชอบเป็นผู้นำ โน้มน้าว บริหารจัดการ" },
  C: { name: "Conventional (นักจัดระบบ)", desc: "ชอบความเป็นระเบียบ ทำงานกับข้อมูลอย่างเป็นระบบ" },
};

// ---------------------------------------------------------------------------
// BULLET POINT RULES
// Each rule: { check: (scores, acadMath, acadSci) => boolean, text: string }
// Evaluated in order; up to 5 bullets shown.
// To add/remove/edit a rule, just update this array.
// ---------------------------------------------------------------------------
const BULLET_RULES = [
  {
    check: (top3Dims) => top3Dims.includes("I"),
    text: "ชอบค้นข้อมูล วิเคราะห์ปัญหา และตั้งคำถามก่อนตัดสินใจ",
  },
  {
    check: (top3Dims) => top3Dims.includes("E"),
    text: "กล้าตัดสินใจ ชอบเสนอไอเดีย และมักรับบทผู้นำในกลุ่ม",
  },
  {
    check: (top3Dims, _m, _s, allScores) => {
      const c = allScores.find(ts => ts.dimension === "C");
      return c && c.normalizedScore >= 70;
    },
    text: "สบายใจกับงานที่มีโครงสร้างชัดเจน ทำงานกับตัวเลขหรือข้อมูลได้ดี",
  },
  {
    check: (top3Dims) => top3Dims.includes("A"),
    text: "มีความคิดสร้างสรรค์และจินตนาการสูง ชอบแสดงออกทางศิลปะหรือสื่อ",
  },
  {
    check: (top3Dims) => top3Dims.includes("S"),
    text: "เอาใจใส่ผู้อื่น ชอบช่วยเหลือ สอน หรือดูแลคนรอบข้าง",
  },
  {
    check: (top3Dims) => top3Dims.includes("R"),
    text: "ชอบลงมือทำสิ่งที่จับต้องได้ ทำงานกับเครื่องมือหรืองานเชิงเทคนิค",
  },
  {
    check: (_d, acadMath) => acadMath >= 60,
    text: "มีความมั่นใจในวิชาคณิตศาสตร์ สามารถต่อยอดไปสาขาที่ใช้ตัวเลขได้",
  },
  {
    check: (_d, _m, acadSci) => acadSci >= 60,
    text: "มีพื้นฐานวิทยาศาสตร์ดี เหมาะกับสาขาที่ใช้ความเข้าใจด้านวิทย์",
  },
];

/**
 * Generate a personality summary from trait scores.
 * Returns: { topTraits, summaryText, bulletPoints }
 */
export function generatePersonalitySummary(traitScores) {
  const riasecScores = traitScores
    .filter(ts => ["R", "I", "A", "S", "E", "C"].includes(ts.dimension))
    .sort((a, b) => b.normalizedScore - a.normalizedScore);

  const top3 = riasecScores.slice(0, 3);
  const top3Dims = top3.map(ts => ts.dimension);
  const top3Labels = top3.map(ts => RIASEC_LABELS[ts.dimension].name).join(", ");

  const acadMath = traitScores.find(ts => ts.dimension === "Academic_Math")?.normalizedScore ?? 0;
  const acadSci = traitScores.find(ts => ts.dimension === "Academic_Sci")?.normalizedScore ?? 0;

  // Short intro sentence
  const summaryText = `บุคลิกภาพหลักของคุณผสมระหว่าง ${top3Labels} คุณจึงเป็นคนที่มีแนวโน้มโดดเด่นด้านเหล่านี้:`;

  // Evaluate bullet rules — collect up to 5
  const bulletPoints = BULLET_RULES
    .filter(rule => rule.check(top3Dims, acadMath, acadSci, riasecScores))
    .slice(0, 5)
    .map(rule => rule.text);

  // Fallback if no rules matched
  if (bulletPoints.length === 0) {
    bulletPoints.push("คุณมีความสนใจที่หลากหลาย ลองสำรวจหลายสาขาเพื่อค้นหาตัวเอง");
  }

  return {
    topTraits: top3.map(ts => ({
      dimension: ts.dimension,
      label: RIASEC_LABELS[ts.dimension].name,
      description: RIASEC_LABELS[ts.dimension].desc,
      score: ts.normalizedScore,
    })),
    summaryText,
    bulletPoints,
    // Pass through raw scores for ActionPlan
    acadMathScore: acadMath,
    acadSciScore: acadSci,
  };
}

// ---------------------------------------------------------------------------
// CLUSTER-SPECIFIC "WHY THIS MATCH?" TEMPLATES
// To edit a template, find the matching clusterId case below.
// topTraits[0] and topTraits[1] are used to personalize the sentence.
// ---------------------------------------------------------------------------
const CLUSTER_WHY_TEMPLATES = {
  CLUSTER_HEALTH_NURSING_ALLIED: (traitA, traitB) =>
    `เพราะคุณมีแนวโน้มด้าน ${traitA} และ ${traitB} สูง และชอบช่วยเหลือดูแลผู้อื่น จึงเหมาะกับสายสุขภาพที่ต้องการความเอาใจใส่และความอดทนสูง`,

  CLUSTER_BUSINESS_ACCOUNTING_ECON: (traitA, traitB) =>
    `เพราะคุณมีแนวโน้มด้าน ${traitA} และ ${traitB} สูง และสนใจการวิเคราะห์ตัวเลขและการจัดการ จึงเหมาะกับกลุ่มสายบริหารธุรกิจ การบัญชี และเศรษฐศาสตร์`,

  CLUSTER_ENGINEERING_IT_DATA: (traitA, traitB) =>
    `เพราะคุณมีแนวโน้มด้าน ${traitA} และ ${traitB} สูง และชอบแก้ปัญหาและสร้างระบบ จึงเหมาะกับสายวิศวกรรม เทคโนโลยี และการวิเคราะห์ข้อมูล`,

  CLUSTER_SCIENCE_RESEARCH: (traitA, traitB) =>
    `เพราะคุณมีแนวโน้มด้าน ${traitA} และ ${traitB} สูง และชอบตั้งคำถาม ทดลอง และค้นคว้า จึงเหมาะกับสายวิทยาศาสตร์และงานวิจัย`,

  CLUSTER_EDUCATION_TEACHING: (traitA, traitB) =>
    `เพราะคุณมีแนวโน้มด้าน ${traitA} และ ${traitB} สูง และชอบอธิบาย สอน และเป็นที่พึ่งของคนอื่น จึงเหมาะกับสายครุศาสตร์และการศึกษา`,

  CLUSTER_SOCIAL_LAW_MEDIA: (traitA, traitB) =>
    `เพราะคุณมีแนวโน้มด้าน ${traitA} และ ${traitB} สูง และชอบสื่อสาร วิเคราะห์สังคม และใช้ภาษาอย่างคล่องแคล่ว จึงเหมาะกับสายนิเทศศาสตร์ กฎหมาย และสังคมศาสตร์`,

  CLUSTER_TOURISM_HOSPITALITY_AGRI: (traitA, traitB) =>
    `เพราะคุณมีแนวโน้มด้าน ${traitA} และ ${traitB} สูง และชอบงานบริการและการลงมือปฏิบัติ จึงเหมาะกับสายท่องเที่ยว การโรงแรม และเกษตรสมัยใหม่`,

  CLUSTER_HEALTH_MEDICINE_PHARMA: (traitA, traitB) =>
    `เพราะคุณมีแนวโน้มด้าน ${traitA} และ ${traitB} สูง และมีความมุ่งมั่นสูงในด้านวิทยาศาสตร์และสุขภาพ จึงเหมาะกับสายแพทยศาสตร์ เภสัชศาสตร์ และสุขภาพขั้นสูง`,
};

/**
 * Generate cluster-specific "Why this match?" text.
 * Uses topTraits[0] and [1] to personalize. No external AI calls.
 */
export function generateWhyMatch(career, topTraits) {
  const traitA = topTraits[0]?.label.split(" ")[0] ?? "บุคลิกภาพ";
  const traitB = topTraits[1]?.label.split(" ")[0] ?? "ความสามารถ";

  const templateFn = CLUSTER_WHY_TEMPLATES[career.clusterId ?? career.id];
  if (templateFn) return templateFn(traitA, traitB);

  // Generic fallback for any cluster not listed above
  return `เพราะคุณมีแนวโน้มด้าน ${traitA} และ ${traitB} สูง จึงเหมาะกับกลุ่มสาย${career.nameTh}`;
}