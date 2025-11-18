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
      admin_ui_settings: {
        Row: {
          category: string
          created_at: string | null
          id: string
          key: string
          updated_at: string | null
          updated_by: string | null
          value: Json
        }
        Insert: {
          category: string
          created_at?: string | null
          id?: string
          key: string
          updated_at?: string | null
          updated_by?: string | null
          value: Json
        }
        Update: {
          category?: string
          created_at?: string | null
          id?: string
          key?: string
          updated_at?: string | null
          updated_by?: string | null
          value?: Json
        }
        Relationships: []
      }
      country_pricing: {
        Row: {
          allowed_payment_methods: string[]
          country_code: string
          country_name: string
          created_at: string | null
          currency: string
          id: string
          investor_fee: number
          region: string
          student_fee: number
          updated_at: string | null
        }
        Insert: {
          allowed_payment_methods: string[]
          country_code: string
          country_name: string
          created_at?: string | null
          currency: string
          id?: string
          investor_fee: number
          region: string
          student_fee: number
          updated_at?: string | null
        }
        Update: {
          allowed_payment_methods?: string[]
          country_code?: string
          country_name?: string
          created_at?: string | null
          currency?: string
          id?: string
          investor_fee?: number
          region?: string
          student_fee?: number
          updated_at?: string | null
        }
        Relationships: []
      }
      courses: {
        Row: {
          created_at: string | null
          description: string | null
          difficulty: Database["public"]["Enums"]["lesson_difficulty"] | null
          id: string
          order_index: number | null
          thumbnail_url: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          difficulty?: Database["public"]["Enums"]["lesson_difficulty"] | null
          id?: string
          order_index?: number | null
          thumbnail_url?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          difficulty?: Database["public"]["Enums"]["lesson_difficulty"] | null
          id?: string
          order_index?: number | null
          thumbnail_url?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      feature_flags: {
        Row: {
          cohort_filter: Json | null
          created_at: string | null
          description: string | null
          id: string
          is_enabled: boolean | null
          key: string
          name: string
          updated_at: string | null
        }
        Insert: {
          cohort_filter?: Json | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_enabled?: boolean | null
          key: string
          name: string
          updated_at?: string | null
        }
        Update: {
          cohort_filter?: Json | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_enabled?: boolean | null
          key?: string
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      lesson_progress: {
        Row: {
          completed: boolean | null
          completed_at: string | null
          created_at: string | null
          id: string
          last_watched_at: string | null
          lesson_id: string
          progress_percent: number | null
          user_id: string
        }
        Insert: {
          completed?: boolean | null
          completed_at?: string | null
          created_at?: string | null
          id?: string
          last_watched_at?: string | null
          lesson_id: string
          progress_percent?: number | null
          user_id: string
        }
        Update: {
          completed?: boolean | null
          completed_at?: string | null
          created_at?: string | null
          id?: string
          last_watched_at?: string | null
          lesson_id?: string
          progress_percent?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lesson_progress_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      lessons: {
        Row: {
          course_id: string | null
          created_at: string | null
          description: string | null
          duration: number
          id: string
          order_index: number | null
          thumbnail_url: string | null
          title: string
          updated_at: string | null
          video_url: string
          xp_reward: number | null
        }
        Insert: {
          course_id?: string | null
          created_at?: string | null
          description?: string | null
          duration: number
          id?: string
          order_index?: number | null
          thumbnail_url?: string | null
          title: string
          updated_at?: string | null
          video_url: string
          xp_reward?: number | null
        }
        Update: {
          course_id?: string | null
          created_at?: string | null
          description?: string | null
          duration?: number
          id?: string
          order_index?: number | null
          thumbnail_url?: string | null
          title?: string
          updated_at?: string | null
          video_url?: string
          xp_reward?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "lessons_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      missions: {
        Row: {
          coin_reward: number
          created_at: string | null
          description: string | null
          est_minutes: number
          id: string
          is_active: boolean | null
          mission_type: string
          order_index: number | null
          title: string
          updated_at: string | null
          xp_reward: number
        }
        Insert: {
          coin_reward?: number
          created_at?: string | null
          description?: string | null
          est_minutes?: number
          id?: string
          is_active?: boolean | null
          mission_type?: string
          order_index?: number | null
          title: string
          updated_at?: string | null
          xp_reward?: number
        }
        Update: {
          coin_reward?: number
          created_at?: string | null
          description?: string | null
          est_minutes?: number
          id?: string
          is_active?: boolean | null
          mission_type?: string
          order_index?: number | null
          title?: string
          updated_at?: string | null
          xp_reward?: number
        }
        Relationships: []
      }
      ncf_action_logs: {
        Row: {
          action_type: string
          admin_user_id: string
          can_undo: boolean | null
          created_at: string | null
          id: string
          new_value: Json | null
          old_value: Json | null
          record_id: string | null
          table_name: string | null
        }
        Insert: {
          action_type: string
          admin_user_id: string
          can_undo?: boolean | null
          created_at?: string | null
          id?: string
          new_value?: Json | null
          old_value?: Json | null
          record_id?: string | null
          table_name?: string | null
        }
        Update: {
          action_type?: string
          admin_user_id?: string
          can_undo?: boolean | null
          created_at?: string | null
          id?: string
          new_value?: Json | null
          old_value?: Json | null
          record_id?: string | null
          table_name?: string | null
        }
        Relationships: []
      }
      payment_methods: {
        Row: {
          available_regions: string[]
          config: Json | null
          created_at: string | null
          id: string
          is_active: boolean | null
          method_type: string
          name: string
        }
        Insert: {
          available_regions: string[]
          config?: Json | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          method_type: string
          name: string
        }
        Update: {
          available_regions?: string[]
          config?: Json | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          method_type?: string
          name?: string
        }
        Relationships: []
      }
      payment_transactions: {
        Row: {
          amount: number
          completed_at: string | null
          created_at: string | null
          currency: string
          id: string
          metadata: Json | null
          payment_method: string
          payment_proof_verified: boolean | null
          payment_reference: string | null
          screenshot_url: string | null
          status: string | null
          transaction_type: string
          updated_at: string | null
          user_id: string
          verification_notes: string | null
        }
        Insert: {
          amount: number
          completed_at?: string | null
          created_at?: string | null
          currency: string
          id?: string
          metadata?: Json | null
          payment_method: string
          payment_proof_verified?: boolean | null
          payment_reference?: string | null
          screenshot_url?: string | null
          status?: string | null
          transaction_type: string
          updated_at?: string | null
          user_id: string
          verification_notes?: string | null
        }
        Update: {
          amount?: number
          completed_at?: string | null
          created_at?: string | null
          currency?: string
          id?: string
          metadata?: Json | null
          payment_method?: string
          payment_proof_verified?: boolean | null
          payment_reference?: string | null
          screenshot_url?: string | null
          status?: string | null
          transaction_type?: string
          updated_at?: string | null
          user_id?: string
          verification_notes?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payment_transactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      premium_plans: {
        Row: {
          billing_period: string
          created_at: string | null
          features: Json
          id: string
          is_active: boolean | null
          name: string
          order_index: number | null
          price_ngn: number
          price_usd: number
          updated_at: string | null
        }
        Insert: {
          billing_period?: string
          created_at?: string | null
          features?: Json
          id?: string
          is_active?: boolean | null
          name: string
          order_index?: number | null
          price_ngn?: number
          price_usd?: number
          updated_at?: string | null
        }
        Update: {
          billing_period?: string
          created_at?: string | null
          features?: Json
          id?: string
          is_active?: boolean | null
          name?: string
          order_index?: number | null
          price_ngn?: number
          price_usd?: number
          updated_at?: string | null
        }
        Relationships: []
      }
      premium_purchases: {
        Row: {
          amount_paid: number
          created_at: string | null
          currency: string
          expires_at: string | null
          id: string
          is_active: boolean | null
          payment_method: string | null
          payment_reference: string | null
          plan_id: string
          starts_at: string
          user_id: string
        }
        Insert: {
          amount_paid: number
          created_at?: string | null
          currency: string
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          payment_method?: string | null
          payment_reference?: string | null
          plan_id: string
          starts_at?: string
          user_id: string
        }
        Update: {
          amount_paid?: number
          created_at?: string | null
          currency?: string
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          payment_method?: string | null
          payment_reference?: string | null
          plan_id?: string
          starts_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "premium_purchases_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "premium_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          account_tier: string | null
          avatar_url: string | null
          country_code: string | null
          country_name: string | null
          created_at: string | null
          currency_preference: string | null
          current_streak: number | null
          demo_balance: number | null
          detected_region: string | null
          email: string
          full_name: string | null
          id: string
          is_demo_mode: boolean | null
          is_premium: boolean | null
          kyc_completed_at: string | null
          kyc_status: string | null
          last_activity_date: string | null
          longest_streak: number | null
          onboarding_completed: boolean | null
          payment_verified: boolean | null
          registration_payment_id: string | null
          timezone: string | null
          total_xp: number | null
          updated_at: string | null
          user_goal: string | null
        }
        Insert: {
          account_tier?: string | null
          avatar_url?: string | null
          country_code?: string | null
          country_name?: string | null
          created_at?: string | null
          currency_preference?: string | null
          current_streak?: number | null
          demo_balance?: number | null
          detected_region?: string | null
          email: string
          full_name?: string | null
          id: string
          is_demo_mode?: boolean | null
          is_premium?: boolean | null
          kyc_completed_at?: string | null
          kyc_status?: string | null
          last_activity_date?: string | null
          longest_streak?: number | null
          onboarding_completed?: boolean | null
          payment_verified?: boolean | null
          registration_payment_id?: string | null
          timezone?: string | null
          total_xp?: number | null
          updated_at?: string | null
          user_goal?: string | null
        }
        Update: {
          account_tier?: string | null
          avatar_url?: string | null
          country_code?: string | null
          country_name?: string | null
          created_at?: string | null
          currency_preference?: string | null
          current_streak?: number | null
          demo_balance?: number | null
          detected_region?: string | null
          email?: string
          full_name?: string | null
          id?: string
          is_demo_mode?: boolean | null
          is_premium?: boolean | null
          kyc_completed_at?: string | null
          kyc_status?: string | null
          last_activity_date?: string | null
          longest_streak?: number | null
          onboarding_completed?: boolean | null
          payment_verified?: boolean | null
          registration_payment_id?: string | null
          timezone?: string | null
          total_xp?: number | null
          updated_at?: string | null
          user_goal?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_registration_payment_id_fkey"
            columns: ["registration_payment_id"]
            isOneToOne: false
            referencedRelation: "payment_transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      quiz_attempts: {
        Row: {
          created_at: string | null
          id: string
          is_correct: boolean
          quiz_id: string
          selected_answer: number
          time_spent: number | null
          user_id: string
          xp_earned: number | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_correct: boolean
          quiz_id: string
          selected_answer: number
          time_spent?: number | null
          user_id: string
          xp_earned?: number | null
        }
        Update: {
          created_at?: string | null
          id?: string
          is_correct?: boolean
          quiz_id?: string
          selected_answer?: number
          time_spent?: number | null
          user_id?: string
          xp_earned?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "quiz_attempts_quiz_id_fkey"
            columns: ["quiz_id"]
            isOneToOne: false
            referencedRelation: "quizzes"
            referencedColumns: ["id"]
          },
        ]
      }
      quizzes: {
        Row: {
          correct_answer: number
          created_at: string | null
          explanation: string | null
          id: string
          lesson_id: string
          options: Json
          order_index: number | null
          question: string
          xp_reward: number | null
        }
        Insert: {
          correct_answer: number
          created_at?: string | null
          explanation?: string | null
          id?: string
          lesson_id: string
          options: Json
          order_index?: number | null
          question: string
          xp_reward?: number | null
        }
        Update: {
          correct_answer?: number
          created_at?: string | null
          explanation?: string | null
          id?: string
          lesson_id?: string
          options?: Json
          order_index?: number | null
          question?: string
          xp_reward?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "quizzes_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      tokens: {
        Row: {
          created_at: string | null
          decimals: number | null
          icon_url: string | null
          id: string
          is_active: boolean | null
          name: string
          symbol: string
        }
        Insert: {
          created_at?: string | null
          decimals?: number | null
          icon_url?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          symbol: string
        }
        Update: {
          created_at?: string | null
          decimals?: number | null
          icon_url?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          symbol?: string
        }
        Relationships: []
      }
      transactions: {
        Row: {
          amount: number
          created_at: string | null
          description: string | null
          id: string
          reference_id: string | null
          status: string | null
          token_id: string
          transaction_type: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string | null
          description?: string | null
          id?: string
          reference_id?: string | null
          status?: string | null
          token_id: string
          transaction_type: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string | null
          description?: string | null
          id?: string
          reference_id?: string | null
          status?: string | null
          token_id?: string
          transaction_type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "transactions_token_id_fkey"
            columns: ["token_id"]
            isOneToOne: false
            referencedRelation: "tokens"
            referencedColumns: ["id"]
          },
        ]
      }
      user_activities: {
        Row: {
          activity_type: string
          created_at: string | null
          description: string | null
          id: string
          metadata: Json | null
          title: string
          user_id: string
        }
        Insert: {
          activity_type: string
          created_at?: string | null
          description?: string | null
          id?: string
          metadata?: Json | null
          title: string
          user_id: string
        }
        Update: {
          activity_type?: string
          created_at?: string | null
          description?: string | null
          id?: string
          metadata?: Json | null
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      user_layouts: {
        Row: {
          id: string
          layout_json: Json
          updated_at: string | null
          user_id: string
        }
        Insert: {
          id?: string
          layout_json?: Json
          updated_at?: string | null
          user_id: string
        }
        Update: {
          id?: string
          layout_json?: Json
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_missions: {
        Row: {
          completed_at: string | null
          created_at: string | null
          id: string
          mission_id: string
          progress_percent: number | null
          snoozed_until: string | null
          status: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          id?: string
          mission_id: string
          progress_percent?: number | null
          snoozed_until?: string | null
          status?: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          id?: string
          mission_id?: string
          progress_percent?: number | null
          snoozed_until?: string | null
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_missions_mission_id_fkey"
            columns: ["mission_id"]
            isOneToOne: false
            referencedRelation: "missions"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      user_wallets: {
        Row: {
          balance: number
          id: string
          locked_balance: number | null
          token_id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          balance?: number
          id?: string
          locked_balance?: number | null
          token_id: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          balance?: number
          id?: string
          locked_balance?: number | null
          token_id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_wallets_token_id_fkey"
            columns: ["token_id"]
            isOneToOne: false
            referencedRelation: "tokens"
            referencedColumns: ["id"]
          },
        ]
      }
      widgets: {
        Row: {
          category: string
          created_at: string | null
          data_endpoint: string | null
          default_config: Json | null
          description: string | null
          id: string
          is_active: boolean | null
          is_premium: boolean | null
          key: string
          name: string
          order_index: number | null
          refresh_interval: number | null
        }
        Insert: {
          category: string
          created_at?: string | null
          data_endpoint?: string | null
          default_config?: Json | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          is_premium?: boolean | null
          key: string
          name: string
          order_index?: number | null
          refresh_interval?: number | null
        }
        Update: {
          category?: string
          created_at?: string | null
          data_endpoint?: string | null
          default_config?: Json | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          is_premium?: boolean | null
          key?: string
          name?: string
          order_index?: number | null
          refresh_interval?: number | null
        }
        Relationships: []
      }
      withdrawal_requests: {
        Row: {
          admin_notes: string | null
          amount: number
          created_at: string | null
          currency: string
          destination_address: string
          id: string
          processed_at: string | null
          status: string | null
          transaction_id: string | null
          updated_at: string | null
          user_id: string
          withdrawal_method: string
        }
        Insert: {
          admin_notes?: string | null
          amount: number
          created_at?: string | null
          currency: string
          destination_address: string
          id?: string
          processed_at?: string | null
          status?: string | null
          transaction_id?: string | null
          updated_at?: string | null
          user_id: string
          withdrawal_method: string
        }
        Update: {
          admin_notes?: string | null
          amount?: number
          created_at?: string | null
          currency?: string
          destination_address?: string
          id?: string
          processed_at?: string | null
          status?: string | null
          transaction_id?: string | null
          updated_at?: string | null
          user_id?: string
          withdrawal_method?: string
        }
        Relationships: [
          {
            foreignKeyName: "withdrawal_requests_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "payment_transactions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "withdrawal_requests_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      xp_transactions: {
        Row: {
          amount: number
          created_at: string | null
          description: string | null
          id: string
          reference_id: string | null
          source: Database["public"]["Enums"]["xp_source"]
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string | null
          description?: string | null
          id?: string
          reference_id?: string | null
          source: Database["public"]["Enums"]["xp_source"]
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string | null
          description?: string | null
          id?: string
          reference_id?: string | null
          source?: Database["public"]["Enums"]["xp_source"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      award_xp: {
        Args: {
          p_amount: number
          p_description?: string
          p_reference_id?: string
          p_source: Database["public"]["Enums"]["xp_source"]
          p_user_id: string
        }
        Returns: undefined
      }
      complete_mission: {
        Args: { p_mission_id: string; p_user_id: string }
        Returns: Json
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      update_wallet_balance: {
        Args: {
          p_amount: number
          p_description?: string
          p_token_symbol: string
          p_transaction_type: string
          p_user_id: string
        }
        Returns: Json
      }
    }
    Enums: {
      app_role: "admin" | "student"
      lesson_difficulty: "beginner" | "intermediate" | "advanced"
      xp_source:
        | "lesson_completion"
        | "quiz_pass"
        | "streak_bonus"
        | "milestone"
        | "daily_login"
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
    Enums: {
      app_role: ["admin", "student"],
      lesson_difficulty: ["beginner", "intermediate", "advanced"],
      xp_source: [
        "lesson_completion",
        "quiz_pass",
        "streak_bonus",
        "milestone",
        "daily_login",
      ],
    },
  },
} as const
