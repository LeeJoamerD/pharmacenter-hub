import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
}

interface VidalPackage {
  id: number
  name: string
  productId: number | null
  cip13: string | null
  cip7: string | null
  cis: string | null
  ucd: string | null
  company: string | null
  activeSubstances: string | null
  galenicalForm: string | null
  atcClass: string | null
  publicPrice: number | null
  refundRate: string | null
  marketStatus: string | null
  genericType: string | null
  isNarcotic: boolean
  isAssimilatedNarcotic: boolean
  safetyAlert: boolean
}

async function getVidalCredentials(supabaseAdmin: any) {
  const keys = ['VIDAL_API_URL', 'VIDAL_APP_ID', 'VIDAL_APP_KEY']
  const { data, error } = await supabaseAdmin
    .from('platform_settings')
    .select('setting_key, setting_value')
    .in('setting_key', keys)

  if (error) throw new Error(`Erreur lecture credentials: ${error.message}`)

  const settings: Record<string, string> = {}
  for (const row of data || []) {
    settings[row.setting_key] = row.setting_value
  }

  if (!settings.VIDAL_API_URL || !settings.VIDAL_APP_ID || !settings.VIDAL_APP_KEY) {
    throw new Error('CREDENTIALS_MISSING')
  }

  return settings
}

function parseXmlText(xml: string, tag: string): string | null {
  // Simple XML text extraction - handles <tag>value</tag> and <tag attr="x">value</tag>
  const regex = new RegExp(`<${tag}[^>]*>([^<]*)</${tag}>`, 'i')
  const match = xml.match(regex)
  return match ? match[1].trim() : null
}

function parseXmlAttr(xml: string, tag: string, attr: string): string | null {
  const regex = new RegExp(`<${tag}[^>]*\\s${attr}="([^"]*)"`, 'i')
  const match = xml.match(regex)
  return match ? match[1].trim() : null
}

function extractIdFromHref(href: string | null): number | null {
  if (!href) return null
  const match = href.match(/\/(\d+)$/)
  return match ? parseInt(match[1], 10) : null
}

function parseEntries(xml: string): VidalPackage[] {
  const entries: VidalPackage[] = []
  const entryRegex = /<entry>([\s\S]*?)<\/entry>/g
  let entryMatch

  while ((entryMatch = entryRegex.exec(xml)) !== null) {
    const entry = entryMatch[1]

    // Extract package ID from <id> tag (e.g., "vidal://package/12345")
    const idText = parseXmlText(entry, 'id')
    const packageId = idText ? extractIdFromHref(idText) : null
    if (!packageId) continue

    const name = parseXmlText(entry, 'summary') || parseXmlText(entry, 'title') || ''

    // Product ID from link
    const productHref = parseXmlAttr(entry, 'link[^>]*rel="related"[^>]*title="PRODUCT"', 'href')
      || (() => {
        const m = entry.match(/<link[^>]*title="PRODUCT"[^>]*href="([^"]*)"/)
        return m ? m[1] : null
      })()
    const productId = extractIdFromHref(productHref)

    // Codes
    const cip13Match = entry.match(/<vidal:cip13>([^<]*)</)
    const cip13 = cip13Match ? cip13Match[1].trim() : null

    const cip7Match = entry.match(/<vidal:cip7>([^<]*)</)
    const cip7 = cip7Match ? cip7Match[1].trim() : null

    const cisMatch = entry.match(/<vidal:cis>([^<]*)</)
    const cis = cisMatch ? cisMatch[1].trim() : null

    const ucdMatch = entry.match(/<vidal:ucd>([^<]*)</)
    const ucd = ucdMatch ? ucdMatch[1].trim() : null

    // Company
    const companyMatch = entry.match(/<vidal:company[^>]*>([^<]*)</)
    const company = companyMatch ? companyMatch[1].trim() : null

    // Active substances
    const substancesMatch = entry.match(/<vidal:activeSubstances>([^<]*)</)
    const activeSubstances = substancesMatch ? substancesMatch[1].trim() : null

    // Galenic form
    const formMatch = entry.match(/<vidal:galenicalForm[^>]*>([^<]*)</)
    const galenicalForm = formMatch ? formMatch[1].trim() : null

    // ATC class
    const atcMatch = entry.match(/<vidal:atcClass[^>]*>([^<]*)</)
    const atcClass = atcMatch ? atcMatch[1].trim() : null

    // Price
    const priceMatch = entry.match(/<vidal:publicPrice>([^<]*)</)
    const publicPrice = priceMatch ? parseFloat(priceMatch[1].trim()) : null

    // Refund rate
    const refundMatch = entry.match(/<vidal:refundRate>([^<]*)</)
    const refundRate = refundMatch ? refundMatch[1].trim() : null

    // Market status
    const marketMatch = entry.match(/<vidal:marketStatus[^>]*name="([^"]*)"/)
    const marketStatus = marketMatch ? marketMatch[1].trim() :
      (() => { const m = entry.match(/<vidal:marketStatus>([^<]*)</); return m ? m[1].trim() : null })()

    // Generic type
    const genericMatch = entry.match(/<vidal:genericType>([^<]*)</)
    const genericType = genericMatch ? genericMatch[1].trim() : null

    // Indicators: narcotic (63), assimilated narcotic (62)
    const isNarcotic = /<vidal:indicator[^>]*id="63"/.test(entry)
    const isAssimilatedNarcotic = /<vidal:indicator[^>]*id="62"/.test(entry)

    // Safety alert (indicator 24 = "Médicament à surveillance particulière")
    const safetyAlert = /<vidal:indicator[^>]*id="24"/.test(entry)

    entries.push({
      id: packageId,
      name,
      productId,
      cip13,
      cip7,
      cis,
      ucd,
      company,
      activeSubstances,
      galenicalForm,
      atcClass,
      publicPrice,
      refundRate,
      marketStatus,
      genericType,
      isNarcotic,
      isAssimilatedNarcotic,
      safetyAlert,
    })
  }

  return entries
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    const { action, query, searchMode, pageSize = 25, startPage = 1 } = await req.json()

    let credentials: Record<string, string>
    try {
      credentials = await getVidalCredentials(supabaseAdmin)
    } catch (e: any) {
      if (e.message === 'CREDENTIALS_MISSING') {
        return new Response(
          JSON.stringify({ error: 'CREDENTIALS_MISSING', message: 'Les credentials VIDAL ne sont pas configurés. Allez dans Configuration > Base VIDAL.' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
      throw e
    }

    const baseUrl = credentials.VIDAL_API_URL.replace(/\/$/, '')
    const authParams = `app_id=${encodeURIComponent(credentials.VIDAL_APP_ID)}&app_key=${encodeURIComponent(credentials.VIDAL_APP_KEY)}`

    if (action === 'search') {
      let url: string

      if (searchMode === 'cip') {
        // Search by CIP code
        url = `${baseUrl}/rest/api/search?code=${encodeURIComponent(query)}&filter=PACKAGE&${authParams}`
      } else {
        // Search by label (default)
        url = `${baseUrl}/rest/api/packages?q=${encodeURIComponent(query)}&start-page=${startPage}&page-size=${pageSize}&${authParams}`
      }

      console.log('VIDAL API call:', url.replace(credentials.VIDAL_APP_KEY, '***'))

      const response = await fetch(url, {
        headers: { 'Accept': 'application/atom+xml' },
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error('VIDAL API error:', response.status, errorText)
        return new Response(
          JSON.stringify({ error: 'VIDAL_API_ERROR', message: `Erreur API VIDAL: ${response.status}`, details: errorText }),
          { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      const xmlText = await response.text()
      const packages = parseEntries(xmlText)

      // Extract total results from opensearch
      const totalMatch = xmlText.match(/<opensearch:totalResults>(\d+)</)
      const totalResults = totalMatch ? parseInt(totalMatch[1], 10) : packages.length

      return new Response(
        JSON.stringify({ packages, totalResults, page: startPage, pageSize }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ error: 'INVALID_ACTION', message: 'Action non supportée. Utilisez "search".' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error: any) {
    console.error('Edge function error:', error)
    return new Response(
      JSON.stringify({ error: 'INTERNAL_ERROR', message: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
