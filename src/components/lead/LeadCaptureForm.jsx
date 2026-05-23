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

const STUDY_TRACK_OPTIONS = [
  { value: "sci_math", label: "วิทย์-คณิต" },
  { value: "arts_math", label: "ศิลป์-คำนวณ" },
  { value: "arts_lang", label: "ศิลป์-ภาษา" },
  { value: "thai_social", label: "ไทย-สังคม" },
  { value: "arts_social", label: "ศิลป์-สังคม" },
  { value: "other", label: "อื่นๆ" },
];

const GPAX_OPTIONS = [
  { value: "3.50+", label: "3.50 ขึ้นไป" },
  { value: "3.00-3.49", label: "3.00 - 3.49" },
  { value: "2.50-2.99", label: "2.50 - 2.99" },
  { value: "<2.50", label: "ต่ำกว่า 2.50" },
];

const GRADE_LEVEL_OPTIONS = {
  student_junior: ["ม.1", "ม.2", "ม.3"],
  student_senior: ["ม.4", "ม.5", "ม.6", "ปวช.1", "ปวช.2", "ปวช.3"],
  parent: ["ม.ต้น", "ม.ปลาย", "ปวช."],
  working_college: ["ปริญญาตรี", "ปริญญาโท", "กำลังทำงาน", "อื่นๆ"],
};

/**
 * @typedef {{
 *   nickname?: string,
 *   userType?: string,
 *   phone?: string,
 *   email?: string,
 *   lineId?: string,
 *   province?: string,
 *   gradeLevel?: string,
 *   studyTrack?: string,
 *   gpax?: string,
 *   schoolName?: string,
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

    if (!form.phone.trim()) nextErrors.phone = "กรุณากรอกเบอร์โทรศัพท์มือถือ";
    if (!form.email.trim()) nextErrors.email = "กรุณากรอกอีเมล";

    if (isStudentType(form.userType)) {
      if (!form.gradeLevel) nextErrors.gradeLevel = "กรุณาเลือกระดับชั้น";
      if (!form.studyTrack) nextErrors.studyTrack = "กรุณาเลือกสายการเรียน";
      if (!form.gpax) nextErrors.gpax = "กรุณาเลือก GPAX";
      if (!form.schoolName.trim()) nextErrors.schoolName = "กรุณากรอกชื่อโรงเรียน";
    }

    if (form.userType === "parent") {
      if (!form.gradeLevel) nextErrors.gradeLevel = "กรุณาเลือกระดับชั้นของบุตรหลาน";
      if (!form.schoolName.trim()) nextErrors.schoolName = "กรุณากรอกชื่อโรงเรียนของบุตรหลาน";
    }

    if (form.userType === "working_college") {
      if (!form.gradeLevel) nextErrors.gradeLevel = "กรุณาเลือกระดับการศึกษา / สถานะ";
    }

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
      user_type: form.userType,
      nickname: form.nickname.trim(),
      phone: form.phone.trim(),
      email: form.email.trim(),
      line_id: form.lineId.trim() || null,
      province: form.province.trim() || null,
      metadata: {
        grade_level: form.gradeLevel || null,
        study_track: form.studyTrack || null,
        gpax: form.gpax || null,
        school_name: form.schoolName.trim() || null,
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
        gradeAndSchool: payload.metadata.school_name
          ? `${payload.metadata.grade_level || ""} / ${payload.metadata.school_name || ""}`.trim()
          : payload.metadata.grade_level || payload.metadata.school_name || "",
        gradeLevel: payload.metadata.grade_level || "",
        schoolName: payload.metadata.school_name || "",
        studyTrack: payload.metadata.study_track || "",
        gpax: payload.metadata.gpax || "",
        contact: payload.phone,
        email: payload.email,
        lineId: payload.line_id,
        educationLevel: payload.metadata.grade_level,
        schoolProvince: payload.province || "",
      });

      onSubmitSuccess?.();
    } catch (error) {
      console.error("Lead capture submit failed:", error);
      setErrors({ form: "เกิดข้อผิดพลาดในการบันทึกข้อมูล กรุณาลองอีกครั้ง" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const gradeLevelOptions = getGradeLevelOptions(form.userType);

  return (
    <form onSubmit={handleSubmit} className={cn("space-y-6", className)}>
      <div className="rounded-2xl border border-border/60 bg-card p-4 md:p-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <LabelAny htmlFor="phone">เบอร์โทรศัพท์มือถือ <span className="text-destructive">*</span></LabelAny>
            <InputAny
              id="phone"
              value={form.phone}
              onChange={/** @param {React.ChangeEvent<HTMLInputElement>} e */ (e) => updateField("phone", e.target.value)}
              placeholder="สำหรับรับสิทธิ์โควต้า/ทุน"
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

          <div className="space-y-2">
            <LabelAny htmlFor="lineId">Line ID <span className="text-muted-foreground">(ถ้ามี)</span></LabelAny>
            <InputAny
              id="lineId"
              value={form.lineId}
              onChange={/** @param {React.ChangeEvent<HTMLInputElement>} e */ (e) => updateField("lineId", e.target.value)}
              placeholder="เพื่อความรวดเร็วในการติดต่อ"
            />
          </div>

          <div className="space-y-2">
            <LabelAny htmlFor="province">จังหวัด <span className="text-muted-foreground">(ถ้ามี)</span></LabelAny>
            <InputAny
              id="province"
              value={form.province}
              onChange={/** @param {React.ChangeEvent<HTMLInputElement>} e */ (e) => updateField("province", e.target.value)}
              placeholder="จังหวัด"
            />
          </div>
        </div>

          <div className="space-y-2 md:col-span-2">
            <LabelAny htmlFor="gradeLevel">
              {form.userType === "parent" ? "ระดับชั้นของบุตรหลาน" : form.userType === "working_college" ? "ระดับการศึกษา / สถานะ" : "ระดับชั้น"}
              {(form.userType !== "working_college") && <span className="text-destructive"> *</span>}
            </LabelAny>
            <select
              id="gradeLevel"
              value={form.gradeLevel}
              onChange={/** @param {React.ChangeEvent<HTMLSelectElement>} e */ (e) => updateField("gradeLevel", e.target.value)}
              className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              <option value="">เลือก</option>
              {gradeLevelOptions.map(/** @param {string} option */ (option) => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
            {errors.gradeLevel && <p className="text-xs text-destructive">{errors.gradeLevel}</p>}
          </div>

          {isStudentType(form.userType) && (
            <>
              <div className="space-y-2">
                <LabelAny htmlFor="studyTrack">สายการเรียน <span className="text-destructive">*</span></LabelAny>
                <select
                  id="studyTrack"
                  value={form.studyTrack}
                  onChange={/** @param {React.ChangeEvent<HTMLSelectElement>} e */ (e) => updateField("studyTrack", e.target.value)}
                  className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  <option value="">เลือกสายการเรียน</option>
                  {STUDY_TRACK_OPTIONS.map(option => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
                {errors.studyTrack && <p className="text-xs text-destructive">{errors.studyTrack}</p>}
              </div>

              <div className="space-y-2">
                <LabelAny htmlFor="gpax">GPAX <span className="text-destructive">*</span></LabelAny>
                <select
                  id="gpax"
                  value={form.gpax}
                  onChange={/** @param {React.ChangeEvent<HTMLSelectElement>} e */ (e) => updateField("gpax", e.target.value)}
                  className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  <option value="">เลือก GPAX</option>
                  {GPAX_OPTIONS.map(option => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
                {errors.gpax && <p className="text-xs text-destructive">{errors.gpax}</p>}
              </div>

              <div className="space-y-2 md:col-span-2">
                <LabelAny htmlFor="schoolName">ชื่อโรงเรียน <span className="text-destructive">*</span></LabelAny>
                <InputAny
                  id="schoolName"
                  value={form.schoolName}
                  onChange={/** @param {React.ChangeEvent<HTMLInputElement>} e */ (e) => updateField("schoolName", e.target.value)}
                  placeholder="ชื่อโรงเรียน"
                />
                {errors.schoolName && <p className="text-xs text-destructive">{errors.schoolName}</p>}
              </div>
            </>
          )}

          {form.userType === "parent" && (
            <div className="space-y-2 md:col-span-2">
              <LabelAny htmlFor="schoolName">ชื่อโรงเรียนของบุตรหลาน <span className="text-destructive">*</span></LabelAny>
              <InputAny
                id="schoolName"
                value={form.schoolName}
                onChange={/** @param {React.ChangeEvent<HTMLInputElement>} e */ (e) => updateField("schoolName", e.target.value)}
                placeholder="ชื่อโรงเรียน"
              />
              {errors.schoolName && <p className="text-xs text-destructive">{errors.schoolName}</p>}
            </div>
          )}
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
              ข้าพเจ้ายินยอมให้ {appNameFull} ใช้ข้อมูลเพื่อแนะนำโควต้า ทุนการศึกษา และมหาวิทยาลัยที่ตรงกับผลประเมิน (อ่าน <Link to="/privacy" className="underline text-primary">นโยบายความเป็นส่วนตัว</Link>)
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
    userType: prefill?.userType || storedProfile?.userType || "",
    phone: prefill?.phone || storedProfile?.contact || "",
    email: prefill?.email || storedProfile?.email || "",
    lineId: prefill?.lineId || storedProfile?.lineId || "",
    province: prefill?.province || storedProfile?.schoolProvince || "",
    gradeLevel: prefill?.gradeLevel || storedProfile?.gradeLevel || "",
    studyTrack: prefill?.studyTrack || storedProfile?.studyTrack || "",
    gpax: prefill?.gpax || storedProfile?.gpax || "",
    schoolName: prefill?.schoolName || storedProfile?.schoolName || "",
    consentAccepted: Boolean(prefill?.consentAccepted || storedProfile?.consentAccepted),
  };
}

/** @param {string} userType */
function isStudentType(userType) {
  return userType === "student_junior" || userType === "student_senior";
}

/** @param {string} userType */
function getGradeLevelOptions(userType) {
  if (userType === "student_junior") return GRADE_LEVEL_OPTIONS.student_junior;
  if (userType === "student_senior") return GRADE_LEVEL_OPTIONS.student_senior;
  if (userType === "parent") return GRADE_LEVEL_OPTIONS.parent;
  if (userType === "working_college") return GRADE_LEVEL_OPTIONS.working_college;
  return [];
}
