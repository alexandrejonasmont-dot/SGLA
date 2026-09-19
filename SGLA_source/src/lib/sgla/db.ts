import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import type {
  Client,
  ClientInsert,
  ClientUpdate,
  Condition,
  ConditionInsert,
  ConditionUpdate,
  Process,
  ProcessInsert,
  ProcessUpdate,
  SglaDocument,
  DocumentInsert,
  DocumentUpdate,
} from "./types";

async function currentUserId() {
  const { data } = await supabase.auth.getUser();
  const id = data.user?.id;
  if (!id) throw new Error("Sessão expirada. Faça login novamente.");
  return id;
}

function fail(message: string): never {
  toast.error(message);
  throw new Error(message);
}

/* ---------------------------------- reads --------------------------------- */

export function useClients() {
  return useQuery({
    queryKey: ["clients"],
    queryFn: async (): Promise<Client[]> => {
      const { data, error } = await supabase
        .from("clients")
        .select("*")
        .order("legal_name", { ascending: true });
      if (error) fail(`Não foi possível carregar os empreendimentos: ${error.message}`);
      return data ?? [];
    },
  });
}

export function useClient(id?: string) {
  return useQuery({
    queryKey: ["clients", id],
    enabled: Boolean(id),
    queryFn: async (): Promise<Client | null> => {
      const { data, error } = await supabase.from("clients").select("*").eq("id", id!).maybeSingle();
      if (error) fail(`Não foi possível carregar o empreendimento: ${error.message}`);
      return data;
    },
  });
}

export function useProcesses() {
  return useQuery({
    queryKey: ["processes"],
    queryFn: async (): Promise<Process[]> => {
      const { data, error } = await supabase
        .from("processes")
        .select("*")
        .order("updated_at", { ascending: false });
      if (error) fail(`Não foi possível carregar os processos: ${error.message}`);
      return data ?? [];
    },
  });
}

export function useConditions() {
  return useQuery({
    queryKey: ["conditions"],
    queryFn: async (): Promise<Condition[]> => {
      const { data, error } = await supabase
        .from("conditions")
        .select("*")
        .order("due_date", { ascending: true, nullsFirst: false });
      if (error) fail(`Não foi possível carregar as condicionantes: ${error.message}`);
      return data ?? [];
    },
  });
}

export function useDocuments() {
  return useQuery({
    queryKey: ["documents"],
    queryFn: async (): Promise<SglaDocument[]> => {
      const { data, error } = await supabase
        .from("documents")
        .select("*")
        .order("updated_at", { ascending: false });
      if (error) fail(`Não foi possível carregar os documentos: ${error.message}`);
      return data ?? [];
    },
  });
}

/* -------------------------------- mutations ------------------------------- */

function useInvalidate() {
  const qc = useQueryClient();
  return (...keys: string[]) => {
    for (const k of keys) void qc.invalidateQueries({ queryKey: [k] });
  };
}

export function useSaveClient() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: async (input: ClientInsert & { id?: string }) => {
      const { id, ...rest } = input;
      if (id) {
        const { data, error } = await supabase
          .from("clients")
          .update(rest as ClientUpdate)
          .eq("id", id)
          .select()
          .single();
        if (error) fail(`Falha ao atualizar o empreendimento: ${error.message}`);
        return data;
      }
      const user_id = await currentUserId();
      const { data, error } = await supabase
        .from("clients")
        .insert({ ...rest, user_id })
        .select()
        .single();
      if (error) fail(`Falha ao cadastrar o empreendimento: ${error.message}`);
      return data;
    },
    onSuccess: (_d, v) => {
      invalidate("clients");
      toast.success(v.id ? "Empreendimento atualizado." : "Empreendimento cadastrado.");
    },
  });
}

export function useSaveProcess() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: async (input: ProcessInsert & { id?: string }) => {
      const { id, ...rest } = input;
      if (id) {
        const { data, error } = await supabase
          .from("processes")
          .update(rest as ProcessUpdate)
          .eq("id", id)
          .select()
          .single();
        if (error) fail(`Falha ao atualizar o processo: ${error.message}`);
        return data;
      }
      const user_id = await currentUserId();
      const { data, error } = await supabase
        .from("processes")
        .insert({ ...rest, user_id })
        .select()
        .single();
      if (error) fail(`Falha ao criar o processo: ${error.message}`);
      return data;
    },
    onSuccess: (_d, v) => {
      invalidate("processes");
      toast.success(v.id ? "Processo atualizado." : "Processo criado.");
    },
  });
}

export function useSaveCondition() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: async (input: ConditionInsert & { id?: string }) => {
      const { id, ...rest } = input;
      if (id) {
        const { data, error } = await supabase
          .from("conditions")
          .update(rest as ConditionUpdate)
          .eq("id", id)
          .select()
          .single();
        if (error) fail(`Falha ao atualizar a condicionante: ${error.message}`);
        return data;
      }
      const user_id = await currentUserId();
      const { data, error } = await supabase
        .from("conditions")
        .insert({ ...rest, user_id })
        .select()
        .single();
      if (error) fail(`Falha ao criar a condicionante: ${error.message}`);
      return data;
    },
    onSuccess: (_d, v) => {
      invalidate("conditions");
      toast.success(v.id ? "Condicionante atualizada." : "Condicionante cadastrada.");
    },
  });
}

export function useToggleCondition() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: async ({ id, done }: { id: string; done: boolean }) => {
      const { error } = await supabase
        .from("conditions")
        .update({
          done,
          done_at: done ? new Date().toISOString() : null,
          status: done ? "Concluída" : "Pendente",
          progress: done ? 100 : 0,
        })
        .eq("id", id);
      if (error) fail(`Falha ao atualizar a condicionante: ${error.message}`);
    },

    onSuccess: () => invalidate("conditions"),
  });
}

export function useSaveDocument() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: async (input: DocumentInsert & { id?: string }) => {
      const { id, ...rest } = input;
      if (id) {
        const { data, error } = await supabase
          .from("documents")
          .update(rest as DocumentUpdate)
          .eq("id", id)
          .select()
          .single();
        if (error) fail(`Falha ao salvar o documento: ${error.message}`);
        return data;
      }
      const user_id = await currentUserId();
      const { data, error } = await supabase
        .from("documents")
        .insert({ ...rest, user_id })
        .select()
        .single();
      if (error) fail(`Falha ao salvar o documento: ${error.message}`);
      return data;
    },
    onSuccess: () => {
      invalidate("documents");
      toast.success("Documento salvo no sistema.");
    },
  });
}

export function useDeleteRow(
  table: "clients" | "processes" | "conditions" | "documents",
  label: string,
) {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from(table).delete().eq("id", id);
      if (error) fail(`Falha ao excluir: ${error.message}`);
    },
    onSuccess: () => {
      invalidate(table);
      toast.success(`${label} excluído(a).`);
    },
  });
}
