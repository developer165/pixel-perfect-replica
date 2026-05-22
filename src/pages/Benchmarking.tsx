// src/pages/RegionalBenchmarking.tsx
import React, { useEffect, useMemo, useState } from "react";
import { Header } from "@/components/dashboard/Header";
import { Loader2 } from "lucide-react";
import { ResponsiveContainer, ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

/** Extract the company NUMBER from "Name — NUMBER" display string */
function extractNumber(displayName: string): string {
  const m = displayName.match(/—\s*(\S+)\s*$/u);
  return m ? m[1] : displayName.trim();
}

type RpcRow = {
  year: number;
  week_number: number;
  total_revenue: number | null;
  rev_week_last_year: number | null;
  num_transactions: number | null;
  trans_week_last_year: number | null;
  avg_sale: number | null;
  avg_sale_last_year: number | null;
};

/** Custom legend: white background, rounded, friendly labels */
const CustomLegend: React.FC<any> = (props) => {
  const { payload } = props;
  if (!payload || !Array.isArray(payload)) return null;

  const labelFor = (value: string) => {
    switch (value) {
      case "rev_week_last_year":
        return "Revenue LY";
      case "total_revenue":
        return "Revenue TY";
      case "trans_week_last_year":
        return "Transactions LY";
      case "num_transactions":
        return "Transactions TY";
      case "avg_sale_last_year":
        return "Avg Sale LY";
      case "avg_sale":
        return "Avg Sale TY";
      default:
        // fallback: beautify key
        return value.replace(/_/g, " ");
    }
  };

  return (
    <div
      style={{
        background: "white",
        padding: "8px 12px",
        borderRadius: 10,
        boxShadow: "0 2px 8px rgba(16,24,40,0.08)",
        display: "inline-flex",
        gap: 18,
        alignItems: "center",
      }}
    >
      {payload.map((entry: any, i: number) => (
        <div key={i} style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span
            style={{
              width: 12,
              height: 12,
              borderRadius: 3,
              background: entry.color || "#ccc",
              display: "inline-block",
              boxShadow: "inset 0 0 0 1px rgba(0,0,0,0.06)",
            }}
          />
          <span style={{ color: "#111827", fontSize: 13 }}>{labelFor(entry.value)}</span>
        </div>
      ))}
    </div>
  );
};

export default function RegionalBenchmarking() {
  const [loadingMeta, setLoadingMeta] = useState(true);
  const [loadingData, setLoadingData] = useState(false);
  const [regions, setRegions] = useState<string[]>([]);
  const [companies, setCompanies] = useState<string[]>([]);
  const [selectedRegions, setSelectedRegions] = useState<string[]>([]);
  const [selectedCompanies, setSelectedCompanies] = useState<string[]>([]);
  const [rows, setRows] = useState<RpcRow[]>([]);
  const [error, setError] = useState<string | null>(null);

  const [openRegions, setOpenRegions] = useState(false);
  const [openCompanies, setOpenCompanies] = useState(false);

  // show last 52 weeks on chart by default
  const limitWeeks = true;

  useEffect(() => {
    (async () => {
      setLoadingMeta(true);
      try {
        // Load distinct regions from view
        const { data: regionViewRows } = await (supabase as any).from("distinct_regions").select("region");

        let uniqRegions: string[] = [];
        if (regionViewRows && Array.isArray(regionViewRows) && regionViewRows.length > 0) {
          uniqRegions = Array.from(
            new Set((regionViewRows || []).map((r: any) => ((r.region ?? "") as string).toString().trim())),
          ).filter(Boolean) as string[];
          uniqRegions.sort((a, b) => a.localeCompare(b));
        }

        // Load distinct company numbers from weekly_reports (distinct_companies view reads
        // from profiles which may be empty, so query the source table directly)
        const { data: companyRows } = await (supabase as any)
          .from("weekly_reports")
          .select("number, name")
          .not("number", "is", null)
          .order("number")
          .limit(1000);

        let displayNames: string[] = [];
        if (companyRows && Array.isArray(companyRows) && companyRows.length > 0) {
          const seen = new Set<string>();
          companyRows.forEach((r: any) => {
            const num = (r.number ?? "").toString().trim();
            if (num && !seen.has(num)) {
              seen.add(num);
              // store as "Name — NUMBER" so we can show the name but filter by number
              const displayName = r.name ? `${r.name} — ${num}` : num;
              displayNames.push(displayName);
            }
          });
          displayNames.sort((a, b) => a.localeCompare(b));
        }

        setRegions(uniqRegions);
        setCompanies(displayNames);
        setSelectedRegions(uniqRegions.slice());
        setSelectedCompanies(displayNames.slice());
        setError(null);
      } catch (e: any) {
        console.error("meta load err", e);
        setError("Failed to load company/region lists");
      } finally {
        setLoadingMeta(false);
      }
    })();
  }, []);

  const buildRpcParams = () => {
    // Companies are stored as "Name — NUMBER"; extract the NUMBER part for the RPC filter
    const cleanSelectedNumbers = selectedCompanies
      .map((c) => extractNumber((c || "").toString()))
      .filter(Boolean);
    const cleanSelectedRegions = selectedRegions.map((r) => (r || "").toString().trim()).filter(Boolean);

    const allRegionsSelected = cleanSelectedRegions.length === 0 || cleanSelectedRegions.length === regions.length;
    const allCompaniesSelected = cleanSelectedNumbers.length === 0 || cleanSelectedNumbers.length === companies.length;

    return {
      p_regions: allRegionsSelected ? null : cleanSelectedRegions,
      p_companies: allCompaniesSelected ? null : cleanSelectedNumbers,
    };
  };

  const fetchData = async () => {
    setLoadingData(true);
    setError(null);
    try {
      const { p_regions, p_companies } = buildRpcParams();

      // Use the v1 RPC which is fast and returns data for the two most recent years.
      // The rev_week_last_year column in the raw table is a company-level total repeated
      // across every category row, so summing it inflates LY ~20x. Instead we build the
      // correct LY by matching same week_number from the previous year's total_revenue.
      const { data, error: rpcErr } = await supabase.rpc("get_benchmark_weekly_metrics", {
        p_regions,
        p_companies,
      } as any);

      if (rpcErr) {
        console.error("rpc error", rpcErr);
        throw rpcErr;
      }

      const allRows = (data || []).map((r: any) => ({
        year: Number(r.year),
        week_number: Number(r.week_number),
        total_revenue: r.total_revenue === null ? null : Number(r.total_revenue),
        num_transactions: r.num_transactions === null ? null : Number(r.num_transactions),
        avg_sale: r.avg_sale === null ? null : Number(r.avg_sale),
      }));

      allRows.sort((a: any, b: any) => a.year - b.year || a.week_number - b.week_number);

      // Find the most recent year with data
      const years = [...new Set(allRows.map((r: any) => r.year))].sort((a, b) => a - b);
      const maxYear = years[years.length - 1] ?? new Date().getFullYear();
      const prevYear = maxYear - 1;

      // Build lookup for prev year so we can use actual prev-year revenue as LY
      const prevYearByWeek = new Map<number, any>();
      allRows.forEach((r: any) => {
        if (r.year === prevYear) prevYearByWeek.set(r.week_number, r);
      });

      // Current-year rows enriched with correct LY values from previous year
      const currentRows = allRows
        .filter((r: any) => r.year === maxYear)
        .map((r: any) => {
          const ly = prevYearByWeek.get(r.week_number);
          return {
            year: r.year,
            week_number: r.week_number,
            total_revenue: r.total_revenue,
            rev_week_last_year: ly ? ly.total_revenue : null,
            num_transactions: r.num_transactions,
            trans_week_last_year: ly ? ly.num_transactions : null,
            avg_sale: r.avg_sale,
            avg_sale_last_year: ly ? ly.avg_sale : null,
          } as RpcRow;
        });

      currentRows.sort((a, b) => a.year - b.year || a.week_number - b.week_number);

      if (limitWeeks && currentRows.length > 52) {
        setRows(currentRows.slice(-52));
      } else {
        setRows(currentRows);
      }
    } catch (e: any) {
      console.error("rpc err", e);
      setError("Failed to load metrics");
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    if (!loadingMeta) fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadingMeta]);

  const chartSeries = useMemo(() => {
    if (!rows || rows.length === 0) return [];
    return rows.map((r) => ({
      weekLabel: `${r.year}-W${String(r.week_number).padStart(2, "0")}`,
      total_revenue: r.total_revenue ?? 0,
      rev_week_last_year: r.rev_week_last_year ?? 0,
      num_transactions: r.num_transactions ?? 0,
      trans_week_last_year: r.trans_week_last_year ?? 0,
      avg_sale: r.avg_sale ?? 0,
      avg_sale_last_year: r.avg_sale_last_year ?? 0,
    }));
  }, [rows]);

  const toggleRegion = (region: string) => {
    setSelectedRegions((prev) => (prev.includes(region) ? prev.filter((r) => r !== region) : [...prev, region]));
  };
  const toggleCompany = (company: string) => {
    setSelectedCompanies((prev) => (prev.includes(company) ? prev.filter((c) => c !== company) : [...prev, company]));
  };

  const selectAllRegions = () => setSelectedRegions(regions.slice());
  const clearAllRegions = () => setSelectedRegions([]);
  const selectAllCompanies = () => setSelectedCompanies(companies.slice());
  const clearAllCompanies = () => setSelectedCompanies([]);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-display font-bold text-foreground">Regional Benchmarking</h1>
          <p className="text-muted-foreground mt-1">Compare revenue, transactions and average sale vs last year</p>
        </div>

        <div className="rounded-xl bg-white p-6 mb-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-start">
            {/* Regions drop */}
            <div className="relative">
              <label className="block text-sm font-medium mb-2">Regions</label>
              <button
                onClick={() => setOpenRegions((s) => !s)}
                className="w-full text-left border rounded px-4 py-2 bg-white flex justify-between items-center"
              >
                <span>
                  Regions:{" "}
                  {selectedRegions.length === 0 || selectedRegions.length === regions.length
                    ? "all"
                    : `${selectedRegions.length}`}
                </span>
                <span>▾</span>
              </button>
              {openRegions && (
                <div className="absolute z-40 mt-2 w-full bg-white border rounded shadow p-3 max-h-64 overflow-auto">
                  <div className="flex justify-between items-center mb-2 gap-2">
                    <input
                      placeholder="Search regions"
                      aria-label="Search regions"
                      className="border rounded px-2 py-1 text-sm w-56"
                      onChange={(e) => {
                        (document.querySelectorAll(".region-row") || []).forEach((el: any) => {
                          const txt = (el.getAttribute("data-name") || "").toLowerCase();
                          el.style.display = txt.includes(e.target.value.toLowerCase()) ? "block" : "none";
                        });
                      }}
                    />

                    <div className="flex items-center gap-2 ml-2">
                      <Button size="sm" onClick={selectAllRegions} className="px-2 py-1">
                        Select all
                      </Button>
                      <Button variant="outline" size="sm" onClick={clearAllRegions} className="px-2 py-1">
                        Clear all
                      </Button>
                    </div>
                  </div>

                  <div className="text-xs text-muted-foreground mb-2">Check/uncheck boxes to filter</div>
                  {regions.map((r) => (
                    <label
                      key={r}
                      className="region-row flex items-center gap-2 p-2 rounded hover:bg-gray-50"
                      data-name={r}
                    >
                      <input type="checkbox" checked={selectedRegions.includes(r)} onChange={() => toggleRegion(r)} />
                      <span className="ml-2">{r}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>

            {/* Companies drop */}
            <div className="relative">
              <label className="block text-sm font-medium mb-2">Companies</label>
              <button
                onClick={() => setOpenCompanies((s) => !s)}
                className="w-full text-left border rounded px-4 py-2 bg-white flex justify-between items-center"
              >
                <span>
                  Companies:{" "}
                  {selectedCompanies.length === 0 || selectedCompanies.length === companies.length
                    ? "all"
                    : `${selectedCompanies.length}`}
                </span>
                <span>▾</span>
              </button>
              {openCompanies && (
                <div className="absolute z-40 mt-2 w-full bg-white border rounded shadow p-3 max-h-64 overflow-auto">
                  <div className="flex justify-between items-center mb-2 gap-2">
                    <input
                      placeholder="Search companies"
                      aria-label="Search companies"
                      className="border rounded px-2 py-1 text-sm w-56"
                      onChange={(e) => {
                        (document.querySelectorAll(".company-row") || []).forEach((el: any) => {
                          const txt = (el.getAttribute("data-name") || "").toLowerCase();
                          el.style.display = txt.includes(e.target.value.toLowerCase()) ? "block" : "none";
                        });
                      }}
                    />

                    <div className="flex items-center gap-2 ml-2">
                      <Button size="sm" onClick={selectAllCompanies} className="px-2 py-1">
                        Select all
                      </Button>
                      <Button variant="outline" size="sm" onClick={clearAllCompanies} className="px-2 py-1">
                        Clear all
                      </Button>
                    </div>
                  </div>

                  <div className="text-xs text-muted-foreground mb-2">Check/uncheck boxes to filter</div>
                  {companies.map((c) => (
                    <label
                      key={c}
                      className="company-row flex items-center gap-2 p-2 rounded hover:bg-gray-50"
                      data-name={c}
                    >
                      <input
                        type="checkbox"
                        checked={selectedCompanies.includes(c)}
                        onChange={() => toggleCompany(c)}
                      />
                      <span className="ml-2">{c}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>

            {/* Buttons */}
            <div className="flex flex-col gap-3">
              <Button
                onClick={() => {
                  fetchData();
                  setOpenCompanies(false);
                  setOpenRegions(false);
                }}
                className="w-full"
              >
                Apply filters
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setSelectedCompanies(companies.slice());
                  setSelectedRegions(regions.slice());
                  fetchData();
                }}
                className="w-full"
              >
                Reset
              </Button>
            </div>
          </div>
        </div>

        {loadingMeta ? (
          <div className="p-6 bg-white rounded-xl shadow-sm">
            <div className="flex items-center justify-center py-20">
              <Loader2 className="animate-spin h-8 w-8" />
            </div>
          </div>
        ) : null}
        {error ? <div className="p-4 mb-4 rounded-lg bg-red-50 text-red-700">{error}</div> : null}

        {/* charts area */}
        <section className="mb-6">
          <div className="rounded-xl p-6" style={{ background: "#e8f9eb" }}>
            <h3 className="text-lg font-semibold mb-4">Revenue Compared to Last Year</h3>
            <div style={{ width: "100%", height: 360 }}>
              {loadingData ? (
                <div className="flex items-center justify-center h-full">
                  <Loader2 className="animate-spin h-8 w-8" />
                </div>
              ) : (
                <ResponsiveContainer>
                  <ComposedChart data={chartSeries}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="weekLabel" />
                    <YAxis
                      tickFormatter={(v: number) =>
                        v >= 1_000_000 ? (v / 1_000_000).toFixed(1) + "M" : v.toLocaleString()
                      }
                    />
                    <Tooltip formatter={(v: any) => (typeof v === "number" ? `$${v.toLocaleString()}` : v)} />
                    <Legend content={<CustomLegend />} />
                    <Bar dataKey="rev_week_last_year" name="rev_week_last_year" barSize={18} fill="#cfe9d1" />
                    <Line dataKey="total_revenue" name="total_revenue" stroke="#157a2f" strokeWidth={2} dot />
                  </ComposedChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </section>

        <section className="mb-6">
          <div className="rounded-xl p-6" style={{ background: "#fff4db" }}>
            <h3 className="text-lg font-semibold mb-4">Transaction Counts Compared to Last Year</h3>
            <div style={{ width: "100%", height: 320 }}>
              <ResponsiveContainer>
                <ComposedChart data={chartSeries}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="weekLabel" />
                  <YAxis
                    tickFormatter={(v: number) => (v >= 1000 ? (v / 1000).toFixed(0) + "K" : v.toLocaleString())}
                  />
                  <Tooltip formatter={(v: any) => (typeof v === "number" ? v.toLocaleString() : v)} />
                  <Legend content={<CustomLegend />} />
                  <Bar dataKey="trans_week_last_year" name="trans_week_last_year" barSize={18} fill="#f8e0a7" />
                  <Line dataKey="num_transactions" name="num_transactions" stroke="#d97706" strokeWidth={2} dot />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>
        </section>

        <section className="mb-6">
          <div className="rounded-xl p-6" style={{ background: "#fbe2eb" }}>
            <h3 className="text-lg font-semibold mb-4">Average Sale Compared to Last Year</h3>
            <div style={{ width: "100%", height: 320 }}>
              <ResponsiveContainer>
                <ComposedChart data={chartSeries}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="weekLabel" />
                  <YAxis />
                  <Tooltip formatter={(v: any) => (typeof v === "number" ? `$${v.toFixed(2)}` : v)} />
                  <Legend content={<CustomLegend />} />
                  <Bar dataKey="avg_sale_last_year" name="avg_sale_last_year" barSize={18} fill="#f7cfd9" />
                  <Line dataKey="avg_sale" name="avg_sale" stroke="#9b2c6a" strokeWidth={2} dot />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
