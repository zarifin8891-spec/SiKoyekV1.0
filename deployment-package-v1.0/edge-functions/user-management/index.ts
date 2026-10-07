import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);
  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !anonKey || !serviceRoleKey) return json({ error: "Server configuration incomplete" }, 500);
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json({ error: "Missing Authorization header" }, 401);

    const userClient = createClient(supabaseUrl, anonKey, { global: { headers: { Authorization: authHeader } } });
    const adminClient = createClient(supabaseUrl, serviceRoleKey);
    const { data: { user: caller }, error: callerError } = await userClient.auth.getUser();
    if (callerError || !caller) return json({ error: "Unauthorized" }, 401);

    const { data: callerProfile, error: profileError } = await adminClient
      .from("profiles").select("id, role, role_id, is_active").eq("id", caller.id).maybeSingle();
    if (profileError) return json({ error: profileError.message }, 500);
    if (!callerProfile?.is_active || callerProfile.role !== "ADMIN") return json({ error: "Forbidden" }, 403);

    const body = await req.json();
    const action = body?.action;

    if (action === "create") {
      const { email, password, full_name, role = "STAFF", role_id = null } = body;
      if (!email || !password || !full_name) return json({ error: "email, password, and full_name are required" }, 400);
      const { data, error } = await adminClient.auth.admin.createUser({ email, password, email_confirm: true });
      if (error) return json({ error: error.message }, 400);
      const { error: insertError } = await adminClient.from("profiles").insert({ id: data.user.id, email, full_name, role, role_id, is_active: true });
      if (insertError) {
        await adminClient.auth.admin.deleteUser(data.user.id);
        return json({ error: insertError.message }, 400);
      }
      return json({ user: data.user });
    }

    if (action === "update") {
      const { user_id, email, password, full_name, role, role_id, is_active } = body;
      if (!user_id) return json({ error: "user_id is required" }, 400);
      const authUpdate: Record<string, unknown> = {};
      if (email !== undefined) authUpdate.email = email;
      if (password !== undefined) authUpdate.password = password;
      if (email !== undefined) authUpdate.email_confirm = true;
      if (Object.keys(authUpdate).length) {
        const { error } = await adminClient.auth.admin.updateUserById(user_id, authUpdate);
        if (error) return json({ error: error.message }, 400);
      }
      const profileUpdate: Record<string, unknown> = {};
      for (const key of ["email", "full_name", "role", "role_id", "is_active"]) if (body[key] !== undefined) profileUpdate[key] = body[key];
      if (Object.keys(profileUpdate).length) {
        const { error } = await adminClient.from("profiles").update(profileUpdate).eq("id", user_id);
        if (error) return json({ error: error.message }, 400);
      }
      return json({ success: true });
    }

    if (action === "reset_password") {
      const { user_id, password } = body;
      if (!user_id || !password) return json({ error: "user_id and password are required" }, 400);
      const { error } = await adminClient.auth.admin.updateUserById(user_id, { password });
      if (error) return json({ error: error.message }, 400);
      return json({ success: true });
    }

    if (action === "delete") {
      const { user_id } = body;
      if (!user_id || user_id === caller.id) return json({ error: "Invalid user_id" }, 400);
      const { error } = await adminClient.auth.admin.deleteUser(user_id);
      if (error) return json({ error: error.message }, 400);
      return json({ success: true });
    }

    if (action === "update_permissions") {
      const { user_id, role_id } = body;
      if (!user_id) return json({ error: "user_id is required" }, 400);
      const { error } = await adminClient.from("profiles").update({ role_id }).eq("id", user_id);
      if (error) return json({ error: error.message }, 400);
      return json({ success: true });
    }

    return json({ error: "Unsupported action" }, 400);
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : "Internal server error" }, 500);
  }
});
