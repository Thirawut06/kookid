import React from "react";
import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { appNameFull } from "@/lib/app-params";
import { Button } from "@/components/ui/button";

// TODO: รีเช็ก Privacy Policy ในรอบสุดท้าย — ตรวจสอบ GDPR / Thai PDPA compliance
// (deferred until all other features are complete)

export default function Privacy() {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-4 py-10 sm:py-14">
        <div className="text-center mb-8">
          <div className="text-xs font-semibold tracking-widest text-primary/60 uppercase mb-2">{appNameFull}</div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">นโยบายความเป็นส่วนตัว (Privacy Policy)</h1>
          <p className="mt-3 text-sm sm:text-base text-muted-foreground">
            เราให้ความสำคัญกับข้อมูลส่วนบุคคลของคุณ หน้านี้อธิบายถึงวิธีการที่เรารวบรวม ใช้งาน และปกป้องข้อมูลของคุณ
          </p>
        </div>

        <Card className="p-6 sm:p-8 border-border/60 shadow-sm space-y-6 text-sm sm:text-base text-foreground/80">
          
          <section className="space-y-2">
            <h2 className="text-lg font-bold text-foreground">1. ข้อมูลที่เรารวบรวม</h2>
            <p>เราเก็บรวบรวมข้อมูลที่คุณให้ไว้โดยสมัครใจเมื่อใช้งานแพลตฟอร์ม ได้แก่:</p>
            <ul className="list-disc list-inside ml-2 space-y-1 text-muted-foreground">
              <li>ข้อมูลทั่วไป: ชื่อเล่น, สถานะ (ระดับชั้น/อายุ)</li>
              <li>ข้อมูลการติดต่อ: เบอร์โทรศัพท์, อีเมล, Line ID, จังหวัด</li>
              <li>ข้อมูลการศึกษา: ชื่อโรงเรียน, แผนการเรียน, เกรดเฉลี่ย (GPAX)</li>
              <li>ข้อมูลการประเมิน: คำตอบจากแบบทดสอบและผลลัพธ์บุคลิกภาพ (Holland Code / RIASEC)</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-bold text-foreground">2. วัตถุประสงค์ในการนำข้อมูลไปใช้</h2>
            <p>เรานำข้อมูลของคุณไปใช้เพื่อวัตถุประสงค์ดังต่อไปนี้เท่านั้น:</p>
            <ul className="list-disc list-inside ml-2 space-y-1 text-muted-foreground">
              <li>วิเคราะห์และประมวลผลเพื่อแนะนำอาชีพ คณะ และมหาวิทยาลัยที่เหมาะสม</li>
              <li>ติดต่อกลับเพื่อให้คำแนะนำ ข่าวสารเกี่ยวกับการศึกษาต่อ หรือสิทธิประโยชน์ที่เกี่ยวข้อง</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-bold text-foreground">3. การเก็บรักษาและความปลอดภัย</h2>
            <p>
              เราจะเก็บรักษาข้อมูลของคุณไว้ด้วยมาตรการรักษาความปลอดภัยที่ได้มาตรฐาน และจะเก็บข้อมูลไว้เป็นระยะเวลา 1 ปีการศึกษา (หรือตามรอบของ TCAS) หลังจากนั้นข้อมูลส่วนบุคคลของคุณจะถูกลบหรือทำให้ไม่สามารถระบุตัวตนได้
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-bold text-foreground">4. สิทธิของเจ้าของข้อมูลส่วนบุคคล</h2>
            <p>คุณมีสิทธิตามพระราชบัญญัติคุ้มครองข้อมูลส่วนบุคคล พ.ศ. 2562 (PDPA) ดังนี้:</p>
            <ul className="list-disc list-inside ml-2 space-y-1 text-muted-foreground">
              <li>สิทธิในการขอเข้าถึง ขอสำเนา หรือขอแก้ไขข้อมูลให้ถูกต้อง</li>
              <li>สิทธิในการขอให้ลบ หรือทำลายข้อมูลส่วนบุคคล</li>
              <li>สิทธิในการเพิกถอนความยินยอมในการประมวลผลหรือส่งต่อข้อมูลได้ตลอดเวลา</li>
            </ul>
          </section>

          <section className="space-y-2 pt-4 border-t border-border/50">
            <h2 className="text-lg font-bold text-foreground">5. ช่องทางการติดต่อ</h2>
            <p className="text-muted-foreground">หากคุณมีคำถามหรือต้องการใช้สิทธิตามกฎหมาย สามารถติดต่อเราได้ที่:</p>
            <div className="mt-2 text-sm bg-muted/30 p-4 rounded-xl border border-border/50">
              <p><span className="font-medium text-foreground">ผู้ควบคุมข้อมูล:</span> ทีมงาน {appNameFull}</p>
              <p><span className="font-medium text-foreground">อีเมล:</span> tthirawut06@gmail.com</p>
              <p><span className="font-medium text-foreground">เบอร์โทรศัพท์:</span> 086-406-2711</p>
              <p><span className="font-medium text-foreground">Line ID:</span> t12312121</p>
            </div>
          </section>

        </Card>

        <div className="flex justify-center mt-8 pb-10">
          <Button asChild variant="outline" className="rounded-xl px-8 shadow-sm">
            <Link to="/results">กลับไปหน้าผลการทดสอบ</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}