ALTER TABLE public.documents
  ADD COLUMN IF NOT EXISTS expires_at date;

COMMENT ON COLUMN public.documents.expires_at IS 'Data de validade do documento, quando aplicável';
