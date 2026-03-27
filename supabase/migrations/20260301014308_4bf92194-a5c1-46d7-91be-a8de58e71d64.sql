
-- Add new roles to app_role enum
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'employee';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'ojt';

-- Add auth_user_id columns to link portal users
ALTER TABLE public.employees ADD COLUMN IF NOT EXISTS auth_user_id uuid;
ALTER TABLE public.ojts ADD COLUMN IF NOT EXISTS auth_user_id uuid;

-- Drop restrictive admin policies and replace with permissive ones
-- (restrictive policies block non-admin access even with additional permissive policies)
DROP POLICY IF EXISTS "Admins can do everything with employees" ON public.employees;
DROP POLICY IF EXISTS "Admins can do everything with ojts" ON public.ojts;

-- Permissive admin policies for employees
CREATE POLICY "Admins full access employees"
ON public.employees FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Employees can view their own record
CREATE POLICY "Employees view own record"
ON public.employees FOR SELECT
TO authenticated
USING (auth.uid() = auth_user_id);

-- Permissive admin policies for ojts
CREATE POLICY "Admins full access ojts"
ON public.ojts FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- OJTs can view their own record
CREATE POLICY "OJTs view own record"
ON public.ojts FOR SELECT
TO authenticated
USING (auth.uid() = auth_user_id);

-- Employee government IDs table (editable by employee)
CREATE TABLE public.employee_government_ids (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE UNIQUE,
  auth_user_id uuid NOT NULL UNIQUE,
  nbi_number text,
  philhealth_number text,
  sss_number text,
  pagibig_number text,
  tin_number text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.employee_government_ids ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Employees view own gov ids"
ON public.employee_government_ids FOR SELECT
TO authenticated
USING (auth.uid() = auth_user_id);

CREATE POLICY "Employees update own gov ids"
ON public.employee_government_ids FOR UPDATE
TO authenticated
USING (auth.uid() = auth_user_id);

CREATE POLICY "Employees insert own gov ids"
ON public.employee_government_ids FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = auth_user_id);

CREATE POLICY "Admins manage gov ids"
ON public.employee_government_ids FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_employee_government_ids_updated_at
BEFORE UPDATE ON public.employee_government_ids
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.employee_government_ids;
