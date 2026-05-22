// src/pages/WeeklyReport.tsx
import React, { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/dashboard/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Save, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { getISOWeeksInYear } from "date-fns";

/**
 * WeeklyReport page
 *
 * - MemberDetails: autofill from Supabase profiles
 * - Category list: exact (final) list from screenshots
 * - Categories saved as JSON in weekly_reports.categories
 * - KPI fields saved to dedicated columns prefixed with kpi_ or fields listed below
 */

/* ---------- Utilities ---------- */
function getISOWeekWrapper(date = new Date()) {
  const tmp = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  tmp.setUTCDate(tmp.getUTCDate() + 4 - (tmp.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(tmp.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil(((tmp.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return { year: tmp.getUTCFullYear(), week: weekNo };
}

function isoWeekStartEnd(year: number, week: number) {
  // returns { start: string, end: string } in ISO date string (YYYY-MM-DD)
  // algorithm: get first Thursday, then add (week-1)*7 days
  const simple = new Date(Date.UTC(year, 0, 1));
  const day = simple.getUTCDay();
  // find first Thursday (day 4)
  const thursdayOffset = (4 - day + 7) % 7;
  const firstThursday = new Date(simple);
  firstThursday.setUTCDate(simple.getUTCDate() + thursdayOffset);
  const weekStart = new Date(firstThursday);
  weekStart.setUTCDate(firstThursday.getUTCDate() + (week - 1) * 7 - 3); // Monday of that ISO week
  const weekEnd = new Date(weekStart);
  weekEnd.setUTCDate(weekStart.getUTCDate() + 6);
  const fmt = (d: Date) =>
    `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`;
  return { start: fmt(weekStart), end: fmt(weekEnd) };
}

/* ---------- Exact category list (final) ----------
   Collected from provided screenshots. Order preserved.
*/
const CATEGORIES = [
  "Perennials/G'covers",
  "Shrubs",
  "Annuals Outdoor Tropicals",
  "Labor Services",
  "Pottery",
  "Tropical Plants Indoor",
  "Trees",
  "Landscape Non-Plant",
  "Hardgoods",
  "Herbs/Veggies",
  "Giftware",
  "Outdoor Living",
  "Container Gardens",
  "Garden Center Floral",
  "Bulb/Seeds",
  "Wild Bird",
  "Cmas Seasonal Non-Plant",
  "Food",
  "Pet",
  "Casual Furniture",
  "Artificial Christmas Trees",
  "Christmas Fresh Grns/Trees",
  "Christmas Plants",
  "Christmas Plants (other)",
  "Seasonal Plant",
  "Seasonal Non-Plant",
  "Sod",
  "Water Gardening",
  "Tropical Plants Indoor (2)",
  "Perennials/Gcovers (alt)",
  "Bulbs and Seeds (alt)",
  "Gift Cards and Certificates Sold",
  "(-)Bonus Bucks/Coupons",
  "Garden Center Floral (alt)",
  "Container Gardens (alt)",
  "Outdoor Furniture (alt)",
  "Other",
];

/* ---------- Component ---------- */
const currentYear = new Date().getFullYear();
const YEARS = [currentYear - 1, currentYear, currentYear + 1];
const WEEKS = Array.from({ length: getISOWeeksInYear(new Date(currentYear, 0, 1)) }, (_, i) => i + 1);

export default function WeeklyReport() {
  const navigate = useNavigate();

  // auth/profile
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [profile, setProfile] = useState<any>(null);
  const [participantNumber, setParticipantNumber] = useState<string | null>(null);

  // member details & selection
  const isoNow = getISOWeekWrapper(new Date());
  const [year, setYear] = useState(String(isoNow.year));
  const [week, setWeek] = useState(String(isoNow.week));
  const [status, setStatus] = useState<string>("Active");

  const [weekStart, setWeekStart] = useState<string>(() => isoWeekStartEnd(isoNow.year, isoNow.week).start);
  const [weekEnd, setWeekEnd] = useState<string>(() => isoWeekStartEnd(isoNow.year, isoNow.week).end);

  // categories state (revenue, margin)
  const [categoryData, setCategoryData] = useState<Record<string, { revenue: string; margin: string }>>(() => {
    const empty: Record<string, { revenue: string; margin: string }> = {};
    for (const c of CATEGORIES) empty[c] = { revenue: "", margin: "" };
    return empty;
  });

  // KPI
  // NOTE: placeholder values for selects use "__none" (non-empty) to avoid Radix runtime error
  const [kpi, setKpi] = useState({
    totalQuantity: "",
    numTransactions: "",
    laborCosts: "",
    retailInventory: "",
    weather: "__none",
    highTemp: "",
    lowTemp: "",
    reasonCode: "__none",
    reasonText: "",
  });

  const [saving, setSaving] = useState(false);

  // total revenue computed
  const totalRevenue = useMemo(() => {
    return Object.values(categoryData).reduce((s, v) => {
      const n = Number(v.revenue || 0);
      return s + (isFinite(n) ? n : 0);
    }, 0);
  }, [categoryData]);

  // init: get user and profile
  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) {
          navigate("/");
          return;
        }
        setUserId(user.id);

        // load profile - now selecting columns from your provided schema (name, participant_number, company, status)
        const { data: profileData, error: profileErr } = await supabase
          .from("profiles")
          .select("participant_number, company, id, name, status")
          .eq("id", user.id)
          .maybeSingle();

        if (profileErr) {
          console.warn("profile fetch err", profileErr);
        }
        if (profileData) {
          setProfile(profileData);
          const pn = profileData.participant_number || profileData.company || profileData.id || null;
          setParticipantNumber(pn ? String(pn) : null);
          if (profileData.status) setStatus(profileData.status);
        }

        // try load existing weekly report for this participant/year/week (prefill)
        if (profileData && (profileData.participant_number || profileData.company || profileData.id)) {
          const pn = String(profileData.participant_number || profileData.company || profileData.id);
          const { data: existing, error: exErr } = await supabase
            .from("weekly_reports")
            .select("*")
            .eq("number", pn)
            .eq("year", Number(year))
            .eq("week_number", Number(week))
            .maybeSingle();

          if (!exErr && existing) {
            // prefill categories if saved as JSON - using 'category' field
            if (existing.category) {
              try {
                const saved = typeof existing.category === "string" ? JSON.parse(existing.category) : existing.category;
                if (typeof saved === "object" && saved !== null) {
                  const copy = { ...categoryData };
                  for (const k of Object.keys(copy)) {
                    if (Object.prototype.hasOwnProperty.call(saved, k)) {
                      copy[k] = {
                        revenue: saved[k]?.revenue != null ? String(saved[k].revenue) : "",
                        margin: saved[k]?.margin != null ? String(saved[k].margin) : "",
                      };
                    }
                  }
                  setCategoryData(copy);
                }
              } catch (e) {
                console.warn("can't parse saved category", e);
              }
            }

            // prefill KPI fields using correct column names from schema
            setKpi((prev) => ({
              ...prev,
              totalQuantity: existing.total_quantity ? String(existing.total_quantity) : prev.totalQuantity,
              numTransactions: existing.num_transactions ? String(existing.num_transactions) : prev.numTransactions,
              laborCosts: existing.labor_costs ? String(existing.labor_costs) : prev.laborCosts,
              retailInventory: existing.retail_inventory ? String(existing.retail_inventory) : prev.retailInventory,
              weather: existing.weather_description ?? prev.weather,
              highTemp: existing.high_temperature ? String(existing.high_temperature) : prev.highTemp,
              lowTemp: existing.low_temperature ? String(existing.low_temperature) : prev.lowTemp,
              reasonCode: existing.first_income_reason ?? prev.reasonCode,
              reasonText: existing.second_income_reason ?? prev.reasonText,
            }));
            setStatus(existing.status ?? status);
          }
        }
      } catch (err) {
        console.error("init err", err);
        toast.error("Ошибка при инициализации страницы");
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // when year/week change -> update week start/end
  useEffect(() => {
    try {
      const y = Number(year);
      const w = Number(week);
      if (isFinite(y) && isFinite(w)) {
        const { start, end } = isoWeekStartEnd(y, w);
        setWeekStart(start);
        setWeekEnd(end);
      }
    } catch (e) {
      // noop
    }
  }, [year, week]);

  const handleCategoryChange = (category: string, field: "revenue" | "margin", value: string) => {
    setCategoryData((prev) => ({
      ...prev,
      [category]: { ...prev[category], [field]: value },
    }));
  };

  const normalizeSelectValue = (v: any) => {
    // We used "__none" as placeholder value — translate to null for DB
    if (v === undefined || v === null) return null;
    if (typeof v === "string" && v === "__none") return null;
    return v;
  };

  const handleSave = async () => {
    if (!participantNumber) {
      toast.error("Не удалось определить store number в профиле");
      return;
    }

    setSaving(true);
    try {
      // prepare categories object and rows
      const categoriesPayload: Record<string, { revenue: number; margin: number | null }> = {};
      for (const c of CATEGORIES) {
        const r = Number(categoryData[c]?.revenue || 0);
        const m =
          categoryData[c]?.margin === "" || categoryData[c]?.margin === null
            ? null
            : Number(categoryData[c]?.margin || 0);
        categoriesPayload[c] = { revenue: isFinite(r) ? r : 0, margin: isFinite(Number(m)) ? Number(m) : m };
      }

      const weatherVal = normalizeSelectValue(kpi.weather);
      const reasonVal = normalizeSelectValue(kpi.reasonCode);

      // common duplicated fields for every row
      const common: any = {
        number: participantNumber,
        year: Number(year),
        week_number: Number(week),
        week_start: weekStart ? weekStart : null,
        week_end: weekEnd ? weekEnd : null,
        status,
        total_quantity: kpi.totalQuantity === "" ? null : Number(kpi.totalQuantity || 0),
        num_transactions: kpi.numTransactions === "" ? null : Number(kpi.numTransactions || 0),
        labor_costs: kpi.laborCosts === "" ? null : Number(kpi.laborCosts || 0),
        retail_inventory: kpi.retailInventory === "" ? null : Number(kpi.retailInventory || 0),
        weather_description: weatherVal,
        high_temperature: kpi.highTemp === "" ? null : Number(kpi.highTemp || 0),
        low_temperature: kpi.lowTemp === "" ? null : Number(kpi.lowTemp || 0),
        first_income_reason: reasonVal,
        second_income_reason: kpi.reasonText || null,
        user_id: userId || null,
        created_at: new Date().toISOString(),
      };

      // Build rows: one row per category that has non-empty input (revenue != 0 or margin not null)
      const rowsToInsert: any[] = [];
      for (const [cat, vals] of Object.entries(categoriesPayload)) {
        const hasRevenue = vals.revenue !== 0;
        const hasMargin = vals.margin !== null;
        if (hasRevenue || hasMargin) {
          rowsToInsert.push({
            ...common,
            category: cat, // store category name in 'category' column
            total_revenue: vals.revenue,
            margin: vals.margin,
          });
        }
      }

      // If no per-category rows were created (user didn't fill individual categories),
      // insert a single row like before — category column contains full JSON and total_revenue is aggregated.
      if (rowsToInsert.length === 0) {
        const totalRevenueAgg = Object.values(categoriesPayload).reduce((s, v) => s + (v.revenue || 0), 0);
        rowsToInsert.push({
          ...common,
          category: JSON.stringify(categoriesPayload),
          total_revenue: totalRevenueAgg,
          margin: null,
        });
      }

      // Remove existing rows for this store/year/week (so we replace them)
      const { error: delErr } = await supabase
        .from("weekly_reports")
        .delete()
        .match({ number: participantNumber, year: Number(year), week_number: Number(week) });

      if (delErr) {
        console.error("delete existing rows error", delErr);
        toast.error("Ошибка при удалении предыдущих записей (попробуйте ещё раз)");
        setSaving(false);
        return;
      }

      // Insert new rows (batch)
      const { data: inserted, error: insertErr } = await supabase.from("weekly_reports").insert(rowsToInsert);

      if (insertErr) {
        console.error("insert error", insertErr);
        toast.error("Ошибка при сохранении отчёта");
      } else {
        toast.success("Отчёт успешно сохранён");
        // optional: if you want to reflect saved state back into UI (e.g. id, created_at), you can process `inserted`
      }
    } catch (err) {
      console.error("save exception", err);
      toast.error("Ошибка при сохранении");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="flex items-center justify-center py-20">
            <Loader2 className="animate-spin h-8 w-8" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="max-w-6xl mx-auto px-6 sm:px-8 lg:px-10 py-8">
        {/* Page title */}
        <div className="mb-8">
          <h1 className="text-3xl font-display font-bold text-foreground">Weekly Department Report</h1>
          <p className="text-muted-foreground mt-1">Complete your weekly sales report</p>
        </div>

        {/* Member Details */}
        <section className="mb-6">
          <div className="rounded-xl shadow-sm bg-white p-6">
            <h2 className="text-xl font-semibold mb-4">Member Details</h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label>Member Name</Label>
                {/* now using profile.name (from schema) */}
                <Input value={profile?.name || profile?.company || ""} disabled />
              </div>

              <div>
                <Label>Member Number</Label>
                <Input value={profile?.participant_number || participantNumber || ""} disabled />
              </div>

              <div>
                <Label>Status</Label>
                <Input value={status} onChange={(e) => setStatus(e.target.value)} />
              </div>

              <div>
                <Label>Year</Label>
                <Select value={year} onValueChange={(v) => setYear(String(v))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {YEARS.map((y) => (
                      <SelectItem key={y} value={String(y)}>
                        {y}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Week Number</Label>
                <Select value={week} onValueChange={(v) => setWeek(String(v))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent style={{ maxHeight: 260 }}>
                    {WEEKS.map((w) => (
                      <SelectItem key={w} value={String(w)}>
                        Week {w}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div />
              {/* empty cell to align */}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div>
                <Label>Week Start</Label>
                <Input value={weekStart} disabled />
              </div>

              <div>
                <Label>Week End</Label>
                <Input value={weekEnd} disabled />
              </div>
            </div>
          </div>
        </section>

        {/* Category Sales (big white card with internal scroll) */}
        <section className="mb-6">
          <div className="rounded-xl shadow-sm bg-white p-6">
            <h2 className="text-xl font-semibold mb-4">Category Sales</h2>

            {/* scroll container - fixed height to match screenshots */}
            <div
              className="bg-white rounded-md p-4"
              style={{
                maxHeight: 520,
                overflowY: "auto",
                borderRadius: 12,
                background: "#ffffff",
              }}
            >
              <div className="space-y-4">
                {CATEGORIES.map((cat) => (
                  <div
                    key={cat}
                    className="flex flex-col md:flex-row items-center md:items-stretch gap-4 p-4 rounded-lg bg-gray-50"
                    style={{ borderRadius: 12 }}
                  >
                    <div className="flex-1">
                      <div className="text-sm font-medium text-foreground">{cat}</div>
                    </div>

                    <div className="w-full md:w-80">
                      <Label className="text-xs text-muted-foreground">Revenue</Label>
                      <Input
                        type="number"
                        placeholder="$ Revenue"
                        value={categoryData[cat]?.revenue || ""}
                        onChange={(e) => handleCategoryChange(cat, "revenue", e.target.value)}
                      />
                    </div>

                    <div className="w-full md:w-56">
                      <Label className="text-xs text-muted-foreground">% Margin</Label>
                      <Input
                        type="number"
                        placeholder="% Margin"
                        value={categoryData[cat]?.margin || ""}
                        onChange={(e) => handleCategoryChange(cat, "margin", e.target.value)}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Total Revenue block */}
            <div className="mt-6 p-4 rounded-xl" style={{ background: "rgba(30, 90, 250, 0.06)" }}>
              <div className="flex items-center justify-between">
                <div className="text-lg font-medium">Total Revenue (sum of entered categories)</div>
                <div className="text-2xl font-bold text-primary">${totalRevenue.toFixed(2)}</div>
              </div>
            </div>
          </div>
        </section>

        {/* KPI Metrics card */}
        <section className="mb-8">
          <div className="rounded-xl shadow-sm bg-white p-6">
            <h2 className="text-xl font-semibold mb-4">KPI Metrics</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Total Items</Label>
                <Input
                  value={kpi.totalQuantity}
                  onChange={(e) => setKpi((p) => ({ ...p, totalQuantity: e.target.value }))}
                  placeholder=""
                />
              </div>
              <div>
                <Label>Transaction Count</Label>
                <Input
                  value={kpi.numTransactions}
                  onChange={(e) => setKpi((p) => ({ ...p, numTransactions: e.target.value }))}
                />
              </div>
              <div>
                <Label>Labor Costs ($)</Label>
                <Input value={kpi.laborCosts} onChange={(e) => setKpi((p) => ({ ...p, laborCosts: e.target.value }))} />
              </div>
              <div>
                <Label>Retail Inventory On Hand</Label>
                <Input
                  value={kpi.retailInventory}
                  onChange={(e) => setKpi((p) => ({ ...p, retailInventory: e.target.value }))}
                />
              </div>

              <div>
                <Label>Rate the Weather</Label>
                <Select value={kpi.weather} onValueChange={(v) => setKpi((p) => ({ ...p, weather: String(v) }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {/* use non-empty placeholder value to avoid Radix error */}
                    <SelectItem value="__none">Select weather</SelectItem>
                    <SelectItem value="1">1 - Snow/Ice</SelectItem>
                    <SelectItem value="2">2 - Cloudy - Cold</SelectItem>
                    <SelectItem value="3">3 - Thunderstorms</SelectItem>
                    <SelectItem value="4">4 - Rain</SelectItem>
                    <SelectItem value="5">5 - Cloudy - Muggy</SelectItem>
                    <SelectItem value="6">6 - Cloudy - Pleasant</SelectItem>
                    <SelectItem value="7">7 - Sunny</SelectItem>
                    <SelectItem value="8">8 - Sunny - Pleasant</SelectItem>
                    <SelectItem value="9">9 - Sunny - Muggy</SelectItem>
                    <SelectItem value="10">10 - Hot</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex gap-4">
                <div className="flex-1">
                  <Label>High Temperature (°F)</Label>
                  <Input value={kpi.highTemp} onChange={(e) => setKpi((p) => ({ ...p, highTemp: e.target.value }))} />
                </div>
                <div className="flex-1">
                  <Label>Low Temperature (°F)</Label>
                  <Input value={kpi.lowTemp} onChange={(e) => setKpi((p) => ({ ...p, lowTemp: e.target.value }))} />
                </div>
              </div>

              <div className="md:col-span-2">
                <Label>Reason for Revenue</Label>
                <Select value={kpi.reasonCode} onValueChange={(v) => setKpi((p) => ({ ...p, reasonCode: String(v) }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none">Select reason</SelectItem>
                    <SelectItem value="promo">Promotional activity</SelectItem>
                    <SelectItem value="event">Local event</SelectItem>
                    <SelectItem value="seasonal">Seasonal</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="md:col-span-2">
                <Label>Reason for Revenue (Max 10 words)</Label>
                <Input value={kpi.reasonText} onChange={(e) => setKpi((p) => ({ ...p, reasonText: e.target.value }))} />
              </div>
            </div>
          </div>
        </section>

        {/* Save */}
        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={saving} className="px-6">
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save Report
              </>
            )}
          </Button>
        </div>
      </main>
    </div>
  );
}
