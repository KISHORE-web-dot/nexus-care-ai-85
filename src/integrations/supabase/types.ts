export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.17";
  };
  public: {
    Tables: {
      ambulance_locations: {
        Row: {
          ambulance_id: string;
          created_at: string;
          id: string;
          latitude: number;
          longitude: number;
        };
        Insert: {
          ambulance_id: string;
          created_at?: string;
          id?: string;
          latitude: number;
          longitude: number;
        };
        Update: {
          ambulance_id?: string;
          created_at?: string;
          id?: string;
          latitude?: number;
          longitude?: number;
        };
        Relationships: [
          {
            foreignKeyName: "ambulance_locations_ambulance_id_fkey";
            columns: ["ambulance_id"];
            isOneToOne: false;
            referencedRelation: "ambulances";
            referencedColumns: ["id"];
          },
        ];
      };
      ambulances: {
        Row: {
          ambulance_number: string;
          ambulance_type: string;
          created_at: string;
          current_case_id: string | null;
          driver_id: string | null;
          driver_name: string | null;
          equipment: string[];
          id: string;
          latitude: number;
          longitude: number;
          paramedic_id: string | null;
          status: string;
          traffic_score: number;
        };
        Insert: {
          ambulance_number: string;
          ambulance_type?: string;
          created_at?: string;
          current_case_id?: string | null;
          driver_id?: string | null;
          driver_name?: string | null;
          equipment?: string[];
          id?: string;
          latitude: number;
          longitude: number;
          paramedic_id?: string | null;
          status?: string;
          traffic_score?: number;
        };
        Update: {
          ambulance_number?: string;
          ambulance_type?: string;
          created_at?: string;
          current_case_id?: string | null;
          driver_id?: string | null;
          driver_name?: string | null;
          equipment?: string[];
          id?: string;
          latitude?: number;
          longitude?: number;
          paramedic_id?: string | null;
          status?: string;
          traffic_score?: number;
        };
        Relationships: [];
      };
      emergencies: {
        Row: {
          accepted_at: string | null;
          address: string | null;
          ai_reasons: string[];
          ai_score: number | null;
          ambulance_id: string | null;
          completed_at: string | null;
          conditions: Json;
          created_at: string;
          description: string | null;
          emergency_type: string;
          eta_minutes: number | null;
          hospital_arrival_at: string | null;
          hospital_id: string | null;
          hospital_reasons: string[];
          id: string;
          latitude: number;
          longitude: number;
          patient_id: string | null;
          patient_name: string | null;
          pickup_at: string | null;
          reported_by: string;
          severity: string;
          status: string;
        };
        Insert: {
          accepted_at?: string | null;
          address?: string | null;
          ai_reasons?: string[];
          ai_score?: number | null;
          ambulance_id?: string | null;
          completed_at?: string | null;
          conditions?: Json;
          created_at?: string;
          description?: string | null;
          emergency_type: string;
          eta_minutes?: number | null;
          hospital_arrival_at?: string | null;
          hospital_id?: string | null;
          hospital_reasons?: string[];
          id?: string;
          latitude: number;
          longitude: number;
          patient_id?: string | null;
          patient_name?: string | null;
          pickup_at?: string | null;
          reported_by: string;
          severity?: string;
          status?: string;
        };
        Update: {
          accepted_at?: string | null;
          address?: string | null;
          ai_reasons?: string[];
          ai_score?: number | null;
          ambulance_id?: string | null;
          completed_at?: string | null;
          conditions?: Json;
          created_at?: string;
          description?: string | null;
          emergency_type?: string;
          eta_minutes?: number | null;
          hospital_arrival_at?: string | null;
          hospital_id?: string | null;
          hospital_reasons?: string[];
          id?: string;
          latitude?: number;
          longitude?: number;
          patient_id?: string | null;
          patient_name?: string | null;
          pickup_at?: string | null;
          reported_by?: string;
          severity?: string;
          status?: string;
        };
        Relationships: [
          {
            foreignKeyName: "emergencies_ambulance_id_fkey";
            columns: ["ambulance_id"];
            isOneToOne: false;
            referencedRelation: "ambulances";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "emergencies_hospital_id_fkey";
            columns: ["hospital_id"];
            isOneToOne: false;
            referencedRelation: "hospitals";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "emergencies_patient_id_fkey";
            columns: ["patient_id"];
            isOneToOne: false;
            referencedRelation: "patients";
            referencedColumns: ["id"];
          },
        ];
      };
      emergency_timeline: {
        Row: {
          created_at: string;
          description: string | null;
          emergency_id: string;
          event: string;
          id: string;
          user_id: string | null;
        };
        Insert: {
          created_at?: string;
          description?: string | null;
          emergency_id: string;
          event: string;
          id?: string;
          user_id?: string | null;
        };
        Update: {
          created_at?: string;
          description?: string | null;
          emergency_id?: string;
          event?: string;
          id?: string;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "emergency_timeline_emergency_id_fkey";
            columns: ["emergency_id"];
            isOneToOne: false;
            referencedRelation: "emergencies";
            referencedColumns: ["id"];
          },
        ];
      };
      hospitals: {
        Row: {
          address: string | null;
          available_beds: number;
          created_at: string;
          emergency_available: boolean;
          icu_beds: number;
          id: string;
          latitude: number;
          longitude: number;
          managed_by: string | null;
          name: string;
          phone: string | null;
          specializations: string[];
          status: string;
        };
        Insert: {
          address?: string | null;
          available_beds?: number;
          created_at?: string;
          emergency_available?: boolean;
          icu_beds?: number;
          id?: string;
          latitude: number;
          longitude: number;
          managed_by?: string | null;
          name: string;
          phone?: string | null;
          specializations?: string[];
          status?: string;
        };
        Update: {
          address?: string | null;
          available_beds?: number;
          created_at?: string;
          emergency_available?: boolean;
          icu_beds?: number;
          id?: string;
          latitude?: number;
          longitude?: number;
          managed_by?: string | null;
          name?: string;
          phone?: string | null;
          specializations?: string[];
          status?: string;
        };
        Relationships: [];
      };
      notifications: {
        Row: {
          created_at: string;
          emergency_id: string | null;
          id: string;
          message: string | null;
          read: boolean;
          role: Database["public"]["Enums"]["app_role"] | null;
          title: string;
          type: string;
          user_id: string | null;
        };
        Insert: {
          created_at?: string;
          emergency_id?: string | null;
          id?: string;
          message?: string | null;
          read?: boolean;
          role?: Database["public"]["Enums"]["app_role"] | null;
          title: string;
          type?: string;
          user_id?: string | null;
        };
        Update: {
          created_at?: string;
          emergency_id?: string | null;
          id?: string;
          message?: string | null;
          read?: boolean;
          role?: Database["public"]["Enums"]["app_role"] | null;
          title?: string;
          type?: string;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "notifications_emergency_id_fkey";
            columns: ["emergency_id"];
            isOneToOne: false;
            referencedRelation: "emergencies";
            referencedColumns: ["id"];
          },
        ];
      };
      patients: {
        Row: {
          age: number | null;
          allergies: string | null;
          blood_group: string | null;
          created_at: string;
          emergency_contact: string | null;
          gender: string | null;
          id: string;
          medical_history: string | null;
          name: string;
          phone: string | null;
          user_id: string | null;
        };
        Insert: {
          age?: number | null;
          allergies?: string | null;
          blood_group?: string | null;
          created_at?: string;
          emergency_contact?: string | null;
          gender?: string | null;
          id?: string;
          medical_history?: string | null;
          name: string;
          phone?: string | null;
          user_id?: string | null;
        };
        Update: {
          age?: number | null;
          allergies?: string | null;
          blood_group?: string | null;
          created_at?: string;
          emergency_contact?: string | null;
          gender?: string | null;
          id?: string;
          medical_history?: string | null;
          name?: string;
          phone?: string | null;
          user_id?: string | null;
        };
        Relationships: [];
      };
      profiles: {
        Row: {
          created_at: string;
          email: string | null;
          id: string;
          name: string;
          phone: string | null;
        };
        Insert: {
          created_at?: string;
          email?: string | null;
          id: string;
          name?: string;
          phone?: string | null;
        };
        Update: {
          created_at?: string;
          email?: string | null;
          id?: string;
          name?: string;
          phone?: string | null;
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
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"];
          _user_id: string;
        };
        Returns: boolean;
      };
      is_staff: { Args: { _user_id: string }; Returns: boolean };
    };
    Enums: {
      app_role: "PATIENT" | "DRIVER" | "PARAMEDIC" | "DOCTOR" | "HOSPITAL" | "ADMIN";
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
      app_role: ["PATIENT", "DRIVER", "PARAMEDIC", "DOCTOR", "HOSPITAL", "ADMIN"],
    },
  },
} as const;
