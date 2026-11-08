// STAGING CANDIDATE — not deployed. Shared by SiKoyek MASTER and KONSTRUVA.
// Supabase Edge Function: user-management. Run isolated tests before changing active functions.
import { createClient, type SupabaseClient } from "npm:@supabase/supabase-js@2.119.0";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (payload: unknown, status = 200) => new Response(JSON.stringify(payload), {
  status, headers: { ...cors, "Content-Type": "application/json" },
});
const validUUID = (value: unknown): value is string => typeof value === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
const clean = (value: unknown) => String(value ?? "").trim();
const fail = (error: string, status = 400) => json({ error }, status);

async function activeRole(admin: SupabaseClient, roleId: unknown) {
  if (!validUUID(roleId)) return null;
  const { data, error } = await admin.from("roles")
    .select("id,name,is_active").eq("id", roleId).maybeSingle();
  if (error || !data?.is_active) return null;
  return data;
}

Deno.serve(async req => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return fail("Method not allowed", 405);
  const authorization = req.headers.get("Authorization") || "";
  if (!/^Bearer\s+\S+$/i.test(authorization)) return fail("Unauthorized", 401);
  const url = Deno.env.get("SUPABASE_URL");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !anonKey || !serviceKey) return fail("Server not configured", 500);
  try {
    const callerClient = createClient(url, anonKey, {
      global: { headers: { Authorization: authorization } },
    });
    const { data: { user } = {}, error: authError } = await callerClient.auth.getUser();
    if (authError || !user?.id) return fail("Unauthorized", 401);

    // Use the role foreign key, NOT profiles.role (STAFF on MASTER; legacy on KONSTRUVA).
    const admin = createClient(url, serviceKey);
    const { data: profile, error: profileError } = await admin.from("profiles")
      .select("id,role_id,is_active,roles(name,is_active)")
      .eq("id", user.id).maybeSingle();
    if (profileError) return fail("Authorization check failed", 500);
    const assignedRole = Array.isArray(profile?.roles) ? profile.roles[0] : profile?.roles;
    if (!profile?.is_active || !profile.role_id || !assignedRole?.is_active ||
        clean(assignedRole.name).toUpperCase() !== "ADMIN") return fail("Forbidden", 403);

    let body;
    try { body = await req.json(); } catch { return fail("Invalid JSON", 400); }
    if (!body || typeof body !== "object" || Array.isArray(body)) return fail("Invalid request", 400);
    const action = clean(body.action);

    if (action === "create") {
      const email = clean(body.email).toLowerCase();
      const password = String(body.password || "");
      const fullName = clean(body.full_name);
      const roleId = clean(body.role_id);
      if (!email || !fullName || password.length < 8) return fail("Nama, email dan password minimal 8 karakter wajib diisi");
      const assigned = await activeRole(admin, roleId);
      if (!assigned) return fail("Role tidak valid atau tidak aktif");
      const { data: created, error: createError } = await admin.auth.admin.createUser({
        email, password, email_confirm: true,
      });
      if (createError || !created?.user?.id) return fail("Gagal membuat pengguna");
      const userId = created.user.id;
      const { error: insertError } = await admin.from("profiles").insert({
        id: userId, email, full_name: fullName, role: "STAFF", role_id: roleId, is_active: true,
      });
      if (insertError) {
        await admin.auth.admin.deleteUser(userId); // Best-effort compensation.
        return fail("Gagal membuat profil pengguna");
      }
      return json({ ok: true, success: true, user_id: userId });
    }

    if (action === "update") {
      const id = clean(body.id || body.user_id);
      if (!validUUID(id)) return fail("User ID tidak valid");
      const changes: { full_name?: string; role_id?: string; is_active?: boolean; updated_at?: string } = {};
      if (body.full_name !== undefined) {
        if (!clean(body.full_name)) return fail("Nama lengkap wajib diisi");
        changes.full_name = clean(body.full_name);
      }
      if (body.role_id !== undefined) {
        const roleId = clean(body.role_id);
        if (!await activeRole(admin, roleId)) return fail("Role tidak valid atau tidak aktif");
        changes.role_id = roleId;
      }
      if (body.is_active !== undefined) {
        if (typeof body.is_active !== "boolean") return fail("Status harus boolean");
        changes.is_active = body.is_active;
      }
      if (id === user.id && (changes.is_active === false ||
          (changes.role_id && changes.role_id !== profile.role_id))) {
        return fail("Admin tidak dapat menonaktifkan atau mengganti role diri sendiri", 403);
      }
      if (Object.keys(changes).length === 0) return fail("Tidak ada perubahan profil");
      changes.updated_at = new Date().toISOString();
      const { error } = await admin.from("profiles").update(changes).eq("id", id);
      if (error) return fail("Gagal memperbarui profil");
      return json({ ok: true, success: true });
    }

    if (action === "reset_password") {
      const id = clean(body.id || body.user_id);
      const password = String(body.password || "");
      if (!validUUID(id) || password.length < 8) return fail("User dan password minimal 8 karakter wajib diisi");
      if (body.password_confirm !== undefined &&
          password !== String(body.password_confirm)) return fail("Konfirmasi password tidak sama");
      const { error } = await admin.auth.admin.updateUserById(id, { password });
      if (error) return fail("Gagal mengubah password");
      return json({ ok: true, success: true });
    }

    if (action === "delete") {
      const id = clean(body.id || body.user_id);
      if (!validUUID(id) || id === user.id) return fail("User tidak valid atau sedang digunakan");
      const { error } = await admin.auth.admin.deleteUser(id);
      if (error) return fail("Gagal menghapus pengguna");
      return json({ ok: true, success: true });
    }

    if (action === "update_permissions") {
      // Legacy KONSTRUVA action ({user_id,role_id}) is NOT equivalent to updating
      // a role's permission matrix. Reject ambiguous payloads instead of silently
      // granting/switching roles.
      const roleId = clean(body.role_id);
      if (!roleId || !Array.isArray(body.permission_ids)) {
        return fail("Gunakan role_id dan permission_ids untuk mengubah hak akses");
      }
      if (!await activeRole(admin, roleId)) return fail("Role tidak valid atau tidak aktif");
      const permissionIds: unknown[] = body.permission_ids;
      if (permissionIds.length > 200 || !permissionIds.every(validUUID)) return fail("Permission ID tidak valid");
      const ids = [...new Set(permissionIds)];
      if (ids.length) {
        const { data: valid, error: e } = await admin.from("permissions").select("id").in("id", ids);
        if (e || valid?.length !== ids.length) return fail("Permission tidak valid");
      }
      // Atomic replacement via a single database transaction.
      // This RPC must be installed and tested in isolated staging first.
      // Only service_role has EXECUTE; the SQL rechecks active ADMIN via actor ID.
      const { data: changedCount, error: replaceError } = await admin.rpc(
        "replace_role_permissions_atomic",
        { p_actor_id: user.id, p_role_id: roleId, p_permission_ids: ids }
      );
      if (replaceError || changedCount !== ids.length) {
        return fail("Gagal menyimpan hak akses. Tidak ada perubahan parsial yang diizinkan", 500);
      }
      return json({ ok: true, success: true, count: ids.length });
    }

    return fail("Action tidak dikenal", 400);
  } catch {
    // Do not return internal error details or privileged database information.
    return fail("Internal server error", 500);
  }
});
