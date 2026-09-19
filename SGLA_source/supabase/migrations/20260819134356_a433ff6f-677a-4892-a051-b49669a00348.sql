ALTER TABLE public.conditions
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'Pendente',
  ADD COLUMN IF NOT EXISTS priority text NOT NULL DEFAULT 'Normal',
  ADD COLUMN IF NOT EXISTS progress integer NOT NULL DEFAULT 0;

UPDATE public.conditions
SET status = CASE WHEN done THEN 'Concluída' ELSE 'Pendente' END,
    progress = CASE WHEN done THEN 100 ELSE 0 END;