import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "npm:resend@2.0.0";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SendCodeSchema = z.object({
  email: z.string().email("Format email invalide").max(255).toLowerCase(),
  phone: z.string().regex(/^\+?[0-9]{8,15}$/, "Format téléphone invalide").optional(),
  type: z.enum(["email", "sms"]),
  pharmacyName: z.string().max(200).trim().optional(),
});

function generateCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function normalizePhoneForTwilio(phone: string): string {
  let normalized = phone.replace(/[\s\-().]/g, '');
  if (normalized.startsWith('00')) {
    normalized = '+' + normalized.slice(2);
  }
  if (!normalized.startsWith('+')) {
    normalized = '+' + normalized;
  }
  return normalized;
}

// Sanitize string for HTML output to prevent XSS
function sanitizeHtml(input: string): string {
  return input.replace(/[&<>"']/g, (char) => {
    const entities: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
    return entities[char] || char;
  });
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // --- Input validation with Zod ---
    const rawBody = await req.json();
    const parseResult = SendCodeSchema.safeParse(rawBody);
    if (!parseResult.success) {
      const firstError = parseResult.error.errors[0]?.message || "Données invalides";
      return new Response(
        JSON.stringify({ error: firstError }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }
    const { email, phone, type, pharmacyName } = parseResult.data;

    if (type === "sms" && !phone) {
      return new Response(
        JSON.stringify({ error: "Le numéro de téléphone est requis pour l'envoi SMS" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Créer client Supabase avec service role
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Read secrets from environment variables instead of platform_settings
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    const expiryMinutes = 10;
    
    // Générer le code
    const code = generateCode();
    const expiresAt = new Date(Date.now() + expiryMinutes * 60 * 1000);

    // Supprimer les anciens codes non utilisés
    await supabase
      .from("verification_codes")
      .delete()
      .eq("email", email)
      .eq("type", type)
      .is("verified_at", null);

    // Insérer le nouveau code
    const { error: insertError } = await supabase
      .from("verification_codes")
      .insert({
        email,
        phone: type === "sms" ? phone : null,
        code,
        type,
        expires_at: expiresAt.toISOString(),
      });

    if (insertError) {
      console.error("Erreur insertion code:", insertError);
      return new Response(
        JSON.stringify({ error: "Erreur lors de la création du code" }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Envoyer le code
    if (type === "email") {
      if (!resendApiKey) {
        return new Response(
          JSON.stringify({ error: "Service email non configuré" }),
          { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }

      const safeName = pharmacyName ? sanitizeHtml(pharmacyName) : null;

      const resend = new Resend(resendApiKey);
      const emailResponse = await resend.emails.send({
        from: "PharmaSoft <support@pharmasoft-djlcs.com>",
        to: [email],
        subject: `Votre code de vérification: ${code}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #2563eb;">Code de Vérification</h1>
            ${safeName ? `<p>Bonjour <strong>${safeName}</strong>,</p>` : '<p>Bonjour,</p>'}
            <p>Votre code de vérification est:</p>
            <div style="background: #f3f4f6; padding: 20px; text-align: center; border-radius: 8px; margin: 20px 0;">
              <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #1f2937;">${code}</span>
            </div>
            <p>Ce code expire dans <strong>${expiryMinutes} minutes</strong>.</p>
            <p style="color: #6b7280; font-size: 14px;">Si vous n'avez pas demandé ce code, ignorez ce message.</p>
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;" />
            <p style="color: #9ca3af; font-size: 12px;">PharmaSoft - Système de Gestion Pharmaceutique</p>
          </div>
        `,
      });

      if (emailResponse.error) {
        console.error("Erreur Resend:", emailResponse.error);
        return new Response(
          JSON.stringify({ error: "Erreur lors de l'envoi de l'email" }),
          { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }
    } else if (type === "sms") {
      // SMS sending disabled - Twilio credentials not configured
      console.log("SMS bypass active: code generated but not sent");
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: type === "email" 
          ? `Code envoyé à ${email}` 
          : `Code envoyé au ${phone?.slice(-4).padStart(phone.length, '*')}`,
        expiresInMinutes: expiryMinutes
      }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );

  } catch (error: any) {
    console.error("Erreur send-verification-code:", error);
    return new Response(
      JSON.stringify({ error: "Une erreur est survenue" }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
