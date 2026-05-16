// ============================================================
// TCAS Career Quiz — Question Bank
// All questions for MVP 0.1: Interests (RIASEC) + Academic + Constraints
// ============================================================

// ------ SECTION 1: Interests / RIASEC (24 questions, 4 per dimension) ------
const riasecQuestions = [
  // R — Realistic
  { id: "Q_R_1", section: "interests", type: "likert", text: "ฉันรับได้กับการทำงานที่ต้องเปื้อนฝุ่น ลุยแดด หรือใช้แรงกายค่อนข้างหนักเป็นประจำ", tags: ["R"], weight: 1.0 },
  { id: "Q_R_2", section: "interests", type: "likert", text: "ฉันโอเคถ้าต้องทำงานในสถานที่อย่างไซต์ก่อสร้าง โรงงาน หรือพื้นที่ภาคสนามที่ไม่สะดวกสบายเหมือนออฟฟิศ", tags: ["R"], weight: 1.0 },
  { id: "Q_R_3", section: "interests", type: "likert", text: "ฉันสามารถทำตามกฎความปลอดภัยและขั้นตอนการทำงานที่เคร่งครัดได้ต่อเนื่อง แม้จะรู้สึกยุ่งยากบ้าง", tags: ["R"], weight: 1.0 },
  { id: "Q_R_4", section: "interests", type: "likert", text: "ถ้างานที่ทำต้องซ่อมแซม/ติดตั้งอุปกรณ์เดิม ๆ ซ้ำหลายครั้ง ฉันก็ยังทำได้โดยไม่รู้สึกเบื่อจนอยากเลิก", tags: ["R"], weight: 1.0 },

  // I — Investigative
  { id: "Q_I_1", section: "interests", type: "likert", text: "ฉันสามารถนั่งโฟกัสกับโจทย์ยาก ๆ หรือปัญหาซับซ้อน (เช่น หา Bug หรืออ่านบทความวิจัย) ได้นานหลายชั่วโมงโดยไม่ทิ้งไปกลางคัน", tags: ["I"], weight: 1.0 },
  { id: "Q_I_2", section: "interests", type: "likert", text: "ฉันพร้อมที่จะเรียนรู้เนื้อหายาก ๆ ใหม่ ๆ อย่างต่อเนื่อง เพราะรู้ว่าถ้าหยุดอัปเดตความรู้ งานสายนี้จะตามไม่ทัน", tags: ["I"], weight: 1.0 },
  { id: "Q_I_3", section: "interests", type: "likert", text: "เวลาติดปัญหายาก ๆ ฉันเลือกค้นข้อมูล/ทดลองหลายวิธีแก้ มากกว่ารอให้คนอื่นบอกคำตอบ", tags: ["I"], weight: 1.0 },
  { id: "Q_I_4", section: "interests", type: "likert", text: "ฉันรับได้ถ้าคะแนนสอบหรือผลทดลองครั้งแรกออกมาไม่ดี และพร้อมปรับแผนแล้วลองใหม่หลายรอบ", tags: ["I"], weight: 1.0 },

  // A — Artistic
  { id: "Q_A_1", section: "interests", type: "likert", text: "ฉันรับได้ถ้าต้องแก้งานหลายรอบ หรือถูกให้กลับไปใช้ดราฟต์เก่า หลังจากทุ่มเททำผลงานใหม่มานาน", tags: ["A"], weight: 1.0 },
  { id: "Q_A_2", section: "interests", type: "likert", text: "ฉันสามารถแยกแยะความรู้สึกส่วนตัวออกจากงานได้ เมื่อผลงานที่ภูมิใจถูกวิจารณ์อย่างหนักว่า ‘ยังไม่ตอบโจทย์ลูกค้า/ตลาด’", tags: ["A"], weight: 1.0 },
  { id: "Q_A_3", section: "interests", type: "likert", text: "ฉันโอเคกับการทำงานที่กำหนดเส้นตาย (Deadline) ชัดเจน และบางครั้งอาจต้องอดนอนเร่งงานให้ทันส่ง", tags: ["A"], weight: 1.0 },
  { id: "Q_A_4", section: "interests", type: "likert", text: "ถ้างานที่ลูกค้าหรือหัวหน้าเลือกไม่ตรงกับสไตล์ที่ฉันชอบที่สุด แต่ตอบโจทย์เขามากกว่า ฉันก็ยังทำต่อได้", tags: ["A"], weight: 1.0 },

  // S — Social
  { id: "Q_S_1", section: "interests", type: "likert", text: "ฉันสามารถควบคุมอารมณ์และพูดดีได้ แม้ต้องเจอคนที่เหวี่ยงวีน พูดจาไม่ดี หรือไม่ให้ความร่วมมือ", tags: ["S"], weight: 1.0 },
  { id: "Q_S_2", section: "interests", type: "likert", text: "ฉันยินดีอธิบายเรื่องเดิมซ้ำ ๆ ให้คนที่เข้าใจช้ากว่าคนอื่น โดยไม่แสดงอาการรำคาญออกไป", tags: ["S"], weight: 1.0 },
  { id: "Q_S_3", section: "interests", type: "likert", text: "ฉันรับได้ถ้าต้องทำงานในเวลาที่คนส่วนใหญ่พักผ่อน (เช่น เสาร์-อาทิตย์ หรือเวรดึก) เพื่อดูแลคนอื่น", tags: ["S"], weight: 1.0 },
  { id: "Q_S_4", section: "interests", type: "likert", text: "หลังจากฟังปัญหาหนัก ๆ ของคนอื่น ฉันยังพอแยกได้ว่าอะไรคือเรื่องของเขา ไม่เอามาเครียดแทนตลอดเวลา", tags: ["S"], weight: 1.0 },

  // E — Enterprising
  { id: "Q_E_1", section: "interests", type: "likert", text: "ฉันสามารถรับมือกับความกดดัน เมื่อมียอดขายหรือเป้าหมาย (KPI) ชัดเจน และถูกวัดผลเป็นตัวเลขทุกเดือน", tags: ["E"], weight: 1.0 },
  { id: "Q_E_2", section: "interests", type: "likert", text: "ฉันกล้าเข้าไปคุย/เสนอไอเดียกับคนแปลกหน้า หรือผู้ใหญ่ที่มีตำแหน่งสูงกว่าฉัน เพื่อผลลัพธ์ของงาน", tags: ["E"], weight: 1.0 },
  { id: "Q_E_3", section: "interests", type: "likert", text: "ฉันรับได้ถ้าต้องโดนปฏิเสธข้อเสนอหรือไอเดียซ้ำ ๆ และยังกล้าลองใหม่โดยไม่รู้สึกท้อจนหยุดไปเลย", tags: ["E"], weight: 1.0 },
  { id: "Q_E_4", section: "interests", type: "likert", text: "ถ้างานต้องให้ฉันรับผิดชอบตัดสินใจเรื่องสำคัญ ๆ ของทีม ฉันพร้อมรับทั้งคำชมและคำตำหนิจากผลลัพธ์นั้น", tags: ["E"], weight: 1.0 },

  // C — Conventional
  { id: "Q_C_1", section: "interests", type: "likert", text: "ฉันสามารถทำงานกับตัวเลขหรือเอกสารที่ต้องละเอียดและแม่นยำสูง (เช่น ตัวเลขเงิน, เอกสารสัญญา) ได้โดยไม่รู้สึกกดดันเกินไป", tags: ["C"], weight: 1.0 },
  { id: "Q_C_2", section: "interests", type: "likert", text: "ฉันรู้สึกโอเคกับการทำงานที่รูปแบบคล้ายเดิมทุกวัน แต่ต้องรักษามาตรฐานให้เป๊ะสม่ำเสมอ", tags: ["C"], weight: 1.0 },
  { id: "Q_C_3", section: "interests", type: "likert", text: "ฉันสบายใจกับการทำงานที่มีกฎ ระเบียบ และขั้นตอนตายตัว มากกว่างานที่เปลี่ยนไปมาโดยไม่มีหลักเกณฑ์ชัดเจน", tags: ["C"], weight: 1.0 },
  { id: "Q_C_4", section: "interests", type: "likert", text: "ถ้าหัวหน้าหรือระบบกำหนดรูปแบบเอกสาร/ไฟล์/โฟลเดอร์ไว้ชัดเจน ฉันยินดีทำตามและช่วยให้ทีมรักษาระบบนั้นต่อไป", tags: ["C"], weight: 1.0 },
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

// ------ SECTION 3: Constraints / Preferences (4 questions) ------
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
  {
    id: "Q_CON_4", section: "constraints", type: "multiple_choice",
    text: "คุณมีความต้องการด้านทุนการศึกษามากน้อยแค่ไหน?",
    options: [
      { id: "need_full", label: "จำเป็นต้องได้ทุนเต็มจำนวน (100%) ถึงจะเรียนได้" },
      { id: "need_partial", label: "ต้องการทุนบางส่วน หรือวางแผนกู้ กยศ." },
      { id: "no_need", label: "ครอบครัวสนับสนุนได้เต็มที่ ไม่เน้นหาทุน" },
    ],
    tags: ["financial_pref"],
    weight: 1.0,
  },
];

// ------ Combine all questions ------
export const allQuestions = [...riasecQuestions, ...academicQuestions, ...constraintQuestions];

export function getQuestionsBySection(section) {
  return allQuestions.filter(q => q.section === section);
}

export const SECTIONS = [
  { id: "interests", label: "ความสนใจ (RIASEC)", icon: "Heart", questionCount: 24 },
  { id: "academic", label: "ด้านวิชาการ", icon: "BookOpen", questionCount: 6 },
  { id: "constraints", label: "ข้อจำกัด/ความต้องการ", icon: "Settings", questionCount: 4 },
];