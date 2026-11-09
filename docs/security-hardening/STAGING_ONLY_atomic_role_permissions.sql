-- STAGING ONLY: DO NOT EXECUTE AGAINST MASTER OR KONSTRUVA PRODUCTION.
-- Requires local PostgreSQL/Supabase verification, synthetic data, and production approval.
-- This function is a single PostgreSQL transaction when invoked via one Supabase RPC call.
-- Access: service_role exclusively; caller identity is rechecked against current DB role.
BEGIN;

CREATE OR REPLACE FUNCTION public.replace_role_permissions_atomic(
    p_actor_id uuid,
    p_role_id uuid,
    p_permission_ids uuid[]
) RETURNS integer
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $function$
DECLARE
    v_count integer;
    v_is_admin boolean;
BEGIN
    IF p_actor_id IS NULL OR p_role_id IS NULL OR p_permission_ids IS NULL THEN
        RAISE EXCEPTION 'Missing authorization or role data' USING ERRCODE = '22023';
    END IF;

    -- Verify the current database role, never legacy profiles.role or user_metadata.
    SELECT EXISTS (
        SELECT 1
        FROM public.profiles p
        JOIN public.roles actor_role ON actor_role.id = p.role_id
        WHERE p.id = p_actor_id
          AND p.is_active IS TRUE
          AND actor_role.is_active IS TRUE
          AND upper(actor_role.name) = 'ADMIN'
    ) INTO v_is_admin;

    IF NOT v_is_admin THEN
        RAISE EXCEPTION 'Caller is not an active administrator' USING ERRCODE = '42501';
    END IF;

    IF coalesce(array_length(p_permission_ids, 1), 0) > 200
       OR array_position(p_permission_ids, NULL) IS NOT NULL THEN
        RAISE EXCEPTION 'Invalid permission list' USING ERRCODE = '22023';
    END IF;

    -- Serialize concurrent replacements for the same role.
    PERFORM 1 FROM public.roles
      WHERE id = p_role_id AND is_active IS TRUE
      FOR UPDATE;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Target role is missing or disabled' USING ERRCODE = '22023';
    END IF;

    SELECT count(DISTINCT pid)::integer
      INTO v_count FROM unnest(p_permission_ids) AS pid;
    IF v_count <> cardinality(p_permission_ids) THEN
        RAISE EXCEPTION 'Duplicate permission IDs' USING ERRCODE = '22023';
    END IF;

    SELECT count(*)::integer INTO v_count
    FROM public.permissions
    WHERE id = ANY(p_permission_ids);
    IF v_count <> cardinality(p_permission_ids) THEN
        RAISE EXCEPTION 'Unknown permission IDs' USING ERRCODE = '22023';
    END IF;

    -- Both statements are part of the SAME database transaction.
    -- Any failure rolls back the DELETE too (unlike two REST calls).
    DELETE FROM public.role_permissions WHERE role_id = p_role_id;
    INSERT INTO public.role_permissions (role_id, permission_id)
      SELECT p_role_id, pid FROM unnest(p_permission_ids) AS pid;

    RETURN cardinality(p_permission_ids);
END;
$function$;

REVOKE ALL ON FUNCTION public.replace_role_permissions_atomic(uuid, uuid, uuid[])
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.replace_role_permissions_atomic(uuid, uuid, uuid[])
  TO service_role;
COMMIT;

-- STAGING TEST REQUIREMENTS:
-- 1. pg_catalog.has_function_privilege('anon',..., 'EXECUTE') = false
-- 2. pg_catalog.has_function_privilege('authenticated',..., 'EXECUTE') = false
-- 3. service_role callable with active ADMIN actor only
-- 4. unknown/duplicate/null IDs produce errors and preserve old role_permissions
-- 5. inject INSERT failure; ensure DELETE rolls back entirely
-- 6. concurrent role replacements serialize correctly
-- 7. works against both schemas; never run here against production.
