// ============================================================
// TCAS Career Quiz — Question Bank
// All questions for MVP 0.1: Interests (RIASEC) + Academic + Constraints
// ============================================================

// ------ SECTION 1: Interests / RIASEC (36 questions, 6 per dimension) ------
const riasecQuestions = [
  // R — Realistic
  { id: "Q_R_1", section: "interests", type: "likert", text: "ฉันชอบลงมือทำงานกับเครื่องมือ อุปกรณ์ หรือชิ้นส่วนต่าง ๆ", tags: ["R"], weight: 1.0 },
  { id: "Q_R_2", section: "interests", type: "likert", text: "ฉันชอบทำงานกลางแจ้งมากกว่าในออฟฟิศ", tags: ["R"], weight: 1.0 },
  { id: "Q_R_3", section: "interests", type: "likert", text: "ฉันสนุกกับการซ่อมแซมสิ่งของหรือประกอบชิ้นส่วน", tags: ["R"], weight: 1.0 },
  { id: "Q_R_4", section: "interests", type: "likert", text: "ฉันชอบทำงานที่เห็นผลลัพธ์เป็นรูปธรรม จับต้องได้", tags: ["R"], weight: 1.0 },
  { id: "Q_R_5", section: "interests", type: "likert", text: "ฉันสนใจเรียนรู้เกี่ยวกับเครื่องจักรหรือเทคโนโลยีการผลิต", tags: ["R"], weight: 1.0 },
  { id: "Q_R_6", section: "interests", type: "likert", text: "ฉันชอบกิจกรรมที่ใช้ร่างกายหรือความแข็งแรง เช่น กีฬา งานช่าง", tags: ["R"], weight: 1.0 },

  // I — Investigative
  { id: "Q_I_1", section: "interests", type: "likert", text: "ฉันชอบตั้งคำถามและค้นหาคำตอบด้วยการวิเคราะห์ข้อมูล", tags: ["I"], weight: 1.0 },
  { id: "Q_I_2", section: "interests", type: "likert", text: "ฉันสนุกกับการทดลองทางวิทยาศาสตร์", tags: ["I"], weight: 1.0 },
  { id: "Q_I_3", section: "interests", type: "likert", text: "ฉันชอบอ่านบทความหรือดูสารคดีเกี่ยวกับวิทยาศาสตร์และเทคโนโลยี", tags: ["I"], weight: 1.0 },
  { id: "Q_I_4", section: "interests", type: "likert", text: "ฉันชอบแก้โจทย์ปัญหาที่ซับซ้อนและท้าทาย", tags: ["I"], weight: 1.0 },
  { id: "Q_I_5", section: "interests", type: "likert", text: "ฉันสนใจทำความเข้าใจว่าสิ่งต่าง ๆ ทำงานอย่างไร", tags: ["I"], weight: 1.0 },
  { id: "Q_I_6", section: "interests", type: "likert", text: "ฉันชอบคิดวิเคราะห์มากกว่าทำตามคำสั่ง", tags: ["I"], weight: 1.0 },

  // A — Artistic
  { id: "Q_A_1", section: "interests", type: "likert", text: "ฉันชอบวาดรูป ออกแบบ หรือสร้างงานศิลปะ", tags: ["A"], weight: 1.0 },
  { id: "Q_A_2", section: "interests", type: "likert", text: "ฉันชอบเขียนเรื่องสั้น บทกวี หรือบล็อก", tags: ["A"], weight: 1.0 },
  { id: "Q_A_3", section: "interests", type: "likert", text: "ฉันสนุกกับการแสดง ดนตรี หรือการเต้น", tags: ["A"], weight: 1.0 },
  { id: "Q_A_4", section: "interests", type: "likert", text: "ฉันชอบคิดไอเดียใหม่ ๆ และมองสิ่งต่าง ๆ ในมุมที่แตกต่าง", tags: ["A"], weight: 1.0 },
  { id: "Q_A_5", section: "interests", type: "likert", text: "ฉันชอบถ่ายรูป ถ่ายวิดีโอ หรือตัดต่อสื่อ", tags: ["A"], weight: 1.0 },
  { id: "Q_A_6", section: "interests", type: "likert", text: "ฉันรู้สึกมีความสุขเมื่อได้แสดงออกทางความคิดสร้างสรรค์", tags: ["A"], weight: 1.0 },

  // S — Social
  { id: "Q_S_1", section: "interests", type: "likert", text: "ฉันชอบช่วยเหลือผู้อื่นและให้คำปรึกษา", tags: ["S"], weight: 1.0 },
  { id: "Q_S_2", section: "interests", type: "likert", text: "ฉันสนุกกับการทำงานเป็นทีม", tags: ["S"], weight: 1.0 },
  { id: "Q_S_3", section: "interests", type: "likert", text: "ฉันชอบสอนหนังสือหรืออธิบายเรื่องยาก ๆ ให้คนอื่นเข้าใจ", tags: ["S"], weight: 1.0 },
  { id: "Q_S_4", section: "interests", type: "likert", text: "ฉันสนใจปัญหาสังคมและอยากมีส่วนร่วมแก้ไข", tags: ["S"], weight: 1.0 },
  { id: "Q_S_5", section: "interests", type: "likert", text: "ฉันชอบฟังเรื่องราวของคนอื่นและเข้าใจความรู้สึกเขา", tags: ["S"], weight: 1.0 },
  { id: "Q_S_6", section: "interests", type: "likert", text: "ฉันรู้สึกดีเมื่อได้ทำงานอาสาสมัครหรือช่วยเหลือชุมชน", tags: ["S"], weight: 1.0 },

  // E — Enterprising
  { id: "Q_E_1", section: "interests", type: "likert", text: "ฉันชอบเป็นผู้นำและตัดสินใจในกลุ่ม", tags: ["E"], weight: 1.0 },
  { id: "Q_E_2", section: "interests", type: "likert", text: "ฉันสนุกกับการพูดโน้มน้าวหรือเจรจาต่อรอง", tags: ["E"], weight: 1.0 },
  { id: "Q_E_3", section: "interests", type: "likert", text: "ฉันชอบวางแผนโปรเจกต์และจัดการให้สำเร็จ", tags: ["E"], weight: 1.0 },
  { id: "Q_E_4", section: "interests", type: "likert", text: "ฉันสนใจเรื่องธุรกิจ การลงทุน หรือการเป็นเจ้าของกิจการ", tags: ["E"], weight: 1.0 },
  { id: "Q_E_5", section: "interests", type: "likert", text: "ฉันชอบแข่งขันและตั้งเป้าหมายที่ท้าทาย", tags: ["E"], weight: 1.0 },
  { id: "Q_E_6", section: "interests", type: "likert", text: "ฉันมั่นใจในการพูดหน้าชั้นเรียนหรือนำเสนอผลงาน", tags: ["E"], weight: 1.0 },

  // C — Conventional
  { id: "Q_C_1", section: "interests", type: "likert", text: "ฉันชอบจัดระเบียบข้อมูลและทำงานอย่างเป็นระบบ", tags: ["C"], weight: 1.0 },
  { id: "Q_C_2", section: "interests", type: "likert", text: "ฉันสนุกกับการทำงานกับตัวเลข ตาราง หรือสเปรดชีต", tags: ["C"], weight: 1.0 },
  { id: "Q_C_3", section: "interests", type: "likert", text: "ฉันชอบทำงานที่มีขั้นตอนชัดเจนและทำซ้ำได้", tags: ["C"], weight: 1.0 },
  { id: "Q_C_4", section: "interests", type: "likert", text: "ฉันใส่ใจรายละเอียดและตรวจสอบงานอย่างละเอียด", tags: ["C"], weight: 1.0 },
  { id: "Q_C_5", section: "interests", type: "likert", text: "ฉันชอบวางแผนและจัดตารางเวลาให้เป็นระเบียบ", tags: ["C"], weight: 1.0 },
  { id: "Q_C_6", section: "interests", type: "likert", text: "ฉันทำงานได้ดีเมื่อมีกฎระเบียบและโครงสร้างชัดเจน", tags: ["C"], weight: 1.0 },
];

// ------ SECTION 2: Academic Profile (6 questions) ------
const academicQuestions = [
  {
    id: "Q_AC_1", section: "academic", type: "multiple_choice",
    text: "วิชาที่คุณชอบเรียนมากที่สุด (เลือกได้หลายข้อ)",
    options: [
      { id: "math", label: "คณิตศาสตร์" },
      { id: "physics", label: "ฟิสิกส์" },
      { id: "chemistry", label: "เคมี" },
      { id: "biology", label: "ชีววิทยา" },
      { id: "thai", label: "ภาษาไทย" },
      { id: "english", label: "ภาษาอังกฤษ" },
      { id: "social", label: "สังคมศึกษา" },
      { id: "art", label: "ศิลปะ/ดนตรี" },
      { id: "computer", label: "คอมพิวเตอร์/IT" },
    ],
    tags: ["academic_subjects"],
    weight: 1.0,
  },
  { id: "Q_AC_2", section: "academic", type: "likert", text: "ฉันมีความมั่นใจในวิชาคณิตศาสตร์", tags: ["Academic_Math"], weight: 1.0 },
  { id: "Q_AC_3", section: "academic", type: "likert", text: "ฉันเข้าใจและสนุกกับการคำนวณและตัวเลข", tags: ["Academic_Math"], weight: 1.0 },
  { id: "Q_AC_4", section: "academic", type: "likert", text: "ฉันมีความมั่นใจในวิชาวิทยาศาสตร์ (ฟิสิกส์/เคมี/ชีววิทยา)", tags: ["Academic_Sci"], weight: 1.0 },
  { id: "Q_AC_5", section: "academic", type: "likert", text: "ฉันชอบทดลองและสังเกตปรากฏการณ์ธรรมชาติ", tags: ["Academic_Sci"], weight: 1.0 },
  { id: "Q_AC_6", section: "academic", type: "likert", text: "ฉันมีความมั่นใจในวิชาภาษาอังกฤษ", tags: ["Academic_Eng"], weight: 1.0 },
];

// ------ SECTION 3: Constraints / Preferences (3 questions) ------
const constraintQuestions = [
  {
    id: "Q_CON_1", section: "constraints", type: "multiple_choice",
    text: "คุณอยากเรียนมหาวิทยาลัยในพื้นที่ไหน?",
    options: [
      { id: "bkk", label: "กรุงเทพฯ / ปริมณฑล" },
      { id: "province", label: "ต่างจังหวัด" },
      { id: "any_loc", label: "ได้หมด ไม่จำกัด" },
    ],
    tags: ["location_pref"],
    weight: 1.0,
  },
  {
    id: "Q_CON_2", section: "constraints", type: "multiple_choice",
    text: "คุณสนใจมหาวิทยาลัยประเภทไหน?",
    options: [
      { id: "public", label: "มหาวิทยาลัยรัฐ" },
      { id: "private", label: "มหาวิทยาลัยเอกชน" },
      { id: "any_type", label: "ได้หมด" },
    ],
    tags: ["uni_type_pref"],
    weight: 1.0,
  },
  {
    id: "Q_CON_3", section: "constraints", type: "multiple_choice",
    text: "คุณเรียนสายอะไรในตอนนี้?",
    options: [
      { id: "sci_math", label: "วิทย์-คณิต" },
      { id: "arts_math", label: "ศิลป์-คำนวณ" },
      { id: "arts_lang", label: "ศิลป์-ภาษา" },
      { id: "arts_soc", label: "ศิลป์-สังคม" },
      { id: "vocational", label: "สายอาชีพ / ปวช." },
    ],
    tags: ["study_track"],
    weight: 1.0,
  },
];

// ------ Combine all questions ------
export const allQuestions = [...riasecQuestions, ...academicQuestions, ...constraintQuestions];

export function getQuestionsBySection(section) {
  return allQuestions.filter(q => q.section === section);
}

export const SECTIONS = [
  { id: "interests", label: "ความสนใจ (RIASEC)", icon: "Heart", questionCount: 36 },
  { id: "academic", label: "ด้านวิชาการ", icon: "BookOpen", questionCount: 6 },
  { id: "constraints", label: "ข้อจำกัด/ความต้องการ", icon: "Settings", questionCount: 3 },
];