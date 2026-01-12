import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SendVerificationRequest {
  email: string;
  phone?: string;
  type: "email" | "sms";
  pharmacyName?: string;
}

function generateCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Normalise un numéro de téléphone au format E.164
function normalizePhoneForTwilio(phone: string): string {
  // Supprimer espaces, tirets, parenthèses, points
  let normalized = phone.replace(/[\s\-().]/g, '');
  
  // Si commence par 00, remplacer par +
  if (normalized.startsWith('00')) {
    normalized = '+' + normalized.slice(2);
  }
  
  // Si ne commence pas par +, ajouter le +
  if (!normalized.startsWith('+')) {
    normalized = '+' + normalized;
  }
  
  return normalized;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, phone, type, pharmacyName }: SendVerificationRequest = await req.json();

    console.log("=== Requête send-verification-code ===");
    console.log("Type:", type);
    console.log("Email:", email);
    if (type === "sms") {
      console.log("Phone (reçu):", phone?.slice(0, 4) + "****" + (phone?.slice(-2) || ""));
    }

    if (!email || !type) {
      return new Response(
        JSON.stringify({ error: "Email et type sont requis" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

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

    // Récupérer les paramètres depuis platform_settings
    const { data: settings } = await supabase
      .from("platform_settings")
      .select("setting_key, setting_value")
      .in("setting_key", [
        "RESEND_API_KEY",
        "TWILIO_ACCOUNT_SID", 
        "TWILIO_AUTH_TOKEN",
        "TWILIO_PHONE_NUMBER",
        "VERIFICATION_CODE_EXPIRY_MINUTES"
      ]);

    const settingsMap = new Map(settings?.map(s => [s.setting_key, s.setting_value]) || []);
    const expiryMinutes = parseInt(settingsMap.get("VERIFICATION_CODE_EXPIRY_MINUTES") || "10");
    
    // Générer le code
    const code = generateCode();
    const expiresAt = new Date(Date.now() + expiryMinutes * 60 * 1000);

    // Supprimer les anciens codes non utilisés pour cet email et type
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
      const resendApiKey = settingsMap.get("RESEND_API_KEY");
      if (!resendApiKey) {
        return new Response(
          JSON.stringify({ error: "Clé API Resend non configurée" }),
          { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }

      const resend = new Resend(resendApiKey);
      const emailResponse = await resend.emails.send({
        from: "PharmaSys <onboarding@resend.dev>",
        to: [email],
        subject: `Votre code de vérification: ${code}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #2563eb;">Code de Vérification</h1>
            ${pharmacyName ? `<p>Bonjour <strong>${pharmacyName}</strong>,</p>` : '<p>Bonjour,</p>'}
            <p>Votre code de vérification est:</p>
            <div style="background: #f3f4f6; padding: 20px; text-align: center; border-radius: 8px; margin: 20px 0;">
              <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #1f2937;">${code}</span>
            </div>
            <p>Ce code expire dans <strong>${expiryMinutes} minutes</strong>.</p>
            <p style="color: #6b7280; font-size: 14px;">Si vous n'avez pas demandé ce code, ignorez ce message.</p>
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;" />
            <p style="color: #9ca3af; font-size: 12px;">PharmaSys - Système de Gestion Pharmaceutique</p>
          </div>
        `,
      });

      console.log("Email envoyé:", emailResponse);
    } else if (type === "sms") {
      const twilioSid = settingsMap.get("TWILIO_ACCOUNT_SID");
      const twilioToken = settingsMap.get("TWILIO_AUTH_TOKEN");
      const twilioPhone = settingsMap.get("TWILIO_PHONE_NUMBER");

      console.log("=== Préparation envoi SMS ===");
      console.log("Twilio SID présent:", !!twilioSid);
      console.log("Twilio Token présent:", !!twilioToken);
      console.log("Twilio Phone (from):", twilioPhone);

      if (!twilioSid || !twilioToken || !twilioPhone) {
        console.error("Configuration Twilio incomplète - SID:", !!twilioSid, "Token:", !!twilioToken, "Phone:", !!twilioPhone);
        return new Response(
          JSON.stringify({ error: "Configuration Twilio incomplète" }),
          { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }

      // Normaliser le numéro de téléphone au format E.164
      const normalizedPhone = normalizePhoneForTwilio(phone!);
      console.log("Phone normalisé (to):", normalizedPhone.slice(0, 4) + "****" + normalizedPhone.slice(-2));

      // Envoyer SMS via Twilio
      const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${twilioSid}/Messages.json`;
      const auth = btoa(`${twilioSid}:${twilioToken}`);

      console.log("Appel Twilio API...");
      const smsResponse = await fetch(twilioUrl, {
        method: "POST",
        headers: {
          "Authorization": `Basic ${auth}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          To: normalizedPhone,
          From: twilioPhone,
          Body: `PharmaSys - Votre code de vérification: ${code}. Valide ${expiryMinutes} min.`,
        }),
      });

      if (!smsResponse.ok) {
        const errorText = await smsResponse.text();
        console.error("Erreur Twilio brute:", errorText);
        
        let errorData: any = {};
        try {
          errorData = JSON.parse(errorText);
        } catch {
          errorData = { message: errorText };
        }
        
        console.error("Erreur Twilio détaillée:", JSON.stringify(errorData));
        
        // Messages d'erreur explicites selon le code Twilio
        let userMessage = "Erreur lors de l'envoi du SMS";
        const twilioCode = errorData.code;
        
        if (twilioCode === 21211 || twilioCode === 21614) {
          userMessage = "Numéro de téléphone invalide. Format attendu: +242XXXXXXXXX";
        } else if (twilioCode === 21608) {
          userMessage = "Ce numéro ne peut pas recevoir de SMS (compte Twilio Trial - numéro non vérifié)";
        } else if (twilioCode === 21612) {
          userMessage = "Le numéro d'envoi Twilio n'est pas configuré pour les SMS";
        } else if (twilioCode === 21408) {
          userMessage = "Permission refusée pour envoyer vers ce pays";
        } else if (errorData.message) {
          userMessage = `Erreur Twilio: ${errorData.message}`;
        }
        
        return new Response(
          JSON.stringify({ error: userMessage }),
          { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }

      const smsResult = await smsResponse.json();
      console.log("SMS envoyé avec succès! SID:", smsResult.sid);
      console.log("SMS envoyé à:", normalizedPhone.slice(0, 4) + "****" + normalizedPhone.slice(-2));
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
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
