import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const body = await req.json();
    const { action, email, type } = body;

    // Check if email exists in employees/ojts table
    if (action === "check-email") {
      const table = type === "employee" ? "employees" : "ojts";
      const { data } = await supabase
        .from(table)
        .select("id, auth_user_id, full_name")
        .eq("email", email)
        .maybeSingle();

      if (!data) {
        return new Response(
          JSON.stringify({ exists: false }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({
          exists: true,
          hasAccount: !!data.auth_user_id,
          fullName: data.full_name,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Link authenticated user to employee/ojt record and assign role
    if (action === "link-account") {
      const authHeader = req.headers.get("Authorization");
      if (!authHeader) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const anonKey = Deno.env.get("SUPABASE_PUBLISHABLE_KEY")!;
      const userClient = createClient(supabaseUrl, anonKey, {
        global: { headers: { Authorization: authHeader } },
      });
      const { data: { user } } = await userClient.auth.getUser();

      if (!user) {
        return new Response(JSON.stringify({ error: "Invalid token" }), {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const table = type === "employee" ? "employees" : "ojts";
      const role = type === "employee" ? "employee" : "ojt";

      const { data: record } = await supabase
        .from(table)
        .select("id, auth_user_id")
        .eq("email", user.email)
        .maybeSingle();

      if (!record) {
        return new Response(JSON.stringify({ error: "Record not found" }), {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      let isNew = false;
      if (!record.auth_user_id) {
        isNew = true;
        await supabase.from(table).update({ auth_user_id: user.id }).eq("id", record.id);
        
        // Check if role already exists before inserting
        const { data: existingRole } = await supabase
          .from("user_roles")
          .select("id")
          .eq("user_id", user.id)
          .eq("role", role)
          .maybeSingle();

        if (!existingRole) {
          await supabase.from("user_roles").insert({ user_id: user.id, role });
        }

        // Create government IDs record for employees
        if (type === "employee") {
          const { data: existingGov } = await supabase
            .from("employee_government_ids")
            .select("id")
            .eq("employee_id", record.id)
            .maybeSingle();

          if (!existingGov) {
            await supabase.from("employee_government_ids").insert({
              employee_id: record.id,
              auth_user_id: user.id,
            });
          }
        }
      }

      return new Response(
        JSON.stringify({ success: true, isNew, recordId: record.id }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get files for portal users
    if (action === "get-files") {
      const authHeader = req.headers.get("Authorization");
      if (!authHeader) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { data: files } = await supabase
        .from("files_metadata")
        .select("*")
        .order("created_at", { ascending: false });

      return new Response(
        JSON.stringify({ files: files || [] }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Admin manual link - link a personnel record to an auth account by email
    if (action === "link") {
      const { email: linkEmail, personId, personType } = body;

      if (!linkEmail || !personId || !personType) {
        return new Response(JSON.stringify({ error: "Missing required fields" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const table = personType === "employees" ? "employees" : "ojts";
      const role = personType === "employees" ? "employee" : "ojt";

      // Check if user exists in auth
      const { data: authUsers, error: listError } = await supabase.auth.admin.listUsers();
      if (listError) throw listError;

      const authUser = authUsers.users.find((u) => u.email?.toLowerCase() === linkEmail.toLowerCase());

      if (!authUser) {
        return new Response(
          JSON.stringify({ error: `No auth account found for email: ${linkEmail}. The user must sign up first.` }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Check if this auth user is already linked to another record
      const { data: existingLink } = await supabase
        .from(table)
        .select("id, full_name")
        .eq("auth_user_id", authUser.id)
        .maybeSingle();

      if (existingLink && existingLink.id !== personId) {
        return new Response(
          JSON.stringify({ error: `This auth account is already linked to: ${existingLink.full_name}` }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Update the personnel record with auth_user_id
      await supabase.from(table).update({ auth_user_id: authUser.id, email: linkEmail.toLowerCase() }).eq("id", personId);

      // Add role if not exists
      const { data: existingRole } = await supabase
        .from("user_roles")
        .select("id")
        .eq("user_id", authUser.id)
        .eq("role", role)
        .maybeSingle();

      if (!existingRole) {
        await supabase.from("user_roles").insert({ user_id: authUser.id, role });
      }

      // Create government IDs record for employees if not exists
      if (personType === "employees") {
        const { data: existingGov } = await supabase
          .from("employee_government_ids")
          .select("id")
          .eq("employee_id", personId)
          .maybeSingle();

        if (!existingGov) {
          await supabase.from("employee_government_ids").insert({
            employee_id: personId,
            auth_user_id: authUser.id,
          });
        }
      }

      return new Response(
        JSON.stringify({ success: true, linkedUserId: authUser.id }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(JSON.stringify({ error: "Invalid action" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
