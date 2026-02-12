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

function extractIdFromHref(href: string | null): number | null {
  if (!href) return null
  const match = href.match(/\/(\d+)$/)
  return match ? parseInt(match[1], 10) : null
}

function parsePackageEntries(xml: string): VidalPackage[] {
  const entries: VidalPackage[] = []
  const entryRegex = /<(?:atom:)?entry[^>]*>([\s\S]*?)<\/(?:atom:)?entry>/g
  let entryMatch

  while ((entryMatch = entryRegex.exec(xml)) !== null) {
    const entry = entryMatch[1]

    // Extract package ID from <id> tag (e.g., "vidal://package/12345")
    const idMatch = entry.match(/<id>([^<]*)<\/id>/)
    const idText = idMatch ? idMatch[1].trim() : null
    const packageId = idText ? extractIdFromHref(idText) : null
    if (!packageId) continue

    const name = (() => {
      const s = entry.match(/<summary[^>]*>([^<]*)<\/summary>/)
      if (s) return s[1].trim()
      const t = entry.match(/<title[^>]*>([^<]*)<\/title>/)
      return t ? t[1].trim() : ''
    })()

    // Product ID from link with title="PRODUCT"
    const productHref = (() => {
      const m = entry.match(/<link[^>]*title="PRODUCT"[^>]*href="([^"]*)"/)
      if (m) return m[1]
      const m2 = entry.match(/<link[^>]*href="([^"]*)"[^>]*title="PRODUCT"/)
      return m2 ? m2[1] : null
    })()
    const productId = extractIdFromHref(productHref)

    const cip13 = (entry.match(/<vidal:cip13>([^<]*)</) || [])[1]?.trim() || null
    const cip7 = (entry.match(/<vidal:cip7>([^<]*)</) || [])[1]?.trim() || null
    const cis = (entry.match(/<vidal:cis>([^<]*)</) || [])[1]?.trim() || null
    const ucd = (entry.match(/<vidal:ucd>([^<]*)</) || [])[1]?.trim() || null
    const company = (entry.match(/<vidal:company[^>]*>([^<]*)</) || [])[1]?.trim() || null
    const activeSubstances = (entry.match(/<vidal:activeSubstances>([^<]*)</) || [])[1]?.trim() || null
    const galenicalForm = (entry.match(/<vidal:galenicalForm[^>]*>([^<]*)</) || [])[1]?.trim() || null
    const atcClass = (entry.match(/<vidal:atcClass[^>]*>([^<]*)</) || [])[1]?.trim() || null
    const publicPrice = (() => { const m = entry.match(/<vidal:publicPrice>([^<]*)</); return m ? parseFloat(m[1].trim()) : null })()
    const refundRate = (entry.match(/<vidal:refundRate>([^<]*)</) || [])[1]?.trim() || null
    const marketStatus = (() => {
      const m = entry.match(/<vidal:marketStatus[^>]*name="([^"]*)"/)
      return m ? m[1].trim() : (entry.match(/<vidal:marketStatus>([^<]*)</) || [])[1]?.trim() || null
    })()
    const genericType = (entry.match(/<vidal:genericType>([^<]*)</) || [])[1]?.trim() || null
    const isNarcotic = /<vidal:indicator[^>]*id="63"/.test(entry)
    const isAssimilatedNarcotic = /<vidal:indicator[^>]*id="62"/.test(entry)
    const safetyAlert = /<vidal:indicator[^>]*id="24"/.test(entry)

    entries.push({
      id: packageId, name, productId, cip13, cip7, cis, ucd, company,
      activeSubstances, galenicalForm, atcClass, publicPrice, refundRate,
      marketStatus, genericType, isNarcotic, isAssimilatedNarcotic, safetyAlert,
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
          JSON.stringify({ error: 'CREDENTIALS_MISSING', message: 'Les credentials VIDAL ne sont pas configurés.' }),
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
        // CIP search: use code parameter
        url = `${baseUrl}/packages?code=${encodeURIComponent(query)}&${authParams}`
      } else {
        // Label search: use /packages?q= to get packages directly with CIP codes
        url = `${baseUrl}/packages?q=${encodeURIComponent(query)}&start-page=${startPage}&page-size=${pageSize}&${authParams}`
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
      console.log('VIDAL response status:', response.status, 'length:', xmlText.length)

      const packages = parsePackageEntries(xmlText)
      console.log('Parsed packages count:', packages.length)

      const totalMatch = xmlText.match(/<opensearch:totalResults[^>]*>(\d+)</)
      const totalResults = totalMatch ? parseInt(totalMatch[1], 10) : packages.length

      return new Response(
        JSON.stringify({ packages, totalResults, page: startPage, pageSize }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ error: 'INVALID_ACTION', message: 'Action non supportée.' }),
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
