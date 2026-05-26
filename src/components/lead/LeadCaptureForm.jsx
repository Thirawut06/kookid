import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { appNameFull } from "@/lib/app-params";
import { getStoredLeadProfile, getStoredUserProfileId, upsertLeadCapture } from "@/lib/leadCaptureApi";

const LabelAny = /** @type {any} */ (Label);
const CheckboxAny = /** @type {any} */ (Checkbox);
const InputAny = /** @type {any} */ (Input);

/**
 * @typedef {{
 *   nickname?: string,
 *   phone?: string,
 *   email?: string,
 *   consentAccepted?: boolean,
 * }} LeadPrefill
 * @typedef {{
 *   user_type: string,
 *   nickname: string,
 *   phone: string,
 *   email: string,
 *   line_id: string | null,
 *   province: string | null,
 *   metadata: {
 *     grade_level: string | null,
 *     study_track: string | null,
 *     gpax: string | null,
 *     school_name: string | null,
 *   },
 *   consentAccepted: boolean,
 * }} LeadPayload
 */

/**
 * @param {{
 *   onSubmit?: (payload: LeadPayload) => void | Promise<void>,
 *   onSubmitSuccess?: () => void,
 *   onCancel?: () => void,
 *   submitLabel?: string,
 *   className?: string,
 *   prefill?: LeadPrefill,
 *   compact?: boolean,
 * }} props
 */
export default function LeadCaptureForm({
  onSubmit,
  onSubmitSuccess,
  onCancel,
  submitLabel = "ยืนยัน",
  className,
  prefill,
}) {
  const [form, setForm] = useState(() => buildInitialForm(prefill));
  const [errors, setErrors] = useState(/** @type {Record<string, string | undefined>} */ ({}));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const profileId = getStoredUserProfileId();

  useEffect(() => {
    setForm(buildInitialForm(prefill));
  }, [prefill]);

  /** @param {string} field @param {string | boolean} value */
  const updateField = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
    setErrors(prev => ({ ...prev, [field]: undefined, form: undefined }));
  };

  const validate = () => {
    /** @type {Record<string, string | undefined>} */
    const nextErrors = {};

    if (!form.nickname.trim()) nextErrors.nickname = "กรุณากรอกชื่อเล่น";
    if (!form.phone.trim()) {
      nextErrors.phone = "กรุณากรอกเบอร์โทรศัพท์มือถือ";
    }
    if (!form.email.trim()) nextErrors.email = "กรุณากรอกอีเมล";

    if (!form.consentAccepted) nextErrors.consentAccepted = "กรุณายินยอมก่อนดำเนินการต่อ";

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  /** @param {React.FormEvent<HTMLFormElement>} event */
  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);

    const payload = {
      user_type: "unknown",
      nickname: form.nickname.trim(),
      phone: form.phone.trim(),
      email: form.email.trim(),
      line_id: null,
      province: null,
      metadata: {
        grade_level: null,
        study_track: null,
        gpax: null,
        school_name: null,
      },
      consentAccepted: form.consentAccepted,
    };

    try {
      if (onSubmit) {
        await onSubmit(payload);
      }

      await upsertLeadCapture(profileId, {
        result: null,
        nickname: payload.nickname,
        userType: payload.user_type,
        gradeAndSchool: "",
        gradeLevel: "",
        schoolName: "",
        studyTrack: "",
        gpax: "",
        contact: payload.phone,
        email: payload.email,
        lineId: "",
        educationLevel: "",
        schoolProvince: "",
      });

      onSubmitSuccess?.();
    } catch (error) {
      console.error("Lead capture submit failed:", error);
      setErrors({ form: "เกิดข้อผิดพลาดในการบันทึกข้อมูล กรุณาลองอีกครั้ง" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className={cn("space-y-6", className)}>
      <div className="rounded-2xl border border-border/60 bg-card p-4 md:p-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2 md:col-span-2">
            <LabelAny htmlFor="nickname">ชื่อเล่น <span className="text-destructive">*</span></LabelAny>
            <InputAny
              id="nickname"
              value={form.nickname}
              onChange={/** @param {React.ChangeEvent<HTMLInputElement>} e */ (e) => updateField("nickname", e.target.value)}
              placeholder="ชื่อเล่นของคุณ"
            />
            {errors.nickname && <p className="text-xs text-destructive">{errors.nickname}</p>}
          </div>

          <div className="space-y-2">
            <LabelAny htmlFor="phone">เบอร์โทรศัพท์มือถือ <span className="text-destructive">*</span></LabelAny>
            <InputAny
              id="phone"
              type="tel"
              inputMode="numeric"
              numericOnly
              value={form.phone}
              onChange={/** @param {React.ChangeEvent<HTMLInputElement>} e */ (e) => updateField("phone", e.target.value)}
              placeholder="เช่น 0812345678"
              maxLength={10}
            />
            {errors.phone && <p className="text-xs text-destructive">{errors.phone}</p>}
          </div>

          <div className="space-y-2">
            <LabelAny htmlFor="email">อีเมล <span className="text-destructive">*</span></LabelAny>
            <InputAny
              id="email"
              type="email"
              value={form.email}
              onChange={/** @param {React.ChangeEvent<HTMLInputElement>} e */ (e) => updateField("email", e.target.value)}
              placeholder="name@example.com"
            />
            {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-border/60 bg-muted/30 p-4 space-y-3">
        <div className="flex items-start gap-3">
          <CheckboxAny
            id="consentAccepted"
            checked={form.consentAccepted}
            onCheckedChange={/** @param {any} checked */ (checked) => updateField("consentAccepted", Boolean(checked))}
            className="mt-1"
          />
          <div>
            <LabelAny htmlFor="consentAccepted" className="text-sm leading-snug cursor-pointer">
              ข้าพเจ้ายินยอมให้ {appNameFull} ใช้ข้อมูลเพื่อประมวลผลและส่งมอบรายงานวิเคราะห์ที่ตรงกับผลประเมิน (อ่าน <Link to="/privacy" className="underline text-primary">นโยบายความเป็นส่วนตัว</Link>)
            </LabelAny>
          </div>
        </div>
        {errors.consentAccepted && <p className="text-xs text-destructive">{errors.consentAccepted}</p>}
      </div>

      {errors.form && <p className="text-sm text-destructive">{errors.form}</p>}

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        {onCancel && (
          <Button type="button" variant="secondary" onClick={() => onCancel()} className="w-full sm:w-auto rounded-xl shadow-none">
            ย้อนกลับ
          </Button>
        )}
        <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto rounded-xl">
          {isSubmitting ? "กำลังบันทึก..." : submitLabel}
        </Button>
      </div>
    </form>
  );
}

/** @param {LeadPrefill | undefined} prefill */
function buildInitialForm(prefill) {
  const storedProfile = getStoredLeadProfile(getStoredUserProfileId());
  return {
    nickname: prefill?.nickname || storedProfile?.nickname || "",
    phone: prefill?.phone || storedProfile?.contact || "",
    email: prefill?.email || storedProfile?.email || "",
    consentAccepted: Boolean(prefill?.consentAccepted || storedProfile?.consentAccepted),
  };
}
