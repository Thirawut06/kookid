import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { appNameFull } from "@/lib/app-params";
import { motion } from "framer-motion";
import { ArrowRight, Clock, CheckCircle, GraduationCap, Sparkles, Target } from "lucide-react";

import { createInitialProfile, getStoredLeadProfile, getStoredUserProfileId } from "@/lib/leadCaptureApi";

const DialogContentAny = /** @type {any} */ (DialogContent);
const DialogHeaderAny = /** @type {any} */ (DialogHeader);
const DialogTitleAny = /** @type {any} */ (DialogTitle);
const DialogDescriptionAny = /** @type {any} */ (DialogDescription);
const LabelAny = /** @type {any} */ (Label);

const features = [
  {
    icon: Target,
    title: "วิเคราะห์ตัวตนแม่นยำ",
    desc: "ค้นหาจุดแข็งและอาชีพที่เหมาะกับคุณ ด้วยทฤษฎีจิตวิทยาระดับโลก (RIASEC)",
  },
  {
    icon: GraduationCap,
    title: "จับคู่คณะ TCAS เป๊ะๆ",
    desc: "บอกลาความสับสน! ระบบจะแนะนำสาขาวิชาและมหาวิทยาลัยในไทยที่ตรงกับผลลัพธ์ของคุณที่สุด",
  },
  {
    icon: Sparkles,
    title: "ชี้เป้าทุนและโควต้า",
    desc: "ไม่ต้องงมหาเองให้เหนื่อย รับข้อมูลทุนการศึกษาและโควต้าจากมหาลัยส่งตรงถึงมือคุณ",
  },
];

const stats = [
  { icon: Clock, label: "ใช้เวลาประเมินเพียง 3-5 นาที" },
  { icon: CheckCircle, label: "ทำง่าย 30 คำถาม (รู้ผลทันที)" },
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
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-semibold mb-6 tracking-wide">
              <Sparkles className="w-4 h-4" />
              {appNameFull}
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-foreground leading-tight">
              หาคณะที่ใช่ มหาลัยที่ชอบ... พร้อมปลดล็อกโควต้าเรียนฟรี!
            </h1>
            <p className="mt-6 text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              ทำแบบทดสอบจิตวิทยาแค่ 3 นาที เพื่อค้นหาอาชีพที่เกิดมาเพื่อคุณ พร้อมจับคู่คณะในระบบ TCAS อัตโนมัติ
            </p>

            <div className="flex flex-wrap items-center justify-center gap-4 mt-5 text-sm text-muted-foreground">
              {stats.map((s, i) => (
                <div key={i} className="flex items-center gap-1.5">
                  <s.icon className="w-4 h-4 text-primary/70" />
                  {s.label}
                </div>
              ))}
            </div>

            <div className="mt-10">
              <Button size="lg" className="text-lg px-8 py-6 rounded-xl shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-all" onClick={handlePreQuizStart}>
                เริ่มทำแบบทดสอบ
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
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
      <footer className="border-t border-border/50 py-8 text-center text-xs sm:text-sm text-muted-foreground">
        <div>{appNameFull} · เครื่องมือแนะแนวสำหรับนักเรียน ม.4–ม.6</div>
        <div className="mt-2 text-xs sm:text-sm">
          <span className="font-medium">ติดต่อผู้พัฒนา:</span> 
          <a href="tel:0864062711" className="underline hover:text-primary ml-1" aria-label="โทร 086-406-2711">086-406-2711</a>
          <span className="mx-2">·</span>
          <a href="https://line.me/ti/p/l6MqQjBc-t" target="_blank" rel="noopener noreferrer" className="underline hover:text-primary" aria-label="Line t12312121">Line: t12312121</a>
          <span className="mx-2">·</span>
          <a href="mailto:tthirawut06@gmail.com" className="underline hover:text-primary" aria-label="Email tthirawut06@gmail.com">Email: tthirawut06@gmail.com</a>
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