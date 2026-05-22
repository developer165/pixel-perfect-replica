// src/pages/PersonalDashboard.tsx
import React, { useEffect, useState, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { toast } from "sonner";
import { DollarSign, TrendingUp, Users, Briefcase } from "lucide-react";
import { Header } from "@/components/dashboard/Header";

import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  CartesianGrid,
  LabelList,
} from "recharts";

import { getISOWeeksInYear } from "date-fns";

/* ---------- Utilities ---------- */
function getISOWeekWrapper(date = new Date()) {
  const tmp = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  tmp.setUTCDate(tmp.getUTCDate() + 4 - (tmp.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(tmp.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil(((tmp.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return { year: tmp.getUTCFullYear(), week: weekNo };
}

function calcPercentChange(current: number, previous: number) {
  if (previous === 0) {
    if (current === 0) return { pct: 0, label: "0%", dir: "neutral" as const };
    return { pct: Infinity, label: "∞", dir: "up" as const };
  }
  const pct = ((current - previous) / Math.abs(previous)) * 100;
  return {
    pct,
    label: `${pct >= 0 ? "+" : ""}${pct.toFixed(1)}%`,
    dir: pct === 0 ? ("neutral" as const) : pct > 0 ? ("up" as const) : ("down" as const),
  };
}

/* Theme */
const THEME = {
  primaryBlue: "#003d6b", // previous / last-year
  accentGreen: "#16a34a", // current / this-week
  dangerRed: "#dc2626",
};

const PercentBadge: React.FC<{ value: string; dir: "up" | "down" | "neutral" }> = ({ value, dir }) => (
  <div
    className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full ${
      dir === "up"
        ? "bg-green-100 text-green-700"
        : dir === "down"
          ? "bg-red-100 text-red-700"
          : "bg-gray-100 text-gray-700"
    }`}
    style={{ transform: "translateY(-6px)" }}
  >
    {dir === "up" ? (
      <ArrowUpRight className="w-3 h-3" />
    ) : dir === "down" ? (
      <ArrowDownRight className="w-3 h-3" />
    ) : null}
    <span>{value}</span>
  </div>
);

/* ---------- Chart components ---------- */
const SalesTimeline: React.FC<{ data: any[]; title?: string; cardHeight?: number }> = ({
  data,
  title = "Sales Timeline (last 12 weeks)",
  cardHeight = 320,
}) => {
  // chartHeight used for inner container height (ResponsiveContainer needs explicit height)
  const chartHeight = Math.max(160, cardHeight - 80);
  return (
    // Сделали карточку адаптивной: h-auto и flex-col, чтобы она расширялась под содержимое
    <div className="card p-4 bg-white shadow-sm rounded-xl h-auto flex flex-col">
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <div style={{ width: "100%", height: chartHeight }}>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="weekLabel" />
            <YAxis tickFormatter={(v: number) => (v >= 1000 ? (v / 1000).toFixed(0) + "k" : v.toLocaleString())} />
            <Tooltip formatter={(v: any) => (typeof v === "number" ? `$${v.toLocaleString()}` : v)} />
            <Legend />
            {/* previous = blue, current = green */}
            <Bar dataKey="previous" name="Previous week" fill={THEME.primaryBlue} />
            <Line type="monotone" dataKey="current" stroke={THEME.accentGreen} strokeWidth={2} dot={{ r: 3 }} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

const HistoricComparisonChart: React.FC<{ points: any[]; title?: string; cardHeight?: number }> = ({
  points,
  title = "Last 5 weeks vs Last year's 9 weeks",
  cardHeight = 320,
}) => {
  if (!points || points.length === 0) {
    return (
      <div className="p-4 bg-white rounded-xl shadow-sm h-auto" style={{ minHeight: cardHeight }}>
        <h3 className="text-lg font-semibold">{title}</h3>
        <div className="text-sm text-muted-foreground mt-2">No comparative data available.</div>
      </div>
    );
  }

  const chartData = points.map((p) => ({ weekLabel: p.weekLabel, current: p.current, lastYear: p.lastYear }));
  const chartHeight = Math.max(160, cardHeight - 80);

  return (
    <div className="card p-4 bg-white shadow-sm rounded-xl h-auto flex flex-col">
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <div style={{ width: "100%", height: chartHeight }}>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="weekLabel" />
            <YAxis tickFormatter={(v: number) => (v >= 1000 ? (v / 1000).toFixed(0) + "k" : v.toLocaleString())} />
            <Tooltip
              formatter={(v: any) => (v === null ? "—" : typeof v === "number" ? `$${v.toLocaleString()}` : v)}
            />
            <Legend />
            {/* lastYear = blue, current = green */}
            <Line type="monotone" dataKey="lastYear" stroke={THEME.primaryBlue} strokeWidth={2} dot={{ r: 3 }} />
            <Line type="monotone" dataKey="current" stroke={THEME.accentGreen} strokeWidth={3} dot={{ r: 4 }} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

/* ---------- Hook: useCategoryRowsLatest (aggregates relative to last submitted week) ---------- */
function useCategoryRowsLatest(participantNumber: string | null, yearsBack = 2) {
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState<{ category: string; thisWeek: number; prevWeek: number; sameWeekLY: number }[]>([]);
  const [latest, setLatest] = useState<{ year: number; week: number } | null>(null);

  useEffect(() => {
    if (!participantNumber) {
      setRows([]);
      setLatest(null);
      return;
    }
    fetchByRPCorFallback();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [participantNumber]);

  const fetchByRPCorFallback = async () => {
    setLoading(true);
    try {
      // try RPC first
      const { data: aggRows, error: aggErr } = await supabase.rpc("get_weekly_for_last_n_years", {
        participant_number: participantNumber,
        n_years: yearsBack,
      });

      let rowsArr: any[] = [];

      if (!aggErr && aggRows && Array.isArray(aggRows) && aggRows.length) {
        rowsArr = aggRows as any[];
      } else {
        // fallback: pull weekly_reports and aggregate client-side
        if (aggErr) {
          console.warn("RPC failed, fallback to client aggregation:", aggErr);
          toast.error("RPC недоступен — использую fallback для категорий");
        }

        const now = new Date();
        const { year: cy } = getISOWeekWrapper(now);
        const minYear = cy - (yearsBack - 1);

        const { data: rawRows, error: rawErr } = await supabase
          .from("weekly_reports")
          .select("year, week_number, category, total_revenue, labor_costs")
          .eq("number", participantNumber)
          .gte("year", minYear)
          .limit(100000);

        if (rawErr) {
          console.error("Fallback fetch error:", rawErr);
          toast.error("Не удалось получить weekly_reports для fallback");
          setRows([]);
          setLatest(null);
          setLoading(false);
          return;
        }

        // aggregate per (year,week)
        const mapWeek = new Map<
          string,
          { year: number; week_number: number; total_revenue: number; labor_costs: number }
        >();
        (rawRows || []).forEach((r: any) => {
          const y = Number(r.year);
          const w = Number(r.week_number);
          const key = `${y}-${String(w).padStart(2, "0")}`;
          const ex = mapWeek.get(key) || { year: y, week_number: w, total_revenue: 0, labor_costs: 0 };
          ex.total_revenue += Number(r.total_revenue || 0);
          ex.labor_costs += Number(r.labor_costs || 0);
          mapWeek.set(key, ex);
        });

        rowsArr = Array.from(mapWeek.values()).map((v) => ({
          year: v.year,
          week_number: v.week_number,
          total_revenue: v.total_revenue,
          labor_costs: v.labor_costs,
        }));
      }

      if (!rowsArr.length) {
        setRows([]);
        setLatest(null);
        setLoading(false);
        return;
      }

      let latestYear = -Infinity;
      let latestWeek = -Infinity;
      for (const r of rowsArr) {
        const y = Number(r.year);
        const w = Number(r.week_number);
        if (y > latestYear || (y === latestYear && w > latestWeek)) {
          latestYear = y;
          latestWeek = w;
        }
      }
      setLatest({ year: latestYear, week: latestWeek });

      // compute prev and LY
      let prevYear = latestYear;
      let prevWeek = latestWeek - 1;
      if (prevWeek < 1) {
        prevYear = latestYear - 1;
        prevWeek = getISOWeeksInYear(new Date(prevYear, 0, 1));
      }
      const sameWeekLastYear = { year: latestYear - 1, week: latestWeek };

      // fetch category rows for three weeks
      const qThis = supabase
        .from("weekly_reports")
        .select("category, total_revenue")
        .eq("number", participantNumber)
        .eq("year", latestYear)
        .eq("week_number", latestWeek)
        .limit(10000);

      const qPrev = supabase
        .from("weekly_reports")
        .select("category, total_revenue")
        .eq("number", participantNumber)
        .eq("year", prevYear)
        .eq("week_number", prevWeek)
        .limit(10000);

      const qLY = supabase
        .from("weekly_reports")
        .select("category, total_revenue")
        .eq("number", participantNumber)
        .eq("year", sameWeekLastYear.year)
        .eq("week_number", sameWeekLastYear.week)
        .limit(10000);

      const [rThis, rPrev, rLY] = await Promise.all([qThis, qPrev, qLY]);
      const thisRows = (rThis?.data as any[]) || [];
      const prevRows = (rPrev?.data as any[]) || [];
      const lyRows = (rLY?.data as any[]) || [];

      // aggregate per category
      const map = new Map<string, { thisWeek: number; prevWeek: number; sameWeekLY: number }>();
      const norm = (cat: any) =>
        cat === null || cat === undefined || String(cat).trim() === "" ? "Uncategorized" : String(cat);

      for (const r of thisRows) {
        const cat = norm(r.category);
        const cur = Number(r.total_revenue || 0);
        const obj = map.get(cat) || { thisWeek: 0, prevWeek: 0, sameWeekLY: 0 };
        obj.thisWeek += cur;
        map.set(cat, obj);
      }
      for (const r of prevRows) {
        const cat = norm(r.category);
        const cur = Number(r.total_revenue || 0);
        const obj = map.get(cat) || { thisWeek: 0, prevWeek: 0, sameWeekLY: 0 };
        obj.prevWeek += cur;
        map.set(cat, obj);
      }
      for (const r of lyRows) {
        const cat = norm(r.category);
        const cur = Number(r.total_revenue || 0);
        const obj = map.get(cat) || { thisWeek: 0, prevWeek: 0, sameWeekLY: 0 };
        obj.sameWeekLY += cur;
        map.set(cat, obj);
      }

      const out = Array.from(map.entries()).map(([category, vals]) => ({
        category,
        thisWeek: vals.thisWeek,
        prevWeek: vals.prevWeek,
        sameWeekLY: vals.sameWeekLY,
      }));

      out.sort((a, b) => b.thisWeek - a.thisWeek);
      setRows(out);
    } catch (err) {
      console.error("useCategoryRowsLatest error:", err);
      toast.error("Ошибка при загрузке категорий (latest)");
      setRows([]);
      setLatest(null);
    } finally {
      setLoading(false);
    }
  };

  return { rows, loading, latest };
}

/* ---------- CategoryComparison (with Custom-week mode for both weeks) ---------- */
const CategoryComparison: React.FC<{
  participantNumber: string | null;
  initialMode?: "WoW" | "LY" | "Custom";
  topN?: number;
}> = ({ participantNumber, initialMode = "WoW", topN = 12 }) => {
  const { rows, loading, latest } = useCategoryRowsLatest(participantNumber, 2);
  const [mode, setMode] = useState<"WoW" | "LY" | "Custom">(initialMode);

  // fallback current ISO week/year
  const fallback = getISOWeekWrapper();

  useEffect(() => {
    if (latest) {
      // ensure default selectors reflect latest when available
      setYearA(latest.year);
      setWeekA(latest.week);
      setYearB(latest.year - 1);
      setWeekB(latest.week);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [latest]);

  // Custom mode: two separate year/week selectors (A = base, B = compare)
  const [yearA, setYearA] = useState<number>(latest?.year ?? fallback.year);
  const [weekA, setWeekA] = useState<number>(latest?.week ?? fallback.week);
  const [yearB, setYearB] = useState<number>(latest ? latest.year - 1 : fallback.year - 1);
  const [weekB, setWeekB] = useState<number>(latest ? latest.week : Math.max(1, fallback.week - 1));

  // chart data state (used for custom mode)
  const [customChartData, setCustomChartData] = useState<
    { category: string; baseVal: number; compareVal: number; pctLabel: string; pctDir: "up" | "down" | "neutral" }[]
  >([]);

  // helper to fetch aggregated category totals for a given (year, week)
  const fetchCategoryTotalsForWeek = async (year: number, week: number) => {
    if (!participantNumber) return new Map<string, number>();
    const { data, error } = await supabase
      .from("weekly_reports")
      .select("category, total_revenue")
      .eq("number", participantNumber)
      .eq("year", year)
      .eq("week_number", week)
      .limit(10000);

    if (error) {
      console.error("fetchCategoryTotalsForWeek error", error);
      return new Map<string, number>();
    }
    const map = new Map<string, number>();
    (data || []).forEach((r: any) => {
      const cat =
        r.category === null || r.category === undefined || String(r.category).trim() === ""
          ? "Uncategorized"
          : String(r.category);
      const v = Number(r.total_revenue || 0);
      map.set(cat, (map.get(cat) || 0) + v);
    });
    return map;
  };

  // When custom mode or its selects change, fetch both weeks and compute pct labels
  useEffect(() => {
    let mounted = true;
    const load = async () => {
      if (mode !== "Custom") return;
      if (!participantNumber) return;

      try {
        const [mapA, mapB] = await Promise.all([
          fetchCategoryTotalsForWeek(yearA, weekA),
          fetchCategoryTotalsForWeek(yearB, weekB),
        ]);
        // union of categories
        const cats = new Set<string>([...Array.from(mapA.keys()), ...Array.from(mapB.keys())]);
        const arr: any[] = [];
        cats.forEach((cat) => {
          const a = mapA.get(cat) || 0;
          const b = mapB.get(cat) || 0;
          // compute change of base (A) vs compare (B): how much A differs from B
          const change = calcPercentChange(a, b);
          arr.push({
            category: cat,
            baseVal: a,
            compareVal: b,
            pctLabel: change.label,
            pctDir: change.dir,
          });
        });
        arr.sort((x, y) => y.baseVal - x.baseVal); // sort by baseVal desc
        if (mounted) setCustomChartData(arr.slice(0, topN));
      } catch (e) {
        console.error("Custom weeks fetch error", e);
        toast.error("Failed to load custom weeks data");
        if (mounted) setCustomChartData([]);
      }
    };
    load();
    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, yearA, weekA, yearB, weekB, participantNumber]);

  // chartData for non-custom modes (from hook)
  const builtInChartData = useMemo(() => {
    if (!rows) return [];
    return rows.slice(0, topN).map((r) =>
      mode === "WoW"
        ? {
            category: r.category,
            previous: r.prevWeek,
            thisWeek: r.thisWeek,
            pctLabel: calcPercentChange(r.thisWeek, r.prevWeek).label,
            pctDir: calcPercentChange(r.thisWeek, r.prevWeek).dir,
          }
        : {
            category: r.category,
            lastYear: r.sameWeekLY,
            thisWeek: r.thisWeek,
            pctLabel: calcPercentChange(r.thisWeek, r.sameWeekLY).label,
            pctDir: calcPercentChange(r.thisWeek, r.sameWeekLY).dir,
          },
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows, mode]);

  const pctLabelStyle = { fill: THEME.accentGreen, fontWeight: 700, fontSize: 12 };

  // year/week dropdown options (simple)
  const years = useMemo(() => {
    const cy = latest?.year ?? new Date().getFullYear();
    // show a small range: cy-1..cy+1
    return [cy - 1, cy, cy + 1];
  }, [latest]);

  const maxWeeksForYearA = useMemo(() => getISOWeeksInYear(new Date(yearA, 0, 1)), [yearA]);
  const weeksA = useMemo(() => Array.from({ length: maxWeeksForYearA }, (_, i) => i + 1), [maxWeeksForYearA]);

  const maxWeeksForYearB = useMemo(() => getISOWeeksInYear(new Date(yearB, 0, 1)), [yearB]);
  const weeksB = useMemo(() => Array.from({ length: maxWeeksForYearB }, (_, i) => i + 1), [maxWeeksForYearB]);

  return (
    <div className="p-4 bg-white rounded-xl shadow-sm w-full h-auto">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold">Category comparison</h3>

        <div className="flex items-center gap-3">
          <div className="text-sm text-muted-foreground mr-2">
            {latest ? `Latest week: ${latest.year}-W${String(latest.week).padStart(2, "0")}` : "No week data"}
          </div>

          <select value={mode} onChange={(e) => setMode(e.target.value as any)} className="border px-2 py-1 rounded">
            <option value="WoW">This week vs Previous week</option>
            <option value="LY">This week vs Same week LY</option>
            <option value="Custom">Custom week comparison</option>
          </select>
        </div>
      </div>

      {/* If Custom mode — show two sets of year+week selects (A = base, B = compare) */}
      {mode === "Custom" && (
        <div className="mb-3 flex items-center gap-4">
          <div>
            <div className="text-xs text-muted-foreground mb-1">Base week</div>
            <div className="flex gap-2">
              <select
                value={yearA}
                onChange={(e) => {
                  const y = Number(e.target.value);
                  setYearA(y);
                  const maxW = getISOWeeksInYear(new Date(y, 0, 1));
                  if (weekA > maxW) setWeekA(maxW);
                }}
                className="border px-2 py-1 rounded"
              >
                {years.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>

              <select
                value={weekA}
                onChange={(e) => setWeekA(Number(e.target.value))}
                className="border px-2 py-1 rounded"
              >
                {weeksA.map((w) => (
                  <option key={w} value={w}>
                    W{w}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <div className="text-xs text-muted-foreground mb-1">Compare week</div>
            <div className="flex gap-2">
              <select
                value={yearB}
                onChange={(e) => {
                  const y = Number(e.target.value);
                  setYearB(y);
                  const maxW = getISOWeeksInYear(new Date(y, 0, 1));
                  if (weekB > maxW) setWeekB(maxW);
                }}
                className="border px-2 py-1 rounded"
              >
                {years.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>

              <select
                value={weekB}
                onChange={(e) => setWeekB(Number(e.target.value))}
                className="border px-2 py-1 rounded"
              >
                {weeksB.map((w) => (
                  <option key={w} value={w}>
                    W{w}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Контейнер графика: внутренний фиксированная высота для Recharts, а карточка остаётся адаптивной */}
      <div style={{ width: "100%", height: 260 }}>
        <ResponsiveContainer width="100%" height="100%">
          {mode === "Custom" ? (
            <ComposedChart
              data={
                customChartData.map((r) => ({
                  category: r.category,
                  base: r.baseVal,
                  compare: r.compareVal,
                  pctLabel: r.pctLabel,
                  pctDir: r.pctDir,
                })) || []
              }
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="category" tick={{ fontSize: 12 }} />
              <YAxis tickFormatter={(v: number) => (v >= 1000 ? (v / 1000).toFixed(0) + "K" : v.toLocaleString())} />
              <Tooltip
                formatter={(v: any, name: any) => {
                  if (name === "base" || name === "compare") return [`$${Number(v).toLocaleString()}`, name];
                  return v;
                }}
              />
              <Legend />
              <Bar dataKey="compare" name="Compare week" barSize={14} fill={THEME.primaryBlue} />
              <Bar dataKey="base" name="Base week" barSize={14} fill={THEME.accentGreen}>
                <LabelList dataKey="pctLabel" position="top" style={pctLabelStyle} />
              </Bar>
            </ComposedChart>
          ) : (
            <ComposedChart data={builtInChartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="category" tick={{ fontSize: 12 }} />
              <YAxis tickFormatter={(v: number) => (v >= 1000 ? (v / 1000).toFixed(0) + "K" : v.toLocaleString())} />
              <Tooltip
                formatter={(v: any, name: any) => {
                  if (name === "thisWeek" || name === "previous" || name === "lastYear")
                    return [`$${Number(v).toLocaleString()}`, name];
                  return v;
                }}
              />
              <Legend />
              {mode === "WoW" ? (
                <>
                  <Bar dataKey="previous" name="Previous week" barSize={14} fill={THEME.primaryBlue} />
                  <Bar dataKey="thisWeek" name="This week" barSize={14} fill={THEME.accentGreen}>
                    <LabelList dataKey="pctLabel" position="top" style={pctLabelStyle} />
                  </Bar>
                </>
              ) : (
                <>
                  <Bar dataKey="lastYear" name="Same week LY" barSize={14} fill={THEME.primaryBlue} />
                  <Bar dataKey="thisWeek" name="This week" barSize={14} fill={THEME.accentGreen}>
                    <LabelList dataKey="pctLabel" position="top" style={pctLabelStyle} />
                  </Bar>
                </>
              )}
            </ComposedChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  );
};

/* ---------- Combined table component with filters & sorting ---------- */
const CombinedCategoryTable: React.FC<{ participantNumber: string | null }> = ({ participantNumber }) => {
  const { rows, loading, latest } = useCategoryRowsLatest(participantNumber, 2);

  // mode: "WoW" (compare with previous week) or "LY" (compare with same week last year)
  const [mode, setMode] = useState<"WoW" | "LY">("WoW");

  // sorting: field "alpha" or "total"; direction asc/desc
  const [sortField, setSortField] = useState<"alpha" | "total">("total");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  const tableData = useMemo(() => {
    if (!rows) return [];
    const mapped = rows.map((r) => {
      const other = mode === "WoW" ? r.prevWeek : r.sameWeekLY;
      const change = calcPercentChange(r.thisWeek, other);
      const totalOther = other;
      return {
        category: r.category,
        thisWeek: r.thisWeek,
        other: totalOther,
        changeLabel: change.label,
        changeDir: change.dir,
        totalThis: r.thisWeek,
      };
    });

    const sorted = mapped.sort((a, b) => {
      if (sortField === "alpha") {
        if (a.category < b.category) return sortDir === "asc" ? -1 : 1;
        if (a.category > b.category) return sortDir === "asc" ? 1 : -1;
        return 0;
      } else {
        // sort by totalThis
        if (a.totalThis < b.totalThis) return sortDir === "asc" ? -1 : 1;
        if (a.totalThis > b.totalThis) return sortDir === "asc" ? 1 : -1;
        return 0;
      }
    });

    return sorted;
  }, [rows, mode, sortField, sortDir]);

  const totals = useMemo(() => {
    const totalThis = (rows || []).reduce((s, r) => s + (r.thisWeek || 0), 0);
    const totalOther = (rows || []).reduce((s, r) => s + (mode === "WoW" ? r.prevWeek : r.sameWeekLY || 0), 0);
    const change = calcPercentChange(totalThis, totalOther);
    return { totalThis, totalOther, change };
  }, [rows, mode]);

  return (
    <div className="w-full p-0">
      {/* MAIN WHITE CARD: теперь адаптивная высота */}
      <div className="bg-white rounded-xl shadow-sm w-full h-auto">
        <div className="p-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold">Category table — comparison</h3>
          <div className="flex items-center gap-3">
            <div className="text-sm text-muted-foreground mr-2">
              {latest ? `Base week: ${latest.year}-W${String(latest.week).padStart(2, "0")}` : "No week data"}
            </div>

            <select className="border px-2 py-1 rounded" value={mode} onChange={(e) => setMode(e.target.value as any)}>
              <option value="WoW">Compare with previous week</option>
              <option value="LY">Compare with same week LY</option>
            </select>

            <select
              className="border px-2 py-1 rounded"
              value={sortField}
              onChange={(e) => setSortField(e.target.value as any)}
            >
              <option value="total">Sort by total (this week)</option>
              <option value="alpha">Sort alphabetically</option>
            </select>

            <select
              className="border px-2 py-1 rounded"
              value={sortDir}
              onChange={(e) => setSortDir(e.target.value as any)}
            >
              <option value="desc">Desc</option>
              <option value="asc">Asc</option>
            </select>
          </div>
        </div>

        {/* table area with padding and overflow */}
        <div className="p-4 overflow-auto">
          {loading ? (
            <div className="py-6 text-center">
              <Loader2 className="animate-spin" />
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left border-b">
                  <th className="py-2">Category</th>
                  <th className="text-right">This week</th>
                  <th className="text-right">{mode === "WoW" ? "Previous week" : "Same week LY"}</th>
                  <th className="text-right">Change</th>
                </tr>
              </thead>
              <tbody>
                {tableData.map((r) => (
                  <tr key={r.category} className="border-b last:border-b-0">
                    <td className="py-2">{r.category}</td>
                    <td className="text-right">
                      ${Number(r.thisWeek).toLocaleString(undefined, { maximumFractionDigits: 2 })}
                    </td>
                    <td className="text-right">
                      ${Number(r.other).toLocaleString(undefined, { maximumFractionDigits: 2 })}
                    </td>
                    <td className="text-right">
                      <div className="flex justify-end">
                        <PercentBadge value={r.changeLabel} dir={r.changeDir} />
                      </div>
                    </td>
                  </tr>
                ))}

                {tableData.length === 0 && (
                  <tr>
                    <td colSpan={4} className="py-4 text-center text-muted-foreground">
                      No category data for base week
                    </td>
                  </tr>
                )}
              </tbody>
              <tfoot>
                <tr className="font-semibold border-t">
                  <td className="py-2">Grand total</td>
                  <td className="text-right">
                    ${totals.totalThis.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                  </td>
                  <td className="text-right">
                    ${totals.totalOther.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                  </td>
                  <td className="text-right">
                    <div className="flex justify-end">
                      <PercentBadge value={totals.change.label} dir={totals.change.dir} />
                    </div>
                  </td>
                </tr>
              </tfoot>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

/* ---------- Main dashboard component ---------- */
export default function PersonalDashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [participantNumber, setParticipantNumber] = useState<string | null>(null);

  // Scorecard data
  const [thisWeekSales, setThisWeekSales] = useState(0);
  const [lastWeekSales, setLastWeekSales] = useState(0);
  const [sameWeekLastYearSales, setSameWeekLastYearSales] = useState(0);
  const [weeklyLabor, setWeeklyLabor] = useState(0);
  const [previousWeekLabor, setPreviousWeekLabor] = useState(0);
  const [laborYTD, setLaborYTD] = useState(0);

  // Revenue YTD and computed percent
  const [revenueYTD, setRevenueYTD] = useState(0);
  const [laborYTDPercent, setLaborYTDPercent] = useState<number | null>(null);

  // Timeline / charts
  const [timelineData, setTimelineData] = useState<any[]>([]);
  const [comparativePoints, setComparativePoints] = useState<any[]>([]);

  const CARD_HEIGHT = 320;

  useEffect(() => {
    initAuthAndLoad();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const initAuthAndLoad = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        navigate("/");
        return;
      }

      const { data: profile, error: profileErr } = await supabase
        .from("profiles")
        .select("participant_number, company, id")
        .eq("id", user.id)
        .single();

      if (profileErr || !profile) {
        console.warn("No profile row or error when selecting participant_number", profileErr);
        toast.error("Store number not found in your profile");
        setLoading(false);
        return;
      }

      const pnCandidate = profile.participant_number || profile.company || profile.id || null;

      if (!pnCandidate) {
        toast.error("Profile doesn't contain a store number (participant_number)");
        setLoading(false);
        return;
      }

      const pn = String(pnCandidate).trim();
      setParticipantNumber(pn);
      await fetchAllData(pn);
    } catch (err) {
      console.error(err);
      toast.error("Ошибка аутентификации");
      setLoading(false);
    }
  };

  const fetchAllData = useCallback(async (partNum: string | null, weeksBack = 12, yearsBack = 2) => {
    setLoading(true);
    try {
      if (!partNum) return;

      // try RPC to get aggregated weekly rows for last n years
      const { data: aggRows, error: aggErr } = await supabase.rpc("get_weekly_for_last_n_years", {
        participant_number: partNum,
        n_years: yearsBack,
      });

      if (aggErr) {
        console.warn("RPC get_weekly_for_last_n_years error (will fallback):", aggErr);
        toast.error("RPC недоступен — использую fallback для timeline");
        // fallback handling is possible (not implemented here for timeline) — RPC is preferred.
      }

      const rowsArr = (aggRows || []) as any[];

      if (!rowsArr.length) {
        // nothing
        setTimelineData([]);
        setThisWeekSales(0);
        setLastWeekSales(0);
        setSameWeekLastYearSales(0);
        setRevenueYTD(0);
        setLaborYTD(0);
        setLaborYTDPercent(null);
        setWeeklyLabor(0);
        setPreviousWeekLabor(0);
        setComparativePoints([]);
        setLoading(false);
        return;
      }

      // determine latest submitted week
      let latestYear = -Infinity;
      let latestWeek = -Infinity;
      for (const r of rowsArr) {
        const y = Number(r.year);
        const w = Number(r.week_number);
        if (y > latestYear || (y === latestYear && w > latestWeek)) {
          latestYear = y;
          latestWeek = w;
        }
      }

      const rowsMap = new Map<string, { year: number; week: number; total_revenue: number; labor_costs: number }>();
      rowsArr.forEach((r) => {
        const y = Number(r.year);
        const w = Number(r.week_number);
        const key = `${y}-${String(w).padStart(2, "0")}`;
        rowsMap.set(key, {
          year: y,
          week: w,
          total_revenue: Number(r.total_revenue || 0),
          labor_costs: Number(r.labor_costs || 0),
        });
      });

      // build backward window from latest submitted week
      const pairs: { year: number; week: number }[] = [];
      let y = latestYear;
      let w = latestWeek;
      for (let i = 0; i < weeksBack; i++) {
        pairs.push({ year: y, week: w });
        w -= 1;
        if (w < 1) {
          y -= 1;
          const maxW = getISOWeeksInYear(new Date(y, 0, 1));
          w = maxW;
        }
      }

      const timeline = pairs
        .map((p) => {
          const key = `${p.year}-${String(p.week).padStart(2, "0")}`;
          const rec = rowsMap.get(key);
          return {
            year: p.year,
            week: p.week,
            weekLabel: `${p.year}-W${String(p.week).padStart(2, "0")}`,
            current: rec?.total_revenue || 0,
            previous: 0,
            labor_costs: rec?.labor_costs || 0,
          };
        })
        .reverse();

      for (let i = 0; i < timeline.length; i++) {
        timeline[i].previous = i < timeline.length - 1 ? timeline[i + 1].current : 0;
      }

      setTimelineData(timeline);

      const newest = timeline[timeline.length - 1] || {
        current: 0,
        year: latestYear,
        week: latestWeek,
        labor_costs: 0,
      };
      const prevRec = timeline[timeline.length - 2] || {
        current: 0,
        year: latestYear,
        week: latestWeek - 1,
        labor_costs: 0,
      };

      setThisWeekSales(newest.current || 0);
      setLastWeekSales(prevRec.current || 0);
      setWeeklyLabor(newest.labor_costs || 0);
      setPreviousWeekLabor(prevRec.labor_costs || 0);

      const keyLY = `${latestYear - 1}-${String(latestWeek).padStart(2, "0")}`;
      const sameWeekLYVal = rowsMap.get(keyLY)?.total_revenue || 0;
      setSameWeekLastYearSales(sameWeekLYVal);

      // YTD up to latestWeek in latestYear
      let accRevenueYTD = 0;
      let accLaborYTD = 0;
      rowsMap.forEach((val) => {
        if (val.year === latestYear && val.week <= latestWeek) {
          accRevenueYTD += val.total_revenue;
          accLaborYTD += val.labor_costs;
        }
      });
      setRevenueYTD(accRevenueYTD);
      setLaborYTD(accLaborYTD);
      setLaborYTDPercent(accRevenueYTD > 0 ? (accLaborYTD / accRevenueYTD) * 100 : null);

      // comparative points offsets -4..+4 relative latest
      const offsetStart = -4;
      const offsetEnd = 4;
      const points: any[] = [];
      for (let offset = offsetStart; offset <= offsetEnd; offset++) {
        let ny = latestYear;
        let nw = latestWeek + offset;
        while (true) {
          const maxW = getISOWeeksInYear(new Date(ny, 0, 1));
          if (nw < 1) {
            ny -= 1;
            nw += getISOWeeksInYear(new Date(ny, 0, 1));
            continue;
          }
          if (nw > maxW) {
            nw -= maxW;
            ny += 1;
            continue;
          }
          break;
        }
        const keyCur = `${ny}-${String(nw).padStart(2, "0")}`;
        const keyLast = `${ny - 1}-${String(nw).padStart(2, "0")}`;
        points.push({
          weekLabel: `${ny}-W${String(nw).padStart(2, "0")}`,
          current: rowsMap.get(keyCur)?.total_revenue ?? null,
          lastYear: rowsMap.get(keyLast)?.total_revenue ?? null,
        });
      }
      setComparativePoints(points);
    } catch (error) {
      console.error("fetchAllData error (last-week mode)", error);
      toast.error("Ошибка загрузки данных (last-week mode)");
    } finally {
      setLoading(false);
    }
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const salesChange = calcPercentChange(thisWeekSales, lastWeekSales);
  const yoyChange = calcPercentChange(thisWeekSales, sameWeekLastYearSales);
  const laborChange = calcPercentChange(weeklyLabor, previousWeekLabor);

  return (
    <div className="min-h-screen p-6 bg-gray-50">
      <div className="max-w-7xl mx-auto">
        <Header />

        {/* added gap between header and cards */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="p-4 bg-white rounded-xl shadow-sm h-auto">
            <div className="flex justify-between items-start">
              <div>
                <div className="text-xs text-muted-foreground">This Week's Sales</div>
                <div className="text-3xl font-bold mt-2">${thisWeekSales.toLocaleString()}</div>

                <div className="mt-2">
                  <PercentBadge
                    value={salesChange.label}
                    dir={salesChange.dir === "neutral" ? "neutral" : salesChange.dir}
                  />
                </div>

                <div className="text-sm text-muted-foreground mt-3">Prev: ${lastWeekSales.toLocaleString()}</div>
              </div>

              <div>
                <DollarSign className="w-6 h-6" style={{ color: THEME.primaryBlue }} />
              </div>
            </div>
          </div>

          <div className="p-4 bg-white rounded-xl shadow-sm h-auto">
            <div className="flex justify-between items-start">
              <div>
                <div className="text-xs text-muted-foreground">Sales vs Same Week Last Year</div>
                <div className="text-3xl font-bold mt-2">${thisWeekSales.toLocaleString()}</div>

                <div className="mt-2">
                  <PercentBadge value={yoyChange.label} dir={yoyChange.dir === "neutral" ? "neutral" : yoyChange.dir} />
                </div>

                <div className="text-sm text-muted-foreground mt-3">
                  Same week LY: ${sameWeekLastYearSales.toLocaleString()}
                </div>
              </div>

              <div>
                <TrendingUp className="w-6 h-6" style={{ color: THEME.primaryBlue }} />
              </div>
            </div>
          </div>

          <div className="p-4 bg-white rounded-xl shadow-sm h-auto">
            <div className="flex justify-between items-start">
              <div>
                <div className="text-xs text-muted-foreground">Weekly Labor</div>
                <div className="text-3xl font-bold mt-2">${weeklyLabor.toLocaleString()}</div>

                <div className="mt-2">
                  <PercentBadge
                    value={laborChange.label}
                    dir={laborChange.dir === "neutral" ? "neutral" : laborChange.dir}
                  />
                </div>

                <div className="text-sm text-muted-foreground mt-3">Prev: ${previousWeekLabor.toLocaleString()}</div>
              </div>

              <div>
                <Users className="w-6 h-6" style={{ color: THEME.primaryBlue }} />
              </div>
            </div>
          </div>

          <div className="p-4 bg-white rounded-xl shadow-sm h-auto">
            <div className="flex justify-between items-start">
              <div>
                <div className="text-xs text-muted-foreground">Labor YTD · Actual</div>

                <div className="text-3xl font-bold mt-2">
                  {laborYTDPercent === null ? "—" : `${laborYTDPercent.toFixed(1)}%`}
                </div>
              </div>

              <div>
                <Briefcase className="w-6 h-6" style={{ color: THEME.primaryBlue }} />
              </div>
            </div>
          </div>
        </div>

        {/* Top charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Внешняя обёртка теперь адаптивна; внутренний компонент сам задаёт высоту графика */}
          <div className="h-auto">
            <SalesTimeline data={timelineData} title="Sales: This Week vs Previous Weeks" cardHeight={CARD_HEIGHT} />
          </div>

          <div className="h-auto">
            <HistoricComparisonChart
              points={comparativePoints}
              cardHeight={CARD_HEIGHT}
              title="Last 5 weeks vs Last year's 9 weeks"
            />
          </div>
        </div>

        {/* CategoryComparison (chart with WoW/LY/Custom toggle) */}
        <div className="grid grid-cols-1 gap-6 mb-6">
          <div className="h-auto">
            <CategoryComparison participantNumber={participantNumber} initialMode="WoW" topN={12} />
          </div>
        </div>

        {/* Combined category table with filters & sorting */}
        <div className="grid grid-cols-1 gap-6 mb-6">
          <CombinedCategoryTable participantNumber={participantNumber} />
        </div>
      </div>
    </div>
  );
}
