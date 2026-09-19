export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.15";
  };
  public: {
    Tables: {
      ai_messages: {
        Row: {
          content: string;
          created_at: string;
          id: string;
          role: string;
          user_id: string;
        };
        Insert: {
          content: string;
          created_at?: string;
          id?: string;
          role: string;
          user_id: string;
        };
        Update: {
          content?: string;
          created_at?: string;
          id?: string;
          role?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      clients: {
        Row: {
          address: string | null;
          built_area: number | null;
          city: string | null;
          cnae: string | null;
          cnae_desc: string | null;
          cnpj: string | null;
          complement: string | null;
          contact_email: string | null;
          contact_mobile: string | null;
          contact_name: string | null;
          contact_phone: string | null;
          communication_email_sent_at: string | null;
          communication_notes: string | null;
          communication_receipt_confirmed_at: string | null;
          communication_receipt_requested_at: string | null;
          created_at: string;
          data_source: string | null;
          id: string;
          latitude: number | null;
          legal_name: string;
          longitude: number | null;
          map_url: string | null;
          neighborhood: string | null;
          notes: string | null;
          number: string | null;
          proposal_accepted_at: string | null;
          proposal_follow_up_month: string | null;
          proposal_sent_at: string | null;
          proposal_status: string;
          registration_status: string | null;
          secondary_cnaes: string | null;
          street: string | null;
          total_area: number | null;
          trade_name: string | null;
          uf: string | null;
          updated_at: string;
          user_id: string;
          zip_code: string | null;
        };
        Insert: {
          address?: string | null;
          built_area?: number | null;
          city?: string | null;
          cnae?: string | null;
          cnae_desc?: string | null;
          cnpj?: string | null;
          complement?: string | null;
          contact_email?: string | null;
          contact_mobile?: string | null;
          contact_name?: string | null;
          contact_phone?: string | null;
          communication_email_sent_at?: string | null;
          communication_notes?: string | null;
          communication_receipt_confirmed_at?: string | null;
          communication_receipt_requested_at?: string | null;
          created_at?: string;
          data_source?: string | null;
          id?: string;
          latitude?: number | null;
          legal_name: string;
          longitude?: number | null;
          map_url?: string | null;
          neighborhood?: string | null;
          notes?: string | null;
          number?: string | null;
          proposal_accepted_at?: string | null;
          proposal_follow_up_month?: string | null;
          proposal_sent_at?: string | null;
          proposal_status?: string;
          registration_status?: string | null;
          secondary_cnaes?: string | null;
          street?: string | null;
          total_area?: number | null;
          trade_name?: string | null;
          uf?: string | null;
          updated_at?: string;
          user_id: string;
          zip_code?: string | null;
        };
        Update: {
          address?: string | null;
          built_area?: number | null;
          city?: string | null;
          cnae?: string | null;
          cnae_desc?: string | null;
          cnpj?: string | null;
          complement?: string | null;
          contact_email?: string | null;
          contact_mobile?: string | null;
          contact_name?: string | null;
          contact_phone?: string | null;
          communication_email_sent_at?: string | null;
          communication_notes?: string | null;
          communication_receipt_confirmed_at?: string | null;
          communication_receipt_requested_at?: string | null;
          created_at?: string;
          data_source?: string | null;
          id?: string;
          latitude?: number | null;
          legal_name?: string;
          longitude?: number | null;
          map_url?: string | null;
          neighborhood?: string | null;
          notes?: string | null;
          number?: string | null;
          proposal_accepted_at?: string | null;
          proposal_follow_up_month?: string | null;
          proposal_sent_at?: string | null;
          proposal_status?: string;
          registration_status?: string | null;
          secondary_cnaes?: string | null;
          street?: string | null;
          total_area?: number | null;
          trade_name?: string | null;
          uf?: string | null;
          updated_at?: string;
          user_id?: string;
          zip_code?: string | null;
        };
        Relationships: [];
      };
      conditions: {
        Row: {
          client_id: string | null;
          created_at: string;
          description: string | null;
          done: boolean;
          done_at: string | null;
          due_date: string | null;
          evidence: string | null;
          id: string;
          owner_name: string | null;
          priority: string;
          process_id: string | null;
          progress: number;
          status: string;
          title: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          client_id?: string | null;
          created_at?: string;
          description?: string | null;
          done?: boolean;
          done_at?: string | null;
          due_date?: string | null;
          evidence?: string | null;
          id?: string;
          owner_name?: string | null;
          priority?: string;
          process_id?: string | null;
          progress?: number;
          status?: string;
          title: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          client_id?: string | null;
          created_at?: string;
          description?: string | null;
          done?: boolean;
          done_at?: string | null;
          due_date?: string | null;
          evidence?: string | null;
          id?: string;
          owner_name?: string | null;
          priority?: string;
          process_id?: string | null;
          progress?: number;
          status?: string;
          title?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "conditions_client_id_fkey";
            columns: ["client_id"];
            isOneToOne: false;
            referencedRelation: "clients";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "conditions_process_id_fkey";
            columns: ["process_id"];
            isOneToOne: false;
            referencedRelation: "processes";
            referencedColumns: ["id"];
          },
        ];
      };
      documents: {
        Row: {
          client_id: string | null;
          checklist_status: string;
          content: string;
          created_at: string;
          document_type: string;
          expires_at: string | null;
          id: string;
          process_id: string | null;
          status: string;
          template_key: string;
          title: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          checklist_status?: string;
          client_id?: string | null;
          content?: string;
          created_at?: string;
          document_type?: string;
          expires_at?: string | null;
          id?: string;
          process_id?: string | null;
          status?: string;
          template_key?: string;
          title: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          checklist_status?: string;
          client_id?: string | null;
          content?: string;
          created_at?: string;
          document_type?: string;
          expires_at?: string | null;
          id?: string;
          process_id?: string | null;
          status?: string;
          template_key?: string;
          title?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "documents_client_id_fkey";
            columns: ["client_id"];
            isOneToOne: false;
            referencedRelation: "clients";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "documents_process_id_fkey";
            columns: ["process_id"];
            isOneToOne: false;
            referencedRelation: "processes";
            referencedColumns: ["id"];
          },
        ];
      };
      processes: {
        Row: {
          agency: string | null;
          client_id: string | null;
          created_at: string;
          expires_at: string | null;
          filed_at: string | null;
          id: string;
          license_type: string;
          notes: string | null;
          opened_at: string | null;
          owner_name: string | null;
          priority: string;
          protocol: string | null;
          status: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          agency?: string | null;
          client_id?: string | null;
          created_at?: string;
          expires_at?: string | null;
          filed_at?: string | null;
          id?: string;
          license_type?: string;
          notes?: string | null;
          opened_at?: string | null;
          owner_name?: string | null;
          priority?: string;
          protocol?: string | null;
          status?: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          agency?: string | null;
          client_id?: string | null;
          created_at?: string;
          expires_at?: string | null;
          filed_at?: string | null;
          id?: string;
          license_type?: string;
          notes?: string | null;
          opened_at?: string | null;
          owner_name?: string | null;
          priority?: string;
          protocol?: string | null;
          status?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "processes_client_id_fkey";
            columns: ["client_id"];
            isOneToOne: false;
            referencedRelation: "clients";
            referencedColumns: ["id"];
          },
        ];
      };
      profiles: {
        Row: {
          created_at: string;
          full_name: string | null;
          id: string;
          organization: string | null;
          role_title: string | null;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          full_name?: string | null;
          id: string;
          organization?: string | null;
          role_title?: string | null;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          full_name?: string | null;
          id?: string;
          organization?: string | null;
          role_title?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
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
    Enums: {},
  },
} as const;
