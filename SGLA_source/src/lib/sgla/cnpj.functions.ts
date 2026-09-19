import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { lookupCnpj, integrationHealth } from "./cnpj.server";

export const consultarCnpj = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => z.object({ cnpj: z.string() }).parse(data))
  .handler(async ({ data }) => lookupCnpj(data.cnpj));

export const healthCheck = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async () => integrationHealth());
