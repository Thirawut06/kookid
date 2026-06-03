import React, { useEffect, useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
// Admin data is loaded from server-side endpoints to avoid exposing service role keys to the client.
import { getMajors, getCareerClusters } from "@/lib/dataLoader";

function toCsvValue(value) {
  const raw = value == null ? "" : String(value);
  if (raw.includes(",") || raw.includes("\n") || raw.includes("\"")) {
    return `"${raw.replace(/\"/g, '""')}"`;
  }
  return raw;
}

function downloadCsv(filename, rows) {
  const BOM = "\uFEFF";
  const csv = rows.map(row => row.map(toCsvValue).join(",")).join("\n");
  const blob = new Blob([BOM + csv], { type: "text/csv;charset=utf-8;" });
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

  // `token` is the typed password input. `bearerToken` is the server-issued admin token
  // returned from /api/admin/login and used to call protected endpoints.
  const [token, setToken] = useState("");
  const [bearerToken, setBearerToken] = useState("");
  const [isAuthed, setIsAuthed] = useState(false);

  const [profiles, setProfiles] = useState([]);
  const [interests, setInterests] = useState([]);
  const [quizResults, setQuizResults] = useState([]);
  const [eventRows, setEventRows] = useState([]);
  const [quizCount, setQuizCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");



  // The client no longer relies on VITE_ADMIN_TOKEN. The serverless endpoints
  // require ADMIN_PASSWORD and ADMIN_JWT_SECRET (server-side only) and a
  // SUPABASE_SERVICE_ROLE_KEY to query protected data.

  const profileById = useMemo(
    () => Object.fromEntries(profiles.map(p => [p.id, p])),
    [profiles]
  );



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

    quizResults.forEach(row => {
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
  }, [quizResults, clusterById]);



  // ── Conversion Intent Metrics ──────────────────────────────────────
  const premiumClickerIds = useMemo(() => {
    const ids = new Set();
    eventRows.forEach(row => {
      if (row.event_name === "fake_door_click_59thb" && row.user_profile_id) {
        ids.add(row.user_profile_id);
      }
    });
    return ids;
  }, [eventRows]);

  const conversionMetrics = useMemo(() => {
    const premiumClicks = eventRows.filter(r => r.event_name === "fake_door_click_59thb").length;
    const totalPageViews = eventRows.filter(r => r.event_name === "results_viewed").length;
    const conversionRate = totalPageViews > 0 ? ((premiumClicks / totalPageViews) * 100).toFixed(1) : "0.0";

    // Pain points from users who clicked the premium button
    const PAINPOINT_LABELS = {
      portfolio: "ไม่มีผลงานทำ Portfolio",
      interview: "กลัวสอบสัมภาษณ์",
      exam_prep: "อ่านหนังสือสอบไม่ทัน",
      finding_info: "งงระบบ TCAS / ไม่รู้จะเริ่มจากตรงไหน",
    };
    const painMap = new Map();
    quizResults.forEach(row => {
      if (!premiumClickerIds.has(row.user_profile_id)) return;
      const answers = row.result?.answers || {};
      let painVal = answers.Q_CON_PAINPOINT;
      if (!painVal) return;
      const painArr = Array.isArray(painVal) ? painVal : [painVal];
      painArr.forEach(p => {
        painMap.set(p, (painMap.get(p) || 0) + 1);
      });
    });
    const painPoints = Array.from(painMap.entries())
      .map(([id, count]) => ({ id, label: PAINPOINT_LABELS[id] || id, count }))
      .sort((a, b) => b.count - a.count);

    return { premiumClicks, totalPageViews, conversionRate, painPoints };
  }, [eventRows, quizResults, premiumClickerIds]);



  // Attempt to load data from the protected server endpoint. The endpoint
  // validates the token and queries Supabase with a service role key on the server.
  useEffect(() => {
    if (!isAuthed) return;

    let mounted = true;
    async function loadData() {
      setIsLoading(true);
      setError("");
      try {
        const resp = await fetch("/api/admin/data", {
          method: "GET",
          headers: {
            Authorization: `Bearer ${bearerToken}`,
            "Content-Type": "application/json",
          },
        });

        if (!mounted) return;

        if (resp.status === 401) {
          setError("ไม่ได้รับอนุญาต (token หมดอายุหรือไม่ถูกต้อง)");
          setIsAuthed(false);
          setBearerToken("");
          localStorage.removeItem("kookid_admin_token");
          return;
        }

        if (!resp.ok) {
          const body = await resp.json().catch(() => ({}));
          throw new Error(body?.details || body?.error || "Failed to load admin data");
        }

        const body = await resp.json();
        setProfiles(body.profiles || []);
        setInterests(body.interests || []);
        setQuizResults(body.quizResults || []);
        setEventRows(body.eventRows || []);
        setQuizCount(body.quizCount || 0);
      } catch (err) {
        console.error("AdminDashboard load error:", err);
        if (mounted) {
          setError(`โหลดข้อมูลไม่สำเร็จ: ${err.message}`);
        }
      } finally {
        if (mounted) setIsLoading(false);
      }
    }

    loadData();
    return () => {
      mounted = false;
    };
  }, [isAuthed, bearerToken]);

  const handleLogin = async (event) => {
    event.preventDefault();
    setError("");
    try {
      const resp = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: token }),
      });

      if (!resp.ok) {
        const body = await resp.json().catch(() => ({}));
        setError(body?.error || "รหัสผ่านผู้ดูแลไม่ถูกต้อง");
        return;
      }

      const body = await resp.json();
      const remoteToken = body.token;
      if (!remoteToken) {
        setError("ไม่สามารถรับ token จาก server ได้");
        return;
      }

      localStorage.setItem("kookid_admin_token", remoteToken);
      setBearerToken(remoteToken);
      setIsAuthed(true);
      setError("");
    } catch (err) {
      console.error("admin login error", err);
      setError("มีปัญหาในการเชื่อมต่อกับ server");
    }
  };

  // On mount, check for a saved admin token and try to use it.
  useEffect(() => {
    const saved = localStorage.getItem("kookid_admin_token");
    if (saved) {
      setBearerToken(saved);
      setIsAuthed(true);
    }
  }, []);



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
          <p className="text-sm text-muted-foreground mt-1">Conversion Intent · Fake Door Test 59 THB · สรุปผู้ทำแบบทดสอบ ความสนใจ และ event</p>
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}

        {/* ── Conversion Intent Metrics (Fake Door 59 THB) ──────────── */}
        <Card className="p-4 sm:p-5 border-2 border-amber-400/60 bg-amber-50/30">
          <h2 className="text-base font-bold text-amber-700 mb-3 flex items-center gap-2">
            🔥 Conversion Intent — Fake Door Test (59 THB)
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
            <div className="rounded-xl border border-amber-200 bg-white p-4">
              <p className="text-xs text-muted-foreground">Total Premium Clicks</p>
              <p className="text-3xl font-bold text-amber-600 mt-1">{conversionMetrics.premiumClicks}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">event: fake_door_click_59thb</p>
            </div>
            <div className="rounded-xl border border-amber-200 bg-white p-4">
              <p className="text-xs text-muted-foreground">Conversion Rate (Click / Results View)</p>
              <p className="text-3xl font-bold text-amber-600 mt-1">{conversionMetrics.conversionRate}%</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">{conversionMetrics.premiumClicks} clicks / {conversionMetrics.totalPageViews} views</p>
            </div>
            <div className="rounded-xl border border-amber-200 bg-white p-4">
              <p className="text-xs text-muted-foreground">Unique Premium Clickers</p>
              <p className="text-3xl font-bold text-amber-600 mt-1">{premiumClickerIds.size}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">unique user_profile_ids</p>
            </div>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground mb-2">🎯 Top Pain Points (จากคนที่กดปุ่ม Premium)</h3>
            {conversionMetrics.painPoints.length > 0 ? (
              <div className="space-y-1.5">
                {conversionMetrics.painPoints.map(pp => {
                  const maxPP = conversionMetrics.painPoints[0]?.count || 1;
                  const barW = Math.max(8, Math.round((pp.count / maxPP) * 100));
                  return (
                    <div key={pp.id} className="flex items-center gap-3">
                      <span className="text-xs text-foreground w-56 shrink-0 truncate">{pp.label}</span>
                      <div className="flex-1 h-2 rounded-full bg-amber-100 overflow-hidden">
                        <div className="h-full rounded-full bg-amber-500" style={{ width: `${barW}%` }} />
                      </div>
                      <span className="text-xs font-semibold text-amber-700 w-8 text-right">{pp.count}</span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground italic">ยังไม่มีข้อมูล — รอให้ user ที่กดปุ่ม Premium ทำแบบทดสอบจบก่อน</p>
            )}
          </div>
        </Card>

        {/* ── Original Summary Cards ────────────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Card className="p-4">
            <p className="text-xs text-muted-foreground">โปรไฟล์ที่ทำแบบทดสอบเสร็จ</p>
            <p className="text-2xl font-bold text-foreground mt-1">{quizCount}</p>
          </Card>

          <Card className="p-4">
            <p className="text-xs text-muted-foreground">โปรไฟล์นักเรียนในระบบ</p>
            <p className="text-2xl font-bold text-foreground mt-1">{profiles.length}</p>
          </Card>
        </div>

        <Card className="p-4 sm:p-5 border border-border/60">
          <div className="flex flex-col sm:flex-row gap-3 sm:items-end justify-end">
            <div className="flex flex-col sm:flex-row gap-2">
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

        {isLoading && <p className="text-sm text-muted-foreground">กำลังโหลดข้อมูล...</p>}
      </div>
    </div>
  );
}
