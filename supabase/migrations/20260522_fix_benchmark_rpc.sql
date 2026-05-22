-- Fix get_benchmark_weekly_metrics_v2:
-- rev_week_last_year and num_transactions are company-level totals
-- repeated across all category rows. Deduplicate with MAX per (year, week_number, number)
-- before summing across companies.
-- Also add indexes to prevent query timeouts.

CREATE INDEX IF NOT EXISTS idx_wr_year_week ON public.weekly_reports (year, week_number);
CREATE INDEX IF NOT EXISTS idx_wr_number ON public.weekly_reports (number);
CREATE INDEX IF NOT EXISTS idx_wr_region ON public.weekly_reports (region);

CREATE OR REPLACE FUNCTION public.get_benchmark_weekly_metrics_v2(
  p_regions  text[] DEFAULT NULL,
  p_companies text[] DEFAULT NULL
)
RETURNS TABLE(
  year                 numeric,
  week_number          numeric,
  total_revenue        numeric,
  rev_week_last_year   numeric,
  num_transactions     numeric,
  trans_week_last_year numeric,
  avg_sale             numeric,
  avg_sale_last_year   numeric
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
  /*
   * Step 1: per company-week, SUM per-category total_revenue
   *         and take MAX of company-level repeated fields
   *         (rev_week_last_year and num_transactions repeat identically
   *          across every category row for a given company-week).
   * Step 2: aggregate across all companies per year-week.
   */
  SELECT
    sub.year::numeric,
    sub.week_number::numeric,
    SUM(sub.co_ty_rev)                                           AS total_revenue,
    SUM(sub.co_ly_rev)                                           AS rev_week_last_year,
    SUM(sub.co_ty_trans)                                         AS num_transactions,
    NULL::numeric                                                AS trans_week_last_year,
    CASE WHEN SUM(sub.co_ty_trans) > 0
         THEN SUM(sub.co_ty_rev) / SUM(sub.co_ty_trans)
         ELSE NULL END                                           AS avg_sale,
    CASE WHEN SUM(sub.co_ly_rev) > 0
         THEN SUM(sub.co_ly_rev) / NULLIF(SUM(sub.co_ty_trans_prev), 0)
         ELSE NULL END                                           AS avg_sale_last_year
  FROM (
    SELECT
      wr.year,
      wr.week_number,
      wr.number,
      SUM(wr.total_revenue)            AS co_ty_rev,
      MAX(wr.rev_week_last_year)       AS co_ly_rev,
      MAX(wr.num_transactions)         AS co_ty_trans,
      MAX(wr.num_transactions)         AS co_ty_trans_prev   -- placeholder; no week-level LY trans column
    FROM public.weekly_reports wr
    WHERE
      (p_regions   IS NULL OR wr.region = ANY(p_regions))
      AND (p_companies IS NULL OR wr.number = ANY(p_companies))
    GROUP BY wr.year, wr.week_number, wr.number
  ) sub
  GROUP BY sub.year, sub.week_number
  ORDER BY sub.year, sub.week_number
$$;

-- Fix distinct_companies view: pull from weekly_reports (not profiles which is empty)
CREATE OR REPLACE VIEW public.distinct_companies AS
SELECT DISTINCT number AS company
FROM public.weekly_reports
WHERE number IS NOT NULL;

GRANT SELECT ON public.distinct_companies TO authenticated, anon;
GRANT SELECT ON public.distinct_regions TO authenticated, anon;
