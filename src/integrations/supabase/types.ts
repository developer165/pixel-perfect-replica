export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      data: {
        Row: {
          Category: string | null
          city: string | null
          high_temp: string | null
          inventory: string | null
          keyword_reason_revenue: string | null
          labor: string | null
          low_temp: string | null
          Margin: string | null
          name: string | null
          number: string | null
          r_or_rg: string | null
          reason_revenue: string | null
          region: string | null
          rev_week_last_year: string | null
          rev_ytd_last_year: string | null
          rev_ytd_this_year: string | null
          Revenue: string | null
          sales_group: string | null
          status: string | null
          total_items: string | null
          trans_week_last_year: string | null
          trans_week_this_year: string | null
          trans_ytd_last_year: string | null
          trans_ytd_this_year: string | null
          weather_description: string | null
          week_begin_current: string | null
          week_begin_last: string | null
          week_end_current: string | null
          week_end_last: string | null
          week_no_current: number | null
          week_no_last: number | null
          week_total_margin: string | null
        }
        Insert: {
          Category?: string | null
          city?: string | null
          high_temp?: string | null
          inventory?: string | null
          keyword_reason_revenue?: string | null
          labor?: string | null
          low_temp?: string | null
          Margin?: string | null
          name?: string | null
          number?: string | null
          r_or_rg?: string | null
          reason_revenue?: string | null
          region?: string | null
          rev_week_last_year?: string | null
          rev_ytd_last_year?: string | null
          rev_ytd_this_year?: string | null
          Revenue?: string | null
          sales_group?: string | null
          status?: string | null
          total_items?: string | null
          trans_week_last_year?: string | null
          trans_week_this_year?: string | null
          trans_ytd_last_year?: string | null
          trans_ytd_this_year?: string | null
          weather_description?: string | null
          week_begin_current?: string | null
          week_begin_last?: string | null
          week_end_current?: string | null
          week_end_last?: string | null
          week_no_current?: number | null
          week_no_last?: number | null
          week_total_margin?: string | null
        }
        Update: {
          Category?: string | null
          city?: string | null
          high_temp?: string | null
          inventory?: string | null
          keyword_reason_revenue?: string | null
          labor?: string | null
          low_temp?: string | null
          Margin?: string | null
          name?: string | null
          number?: string | null
          r_or_rg?: string | null
          reason_revenue?: string | null
          region?: string | null
          rev_week_last_year?: string | null
          rev_ytd_last_year?: string | null
          rev_ytd_this_year?: string | null
          Revenue?: string | null
          sales_group?: string | null
          status?: string | null
          total_items?: string | null
          trans_week_last_year?: string | null
          trans_week_this_year?: string | null
          trans_ytd_last_year?: string | null
          trans_ytd_this_year?: string | null
          weather_description?: string | null
          week_begin_current?: string | null
          week_begin_last?: string | null
          week_end_current?: string | null
          week_end_last?: string | null
          week_no_current?: number | null
          week_no_last?: number | null
          week_total_margin?: string | null
        }
        Relationships: []
      }
      data_v1: {
        Row: {
          Category: string | null
          city: string | null
          high_temp: string | null
          inventory: string | null
          keyword_reason_revenue: string | null
          labor: string | null
          low_temp: string | null
          Margin: string | null
          name: string | null
          number: string | null
          r_or_rg: string | null
          reason_revenue: string | null
          region: string | null
          rev_week_last_year: string | null
          rev_ytd_last_year: string | null
          rev_ytd_this_year: string | null
          Revenue: string | null
          sales_group: string | null
          status: string | null
          total_items: string | null
          trans_week_last_year: string | null
          trans_week_this_year: string | null
          trans_ytd_last_year: string | null
          trans_ytd_this_year: string | null
          weather_description: string | null
          week_begin_current: string | null
          week_begin_last: string | null
          week_end_current: string | null
          Week_end_last: string | null
          Week_no_current: number | null
          week_no_last: number | null
          week_total_margin: string | null
        }
        Insert: {
          Category?: string | null
          city?: string | null
          high_temp?: string | null
          inventory?: string | null
          keyword_reason_revenue?: string | null
          labor?: string | null
          low_temp?: string | null
          Margin?: string | null
          name?: string | null
          number?: string | null
          r_or_rg?: string | null
          reason_revenue?: string | null
          region?: string | null
          rev_week_last_year?: string | null
          rev_ytd_last_year?: string | null
          rev_ytd_this_year?: string | null
          Revenue?: string | null
          sales_group?: string | null
          status?: string | null
          total_items?: string | null
          trans_week_last_year?: string | null
          trans_week_this_year?: string | null
          trans_ytd_last_year?: string | null
          trans_ytd_this_year?: string | null
          weather_description?: string | null
          week_begin_current?: string | null
          week_begin_last?: string | null
          week_end_current?: string | null
          Week_end_last?: string | null
          Week_no_current?: number | null
          week_no_last?: number | null
          week_total_margin?: string | null
        }
        Update: {
          Category?: string | null
          city?: string | null
          high_temp?: string | null
          inventory?: string | null
          keyword_reason_revenue?: string | null
          labor?: string | null
          low_temp?: string | null
          Margin?: string | null
          name?: string | null
          number?: string | null
          r_or_rg?: string | null
          reason_revenue?: string | null
          region?: string | null
          rev_week_last_year?: string | null
          rev_ytd_last_year?: string | null
          rev_ytd_this_year?: string | null
          Revenue?: string | null
          sales_group?: string | null
          status?: string | null
          total_items?: string | null
          trans_week_last_year?: string | null
          trans_week_this_year?: string | null
          trans_ytd_last_year?: string | null
          trans_ytd_this_year?: string | null
          weather_description?: string | null
          week_begin_current?: string | null
          week_begin_last?: string | null
          week_end_current?: string | null
          Week_end_last?: string | null
          Week_no_current?: number | null
          week_no_last?: number | null
          week_total_margin?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          company: string | null
          created_at: string | null
          id: string
          name: string | null
          participant_number: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          company?: string | null
          created_at?: string | null
          id?: string
          name?: string | null
          participant_number?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          company?: string | null
          created_at?: string | null
          id?: string
          name?: string | null
          participant_number?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      weekly_reports: {
        Row: {
          category: string | null
          city: string | null
          created_at: string
          first_income_reason: string | null
          high_temperature: number | null
          id: number
          labor_costs: number | null
          low_temperature: number | null
          margin: number | null
          name: string | null
          num_transactions: number | null
          number: string | null
          r_or_rg: string | null
          region: string | null
          retail_inventory: number | null
          rev_week_last_year: number | null
          rev_ytd_last_year: number | null
          rev_ytd_this_year: number | null
          sales_group: string | null
          second_income_reason: string | null
          status: string | null
          total_quantity: number | null
          total_revenue: number | null
          trans_ytd_last_year: number | null
          trans_ytd_this_year: number | null
          user_id: string | null
          weather_description: string | null
          weather_estimate: number | null
          week_begin_last: string | null
          week_end: string | null
          week_end_last: string | null
          week_no_last: number | null
          week_number: number | null
          week_start: string | null
          week_total_margin: number | null
          year: number | null
        }
        Insert: {
          category?: string | null
          city?: string | null
          created_at?: string
          first_income_reason?: string | null
          high_temperature?: number | null
          id?: number
          labor_costs?: number | null
          low_temperature?: number | null
          margin?: number | null
          name?: string | null
          num_transactions?: number | null
          number?: string | null
          r_or_rg?: string | null
          region?: string | null
          retail_inventory?: number | null
          rev_week_last_year?: number | null
          rev_ytd_last_year?: number | null
          rev_ytd_this_year?: number | null
          sales_group?: string | null
          second_income_reason?: string | null
          status?: string | null
          total_quantity?: number | null
          total_revenue?: number | null
          trans_ytd_last_year?: number | null
          trans_ytd_this_year?: number | null
          user_id?: string | null
          weather_description?: string | null
          weather_estimate?: number | null
          week_begin_last?: string | null
          week_end?: string | null
          week_end_last?: string | null
          week_no_last?: number | null
          week_number?: number | null
          week_start?: string | null
          week_total_margin?: number | null
          year?: number | null
        }
        Update: {
          category?: string | null
          city?: string | null
          created_at?: string
          first_income_reason?: string | null
          high_temperature?: number | null
          id?: number
          labor_costs?: number | null
          low_temperature?: number | null
          margin?: number | null
          name?: string | null
          num_transactions?: number | null
          number?: string | null
          r_or_rg?: string | null
          region?: string | null
          retail_inventory?: number | null
          rev_week_last_year?: number | null
          rev_ytd_last_year?: number | null
          rev_ytd_this_year?: number | null
          sales_group?: string | null
          second_income_reason?: string | null
          status?: string | null
          total_quantity?: number | null
          total_revenue?: number | null
          trans_ytd_last_year?: number | null
          trans_ytd_this_year?: number | null
          user_id?: string | null
          weather_description?: string | null
          weather_estimate?: number | null
          week_begin_last?: string | null
          week_end?: string | null
          week_end_last?: string | null
          week_no_last?: number | null
          week_number?: number | null
          week_start?: string | null
          week_total_margin?: number | null
          year?: number | null
        }
        Relationships: []
      }
    }
    Views: {
      distinct_companies: {
        Row: {
          company: string | null
        }
        Relationships: []
      }
      distinct_regions: {
        Row: {
          region: string | null
        }
        Relationships: []
      }
      weekly_reports_summary: {
        Row: {
          labor_costs_sum: number | null
          number: string | null
          rows_count: number | null
          total_revenue_sum: number | null
          week_number: number | null
          year: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      get_benchmark_weekly_metrics: {
        Args: { p_companies?: string[]; p_regions?: string[] }
        Returns: {
          avg_sale: number
          avg_sale_last_year: number
          num_transactions: number
          rev_week_last_year: number
          total_revenue: number
          trans_week_last_year: number
          week_number: number
          year: number
        }[]
      }
      get_benchmark_weekly_metrics_v2: {
        Args: { p_companies?: string[]; p_regions?: string[] }
        Returns: {
          avg_sale: number
          avg_sale_last_year: number
          num_transactions: number
          rev_week_last_year: number
          total_revenue: number
          trans_week_last_year: number
          week_number: number
          year: number
        }[]
      }
      get_distinct_companies: {
        Args: never
        Returns: {
          company_name: string
        }[]
      }
      get_distinct_companies_regions: {
        Args: never
        Returns: {
          name: string
          name_only: string
          number: string
          region: string
        }[]
      }
      get_distinct_regions: {
        Args: never
        Returns: {
          region: string
        }[]
      }
      get_weekly_for_last_n_years: {
        Args: { n_years?: number; participant_number: string }
        Returns: {
          labor_costs: number
          total_revenue: number
          week_label: string
          week_number: number
          year: number
        }[]
      }
      get_weekly_report_meta: {
        Args: never
        Returns: {
          name: string
          number: string
          region: string
        }[]
      }
      get_weekly_sum: {
        Args: { participant_number: string; wk: number; yr: number }
        Returns: {
          labor_costs: number
          total_revenue: number
        }[]
      }
      get_weekly_timeline: {
        Args: { participant_number: string; weeks_back?: number }
        Returns: {
          labor_costs: number
          total_revenue: number
          week_label: string
          week_number: number
          year: number
        }[]
      }
      get_ytd_sums: {
        Args: { participant_number: string; upto_week: number; yr: number }
        Returns: {
          labor_ytd: number
          revenue_ytd: number
        }[]
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
