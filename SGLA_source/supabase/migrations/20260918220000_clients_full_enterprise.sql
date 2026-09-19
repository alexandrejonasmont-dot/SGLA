-- Evolução não-destrutiva do cadastro de empreendimento (Prioridade 1)
-- Mantém a coluna address para compatibilidade; novos campos estruturados.

ALTER TABLE public.clients
  ADD COLUMN IF NOT EXISTS street text,
  ADD COLUMN IF NOT EXISTS number text,
  ADD COLUMN IF NOT EXISTS complement text,
  ADD COLUMN IF NOT EXISTS neighborhood text,
  ADD COLUMN IF NOT EXISTS zip_code text,
  ADD COLUMN IF NOT EXISTS secondary_cnaes text,
  ADD COLUMN IF NOT EXISTS total_area numeric,
  ADD COLUMN IF NOT EXISTS built_area numeric,
  ADD COLUMN IF NOT EXISTS latitude numeric,
  ADD COLUMN IF NOT EXISTS longitude numeric,
  ADD COLUMN IF NOT EXISTS map_url text,
  ADD COLUMN IF NOT EXISTS contact_mobile text;

COMMENT ON COLUMN public.clients.street IS 'Logradouro';
COMMENT ON COLUMN public.clients.number IS 'Número do endereço';
COMMENT ON COLUMN public.clients.complement IS 'Complemento';
COMMENT ON COLUMN public.clients.neighborhood IS 'Bairro';
COMMENT ON COLUMN public.clients.zip_code IS 'CEP';
COMMENT ON COLUMN public.clients.secondary_cnaes IS 'CNAEs secundários (texto livre ou lista separada por vírgula)';
COMMENT ON COLUMN public.clients.total_area IS 'Área total (m²)';
COMMENT ON COLUMN public.clients.built_area IS 'Área construída (m²)';
COMMENT ON COLUMN public.clients.latitude IS 'Latitude (WGS84)';
COMMENT ON COLUMN public.clients.longitude IS 'Longitude (WGS84)';
COMMENT ON COLUMN public.clients.map_url IS 'Link para localização no mapa';
COMMENT ON COLUMN public.clients.contact_mobile IS 'Telefone celular do responsável';
