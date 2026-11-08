-- Disposable test-only stand-ins for the 4 existing Cloud definer functions.
\set ON_ERROR_STOP on
CREATE OR REPLACE FUNCTION public.refresh_all_project_statuses()
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=''
AS $$ BEGIN NULL; END $$;
CREATE OR REPLACE FUNCTION public.refresh_project_status(p_project_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=''
AS $$ BEGIN NULL; END $$;
CREATE OR REPLACE FUNCTION public.trg_project_initial_status()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=''
AS $$ BEGIN NEW.status=coalesce(NEW.status,'RENCANA'); RETURN NEW; END $$;
CREATE OR REPLACE FUNCTION public.trg_refresh_project_status()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=''
AS $$ BEGIN RETURN NEW; END $$;
CREATE TRIGGER synthetic_project_initial_status
BEFORE INSERT ON public.projects FOR EACH ROW
EXECUTE FUNCTION public.trg_project_initial_status();
CREATE TRIGGER synthetic_project_refresh_status
AFTER UPDATE ON public.projects FOR EACH ROW
EXECUTE FUNCTION public.trg_refresh_project_status();
DO $before$
BEGIN
 IF NOT has_function_privilege('anon','public.refresh_project_status(uuid)','EXECUTE')
 THEN RAISE EXCEPTION 'Fixture lacks open legacy EXECUTE to revoke'; END IF;
END;
$before$;
