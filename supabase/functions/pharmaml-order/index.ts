import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Générer le XML PharmaML pour une commande
function generatePharmaMLXML(
  config: {
    codeRepartiteur: string;
    idRepartiteur: string;
    cleSecrete: string;
    idOfficine: string;
  },
  order: {
    id: string;
    numero: string;
    date: string;
  },
  orderLines: Array<{
    code_cip: string;
    libelle: string;
    quantite: number;
  }>
): string {
  const now = new Date().toISOString();
  
  // Format XML basé sur les standards PharmaML (structure hypothétique - à ajuster selon documentation officielle)
  const lignesXML = orderLines.map((line, index) => `
    <Ligne numero="${index + 1}">
      <CodeCIP>${escapeXml(line.code_cip || '')}</CodeCIP>
      <Libelle>${escapeXml(line.libelle || '')}</Libelle>
      <Quantite>${line.quantite}</Quantite>
    </Ligne>`).join('');

  return `<?xml version="1.0" encoding="UTF-8"?>
<PharmaML version="1.0">
  <Header>
    <CodeRepartiteur>${escapeXml(config.codeRepartiteur)}</CodeRepartiteur>
    <IdRepartiteur>${escapeXml(config.idRepartiteur)}</IdRepartiteur>
    <CleSecrete>${escapeXml(config.cleSecrete)}</CleSecrete>
    <IdOfficine>${escapeXml(config.idOfficine)}</IdOfficine>
    <DateHeure>${now}</DateHeure>
    <TypeMessage>COMMANDE</TypeMessage>
  </Header>
  <Commande>
    <NumeroCommande>${escapeXml(order.numero)}</NumeroCommande>
    <DateCommande>${order.date}</DateCommande>
    <ReferenceInterne>${escapeXml(order.id)}</ReferenceInterne>
    <Lignes>${lignesXML}
    </Lignes>
  </Commande>
</PharmaML>`;
}

function escapeXml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { commande_id, fournisseur_id, tenant_id } = await req.json();

    if (!commande_id || !fournisseur_id || !tenant_id) {
      return new Response(
        JSON.stringify({ success: false, error: 'Paramètres manquants (commande_id, fournisseur_id, tenant_id)' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    console.log(`Processing PharmaML order: commande_id=${commande_id}, fournisseur_id=${fournisseur_id}`);

    // Récupérer la configuration PharmaML du fournisseur
    const { data: supplier, error: supplierError } = await supabaseClient
      .from('fournisseurs')
      .select('*')
      .eq('id', fournisseur_id)
      .single();

    if (supplierError || !supplier) {
      return new Response(
        JSON.stringify({ success: false, error: 'Fournisseur non trouvé' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
      );
    }

    // Vérifier que PharmaML est configuré
    if (!supplier.pharmaml_enabled) {
      return new Response(
        JSON.stringify({ success: false, error: 'PharmaML non activé pour ce fournisseur' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    if (!supplier.pharmaml_url || !supplier.pharmaml_id_repartiteur || !supplier.pharmaml_id_officine) {
      return new Response(
        JSON.stringify({ success: false, error: 'Configuration PharmaML incomplète' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // Récupérer les détails de la commande
    const { data: order, error: orderError } = await supabaseClient
      .from('commandes_fournisseurs')
      .select('*')
      .eq('id', commande_id)
      .single();

    if (orderError || !order) {
      return new Response(
        JSON.stringify({ success: false, error: 'Commande non trouvée' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
      );
    }

    // Récupérer les lignes de commande avec les produits
    const { data: orderLines, error: linesError } = await supabaseClient
      .from('lignes_commande_fournisseur')
      .select(`
        *,
        produit:produits(libelle_produit, code_cip)
      `)
      .eq('commande_id', commande_id);

    if (linesError) {
      console.error('Error fetching order lines:', linesError);
      return new Response(
        JSON.stringify({ success: false, error: 'Erreur lors de la récupération des lignes de commande' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    if (!orderLines || orderLines.length === 0) {
      return new Response(
        JSON.stringify({ success: false, error: 'Aucune ligne de commande trouvée' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // Générer le numéro de commande
    const orderNumber = `CMD-${new Date(order.date_commande).getFullYear()}-${order.id.slice(-6).toUpperCase()}`;

    // Préparer les lignes pour le XML
    const xmlLines = orderLines.map(line => ({
      code_cip: line.produit?.code_cip || '',
      libelle: line.produit?.libelle_produit || '',
      quantite: line.quantite_commandee || 0,
    }));

    // Générer le XML PharmaML
    const xmlContent = generatePharmaMLXML(
      {
        codeRepartiteur: supplier.pharmaml_code_repartiteur || '28',
        idRepartiteur: supplier.pharmaml_id_repartiteur,
        cleSecrete: supplier.pharmaml_cle_secrete || 'PHDA',
        idOfficine: supplier.pharmaml_id_officine,
      },
      {
        id: order.id,
        numero: orderNumber,
        date: order.date_commande,
      },
      xmlLines
    );

    console.log('Generated PharmaML XML:', xmlContent.substring(0, 500));

    // Envoyer la commande au serveur PharmaML
    const startTime = Date.now();
    let responseXml = '';
    let transmissionStatus: 'success' | 'error' | 'timeout' = 'error';
    let errorCode = null;
    let message = '';

    try {
      const response = await fetch(supplier.pharmaml_url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/xml; charset=utf-8',
          'Accept': 'application/xml, text/xml',
        },
        body: xmlContent,
      });

      const duration = Date.now() - startTime;
      responseXml = await response.text();

      if (response.ok) {
        transmissionStatus = 'success';
        message = `Commande transmise avec succès (${duration}ms)`;
      } else {
        transmissionStatus = 'error';
        errorCode = response.status.toString();
        message = `Erreur serveur: ${response.status} ${response.statusText}`;
      }

      console.log(`PharmaML response: status=${response.status}, duration=${duration}ms`);

    } catch (fetchError) {
      const duration = Date.now() - startTime;
      
      if (fetchError.name === 'TimeoutError' || duration > 30000) {
        transmissionStatus = 'timeout';
        message = 'Délai d\'attente dépassé';
      } else {
        transmissionStatus = 'error';
        message = `Erreur de connexion: ${fetchError.message}`;
      }
      
      errorCode = 'NETWORK_ERROR';
      console.error('PharmaML fetch error:', fetchError);
    }

    const totalDuration = Date.now() - startTime;

    // Enregistrer la transmission dans l'historique
    const { data: transmission, error: transmissionError } = await supabaseClient
      .from('pharmaml_transmissions')
      .insert({
        tenant_id,
        commande_id,
        fournisseur_id,
        xml_envoye: xmlContent,
        xml_reponse: responseXml,
        statut: transmissionStatus,
        code_erreur: errorCode,
        message,
        numero_commande_pharmaml: orderNumber,
        duree_ms: totalDuration,
      })
      .select()
      .single();

    if (transmissionError) {
      console.error('Error saving transmission:', transmissionError);
    }

    // Mettre à jour le statut de la commande si succès
    if (transmissionStatus === 'success') {
      await supabaseClient
        .from('commandes_fournisseurs')
        .update({ statut: 'Envoyé PharmaML' })
        .eq('id', commande_id);
    }

    return new Response(
      JSON.stringify({
        success: transmissionStatus === 'success',
        transmission_id: transmission?.id,
        status: transmissionStatus,
        message,
        duration_ms: totalDuration,
        order_number: orderNumber,
        lines_count: orderLines.length,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('PharmaML order error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
