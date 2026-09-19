import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Leaf, Loader2, ShieldCheck } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Btn, Text } from "@/components/sgla/form";
import { ThemeToggle } from "@/components/sgla/ThemeToggle";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Acesso | SGLA — Gestão de Licenciamento Ambiental" },
      {
        name: "description",
        content:
          "Área de acesso do SGLA: entre com sua conta para gerenciar empreendimentos, processos, condicionantes e documentos de licenciamento ambiental.",
      },
      { property: "og:title", content: "Acesso ao SGLA" },
      {
        property: "og:description",
        content: "Autenticação segura do Sistema de Gestão de Licenciamento Ambiental.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup" | "forgot" | "reset">(() =>
    typeof window !== "undefined" &&
    (window.location.hash.includes("type=recovery") ||
      new URLSearchParams(window.location.search).get("type") === "recovery" ||
      new URLSearchParams(window.location.search).get("recovery") === "1")
      ? "reset"
      : "signin",
  );
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") setMode("reset");
    });
    return () => data.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!loading && user && mode !== "reset") void navigate({ to: "/" });
  }, [loading, user, mode, navigate]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "reset") {
        if (password !== passwordConfirmation) {
          throw new Error("As senhas não coincidem.");
        }
        const { error } = await supabase.auth.updateUser({ password });
        if (error) throw error;
        toast.success("Senha alterada com sucesso.");
        void navigate({ to: "/" });
      } else if (mode === "forgot") {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/auth?recovery=1`,
        });
        if (error) throw error;
        toast.success("Enviamos as instruções de redefinição para o seu e-mail.");
        setMode("signin");
      } else if (mode === "signin") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("Acesso liberado.");
        void navigate({ to: "/" });
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: window.location.origin,
            data: { full_name: name },
          },
        });
        if (error) throw error;
        toast.success(
          "Conta criada. Se a confirmação por e-mail estiver ativa, verifique sua caixa.",
        );
        void navigate({ to: "/" });
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Não foi possível autenticar.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="relative hidden flex-col justify-between overflow-hidden border-r border-border bg-sidebar p-10 lg:flex">
        <div className="pointer-events-none absolute -top-32 -left-24 size-[420px] rounded-full bg-primary/12 blur-3xl" />
        <div className="pointer-events-none absolute -right-24 -bottom-32 size-[380px] rounded-full bg-gold/10 blur-3xl" />
        <div className="relative flex items-center gap-3">
          <span className="grid size-11 place-items-center rounded-xl border border-primary/35 bg-primary/12">
            <Leaf className="size-5 text-primary" />
          </span>
          <div>
            <p className="font-display text-lg font-bold tracking-tight">SGLA 3.0</p>
            <p className="text-[10px] tracking-[0.18em] text-muted-foreground uppercase">
              Licenciamento Ambiental
            </p>
          </div>
        </div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="relative max-w-md"
        >
          <h2 className="font-display text-3xl leading-tight font-semibold">
            Consultoria ambiental com padrão corporativo, do processo ao protocolo.
          </h2>
          <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
            Clientes, processos, condicionantes, documentos em Word e PDF e um assistente
            especializado em legislação ambiental brasileira — tudo em uma base única, segura e
            multiusuário.
          </p>
          <ul className="mt-6 space-y-2 text-sm text-muted-foreground">
            {[
              "Consulta cadastral de CNPJ executada no backend",
              "Documentos técnicos exportáveis em .docx e .pdf",
              "Controle de prazos e condicionantes com alertas",
            ].map((t) => (
              <li key={t} className="flex items-start gap-2">
                <ShieldCheck className="mt-0.5 size-4 shrink-0 text-primary" />
                {t}
              </li>
            ))}
          </ul>
        </motion.div>
        <p className="relative text-[11px] text-muted-foreground">
          Dados isolados por usuário com políticas de segurança em nível de linha.
        </p>
      </div>

      <div className="relative flex items-center justify-center px-5 py-12">
        <div className="absolute right-4 top-4">
          <ThemeToggle />
        </div>
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
          className="surface w-full max-w-sm rounded-2xl p-6"
        >
          <h1 className="font-display text-xl font-semibold">
            {mode === "signin"
              ? "Entrar no SGLA"
              : mode === "forgot"
                ? "Redefinir senha"
                : mode === "reset"
                  ? "Criar nova senha"
                  : "Criar conta"}
          </h1>
          <p className="mt-1 text-xs text-muted-foreground">
            {mode === "signin"
              ? "Use suas credenciais corporativas para acessar o painel."
              : mode === "forgot"
                ? "Informe seu e-mail para receber o link de redefinição."
                : mode === "reset"
                  ? "Escolha uma nova senha para sua conta."
                  : "Cadastre-se para iniciar sua carteira de processos ambientais."}
          </p>

          <form onSubmit={submit} className="mt-6 space-y-3.5">
            {mode === "signup" ? (
              <Text
                label="Nome completo"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Responsável técnico"
                autoComplete="name"
              />
            ) : null}
            {mode !== "reset" ? (
              <Text
                label="E-mail"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="voce@empresa.com.br"
                autoComplete="email"
              />
            ) : null}
            {mode !== "forgot" ? (
              <Text
                label="Senha"
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mínimo de 6 caracteres"
                autoComplete={mode === "signin" ? "current-password" : "new-password"}
              />
            ) : null}
            {mode === "reset" ? (
              <Text
                label="Confirmar nova senha"
                type="password"
                required
                minLength={6}
                value={passwordConfirmation}
                onChange={(e) => setPasswordConfirmation(e.target.value)}
                placeholder="Digite a senha novamente"
                autoComplete="new-password"
              />
            ) : null}
            <Btn type="submit" disabled={busy} className="w-full">
              {busy ? <Loader2 className="size-4 animate-spin" /> : null}
              {mode === "signin"
                ? "Entrar"
                : mode === "forgot"
                  ? "Enviar link"
                  : mode === "reset"
                    ? "Alterar senha"
                    : "Criar conta"}
            </Btn>
          </form>

          {mode === "signin" ? (
            <>
              <button
                type="button"
                onClick={() => setMode("forgot")}
                className="mt-3 w-full text-center text-xs text-muted-foreground hover:text-foreground"
              >
                Esqueci minha senha
              </button>
            </>
          ) : null}

          <button
            onClick={() => setMode(mode === "signup" ? "signin" : "signup")}
            className="mt-5 w-full text-center text-xs text-muted-foreground hover:text-foreground"
          >
            {mode === "signin"
              ? "Ainda não tem conta? Cadastre-se"
              : mode === "forgot" || mode === "reset"
                ? "Voltar para o login"
                : "Já possui conta? Faça login"}
          </button>
        </motion.div>
      </div>
    </div>
  );
}
