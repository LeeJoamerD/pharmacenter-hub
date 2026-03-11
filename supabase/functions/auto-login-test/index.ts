import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const TEST_USER_EMAIL = "support@pharmasoft-djlcs.com";
const TEST_TENANT_ID = "2f7365aa-eadd-4aa9-a5c8-330b97d55ea8";

const RequestSchema = z.object({
  email: z.string().email().max(255).toLowerCase(),
});

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const rawBody = await req.json();
    const parseResult = RequestSchema.safeParse(rawBody);
    if (!parseResult.success) {
      return new Response(
        JSON.stringify({ error: "Email invalide" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }
    const { email } = parseResult.data;

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify email is in allowed_test_emails and active
    const { data: allowed, error: allowedError } = await supabase
      .from("allowed_test_emails")
      .select("id, is_active")
      .eq("email", email)
      .eq("is_active", true)
      .maybeSingle();

    if (allowedError || !allowed) {
      return new Response(
        JSON.stringify({ error: "Email non autorisé pour les tests" }),
        { status: 403, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Verify that OTP was recently validated for this email
    const { data: verifiedCode, error: codeError } = await supabase
      .from("verification_codes")
      .select("id, verified_at")
      .eq("email", email)
      .eq("type", "email")
      .not("verified_at", "is", null)
      .order("verified_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (codeError || !verifiedCode) {
      return new Response(
        JSON.stringify({ error: "Code de vérification non validé" }),
        { status: 403, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Check code was verified within the last 5 minutes
    const verifiedAt = new Date(verifiedCode.verified_at);
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    if (verifiedAt < fiveMinutesAgo) {
      return new Response(
        JSON.stringify({ error: "Code expiré, veuillez recommencer" }),
        { status: 403, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Generate magic link for the test user account
    const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
      type: "magiclink",
      email: TEST_USER_EMAIL,
    });

    if (linkError || !linkData) {
      console.error("Error generating magic link:", linkError);
      return new Response(
        JSON.stringify({ error: "Erreur de connexion au compte test" }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Create a real pharmacy session via RPC
    const { data: sessionData, error: sessionError } = await supabase.rpc('create_pharmacy_session', {
      p_pharmacy_id: TEST_TENANT_ID,
      p_ip_address: null,
      p_user_agent: 'test-access'
    });

    if (sessionError || !sessionData) {
      console.error("Error creating pharmacy session:", sessionError);
      return new Response(
        JSON.stringify({ error: "Erreur création session pharmacie" }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const sessionResult = sessionData as { success: boolean; session_token?: string; expires_at?: string; error?: string };

    if (!sessionResult.success || !sessionResult.session_token) {
      console.error("Session creation failed:", sessionResult.error);
      return new Response(
        JSON.stringify({ error: "Erreur création session pharmacie" }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Fetch pharmacy data for enriched localStorage
    const { data: pharmacyData, error: pharmacyError } = await supabase
      .from("pharmacies")
      .select("id, name, email, city, status, address, departement, arrondissement")
      .eq("id", TEST_TENANT_ID)
      .single();

    if (pharmacyError || !pharmacyData) {
      console.error("Error fetching pharmacy data:", pharmacyError);
    }

    // Extract tokens from the link properties
    const { properties } = linkData;

    return new Response(
      JSON.stringify({
        success: true,
        access_token: properties?.access_token,
        refresh_token: properties?.refresh_token,
        session_token: sessionResult.session_token,
        expires_at: sessionResult.expires_at,
        pharmacy: pharmacyData || { id: TEST_TENANT_ID, name: "Pharmacie TESTS" },
      }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("Erreur auto-login-test:", error);
    return new Response(
      JSON.stringify({ error: "Une erreur est survenue" }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
