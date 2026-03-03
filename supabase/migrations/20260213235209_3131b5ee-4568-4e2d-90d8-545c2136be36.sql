
-- Create role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');

-- Create user_roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function for role checking
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- RLS for user_roles
CREATE POLICY "Admins can view roles" ON public.user_roles
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Employees table
CREATE TABLE public.employees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  date_of_birth DATE,
  gender TEXT,
  address TEXT,
  position TEXT,
  department TEXT,
  date_hired DATE,
  status TEXT NOT NULL DEFAULT 'Active',
  emergency_contact_name TEXT,
  emergency_contact_phone TEXT,
  photo_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can do everything with employees" ON public.employees
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Workers table
CREATE TABLE public.workers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  date_of_birth DATE,
  gender TEXT,
  address TEXT,
  job_role TEXT,
  skill_type TEXT,
  assignment_area TEXT,
  date_started DATE,
  status TEXT NOT NULL DEFAULT 'Active',
  emergency_contact_name TEXT,
  emergency_contact_phone TEXT,
  photo_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.workers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can do everything with workers" ON public.workers
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Files metadata table
CREATE TABLE public.files_metadata (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  file_name TEXT NOT NULL,
  file_type TEXT,
  file_size BIGINT,
  storage_path TEXT NOT NULL,
  uploaded_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.files_metadata ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can do everything with files" ON public.files_metadata
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_employees_updated_at
  BEFORE UPDATE ON public.employees
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_workers_updated_at
  BEFORE UPDATE ON public.workers
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.employees;
ALTER PUBLICATION supabase_realtime ADD TABLE public.workers;
ALTER PUBLICATION supabase_realtime ADD TABLE public.files_metadata;

-- Storage buckets
INSERT INTO storage.buckets (id, name, public) VALUES ('employee-photos', 'employee-photos', true);
INSERT INTO storage.buckets (id, name, public) VALUES ('worker-photos', 'worker-photos', true);
INSERT INTO storage.buckets (id, name, public) VALUES ('forms-files', 'forms-files', true);

-- Storage policies
CREATE POLICY "Admins can upload employee photos" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'employee-photos' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Anyone can view employee photos" ON storage.objects
  FOR SELECT USING (bucket_id = 'employee-photos');

CREATE POLICY "Admins can delete employee photos" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'employee-photos' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can upload worker photos" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'worker-photos' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Anyone can view worker photos" ON storage.objects
  FOR SELECT USING (bucket_id = 'worker-photos');

CREATE POLICY "Admins can delete worker photos" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'worker-photos' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can upload form files" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'forms-files' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Anyone can view form files" ON storage.objects
  FOR SELECT USING (bucket_id = 'forms-files');

CREATE POLICY "Admins can delete form files" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'forms-files' AND public.has_role(auth.uid(), 'admin'));
