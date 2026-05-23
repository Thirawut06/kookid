import React from "react";
import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { appNameFull } from "@/lib/app-params";
import { Button } from "@/components/ui/button";

export default function Privacy() {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-4 py-10 sm:py-14">
        <div className="text-center mb-8">
          <div className="text-xs font-semibold tracking-widest text-primary/60 uppercase mb-2">{appNameFull}</div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">นโยบายความเป็นส่วนตัว / PDPA</h1>
          <p className="mt-3 text-sm sm:text-base text-muted-foreground">
            หน้านี้อธิบายการเก็บ ใช้ และส่งต่อข้อมูลตามความยินยอมของผู้ใช้ เพื่อให้สอดคล้องกับ PDPA และแนวทางการใช้งานจริง
          </p>
        </div>

        <Card className="p-5 sm:p-7 border-border/60 shadow-sm space-y-4 leading-relaxed text-sm sm:text-base text-foreground/80">
          <p>
            {appNameFull} เก็บข้อมูลที่ผู้ใช้กรอกไว้เพื่อใช้ในการแนะนำสาขาวิชา โควต้า ทุนการศึกษา และข้อมูลที่เกี่ยวข้องกับผลการประเมินของผู้ใช้เท่านั้น
          </p>
          <p>
            ข้อมูลอาจถูกส่งต่อให้มหาวิทยาลัยหรือพันธมิตรที่เกี่ยวข้องเฉพาะในกรณีที่สอดคล้องกับความยินยอมของผู้ใช้ และใช้เพื่อการติดต่อกลับหรือการให้คำแนะนำทางการศึกษา
          </p>
          <p>
            ผู้ใช้สามารถติดต่อทีมงานเพื่อขอแก้ไขหรือขอลบข้อมูลได้ตามสิทธิ์ที่กฎหมายคุ้มครองข้อมูลส่วนบุคคลกำหนด
          </p>
          <p>
            ควรระบุรายละเอียดผู้ควบคุมข้อมูล ช่องทางติดต่อ และระยะเวลาการเก็บรักษาข้อมูลให้ครบถ้วนก่อนใช้งานจริงในสภาพแวดล้อมสาธารณะ
          </p>
        </Card>

        <div className="flex justify-center mt-6">
          <Button asChild variant="outline" className="rounded-xl">
            <Link to="/results">กลับไปหน้าผลการทดสอบ</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
