import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface VerifyCodeRequest {
  email: string;
  code: string;
  type: "email" | "sms";
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, code, type }: VerifyCodeRequest = await req.json();

    if (!email || !code || !type) {
      return new Response(
        JSON.stringify({ error: "Email, code et type sont requis" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Créer client Supabase avec service role
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Récupérer le code de vérification
    const { data: verificationCode, error: fetchError } = await supabase
      .from("verification_codes")
      .select("*")
      .eq("email", email)
      .eq("type", type)
      .is("verified_at", null)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (fetchError || !verificationCode) {
      return new Response(
        JSON.stringify({ error: "Aucun code de vérification en attente" }),
        { status: 404, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Vérifier si le code a expiré
    if (new Date(verificationCode.expires_at) < new Date()) {
      return new Response(
        JSON.stringify({ error: "Le code a expiré. Veuillez en demander un nouveau." }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Vérifier le nombre de tentatives
    if (verificationCode.attempts >= verificationCode.max_attempts) {
      return new Response(
        JSON.stringify({ error: "Nombre maximum de tentatives atteint. Demandez un nouveau code." }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Incrémenter le compteur de tentatives
    await supabase
      .from("verification_codes")
      .update({ attempts: verificationCode.attempts + 1 })
      .eq("id", verificationCode.id);

    // Vérifier le code
    if (verificationCode.code !== code) {
      const remainingAttempts = verificationCode.max_attempts - verificationCode.attempts - 1;
      return new Response(
        JSON.stringify({ 
          error: `Code incorrect. ${remainingAttempts} tentative(s) restante(s).`,
          remainingAttempts
        }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Marquer le code comme vérifié
    await supabase
      .from("verification_codes")
      .update({ verified_at: new Date().toISOString() })
      .eq("id", verificationCode.id);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: type === "email" 
          ? "Adresse email vérifiée avec succès" 
          : "Numéro de téléphone vérifié avec succès"
      }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );

  } catch (error: any) {
    console.error("Erreur verify-code:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
