CREATE TABLE public.allowed_test_emails (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

ALTER TABLE public.allowed_test_emails ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Platform admins full access"
  ON public.allowed_test_emails
  FOR ALL
  TO authenticated
  USING (public.is_platform_admin())
  WITH CHECK (public.is_platform_admin());

CREATE POLICY "Anon read for test check"
  ON public.allowed_test_emails
  FOR SELECT
  TO anon, authenticated
  USING (true);