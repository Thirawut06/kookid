import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

const initialForm = {
  nickname: "",
  gradeLevel: "",
  schoolName: "",
  studyTrack: "",
  contact: "",
  email: "",
  schoolProvince: "",
  consentAccepted: false,
};

export default function LeadCaptureForm({
  onSubmit,
  onCancel,
  submitLabel = "ยืนยัน",
  className,
  prefill,
  compact = false,
}) {
  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!prefill) return;

    const derivedGradeLevel = prefill.gradeLevel || prefill.gradeAndSchool || "";
    const derivedSchoolName = prefill.schoolName || "";
    const derivedStudyTrack = prefill.studyTrack || prefill.schoolName || "";

    setForm(prev => ({
      ...prev,
      ...prefill,
      gradeLevel: derivedGradeLevel,
      schoolName: derivedSchoolName,
      studyTrack: derivedStudyTrack,
      consentAccepted: Boolean(prefill.consentAccepted),
    }));
  }, [prefill]);

  const updateField = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
    setErrors(prev => ({ ...prev, [field]: undefined, form: undefined }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const nextErrors = {};
    if (!form.nickname.trim()) nextErrors.nickname = "กรุณากรอกชื่อเล่น";
    if (!form.gradeLevel.trim()) nextErrors.gradeLevel = "กรุณากรอกระดับชั้นของคุณ";
    if (!form.schoolName.trim()) nextErrors.schoolName = "กรุณากรอกชื่อโรงเรียน";
    if (!form.studyTrack.trim()) nextErrors.studyTrack = "กรุณากรอกสายการเรียน";
    if (!form.contact.trim()) nextErrors.contact = "กรุณากรอกเบอร์โทรศัพท์หรือ Line ID อย่างน้อย 1 ช่องทาง";
    if (!form.consentAccepted) nextErrors.consentAccepted = "กรุณายินยอมก่อนดำเนินการต่อ";

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit({
        nickname: form.nickname.trim(),
        gradeLevel: form.gradeLevel.trim(),
        schoolName: form.schoolName.trim(),
        studyTrack: form.studyTrack.trim(),
        contact: form.contact.trim(),
        email: form.email.trim(),
        schoolProvince: form.schoolProvince.trim(),
        consentAccepted: form.consentAccepted,
      });
    } catch (error) {
      console.error("Lead capture submit failed:", error);
      setErrors({ form: "เกิดข้อผิดพลาดในการบันทึกข้อมูล กรุณาลองอีกครั้ง" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className={cn("space-y-4", className)}>
      <div className={cn("grid gap-4", compact ? "md:grid-cols-1" : "md:grid-cols-2")}>
        <div className="space-y-2">
          <Label htmlFor="nickname">ชื่อเล่น <span className="text-destructive">*</span></Label>
          <Input
            id="nickname"
            value={form.nickname}
            onChange={(e) => updateField("nickname", e.target.value)}
            placeholder="เช่น ใบเตย"
            autoComplete="nickname"
          />
          {errors.nickname && <p className="text-xs text-destructive">{errors.nickname}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="gradeLevel">ระดับชั้น <span className="text-destructive">*</span></Label>
          <Input
            id="gradeLevel"
            value={form.gradeLevel}
            onChange={(e) => updateField("gradeLevel", e.target.value)}
            placeholder="เช่น ม.6 / ปวช.3"
            autoComplete="organization-title"
          />
          {errors.gradeLevel && <p className="text-xs text-destructive">{errors.gradeLevel}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="schoolName">โรงเรียน <span className="text-destructive">*</span></Label>
          <Input
            id="schoolName"
            value={form.schoolName}
            onChange={(e) => updateField("schoolName", e.target.value)}
            placeholder="เช่น โรงเรียนสวนกุหลาบวิทยาลัย"
            autoComplete="organization"
            aria-required="true"
            required
          />
          {errors.schoolName && <p className="text-xs text-destructive">{errors.schoolName}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="studyTrack">สายการเรียน <span className="text-destructive">*</span></Label>
          <Input
            id="studyTrack"
            value={form.studyTrack}
            onChange={(e) => updateField("studyTrack", e.target.value)}
            placeholder="เช่น วิทย์-คณิต / ศิลป์-ภาษา"
            autoComplete="organization"
            aria-required="true"
            required
          />
          {errors.studyTrack && <p className="text-xs text-destructive">{errors.studyTrack}</p>}
        </div>

        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="contact">เบอร์โทรศัพท์ หรือ Line ID <span className="text-destructive">*</span></Label>
          <Input
            id="contact"
            value={form.contact}
            onChange={(e) => updateField("contact", e.target.value)}
            placeholder="เบอร์โทรศัพท์ หรือ LINE ID เช่น 08x-xxx-xxxx / @lineid"
            autoComplete="tel"
          />
          {errors.contact && <p className="text-xs text-destructive">{errors.contact}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">อีเมล <span className="text-muted-foreground">(ถ้ามี)</span></Label>
          <Input
            id="email"
            type="email"
            value={form.email}
            onChange={(e) => updateField("email", e.target.value)}
            placeholder="name@example.com"
            autoComplete="email"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="schoolProvince">จังหวัดของโรงเรียน <span className="text-muted-foreground">(ถ้าทราบ)</span></Label>
          <Input
            id="schoolProvince"
            value={form.schoolProvince}
            onChange={(e) => updateField("schoolProvince", e.target.value)}
            placeholder="เช่น กรุงเทพมหานคร"
            autoComplete="address-level1"
          />
        </div>
      </div>

      <div className="rounded-2xl border border-border/60 bg-muted/30 p-4 space-y-3">
        <div className="flex items-start gap-3">
          <Checkbox
            id="consentAccepted"
            checked={form.consentAccepted}
            onCheckedChange={(checked) => updateField("consentAccepted", Boolean(checked))}
            className="mt-1"
          />
          <div className="space-y-1">
            <Label htmlFor="consentAccepted" className="text-sm leading-6 font-normal cursor-pointer">
              ข้าพเจ้ารับทราบและยินยอมให้แพลตฟอร์มคู่คิด (KooKid) นำข้อมูลผลแบบทดสอบและข้อมูลติดต่อของข้าพเจ้าไปใช้ในการแนะนำโควต้า ทุนการศึกษา หรือส่งต่อข้อมูลให้มหาวิทยาลัยคู่สัญญาที่เกี่ยวข้องกับผลการประเมิน ตามนโยบายความเป็นส่วนตัว
            </Label>
            <div className="text-xs text-muted-foreground">
              อ่านรายละเอียดเพิ่มเติมได้ที่ <Link to="/privacy" className="underline underline-offset-4 text-primary">นโยบายความเป็นส่วนตัว / PDPA</Link>
            </div>
            <div className="text-xs text-muted-foreground">
              เราจะไม่ส่งข้อมูลของคุณให้มหาวิทยาลัยแบบสุ่ม ข้อมูลจะถูกใช้กับมหาวิทยาลัยที่เกี่ยวข้องกับผลการประเมินของคุณเท่านั้น
            </div>
          </div>
        </div>
        {errors.consentAccepted && <p className="text-xs text-destructive">{errors.consentAccepted}</p>}
      </div>

      {errors.form && <p className="text-sm text-destructive">{errors.form}</p>}

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        {onCancel && (
          <Button type="button" variant="secondary" onClick={onCancel} className="w-full sm:w-auto rounded-xl shadow-none">
            ย้อนกลับ
          </Button>
        )}
        <Button
          type="submit"
          disabled={isSubmitting || !form.consentAccepted}
          className="w-full sm:w-auto rounded-xl"
        >
          {isSubmitting ? "กำลังบันทึก..." : submitLabel}
        </Button>
      </div>
    </form>
  );
}
