export const stripCnpj = (s: string) =>
  String(s ?? "")
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .slice(0, 14);

export const maskCnpj = (s: string) => {
  const x = stripCnpj(s);
  if (!x) return "";
  return `${x.slice(0, 2)}${x.length > 2 ? "." : ""}${x.slice(2, 5)}${x.length > 5 ? "." : ""}${x.slice(
    5,
    8,
  )}${x.length > 8 ? "/" : ""}${x.slice(8, 12)}${x.length > 12 ? "-" : ""}${x.slice(12, 14)}`;
};

/** Aceita CNPJ numérico legado e o padrão alfanumérico vigente. */
export const validCnpjShape = (s: string) => {
  const x = stripCnpj(s);
  return x.length === 14 && /^[A-Z0-9]{12}[0-9]{2}$/.test(x);
};

export const isNumericCnpj = (s: string) => /^[0-9]{14}$/.test(stripCnpj(s));

function cnpjDigit(base: string) {
  const w =
    base.length === 12
      ? [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
      : [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  const sum = [...base].reduce((a, ch, i) => a + (ch.charCodeAt(0) - 48) * (w[i] ?? 0), 0);
  const d = 11 - (sum % 11);
  return d >= 10 ? 0 : d;
}

export const validCnpjDv = (v: string) => {
  const x = stripCnpj(v);
  if (!validCnpjShape(x)) return false;
  const d1 = cnpjDigit(x.slice(0, 12));
  const d2 = cnpjDigit(x.slice(0, 12) + String(d1));
  return x.slice(-2) === `${d1}${d2}`;
};

export const fmtDate = (v?: string | null) => {
  if (!v) return "—";
  const d = new Date(v.length <= 10 ? `${v}T12:00:00` : v);
  return isNaN(d.getTime()) ? "—" : d.toLocaleDateString("pt-BR");
};

export const fmtDateTime = (v?: string | null) => {
  if (!v) return "—";
  const d = new Date(v);
  return isNaN(d.getTime())
    ? "—"
    : d.toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
};

export const todayISO = () => new Date().toISOString().slice(0, 10);

export const daysUntil = (d?: string | null) => {
  if (!d) return null;
  const target = new Date(`${d.slice(0, 10)}T23:59:59`);
  if (isNaN(target.getTime())) return null;
  return Math.ceil((target.getTime() - Date.now()) / 86400000);
};

export const safeFileName = (s: string) =>
  String(s ?? "documento")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9._ -]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .slice(0, 80) || "documento";

export const initials = (s?: string | null) =>
  String(s ?? "?")
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("") || "?";
