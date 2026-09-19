import type { Tables, TablesInsert, TablesUpdate } from "@/integrations/supabase/types";

export type Client = Tables<"clients">;
export type Process = Tables<"processes">;
export type Condition = Tables<"conditions">;
export type SglaDocument = Tables<"documents">;
export type Profile = Tables<"profiles">;
export type AiMessage = Tables<"ai_messages">;

export type ClientInsert = Omit<TablesInsert<"clients">, "user_id">;
export type ProcessInsert = Omit<TablesInsert<"processes">, "user_id">;
export type ConditionInsert = Omit<TablesInsert<"conditions">, "user_id">;
export type DocumentInsert = Omit<TablesInsert<"documents">, "user_id">;

export type ClientUpdate = TablesUpdate<"clients">;
export type ProcessUpdate = TablesUpdate<"processes">;
export type ConditionUpdate = TablesUpdate<"conditions">;
export type DocumentUpdate = TablesUpdate<"documents">;
