import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { appNameFull } from "@/lib/app-params";
import { motion } from "framer-motion";
import { ArrowRight, Clock, CheckCircle, Target, Brain, Filter, Users, ShieldCheck } from "lucide-react";

import { createInitialProfile, getStoredLeadProfile, getStoredUserProfileId } from "@/lib/leadCaptureApi";

const DialogContentAny = /** @type {any} */ (DialogContent);
const DialogHeaderAny = /** @type {any} */ (DialogHeader);
const DialogTitleAny = /** @type {any} */ (DialogTitle);
const DialogDescriptionAny = /** @type {any} */ (DialogDescription);
const LabelAny = /** @type {any} */ (Label);

const features = [
  {
    icon: Brain,
    title: "ค้นหาตัวตน ไม่ตามกระแส",
    desc: "เลิกสุ่มเดาอนาคต ระบบใช้แบบทดสอบจิตวิทยาอาชีพ (RIASEC) เพื่อบอกจุดแข็งที่คุณมีจริงๆ และอาชีพที่ทำแล้วจะรอดในระยะยาว",
  },
  {
    icon: Filter,
    title: "จับคู่คณะ ตรงสเปก",
    desc: "คัดกรองคณะจากหลักสูตรนับพัน ให้เหลือเฉพาะที่ตรงกับ \"ความถนัด\" และ \"เกรดเฉลี่ย\" ของคุณแบบอัตโนมัติ",
  },
  {
    icon: Users,
    title: "เอา Data ไปคุยกับพ่อแม่",
    desc: "ได้ Report สรุป \"เงินเดือนเฉลี่ย\" และ \"โอกาสเติบโต\" ของอาชีพนั้นๆ เพื่อใช้เป็นข้อมูลจริงคุยกับที่บ้าน ลดปัญหาถูกบังคับเรียน",
  },
];

export default function Landing() {
  const navigate = useNavigate();
  const storedProfileId = getStoredUserProfileId();
  const storedProfile = storedProfileId ? getStoredLeadProfile(storedProfileId) : null;
  const [preQuizModalOpen, setPreQuizModalOpen] = useState(false);
  const [preQuizForm, setPreQuizForm] = useState(() => ({
    nickname: storedProfile?.nickname || "",
    userType: storedProfile?.userType || "",
  }));
  const [preQuizError, setPreQuizError] = useState("");

  const handlePreQuizStart = () => {
    setPreQuizModalOpen(true);
  };

  /** @param {React.FormEvent<HTMLFormElement>} event */
  const handlePreQuizSubmit = async (event) => {
    event.preventDefault();

    const nickname = preQuizForm.nickname.trim();
    const userType = preQuizForm.userType.trim();

    if (!nickname || !userType) {
      setPreQuizError("กรุณากรอกชื่อเล่นและเลือกสถานะของคุณ");
      return;
    }

    const profileId = await createInitialProfile({ nickname, userType });
    window.localStorage.setItem("kookid_user_profile_nickname", nickname);
    window.localStorage.setItem("kookid_user_profile_type", userType);
    window.localStorage.setItem("kookid_user_profile_id", profileId);
    setPreQuizError("");
    setPreQuizModalOpen(false);
    navigate("/quiz");
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5" />
        <div className="relative max-w-5xl mx-auto px-4 pt-16 pb-20 sm:pt-24 sm:pb-28">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            className="text-center"
          >
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-foreground leading-tight">
              เลือกคณะพลาด เสียเวลาฟรี 1 ปี<br className="hidden sm:block" />
              หา <span className="text-primary">"อาชีพที่ใช่"</span> ก่อนลงสนาม TCAS
            </h1>
            
            <p className="mt-8 text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              ค้นหาจุดแข็งและจับคู่คณะที่ 'รอด' สำหรับคุณโดยอัตโนมัติ เลิกงมระเบียบการและข้อมูลขยะให้ปวดหัว
            </p>

            <div className="mt-10">
              <Button size="lg" className="text-lg px-8 py-6 rounded-xl shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-all" onClick={handlePreQuizStart}>
                เริ่มทำควิซ (ฟรี 100%)
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
              <div className="mt-4 flex flex-wrap items-center justify-center gap-3 sm:gap-4 text-sm font-medium text-muted-foreground">
                <span className="flex items-center gap-1.5">⏱️ ใช้เวลาแค่ 3 นาที</span>
                <span className="text-border hidden sm:inline">|</span>
                <span className="flex items-center gap-1.5">📝 30 คำถาม</span>
                <span className="text-border hidden sm:inline">|</span>
                <span className="flex items-center gap-1.5">⚡ รู้ผลทันที</span>
              </div>
            </div>

            {/* Trust Badges */}
            <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-3 mt-12">
              <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 rounded-full text-xs text-slate-600 font-medium">
                <span>✅ มาตรฐานสากล RIASEC</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 rounded-full text-xs text-slate-600 font-medium">
                <span>✅ อิง Data ตลาดแรงงาน</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 rounded-full text-xs text-slate-600 font-medium">
                <span>✅ อ้างอิงสาขาจาก TCAS</span>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Features */}
      <div className="max-w-5xl mx-auto px-4 pb-20">
        <div className="grid sm:grid-cols-3 gap-6">
          {features.map((f, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + i * 0.15 }}
              className="bg-card rounded-2xl p-6 border border-border/50 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                <f.icon className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">{f.title}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-border/50 py-10 px-4 text-center">
        <div className="max-w-4xl mx-auto space-y-5">
          <p className="text-sm font-medium text-foreground/80">
            &copy; 2026 KooKid. เครื่องมือแนะแนวสำหรับนักเรียน ม.4–ม.6
          </p>
          
          <p className="text-xs text-muted-foreground/70 leading-relaxed max-w-4xl mx-auto text-balance">
            <span className="font-semibold">Beta Version:</span> แพลตฟอร์มนี้อยู่ในช่วงการพัฒนาและทดสอบ ข้อมูลอาชีพ เงินเดือน และหลักสูตร ถูกรวบรวมและประมวลผลจากฐานข้อมูลสาธารณะ (สถิติตลาดแรงงานและระเบียบการ TCAS) โดยระบบอัลกอริทึมของ KooKid ข้อมูลและรายงานทั้งหมดจัดทำขึ้นเพื่อเป็น "แนวทางเบื้องต้น" ในการสำรวจตัวเองและการตั้งเป้าหมายเท่านั้น ระบบอาจไม่ครอบคลุมเงื่อนไขพิเศษของบางสถาบัน ผู้ใช้งานต้องตรวจสอบระเบียบการทางการของเว็บไซต์มหาวิทยาลัยหรือ ทปอ. (mytcas.com) เพื่อประกอบการตัดสินใจขั้นสุดท้ายเสมอ
          </p>

          <div className="text-sm text-foreground/70 flex flex-wrap justify-center gap-2 sm:gap-4 items-center pt-2">
            <span className="font-medium mr-1">ติดต่อทีมงาน:</span>
            <a href="tel:0864062711" className="hover:text-primary transition-colors flex items-center gap-1.5" aria-label="โทร 086-406-2711">
              📞 086-406-2711
            </a>
            <span className="text-border hidden sm:inline">|</span>
            <a href="https://line.me/ti/p/l6MqQjBc-t" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors flex items-center gap-1.5" aria-label="Line t12312121">
              💬 Line: t12312121
            </a>
            <span className="text-border hidden sm:inline">|</span>
            <a href="mailto:tthirawut06@gmail.com" className="hover:text-primary transition-colors flex items-center gap-1.5" aria-label="Email tthirawut06@gmail.com">
              ✉️ tthirawut06@gmail.com
            </a>
          </div>
        </div>
      </footer>

      <Dialog open={preQuizModalOpen} onOpenChange={setPreQuizModalOpen}>
        <DialogContentAny className="sm:max-w-lg">
          <DialogHeaderAny>
            <DialogTitleAny>เริ่มต้นด้วยข้อมูลสั้น ๆ</DialogTitleAny>
            <DialogDescriptionAny>
              ใช้เพียงชื่อเล่นและสถานะของคุณเพื่อปรับคำถามและผลลัพธ์ให้ตรงขึ้น
            </DialogDescriptionAny>
          </DialogHeaderAny>
          <form className="space-y-4 pt-2" onSubmit={handlePreQuizSubmit}>
            <div className="space-y-2">
              <LabelAny htmlFor="prequiz-nickname">ชื่อเล่น <span className="text-destructive">*</span></LabelAny>
              <Input
                id="prequiz-nickname"
                value={preQuizForm.nickname}
                onChange={(e) => setPreQuizForm(prev => ({ ...prev, nickname: e.target.value }))}
                placeholder="เช่น ใบเตย"
                autoComplete="nickname"
                required
              />
            </div>

            <div className="space-y-2">
              <LabelAny htmlFor="prequiz-usertype">สถานะปัจจุบัน <span className="text-destructive">*</span></LabelAny>
              <select
                id="prequiz-usertype"
                value={preQuizForm.userType}
                onChange={(e) => setPreQuizForm(prev => ({ ...prev, userType: e.target.value }))}
                required
                className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <option value="" disabled>เลือกสถานะของคุณ</option>
                <option value="student_junior">นักเรียน ม.ต้น</option>
                <option value="student_senior">นักเรียน ม.ปลาย / ปวช.</option>
                <option value="parent">ผู้ปกครอง</option>
                <option value="working_college">นักศึกษา / วัยทำงาน</option>
              </select>
            </div>

            {preQuizError && <p className="text-sm text-destructive">{preQuizError}</p>}

            <div className="flex justify-end gap-3 pt-2">
              <Button type="button" variant="outline" onClick={() => setPreQuizModalOpen(false)} className="rounded-xl">
                ยกเลิก
              </Button>
              <Button type="submit" className="rounded-xl">
                เริ่มทำแบบทดสอบ
                <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </form>
        </DialogContentAny>
      </Dialog>
    </div>
  );
}