export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5";
  };
  public: {
    Tables: {
      admin_bracket: {
        Row: {
          away: string | null;
          away_score: number | null;
          home: string | null;
          home_score: number | null;
          id: string;
          kickoff: string | null;
          live: boolean;
          position: number;
          round: string;
          updated_at: string;
          winner: string | null;
        };
        Insert: {
          away?: string | null;
          away_score?: number | null;
          home?: string | null;
          home_score?: number | null;
          id: string;
          kickoff?: string | null;
          live?: boolean;
          position?: number;
          round: string;
          updated_at?: string;
          winner?: string | null;
        };
        Update: {
          away?: string | null;
          away_score?: number | null;
          home?: string | null;
          home_score?: number | null;
          id?: string;
          kickoff?: string | null;
          live?: boolean;
          position?: number;
          round?: string;
          updated_at?: string;
          winner?: string | null;
        };
        Relationships: [];
      };
      admin_broadcasts: {
        Row: {
          body: string;
          created_at: string;
          id: string;
          tag: string;
          title: string;
          tone: string;
        };
        Insert: {
          body: string;
          created_at?: string;
          id?: string;
          tag: string;
          title: string;
          tone?: string;
        };
        Update: {
          body?: string;
          created_at?: string;
          id?: string;
          tag?: string;
          title?: string;
          tone?: string;
        };
        Relationships: [];
      };
      admin_fixtures: {
        Row: {
          away: string;
          day: string;
          home: string;
          id: string;
          kickoff: string;
          position: number;
          updated_at: string;
          venue: string;
        };
        Insert: {
          away: string;
          day: string;
          home: string;
          id?: string;
          kickoff: string;
          position?: number;
          updated_at?: string;
          venue: string;
        };
        Update: {
          away?: string;
          day?: string;
          home?: string;
          id?: string;
          kickoff?: string;
          position?: number;
          updated_at?: string;
          venue?: string;
        };
        Relationships: [];
      };
      admin_standings: {
        Row: {
          d: number;
          ga: number;
          gf: number;
          id: string;
          l: number;
          p: number;
          pts: number;
          team: string;
          updated_at: string;
          w: number;
        };
        Insert: {
          d?: number;
          ga?: number;
          gf?: number;
          id?: string;
          l?: number;
          p?: number;
          pts?: number;
          team: string;
          updated_at?: string;
          w?: number;
        };
        Update: {
          d?: number;
          ga?: number;
          gf?: number;
          id?: string;
          l?: number;
          p?: number;
          pts?: number;
          team?: string;
          updated_at?: string;
          w?: number;
        };
        Relationships: [];
      };
      admin_timeline: {
        Row: {
          created_at: string;
          detail: string | null;
          event_type: string;
          id: string;
          minute: number;
          team: string | null;
          title: string;
        };
        Insert: {
          created_at?: string;
          detail?: string | null;
          event_type: string;
          id?: string;
          minute: number;
          team?: string | null;
          title: string;
        };
        Update: {
          created_at?: string;
          detail?: string | null;
          event_type?: string;
          id?: string;
          minute?: number;
          team?: string | null;
          title?: string;
        };
        Relationships: [];
      };
      leaderboard_scores: {
        Row: {
          best: number;
          correct: number;
          points: number;
          streak: number;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          best?: number;
          correct?: number;
          points?: number;
          streak?: number;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          best?: number;
          correct?: number;
          points?: number;
          streak?: number;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      nfc_cache: {
        Row: {
          cache_key: string;
          id: string;
          payload: Json;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          cache_key: string;
          id?: string;
          payload: Json;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          cache_key?: string;
          id?: string;
          payload?: Json;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      predictions: {
        Row: {
          id: string;
          match_id: string;
          pick_away: number;
          pick_home: number;
          submitted_at: string;
          user_id: string;
        };
        Insert: {
          id?: string;
          match_id: string;
          pick_away: number;
          pick_home: number;
          submitted_at?: string;
          user_id: string;
        };
        Update: {
          id?: string;
          match_id?: string;
          pick_away?: number;
          pick_home?: number;
          submitted_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      profiles: {
        Row: {
          avatar_url: string | null;
          created_at: string;
          display_name: string;
          id: string;
          updated_at: string;
        };
        Insert: {
          avatar_url?: string | null;
          created_at?: string;
          display_name?: string;
          id: string;
          updated_at?: string;
        };
        Update: {
          avatar_url?: string | null;
          created_at?: string;
          display_name?: string;
          id?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      user_roles: {
        Row: {
          created_at: string;
          id: string;
          role: Database["public"]["Enums"]["app_role"];
          user_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          role: Database["public"]["Enums"]["app_role"];
          user_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          role?: Database["public"]["Enums"]["app_role"];
          user_id?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      claim_admin: { Args: never; Returns: boolean };
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"];
          _user_id: string;
        };
        Returns: boolean;
      };
    };
    Enums: {
      app_role: "admin" | "user";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    keyof DefaultSchema["Enums"] | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    keyof DefaultSchema["CompositeTypes"] | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "user"],
    },
  },
} as const;
