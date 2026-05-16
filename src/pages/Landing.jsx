import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { ArrowRight, GraduationCap, Target, Sparkles, Clock, CheckCircle } from "lucide-react";
import { supabase } from "@/utils/supabase";

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
  const [dbStatus, setDbStatus] = useState("กำลังเชื่อมต่อฐานข้อมูล...");

  useEffect(() => {
    let mounted = true;

    async function checkSupabase() {
      if (!supabase) {
        if (mounted) setDbStatus("ยังไม่ได้ตั้งค่า Supabase");
        return;
      }

      const { error } = await supabase.from("program_interests").select("id", { count: "exact", head: true });
      if (!mounted) return;

      setDbStatus(error ? "เชื่อมต่อฐานข้อมูลไม่สำเร็จ" : "เชื่อมต่อ Supabase พร้อมใช้งาน");
    }

    checkSupabase();

    return () => {
      mounted = false;
    };
  }, []);

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
              ค้นหาคณะและอาชีพ
              <br />
              <span className="text-primary">ที่ใช่สำหรับคุณ</span>
            </h1>
            <p className="mt-6 text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              แบบทดสอบวิเคราะห์ความสนใจ ความถนัด และบุคลิกภาพ
              เพื่อแนะนำสาขาวิชาและมหาวิทยาลัยที่เหมาะกับคุณในระบบ TCAS
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
        <div className="mt-1 text-xs text-muted-foreground/80">{dbStatus}</div>
      </footer>
    </div>
  );
}