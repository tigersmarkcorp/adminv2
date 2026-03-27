
-- Create audit_log table for tracking all changes
CREATE TABLE public.audit_log (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  table_name text NOT NULL,
  record_id uuid NOT NULL,
  action text NOT NULL, -- INSERT, UPDATE, DELETE
  old_data jsonb,
  new_data jsonb,
  changed_by uuid,
  changed_fields text[],
  record_name text, -- store the full_name for display
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

-- Only admins can view audit logs
CREATE POLICY "Admins can view audit logs"
ON public.audit_log FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Create index for performance
CREATE INDEX idx_audit_log_table ON public.audit_log(table_name);
CREATE INDEX idx_audit_log_created ON public.audit_log(created_at DESC);
CREATE INDEX idx_audit_log_record ON public.audit_log(record_id);

-- Create audit trigger function
CREATE OR REPLACE FUNCTION public.audit_trigger_func()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _old jsonb;
  _new jsonb;
  _changed text[];
  _name text;
  _key text;
BEGIN
  IF TG_OP = 'DELETE' THEN
    _old := to_jsonb(OLD);
    _name := OLD.full_name;
    INSERT INTO public.audit_log (table_name, record_id, action, old_data, new_data, changed_by, record_name)
    VALUES (TG_TABLE_NAME, OLD.id, 'DELETE', _old, NULL, auth.uid(), _name);
    RETURN OLD;
  ELSIF TG_OP = 'INSERT' THEN
    _new := to_jsonb(NEW);
    _name := NEW.full_name;
    INSERT INTO public.audit_log (table_name, record_id, action, old_data, new_data, changed_by, record_name)
    VALUES (TG_TABLE_NAME, NEW.id, 'INSERT', NULL, _new, auth.uid(), _name);
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    _old := to_jsonb(OLD);
    _new := to_jsonb(NEW);
    _name := NEW.full_name;
    _changed := ARRAY[]::text[];
    FOR _key IN SELECT jsonb_object_keys(_new)
    LOOP
      IF _key NOT IN ('updated_at', 'created_at') AND (_old->>_key IS DISTINCT FROM _new->>_key) THEN
        _changed := _changed || _key;
      END IF;
    END LOOP;
    -- Only log if something actually changed
    IF array_length(_changed, 1) > 0 THEN
      INSERT INTO public.audit_log (table_name, record_id, action, old_data, new_data, changed_by, changed_fields, record_name)
      VALUES (TG_TABLE_NAME, NEW.id, 'UPDATE', _old, _new, auth.uid(), _changed, _name);
    END IF;
    RETURN NEW;
  END IF;
  RETURN NULL;
END;
$$;

-- Attach triggers to employees, workers, ojts
CREATE TRIGGER audit_employees
AFTER INSERT OR UPDATE OR DELETE ON public.employees
FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_func();

CREATE TRIGGER audit_workers
AFTER INSERT OR UPDATE OR DELETE ON public.workers
FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_func();

CREATE TRIGGER audit_ojts
AFTER INSERT OR UPDATE OR DELETE ON public.ojts
FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_func();

-- Enable realtime for audit_log
ALTER PUBLICATION supabase_realtime ADD TABLE public.audit_log;
