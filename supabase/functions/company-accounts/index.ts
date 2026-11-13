import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, apikey, x-client-info, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function reply(status: number, body: Record<string, unknown>) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, "Content-Type": "application/json" },
  });
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response(null, { headers: cors });
  if (request.method !== "POST") return reply(405, { error: "Metode tidak didukung." });

  const authorization = request.headers.get("Authorization");
  if (!authorization?.startsWith("Bearer ")) return reply(401, { error: "Silakan login." });
  const url = Deno.env.get("SUPABASE_URL");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !anonKey || !serviceKey) return reply(503, { error: "Layanan belum dikonfigurasi." });

  try {
    const client = createClient(url, anonKey, { global: { headers: { Authorization: authorization } } });
    const admin = createClient(url, serviceKey);
    const { data: { user }, error: authError } = await client.auth.getUser();
    if (authError || !user) return reply(401, { error: "Sesi login tidak valid." });

    const { data: caller, error: callerError } = await client.from("company_accounts")
      .select("company_id,access_role,is_active").eq("user_id", user.id).maybeSingle();
    if (callerError) return reply(503, { error: "Akses akun belum dapat diperiksa." });
    if (!caller?.is_active || !["platform_admin", "company_admin"].includes(caller.access_role)) {
      return reply(403, { error: "Akses pembuatan akun ditolak." });
    }

    const body = await request.json().catch(() => null);
    const name = typeof body?.full_name === "string" ? body.full_name.trim() : "";
    const email = typeof body?.email === "string" ? body.email.trim() : "";
    const password = body?.password;
    const action = body?.action ?? "create";
    if (action !== "create") {
      const targetId = body?.id;
      if (!["update", "delete", "reset_password"].includes(action) || typeof targetId !== "string" || targetId === user.id) {
        return reply(400, { error: "Aksi akun tidak valid." });
      }
      const { data: target, error: targetError } = await client.from("company_accounts")
        .select("user_id,company_id,access_role").eq("user_id", targetId).maybeSingle();
      const allowed = target && (caller.access_role === "platform_admin"
        ? target.access_role === "company_admin"
        : target.access_role === "staff" && target.company_id === caller.company_id);
      if (targetError || !allowed) return reply(403, { error: "Akses pengelolaan akun ditolak." });
      const { data: company, error: companyError } = await client.from("companies")
        .select("is_active").eq("id", target.company_id).maybeSingle();
      if (companyError || !company?.is_active) return reply(403, { error: "Perusahaan tidak aktif." });
      if (action === "update") {
        if (!name || name.length > 160 || typeof body?.is_active !== "boolean") {
          return reply(400, { error: "Periksa nama dan status akun." });
        }
        const { data, error } = await admin.from("company_accounts")
          .update({ full_name: name, is_active: body.is_active }).eq("user_id", targetId)
          .eq("access_role", target.access_role).eq("company_id", target.company_id).select("user_id").maybeSingle();
        return error || !data ? reply(409, { error: "Akun belum dapat diperbarui." }) : reply(200, { id: targetId });
      }
      if (action === "reset_password") {
        if (typeof password !== "string" || password.length < 8 || password !== body?.password_confirm) {
          return reply(400, { error: "Periksa password dan konfirmasinya." });
        }
        const { error } = await admin.auth.admin.updateUserById(targetId, { password });
        return error ? reply(409, { error: "Password belum dapat diubah." }) : reply(200, { id: targetId });
      }
      const { error } = await admin.auth.admin.deleteUser(targetId);
      return error ? reply(409, { error: "Akun belum dapat dihapus." }) : reply(200, { id: targetId });
    }

    const platform = caller.access_role === "platform_admin";
    const companyId = platform ? body?.company_id : caller.company_id;
    if (!name || name.length > 160 || !email || typeof password !== "string" || password.length < 8 ||
      typeof companyId !== "string" || !/^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(companyId)) {
      return reply(400, { error: "Periksa nama, email, perusahaan, dan password minimal 8 karakter." });
    }

    const { data: company, error: companyError } = await client.from("companies")
      .select("id,is_active").eq("id", companyId).maybeSingle();
    if (companyError) return reply(503, { error: "Perusahaan belum dapat diperiksa." });
    if (!company?.is_active) return reply(403, { error: "Perusahaan tidak aktif atau tidak ditemukan." });

    const { data: created, error: createError } = await admin.auth.admin.createUser({
      email, password, email_confirm: true,
    });
    if (createError || !created.user) return reply(400, { error: "Akun tidak dapat dibuat. Periksa email dan password." });

    const role = platform ? "company_admin" : "staff";
    const { error: attachError } = await admin.rpc("attach_new_company_account", {
      caller_id: user.id,
      new_user_id: created.user.id,
      target_company_id: company.id,
      target_role: role,
      target_name: name,
    });
    if (attachError) {
      // A failed HTTP response can be ambiguous. Confirm absence before compensating.
      const { data: attached, error: checkError } = await admin.from("company_accounts")
        .select("company_id,access_role").eq("user_id", created.user.id).maybeSingle();
      if (attached?.company_id === company.id && attached.access_role === role) {
        return reply(201, { id: created.user.id, company_id: company.id, access_role: role });
      }
      if (!checkError && !attached) {
        const { error: cleanupError } = await admin.auth.admin.deleteUser(created.user.id);
        if (cleanupError) console.error("company account cleanup required", created.user.id);
      } else {
        console.error("company account state requires verification", created.user.id);
      }
      return reply(409, { error: "Akun belum dapat dihubungkan ke perusahaan." });
    }
    return reply(201, { id: created.user.id, company_id: company.id, access_role: role });
  } catch {
    return reply(503, { error: "Layanan pembuatan akun sedang tidak tersedia." });
  }
});
