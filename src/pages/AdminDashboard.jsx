import React, { useEffect, useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/utils/supabase";
import { getMajors, getCareerClusters } from "@/lib/dataLoader";

function toCsvValue(value) {
  const raw = value == null ? "" : String(value);
  if (raw.includes(",") || raw.includes("\n") || raw.includes("\"")) {
    return `"${raw.replace(/\"/g, '""')}"`;
  }
  return raw;
}

function downloadCsv(filename, rows) {
  const csv = rows.map(row => row.map(toCsvValue).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function splitGradeAndSchool(value) {
  if (!value || typeof value !== "string") {
    return { gradeLevel: "", schoolName: "" };
  }

  const parts = value.split("/").map(part => part.trim()).filter(Boolean);
  if (parts.length === 0) return { gradeLevel: "", schoolName: "" };
  if (parts.length === 1) return { gradeLevel: parts[0], schoolName: "" };

  return {
    gradeLevel: parts[0],
    schoolName: parts.slice(1).join(" / "),
  };
}

export default function AdminDashboard() {
  const majors = useMemo(() => getMajors(), []);
  const clusters = useMemo(() => getCareerClusters(), []);
  const majorById = useMemo(() => Object.fromEntries(majors.map(m => [m.id, m])), [majors]);
  const clusterById = useMemo(() => Object.fromEntries(clusters.map(c => [c.id, c])), [clusters]);

  const [token, setToken] = useState("");
  const [isAuthed, setIsAuthed] = useState(false);

  const [profiles, setProfiles] = useState([]);
  const [interests, setInterests] = useState([]);
  const [quizResults, setQuizResults] = useState([]);
  const [eventRows, setEventRows] = useState([]);
  const [quizCount, setQuizCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const [universityFilter, setUniversityFilter] = useState("all");
  const [majorFilter, setMajorFilter] = useState("all");

  const expectedToken = import.meta.env.VITE_ADMIN_TOKEN || "";

  const profileById = useMemo(
    () => Object.fromEntries(profiles.map(p => [p.id, p])),
    [profiles]
  );

  const enrichedInterests = useMemo(() => {
    return interests.map(row => {
      const major = majorById[row.major_id] || null;
      const cluster = major ? clusterById[major.clusterId] : null;
      const profile = profileById[row.user_profile_id] || null;
      const fallbackGradeAndSchool = splitGradeAndSchool(profile?.grade_and_school);
      const gradeLevel = profile?.grade_level || profile?.gradeLevel || fallbackGradeAndSchool.gradeLevel || "-";
      const schoolName = profile?.school_name || profile?.schoolName || fallbackGradeAndSchool.schoolName || "-";
      const universityId = row.university_id || major?.universityId || "-";
      const universityName = major?.universityNameTh || universityId;

      return {
        id: row.id,
        createdAt: row.created_at,
        userProfileId: row.user_profile_id,
        nickname: profile?.nickname || "-",
        gradeLevel,
        schoolName,
        schoolProvince: profile?.school_province || profile?.schoolProvince || "-",
        contact: profile?.contact || "-",
        email: profile?.email || "-",
        majorId: row.major_id,
        majorName: major?.nameTh || row.major_id,
        clusterName: cluster?.nameTh || "-",
        universityId,
        universityName,
      };
    });
  }, [interests, majorById, clusterById, profileById]);

  const universities = useMemo(() => {
    const map = new Map();
    enrichedInterests.forEach(row => {
      if (row.universityId !== "-") {
        map.set(row.universityId, row.universityName);
      }
    });
    return Array.from(map.entries()).sort((a, b) => a[1].localeCompare(b[1], "th"));
  }, [enrichedInterests]);

  const filteredRows = useMemo(() => {
    return enrichedInterests.filter(row => {
      if (universityFilter !== "all" && row.universityId !== universityFilter) return false;
      if (majorFilter !== "all" && row.majorId !== majorFilter) return false;
      return true;
    });
  }, [enrichedInterests, universityFilter, majorFilter]);

  const hasActiveFilters = universityFilter !== "all" || majorFilter !== "all";

  const filteredProfileIds = useMemo(() => {
    return new Set(filteredRows.map(row => row.userProfileId));
  }, [filteredRows]);

  const groupedStats = useMemo(() => {
    const map = new Map();
    filteredRows.forEach(row => {
      const key = `${row.universityId}::${row.majorId}`;
      const current = map.get(key) || {
        universityName: row.universityName,
        majorName: row.majorName,
        count: 0,
      };
      current.count += 1;
      map.set(key, current);
    });
    return Array.from(map.values()).sort((a, b) => b.count - a.count);
  }, [filteredRows]);

  const eventSummary = useMemo(() => {
    const map = new Map();
    eventRows.forEach(row => {
      map.set(row.event_name, (map.get(row.event_name) || 0) + 1);
    });
    return Array.from(map.entries())
      .map(([eventName, count]) => ({ eventName, count }))
      .sort((a, b) => b.count - a.count);
  }, [eventRows]);

  const clusterSummary = useMemo(() => {
    const map = new Map();
    const sourceQuizResults = hasActiveFilters
      ? quizResults.filter(row => filteredProfileIds.has(row.user_profile_id))
      : quizResults;

    sourceQuizResults.forEach(row => {
      const clustersFromResult = Array.isArray(row?.result?.clusters) ? row.result.clusters : [];
      clustersFromResult.forEach(cluster => {
        const clusterId = cluster.clusterId || cluster.id || cluster.nameTh;
        if (!clusterId) return;

        const current = map.get(clusterId) || {
          clusterName: cluster.nameTh || clusterById[clusterId]?.nameTh || clusterId,
          profileIds: new Set(),
        };
        current.profileIds.add(row.user_profile_id);
        map.set(clusterId, current);
      });
    });

    return Array.from(map.entries())
      .map(([clusterId, data]) => ({
        clusterId,
        clusterName: data.clusterName,
        count: data.profileIds.size,
      }))
      .sort((a, b) => b.count - a.count);
  }, [quizResults, hasActiveFilters, filteredProfileIds, clusterById]);

  const topCareers = useMemo(() => {
    const map = new Map();

    eventRows
      .filter(row => row.event_name === "career_viewed")
      .filter(row => {
        if (!hasActiveFilters) return true;
        return filteredProfileIds.has(row.user_profile_id);
      })
      .forEach(row => {
        const payload = row.payload || {};
        // Keep this payload contract flexible for future careers.json-based IDs.
        const careerId = payload.careerId || payload.career_id || payload.clusterId || payload.cluster_id || "unknown";
        const careerName = payload.careerName || payload.career_name || payload.clusterName || payload.cluster_name || clusterById[payload.clusterId]?.nameTh || "ไม่ระบุอาชีพ";
        const key = `${careerId}::${careerName}`;
        const current = map.get(key) || { careerName, count: 0 };
        current.count += 1;
        map.set(key, current);
      });

    return Array.from(map.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }, [eventRows, hasActiveFilters, filteredProfileIds, clusterById]);

  useEffect(() => {
    if (!isAuthed) return;
    if (!supabase) {
      setError("ยังไม่ได้ตั้งค่า Supabase ใน environment นี้");
      return;
    }

    let mounted = true;
    async function loadData() {
      setIsLoading(true);
      setError("");
      try {
        const [profilesRes, interestsRes, quizResultsRes, eventsRes, quizCountRes] = await Promise.all([
          supabase.from("user_profiles").select("*"),
          supabase.from("program_interests").select("id,user_profile_id,major_id,university_id,created_at").order("created_at", { ascending: false }),
          supabase.from("quiz_results").select("user_profile_id,result,created_at").order("created_at", { ascending: false }),
          supabase.from("event_logs").select("event_name,created_at,user_profile_id,session_id,page,payload").order("created_at", { ascending: false }).limit(5000),
          supabase.from("quiz_results").select("id", { count: "exact", head: true }),
        ]);

        const errors = [profilesRes.error, interestsRes.error, quizResultsRes.error, eventsRes.error, quizCountRes.error].filter(Boolean);
        if (errors.length > 0) {
          throw errors[0];
        }

        if (!mounted) return;
        setProfiles(profilesRes.data || []);
        setInterests(interestsRes.data || []);
        setQuizResults(quizResultsRes.data || []);
        setEventRows(eventsRes.data || []);
        setQuizCount(quizCountRes.count || 0);
      } catch (err) {
        console.error("AdminDashboard load error:", err);
        if (mounted) {
          setError("โหลดข้อมูลไม่สำเร็จ กรุณาตรวจสอบสิทธิ์ตารางและนโยบาย RLS");
        }
      } finally {
        if (mounted) setIsLoading(false);
      }
    }

    loadData();
    return () => {
      mounted = false;
    };
  }, [isAuthed]);

  const handleLogin = (event) => {
    event.preventDefault();
    if (token.trim() === expectedToken) {
      setIsAuthed(true);
      setError("");
      return;
    }
    setError("รหัสผ่านผู้ดูแลไม่ถูกต้อง");
  };

  const handleExportCsv = () => {
    const header = [
      "created_at",
      "user_profile_id",
      "nickname",
      "gradeLevel",
      "schoolName",
      "schoolProvince",
      "contact",
      "email",
      "cluster",
      "major",
      "university",
    ];

    const rows = filteredRows.map(row => [
      row.createdAt,
      row.userProfileId,
      row.nickname,
      row.gradeLevel,
      row.schoolName,
      row.schoolProvince,
      row.contact,
      row.email,
      row.clusterName,
      row.majorName,
      row.universityName,
    ]);

    downloadCsv(`kookid_program_interests_${Date.now()}.csv`, [header, ...rows]);
  };

  const handleExportEventsCsv = () => {
    const header = ["created_at", "event_name", "session_id", "user_profile_id", "page"];
    const rows = eventRows.map(row => [
      row.created_at,
      row.event_name,
      row.session_id || "",
      row.user_profile_id || "",
      row.page || "",
    ]);

    downloadCsv(`kookid_event_logs_${Date.now()}.csv`, [header, ...rows]);
  };

  if (!isAuthed) {
    return (
      <div className="min-h-screen bg-background px-4 py-8">
        <div className="max-w-md mx-auto">
          <Card className="p-5 sm:p-6 border border-border/60">
            <h1 className="text-xl font-bold text-foreground">KooKid Admin</h1>
            <form className="mt-4 space-y-3" onSubmit={handleLogin}>
              <input
                id="adminToken"
                type="password"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                placeholder="password"
              />
              {error && <p className="text-xs text-destructive">{error}</p>}
              <Button type="submit" className="w-full rounded-xl">
                เข้าสู่แดชบอร์ด
              </Button>
            </form>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background px-4 py-6 sm:py-8">
      <div className="max-w-6xl mx-auto space-y-5">
        <div>
          <h1 className="text-2xl font-bold text-foreground">KooKid Admin Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">สรุปผู้ทำแบบทดสอบ คำขอข้อมูลโควต้า/ทุน ความสนใจตามกลุ่มอาชีพ และ event พื้นฐานของระบบ</p>
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Card className="p-4">
            <p className="text-xs text-muted-foreground">โปรไฟล์ที่ทำแบบทดสอบเสร็จ</p>
            <p className="text-2xl font-bold text-foreground mt-1">{quizCount}</p>
          </Card>
          <Card className="p-4">
            <p className="text-xs text-muted-foreground">คำขอข้อมูลโควต้า/ทุนทั้งหมด</p>
            <p className="text-2xl font-bold text-foreground mt-1">{interests.length}</p>
          </Card>
          <Card className="p-4">
            <p className="text-xs text-muted-foreground">โปรไฟล์นักเรียนในระบบ</p>
            <p className="text-2xl font-bold text-foreground mt-1">{profiles.length}</p>
          </Card>
        </div>

        <Card className="p-4 sm:p-5 border border-border/60">
          <div className="flex flex-col sm:flex-row gap-3 sm:items-end sm:justify-between">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full sm:max-w-2xl">
              <div>
                <label className="text-xs text-muted-foreground">กรองตามมหาวิทยาลัย</label>
                <select
                  className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                  value={universityFilter}
                  onChange={(e) => setUniversityFilter(e.target.value)}
                >
                  <option value="all">ทั้งหมด</option>
                  {universities.map(([id, name]) => (
                    <option key={id} value={id}>{name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs text-muted-foreground">กรองตามสาขา</label>
                <select
                  className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                  value={majorFilter}
                  onChange={(e) => setMajorFilter(e.target.value)}
                >
                  <option value="all">ทั้งหมด</option>
                  {majors.map((m) => (
                    <option key={m.id} value={m.id}>{m.nameTh}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2">
              <Button onClick={handleExportCsv} className="rounded-xl">
                Export รายการคำขอ (CSV)
              </Button>
              <Button onClick={handleExportEventsCsv} variant="outline" className="rounded-xl">
                Export Event Logs (CSV)
              </Button>
            </div>
          </div>
        </Card>

        <Card className="p-4 sm:p-5 border border-border/60">
          <h2 className="text-base font-semibold text-foreground mb-3">สรุปจำนวนผู้สนใจตามกลุ่มสาขา (Cluster)</h2>
          <div className="space-y-2">
            {clusterSummary.map((row) => {
              const maxCount = clusterSummary[0]?.count || 1;
              const width = Math.max(8, Math.round((row.count / maxCount) * 100));
              return (
                <div key={row.clusterId} className="rounded-lg border border-border/50 p-3">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-medium text-foreground">{row.clusterName}</p>
                    <p className="text-sm font-semibold text-foreground">{row.count}</p>
                  </div>
                  <div className="mt-2 h-2 rounded-full bg-muted overflow-hidden">
                    <div className="h-full rounded-full bg-primary" style={{ width: `${width}%` }} />
                  </div>
                </div>
              );
            })}
            {clusterSummary.length === 0 && (
              <p className="text-sm text-muted-foreground">ยังไม่มีข้อมูล cluster ตามตัวกรองที่เลือก</p>
            )}
          </div>
        </Card>

        <Card className="p-4 sm:p-5 border border-border/60">
          <h2 className="text-base font-semibold text-foreground mb-3">อาชีพที่ได้รับความสนใจมากที่สุด</h2>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[420px] text-sm">
              <thead>
                <tr className="text-left border-b border-border">
                  <th className="py-2 pr-2">Career name</th>
                  <th className="py-2 pr-2">Count</th>
                </tr>
              </thead>
              <tbody>
                {topCareers.map((row, idx) => (
                  <tr key={`${row.careerName}_${idx}`} className="border-b border-border/50">
                    <td className="py-2 pr-2">{row.careerName}</td>
                    <td className="py-2 pr-2 font-semibold">{row.count}</td>
                  </tr>
                ))}
                {topCareers.length === 0 && (
                  <tr>
                    <td className="py-3 text-muted-foreground" colSpan={2}>ยังไม่มี event career_viewed ตามตัวกรองที่เลือก</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>

        <Card className="p-4 sm:p-5 border border-border/60">
          <h2 className="text-base font-semibold text-foreground mb-3">คำขอข้อมูลแยกตามมหาวิทยาลัยและสาขา</h2>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[520px] text-sm">
              <thead>
                <tr className="text-left border-b border-border">
                  <th className="py-2 pr-2">มหาวิทยาลัย</th>
                  <th className="py-2 pr-2">สาขา</th>
                  <th className="py-2 pr-2">จำนวนคำขอ</th>
                </tr>
              </thead>
              <tbody>
                {groupedStats.map((row, idx) => (
                  <tr key={`${row.universityName}_${row.majorName}_${idx}`} className="border-b border-border/50">
                    <td className="py-2 pr-2">{row.universityName}</td>
                    <td className="py-2 pr-2">{row.majorName}</td>
                    <td className="py-2 pr-2 font-semibold">{row.count}</td>
                  </tr>
                ))}
                {groupedStats.length === 0 && (
                  <tr>
                    <td className="py-3 text-muted-foreground" colSpan={3}>ยังไม่มีข้อมูลตามเงื่อนไขที่เลือก</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>

        <Card className="p-4 sm:p-5 border border-border/60">
          <h2 className="text-base font-semibold text-foreground mb-3">Event Tracking พื้นฐาน</h2>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[420px] text-sm">
              <thead>
                <tr className="text-left border-b border-border">
                  <th className="py-2 pr-2">Event</th>
                  <th className="py-2 pr-2">จำนวน</th>
                </tr>
              </thead>
              <tbody>
                {eventSummary.map((row) => (
                  <tr key={row.eventName} className="border-b border-border/50">
                    <td className="py-2 pr-2">{row.eventName}</td>
                    <td className="py-2 pr-2 font-semibold">{row.count}</td>
                  </tr>
                ))}
                {eventSummary.length === 0 && (
                  <tr>
                    <td className="py-3 text-muted-foreground" colSpan={2}>ยังไม่มี event ในระบบ (ตรวจสอบว่าได้รัน schema ล่าสุดหรือยัง)</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>

        <Card className="p-4 sm:p-5 border border-border/60">
          <h2 className="text-base font-semibold text-foreground mb-3">รายการคำขอ (ตามตัวกรองปัจจุบัน)</h2>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[980px] text-sm">
              <thead>
                <tr className="text-left border-b border-border">
                  <th className="py-2 pr-2">เวลา</th>
                  <th className="py-2 pr-2">นักเรียน</th>
                  <th className="py-2 pr-2">ระดับชั้น</th>
                  <th className="py-2 pr-2">โรงเรียน</th>
                  <th className="py-2 pr-2">จังหวัดของโรงเรียน</th>
                  <th className="py-2 pr-2">เบอร์โทร/LINE</th>
                  <th className="py-2 pr-2">อีเมล</th>
                  <th className="py-2 pr-2">กลุ่มอาชีพ</th>
                  <th className="py-2 pr-2">สาขา</th>
                  <th className="py-2 pr-2">มหาวิทยาลัย</th>
                </tr>
              </thead>
              <tbody>
                {filteredRows.map((row) => (
                  <tr key={row.id} className="border-b border-border/50">
                    <td className="py-2 pr-2 whitespace-nowrap">{new Date(row.createdAt).toLocaleString("th-TH")}</td>
                    <td className="py-2 pr-2">{row.nickname}</td>
                    <td className="py-2 pr-2">{row.gradeLevel}</td>
                    <td className="py-2 pr-2">{row.schoolName}</td>
                    <td className="py-2 pr-2">{row.schoolProvince}</td>
                    <td className="py-2 pr-2">{row.contact}</td>
                    <td className="py-2 pr-2">{row.email}</td>
                    <td className="py-2 pr-2">{row.clusterName}</td>
                    <td className="py-2 pr-2">{row.majorName}</td>
                    <td className="py-2 pr-2">{row.universityName}</td>
                  </tr>
                ))}
                {filteredRows.length === 0 && (
                  <tr>
                    <td className="py-3 text-muted-foreground" colSpan={10}>ไม่พบรายการคำขอตามตัวกรองที่เลือก</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>

        {isLoading && <p className="text-sm text-muted-foreground">กำลังโหลดข้อมูล...</p>}
      </div>
    </div>
  );
}
