import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { motion } from "framer-motion";
import { ArrowRight, Clock, CheckCircle, GraduationCap, PencilLine, Sparkles, Target } from "lucide-react";
import { toast } from "sonner";

import LeadCaptureForm from "@/components/lead/LeadCaptureForm";
import { getStoredLeadProfile, getStoredUserProfileId, upsertLeadCapture } from "@/lib/leadCaptureApi";

const features = [
  { icon: Target, title: "ค้นหาตัวตน", desc: "วิเคราะห์ความสนใจและจุดแข็งของคุณผ่านแบบทดสอบ RIASEC" },
  { icon: GraduationCap, title: "แนะนำสาขา", desc: "จับคู่กับคณะและมหาวิทยาลัยที่เหมาะกับคุณในระบบ TCAS" },
  { icon: Sparkles, title: "เข้าใจง่าย", desc: "ผลลัพธ์สรุปเป็นภาษาไทยพร้อมคำอธิบายว่าทำไมถึงเหมาะ" },
];

const stats = [
  { icon: Clock, label: "ใช้เวลาประมาณ 10-15 นาที" },
  { icon: CheckCircle, label: "45 คำถาม ครอบคลุม 3 ด้าน" },
];

export default function Landing() {
  const [profileId, setProfileId] = useState(() => getStoredUserProfileId());
  const [profile, setProfile] = useState(() => (profileId ? getStoredLeadProfile(profileId) : null));
  const [profileEditorOpen, setProfileEditorOpen] = useState(false);

  const openProfileEditor = () => {
    setProfileEditorOpen(true);
  };

  const handleProfileSubmit = async (leadData) => {
    const nextProfileId = await upsertLeadCapture({
      userProfileId: profileId,
      ...leadData,
    });

    const nextProfile = getStoredLeadProfile(nextProfileId);
    setProfileId(nextProfileId);
    setProfile(nextProfile);
    setProfileEditorOpen(false);
    toast.success(profile ? "อัปเดตข้อมูลผู้ใช้เรียบร้อย" : "บันทึกข้อมูลผู้ใช้เรียบร้อย");
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
              คู่คิด KooKid
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-foreground leading-tight">
              ค้นหาคณะและมหาวิทยาลัยที่ใช่สำหรับคุณ
            </h1>
            <p className="mt-6 text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              แบบทดสอบค้นหาตัวเอง 24 ข้อ พร้อมจับคู่สาขาและมหาวิทยาลัยที่เหมาะสมตามความสนใจของคุณ
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
              <Link to="/quiz">
                <Button size="lg" className="text-lg px-8 py-6 rounded-xl shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-all">
                  เริ่มทำแบบทดสอบ
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
            </div>

            <div className="mt-3 flex justify-center">
              <Button
                type="button"
                variant="ghost"
                onClick={openProfileEditor}
                className="rounded-xl px-4 text-muted-foreground hover:bg-muted/70 hover:text-foreground"
              >
                <PencilLine className="w-4 h-4 mr-2" />
                ข้อมูลผู้ใช้
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
      <footer className="border-t border-border/50 py-8 text-center text-sm text-muted-foreground">
        <div>คู่คิด KooKid · เครื่องมือแนะแนวสำหรับนักเรียน ม.4–ม.6</div>
      </footer>

      <Dialog open={profileEditorOpen} onOpenChange={setProfileEditorOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{profile ? "แก้ไขข้อมูลผู้ใช้" : "กรอกข้อมูลผู้ใช้"}</DialogTitle>
            <DialogDescription>
              ข้อมูลชุดนี้จะถูกใช้กับการแนะนำสาขา รายงาน และการติดต่อกลับจากระบบ
            </DialogDescription>
          </DialogHeader>
          <LeadCaptureForm
            onSubmit={handleProfileSubmit}
            onCancel={() => setProfileEditorOpen(false)}
            submitLabel={profile ? "บันทึกการแก้ไข" : "บันทึกข้อมูล"}
            prefill={profile || undefined}
            className="pt-2"
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}