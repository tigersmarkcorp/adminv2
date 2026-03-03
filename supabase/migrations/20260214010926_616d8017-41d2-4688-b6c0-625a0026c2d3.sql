
-- Add new columns to employees
ALTER TABLE public.employees 
ADD COLUMN IF NOT EXISTS employee_id TEXT,
ADD COLUMN IF NOT EXISTS until_date DATE,
ADD COLUMN IF NOT EXISTS schedule_type TEXT DEFAULT 'Fixed';

-- Add new columns to workers
ALTER TABLE public.workers
ADD COLUMN IF NOT EXISTS worker_id TEXT,
ADD COLUMN IF NOT EXISTS until_date DATE;

-- Create OJTs table
CREATE TABLE public.ojts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ojt_id TEXT,
  full_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  date_of_birth DATE,
  gender TEXT,
  address TEXT,
  school TEXT,
  course TEXT,
  date_started DATE,
  until_date DATE,
  status TEXT NOT NULL DEFAULT 'Active',
  emergency_contact_name TEXT,
  emergency_contact_phone TEXT,
  photo_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.ojts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can do everything with ojts"
ON public.ojts
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

ALTER PUBLICATION supabase_realtime ADD TABLE public.ojts;

-- Create OJT photos bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('ojt-photos', 'ojt-photos', true);

CREATE POLICY "Admin upload ojt photos"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'ojt-photos' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admin update ojt photos"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'ojt-photos' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admin delete ojt photos"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'ojt-photos' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Public read ojt photos"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'ojt-photos');

-- Trigger for ojts updated_at
CREATE TRIGGER update_ojts_updated_at
BEFORE UPDATE ON public.ojts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
