ALTER TABLE public.clients
  ADD COLUMN IF NOT EXISTS proposal_status text NOT NULL DEFAULT 'Não enviada',
  ADD COLUMN IF NOT EXISTS proposal_sent_at timestamptz,
  ADD COLUMN IF NOT EXISTS proposal_accepted_at timestamptz,
  ADD COLUMN IF NOT EXISTS proposal_follow_up_month date,
  ADD COLUMN IF NOT EXISTS communication_email_sent_at timestamptz,
  ADD COLUMN IF NOT EXISTS communication_receipt_requested_at timestamptz,
  ADD COLUMN IF NOT EXISTS communication_receipt_confirmed_at timestamptz,
  ADD COLUMN IF NOT EXISTS communication_notes text;

ALTER TABLE public.documents
  ADD COLUMN IF NOT EXISTS document_type text NOT NULL DEFAULT 'Outro',
  ADD COLUMN IF NOT EXISTS checklist_status text NOT NULL DEFAULT 'Pendente';

COMMENT ON COLUMN public.clients.proposal_status IS 'Status da proposta comercial: Não enviada, Enviada ou Aceita';
COMMENT ON COLUMN public.clients.proposal_follow_up_month IS 'Mês de acompanhamento pessoal da proposta';
COMMENT ON COLUMN public.clients.communication_receipt_confirmed_at IS 'Data de confirmação de recebimento pelo cliente';
COMMENT ON COLUMN public.documents.checklist_status IS 'Situação do item documental: Pendente ou Concluído';
