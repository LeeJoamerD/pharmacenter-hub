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
  isBiosimilar: boolean
  isDoping: boolean
  hasRestrictedPrescription: boolean
  drugInSport: boolean
  tfr: number | null
  ucdPrice: number | null
}

function getVidalCredentials(): Record<string, string> {
  const VIDAL_API_URL = Deno.env.get('VIDAL_API_URL')
  const VIDAL_APP_ID = Deno.env.get('VIDAL_APP_ID')
  const VIDAL_APP_KEY = Deno.env.get('VIDAL_APP_KEY')

  if (!VIDAL_API_URL || !VIDAL_APP_ID || !VIDAL_APP_KEY) {
    throw new Error('CREDENTIALS_MISSING')
  }

  return { VIDAL_API_URL, VIDAL_APP_ID, VIDAL_APP_KEY }
}

function extractVidalField(entry: string, tagName: string): string | null {
  const nameMatch = entry.match(new RegExp(`<vidal:${tagName}[^>]*\\bname="([^"]*)"`))
  if (nameMatch) return nameMatch[1].trim() || null
  const textMatch = entry.match(new RegExp(`<vidal:${tagName}[^>]*>([^<]+)<`))
  if (textMatch) return textMatch[1].trim() || null
  return null
}

function extractIdFromHref(href: string | null): number | null {
  if (!href) return null
  const match = href.match(/\/(\d+)$/)
  return match ? parseInt(match[1], 10) : null
}

function extractRoundValue(entry: string, tagName: string): number | null {
  const rv = entry.match(new RegExp(`<vidal:${tagName}[^>]*roundValue="([^"]*)"`))
  if (rv) return parseFloat(rv[1])
  const m = entry.match(new RegExp(`<vidal:${tagName}[^>]*>([^<]*)<`))
  return m ? parseFloat(m[1].trim()) : null
}

function parsePackageEntries(xml: string): VidalPackage[] {
  const entries: VidalPackage[] = []
  const entryRegex = /<(?:atom:)?entry[^>]*>([\s\S]*?)<\/(?:atom:)?entry>/g
  let entryMatch

  while ((entryMatch = entryRegex.exec(xml)) !== null) {
    const entry = entryMatch[1]

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
    const company = extractVidalField(entry, 'company')
    const galenicalForm = extractVidalField(entry, 'galenicForm')
    const activeSubstances = extractVidalField(entry, 'activeSubstances') || extractVidalField(entry, 'vmp')
    const atcClass = extractVidalField(entry, 'atcClass')

    const publicPrice = extractRoundValue(entry, 'publicPrice')
    const refundRate = (entry.match(/<vidal:refundRate>([^<]*)</) || [])[1]?.trim() || null
    const marketStatus = (() => {
      const m = entry.match(/<vidal:marketStatus[^>]*name="([^"]*)"/)
      return m ? m[1].trim() : (entry.match(/<vidal:marketStatus>([^<]*)</) || [])[1]?.trim() || null
    })()
    const genericType = (entry.match(/<vidal:genericType>([^<]*)</) || [])[1]?.trim() || null

    // Indicators by ID
    const isNarcotic = /<vidal:indicator[^>]*id="63"/.test(entry)
    const isAssimilatedNarcotic = /<vidal:indicator[^>]*id="62"/.test(entry)
    const safetyAlert = /<vidal:indicator[^>]*id="24"/.test(entry)
    const isDoping = /<vidal:indicator[^>]*id="10"/.test(entry)
    const hasRestrictedPrescription = /<vidal:indicator[^>]*id="55"/.test(entry)
    const isBiosimilar = /<vidal:indicator[^>]*id="78"/.test(entry)

    // Additional tags
    const drugInSportMatch = entry.match(/<vidal:drugInSport[^>]*>([^<]*)</)
    const drugInSport = drugInSportMatch ? drugInSportMatch[1].trim().toLowerCase() === 'true' : false

    const tfr = extractRoundValue(entry, 'tfr')
    const ucdPrice = extractRoundValue(entry, 'ucdPrice') || extractRoundValue(entry, 'pricePerDose')

    entries.push({
      id: packageId, name, productId, cip13, cip7, cis, ucd, company,
      activeSubstances, galenicalForm, atcClass, publicPrice, refundRate,
      marketStatus, genericType, isNarcotic, isAssimilatedNarcotic, safetyAlert,
      isBiosimilar, isDoping, hasRestrictedPrescription, drugInSport, tfr, ucdPrice,
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

    const { action, query, searchMode, pageSize = 25, startPage = 1, packageId, substanceId, classificationId, productId, vmpId: directVmpId } = await req.json()

    let credentials: Record<string, string>
    try {
      credentials = getVidalCredentials()
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

    // ── ACTION: search ──
    if (action === 'search') {
      let url: string

      if (searchMode === 'exact-code') {
        // Recherche exacte par code via l'endpoint /search officiel VIDAL
        url = `${baseUrl}/search?q=&code=${encodeURIComponent(query)}&filter=package&${authParams}`
      } else if (searchMode === 'cip') {
        url = `${baseUrl}/packages?code=${encodeURIComponent(query)}&${authParams}`
      } else {
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

    // ── ACTION: get-package-details ──
    if (action === 'get-package-details') {
      if (!packageId) {
        return new Response(
          JSON.stringify({ error: 'MISSING_PACKAGE_ID', message: 'packageId requis.' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      const url = `${baseUrl}/package/${packageId}?${authParams}`
      console.log('VIDAL package details call:', url.replace(credentials.VIDAL_APP_KEY, '***'))

      const response = await fetch(url, {
        headers: { 'Accept': 'application/atom+xml' },
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error('VIDAL package details error:', response.status, errorText)
        return new Response(
          JSON.stringify({ error: 'VIDAL_API_ERROR', message: `Erreur API VIDAL: ${response.status}` }),
          { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      const xmlText = await response.text()

      // Parse detailed fields from the single package entry
      const tfr = extractRoundValue(xmlText, 'tfr')
      const ucdPrice = extractRoundValue(xmlText, 'ucdPrice') || extractRoundValue(xmlText, 'pricePerDose')
      const isDoping = /<vidal:indicator[^>]*id="10"/.test(xmlText)
      const hasRestrictedPrescription = /<vidal:indicator[^>]*id="55"/.test(xmlText)
      const isBiosimilar = /<vidal:indicator[^>]*id="78"/.test(xmlText)
      const drugInSportMatch = xmlText.match(/<vidal:drugInSport[^>]*>([^<]*)</)
      const drugInSport = drugInSportMatch ? drugInSportMatch[1].trim().toLowerCase() === 'true' : false

      return new Response(
        JSON.stringify({ packageId, tfr, ucdPrice, isDoping, hasRestrictedPrescription, isBiosimilar, drugInSport }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // ── ACTION: check-version ──
    if (action === 'check-version') {
      const url = `${baseUrl}/version?${authParams}`
      console.log('VIDAL version check:', url.replace(credentials.VIDAL_APP_KEY, '***'))

      const response = await fetch(url, {
        headers: { 'Accept': 'application/atom+xml' },
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error('VIDAL version error:', response.status, errorText)
        return new Response(
          JSON.stringify({ error: 'VIDAL_API_ERROR', message: `Erreur API VIDAL: ${response.status}` }),
          { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      const xmlText = await response.text()
      console.log('VIDAL version response:', xmlText.substring(0, 500))

      const version = (xmlText.match(/<vidal:version[^>]*>([^<]*)</) || [])[1]?.trim() || null
      const weeklyDate = (xmlText.match(/<vidal:weeklyDate[^>]*>([^<]*)</) || [])[1]?.trim() || null
      const dailyDate = (xmlText.match(/<vidal:dailyDate[^>]*>([^<]*)</) || [])[1]?.trim() || null

      // Get last known version from platform_settings
      const { data: lastVersionData } = await supabaseAdmin
        .from('platform_settings')
        .select('setting_value')
        .eq('setting_key', 'VIDAL_LAST_VERSION')
        .single()

      const lastVersion = lastVersionData?.setting_value || null
      const hasUpdate = version !== null && version !== lastVersion

      // Update stored version if changed
      if (hasUpdate && version) {
        await supabaseAdmin
          .from('platform_settings')
          .upsert(
            { setting_key: 'VIDAL_LAST_VERSION', setting_value: version, is_secret: false },
            { onConflict: 'setting_key' }
          )

        // Also store the check date
        await supabaseAdmin
          .from('platform_settings')
          .upsert(
            { setting_key: 'VIDAL_LAST_CHECK_DATE', setting_value: new Date().toISOString(), is_secret: false },
            { onConflict: 'setting_key' }
          )
      }

      return new Response(
        JSON.stringify({ version, weeklyDate, dailyDate, lastVersion, hasUpdate, checkedAt: new Date().toISOString() }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // ── ACTION: search-substances ──
    if (action === 'search-substances') {
      if (!query) {
        return new Response(
          JSON.stringify({ error: 'MISSING_QUERY', message: 'query requis.' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      const url = `${baseUrl}/molecules/active-substances?q=${encodeURIComponent(query)}&${authParams}`
      console.log('VIDAL search-substances:', url.replace(credentials.VIDAL_APP_KEY, '***'))

      const response = await fetch(url, { headers: { 'Accept': 'application/atom+xml' } })
      if (!response.ok) {
        return new Response(
          JSON.stringify({ error: 'VIDAL_API_ERROR', message: `Erreur API VIDAL: ${response.status}` }),
          { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      const xmlText = await response.text()
      const substances: { id: number; name: string }[] = []
      const entryRegex = /<(?:atom:)?entry[^>]*>([\s\S]*?)<\/(?:atom:)?entry>/g
      let m
      while ((m = entryRegex.exec(xmlText)) !== null) {
        const entry = m[1]
        const idMatch = entry.match(/<id>([^<]*)<\/id>/)
        const titleMatch = entry.match(/<title[^>]*>([^<]*)<\/title>/)
        const substanceId = idMatch ? extractIdFromHref(idMatch[1].trim()) : null
        const name = titleMatch ? titleMatch[1].trim() : ''
        if (substanceId && name) {
          substances.push({ id: substanceId, name })
        }
      }

      return new Response(
        JSON.stringify({ substances }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // ── ACTION: get-substance-details ──
    if (action === 'get-substance-details') {
      if (!substanceId) {
        return new Response(
          JSON.stringify({ error: 'MISSING_SUBSTANCE_ID', message: 'substanceId requis.' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Get VMPs for this substance
      const vmpsUrl = `${baseUrl}/molecule/active-substance/${substanceId}/vmps?${authParams}`
      console.log('VIDAL get-substance VMPs:', vmpsUrl.replace(credentials.VIDAL_APP_KEY, '***'))

      const vmpsResponse = await fetch(vmpsUrl, { headers: { 'Accept': 'application/atom+xml' } })
      if (!vmpsResponse.ok) {
        return new Response(
          JSON.stringify({ error: 'VIDAL_API_ERROR', message: `Erreur API VIDAL VMPs: ${vmpsResponse.status}` }),
          { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      const vmpsXml = await vmpsResponse.text()
      // Extract first VMP id
      const vmpIdMatch = vmpsXml.match(/<id>[^<]*\/(\d+)<\/id>/)
      const vmpId = vmpIdMatch ? parseInt(vmpIdMatch[1], 10) : null

      let contraindications: string[] = []
      let sideEffects: string[] = []

      if (vmpId) {
        // Fetch contraindications and side effects in parallel
        const [ciRes, seRes] = await Promise.all([
          fetch(`${baseUrl}/vmp/${vmpId}/contraindications?${authParams}`, { headers: { 'Accept': 'application/atom+xml' } }),
          fetch(`${baseUrl}/vmp/${vmpId}/side-effects?${authParams}`, { headers: { 'Accept': 'application/atom+xml' } }),
        ])

        if (ciRes.ok) {
          const ciXml = await ciRes.text()
          const ciRegex = /<title[^>]*>([^<]+)<\/title>/g
          let ciMatch
          while ((ciMatch = ciRegex.exec(ciXml)) !== null) {
            const val = ciMatch[1].trim()
            if (val && !val.startsWith('VIDAL') && val.length > 2) contraindications.push(val)
          }
        }

        if (seRes.ok) {
          const seXml = await seRes.text()
          const seRegex = /<title[^>]*>([^<]+)<\/title>/g
          let seMatch
          while ((seMatch = seRegex.exec(seXml)) !== null) {
            const val = seMatch[1].trim()
            if (val && !val.startsWith('VIDAL') && val.length > 2) sideEffects.push(val)
          }
        }
      }

      return new Response(
        JSON.stringify({ substanceId, vmpId, contraindications, sideEffects }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // ── ACTION: get-atc-children ──
    if (action === 'get-atc-children') {
      if (!classificationId) {
        return new Response(
          JSON.stringify({ error: 'MISSING_CLASSIFICATION_ID', message: 'classificationId requis.' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      const url = `${baseUrl}/atc-classification/${classificationId}/children?${authParams}`
      console.log('VIDAL get-atc-children:', url.replace(credentials.VIDAL_APP_KEY, '***'))

      const response = await fetch(url, { headers: { 'Accept': 'application/atom+xml' } })
      if (!response.ok) {
        return new Response(
          JSON.stringify({ error: 'VIDAL_API_ERROR', message: `Erreur API VIDAL: ${response.status}` }),
          { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      const xmlText = await response.text()
      const children: { id: number; code: string; label: string }[] = []
      const entryRegex4 = /<(?:atom:)?entry[^>]*>([\s\S]*?)<\/(?:atom:)?entry>/g
      let m4
      while ((m4 = entryRegex4.exec(xmlText)) !== null) {
        const entry = m4[1]
        const idMatch = entry.match(/<id>([^<]*)<\/id>/)
        const titleMatch = entry.match(/<title[^>]*>([^<]*)<\/title>/)
        const atcId = idMatch ? extractIdFromHref(idMatch[1].trim()) : null
        const label = titleMatch ? titleMatch[1].trim() : ''
        const codeMatch = entry.match(/<vidal:code>([^<]*)</) || entry.match(/<summary[^>]*>([^<]*)</)
        const code = codeMatch ? codeMatch[1].trim() : ''
        if (atcId && label) {
          children.push({ id: atcId, code, label })
        }
      }

      return new Response(
        JSON.stringify({ children }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // ── ACTION: get-product-info ──
    if (action === 'get-product-info') {
      if (!productId) {
        return new Response(
          JSON.stringify({ error: 'MISSING_PRODUCT_ID', message: 'productId requis.' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Fetch all endpoints in parallel
      const [productRes, indicationsRes, contraindicationsRes, sideEffectsRes, prescriptionRes, monographyRes] = await Promise.all([
        fetch(`${baseUrl}/product/${productId}?${authParams}`, { headers: { 'Accept': 'application/atom+xml' } }),
        fetch(`${baseUrl}/product/${productId}/indications?${authParams}`, { headers: { 'Accept': 'application/atom+xml' } }),
        fetch(`${baseUrl}/product/${productId}/contraindications?${authParams}`, { headers: { 'Accept': 'application/atom+xml' } }),
        fetch(`${baseUrl}/product/${productId}/side-effects?${authParams}`, { headers: { 'Accept': 'application/atom+xml' } }),
        fetch(`${baseUrl}/product/${productId}/prescription-conditions?${authParams}`, { headers: { 'Accept': 'application/atom+xml' } }),
        fetch(`${baseUrl}/product/${productId}/documents/opt?type=MONO&${authParams}`, { headers: { 'Accept': 'application/atom+xml' } }),
      ])

      // Parse product info
      let name = '', company = '', activeSubstances = '', galenicalForm = '', storageCondition: string | null = null
      const indicators = {
        isNarcotic: false, isAssimilatedNarcotic: false, isCrushable: false, isScorable: false,
        isPhotosensitive: false, isDoping: false, isBiosimilar: false, hasRestrictedPrescription: false, safetyAlert: false,
      }

      if (productRes.ok) {
        const xml = await productRes.text()
        name = (xml.match(/<vidal:name>([^<]*)</) || xml.match(/<title[^>]*>([^<]*)<\/title>/) || [])[1]?.trim() || ''
        company = extractVidalField(xml, 'company') || ''
        activeSubstances = extractVidalField(xml, 'activeSubstances') || extractVidalField(xml, 'vmp') || ''
        galenicalForm = extractVidalField(xml, 'galenicForm') || ''
        const storageMatch = xml.match(/<vidal:storageCondition[^>]*name="([^"]*)"/) || xml.match(/<vidal:storageCondition[^>]*>([^<]*)/)
        storageCondition = storageMatch ? storageMatch[1].trim() : null
        indicators.isNarcotic = /<vidal:indicator[^>]*id="63"/.test(xml)
        indicators.isAssimilatedNarcotic = /<vidal:indicator[^>]*id="62"/.test(xml)
        indicators.safetyAlert = /<vidal:indicator[^>]*id="24"/.test(xml)
        indicators.isDoping = /<vidal:indicator[^>]*id="10"/.test(xml)
        indicators.hasRestrictedPrescription = /<vidal:indicator[^>]*id="55"/.test(xml)
        indicators.isBiosimilar = /<vidal:indicator[^>]*id="78"/.test(xml)
        indicators.isPhotosensitive = /<vidal:indicator[^>]*id="60"/.test(xml)
        indicators.isCrushable = /<vidal:indicator[^>]*id="80"/.test(xml)
        indicators.isScorable = /<vidal:indicator[^>]*id="81"/.test(xml)
      }

      // Helper to extract entry titles from XML feeds
      const extractTitles = async (res: Response): Promise<string[]> => {
        if (!res.ok) return []
        const xml = await res.text()
        const titles: string[] = []
        const re = /<(?:atom:)?entry[^>]*>([\s\S]*?)<\/(?:atom:)?entry>/g
        let em
        while ((em = re.exec(xml)) !== null) {
          const t = em[1].match(/<title[^>]*>([^<]+)<\/title>/)
          if (t) {
            const val = t[1].trim()
            if (val && !val.startsWith('VIDAL') && val.length > 2) titles.push(val)
          }
        }
        return titles
      }

      const [indications, contraindications, sideEffects, prescriptionConditions] = await Promise.all([
        extractTitles(indicationsRes),
        extractTitles(contraindicationsRes),
        extractTitles(sideEffectsRes),
        extractTitles(prescriptionRes),
      ])

      // Monography URL
      let monographyUrl: string | null = null
      if (monographyRes.ok) {
        const monoXml = await monographyRes.text()
        const linkMatch = monoXml.match(/<link[^>]*href="([^"]*)"[^>]*type="text\/html"/) || monoXml.match(/<link[^>]*href="([^"]*)"/)
        monographyUrl = linkMatch ? linkMatch[1] : null
      }

      return new Response(
        JSON.stringify({
          productId, name, company, activeSubstances, galenicalForm,
          indications, contraindications, sideEffects, prescriptionConditions,
          monographyUrl, storageCondition, indicators,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // ── ACTION: get-generic-group ──
    if (action === 'get-generic-group') {
      if (!productId) {
        return new Response(
          JSON.stringify({ error: 'MISSING_PRODUCT_ID', message: 'productId requis.' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      const url = `${baseUrl}/product/${productId}/generic-group?${authParams}`
      console.log('VIDAL get-generic-group:', url.replace(credentials.VIDAL_APP_KEY, '***'))

      const response = await fetch(url, { headers: { 'Accept': 'application/atom+xml' } })
      if (!response.ok) {
        // 404 means no generic group — return empty
        if (response.status === 404) {
          return new Response(JSON.stringify({ products: [] }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
        }
        return new Response(
          JSON.stringify({ error: 'VIDAL_API_ERROR', message: `Erreur API VIDAL: ${response.status}` }),
          { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      const xmlText = await response.text()
      const products: { id: number; name: string; company: string | null; galenicalForm: string | null }[] = []
      const entryRegexGG = /<(?:atom:)?entry[^>]*>([\s\S]*?)<\/(?:atom:)?entry>/g
      let mGG
      while ((mGG = entryRegexGG.exec(xmlText)) !== null) {
        const entry = mGG[1]
        const idMatch = entry.match(/<id>([^<]*)<\/id>/)
        const pid = idMatch ? extractIdFromHref(idMatch[1].trim()) : null
        const titleMatch = entry.match(/<title[^>]*>([^<]*)<\/title>/)
        const name = titleMatch ? titleMatch[1].trim() : ''
        if (pid && name) {
          products.push({ id: pid, name, company: extractVidalField(entry, 'company'), galenicalForm: extractVidalField(entry, 'galenicForm') })
        }
      }

      return new Response(JSON.stringify({ products }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    // ── ACTION: get-biosimilar-group ──
    if (action === 'get-biosimilar-group') {
      if (!productId) {
        return new Response(
          JSON.stringify({ error: 'MISSING_PRODUCT_ID', message: 'productId requis.' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      const url = `${baseUrl}/product/${productId}/biosimilar-group?${authParams}`
      console.log('VIDAL get-biosimilar-group:', url.replace(credentials.VIDAL_APP_KEY, '***'))

      const response = await fetch(url, { headers: { 'Accept': 'application/atom+xml' } })
      if (!response.ok) {
        if (response.status === 404) {
          return new Response(JSON.stringify({ products: [] }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
        }
        return new Response(
          JSON.stringify({ error: 'VIDAL_API_ERROR', message: `Erreur API VIDAL: ${response.status}` }),
          { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      const xmlText = await response.text()
      const products: { id: number; name: string; company: string | null; galenicalForm: string | null }[] = []
      const entryRegexBG = /<(?:atom:)?entry[^>]*>([\s\S]*?)<\/(?:atom:)?entry>/g
      let mBG
      while ((mBG = entryRegexBG.exec(xmlText)) !== null) {
        const entry = mBG[1]
        const idMatch = entry.match(/<id>([^<]*)<\/id>/)
        const pid = idMatch ? extractIdFromHref(idMatch[1].trim()) : null
        const titleMatch = entry.match(/<title[^>]*>([^<]*)<\/title>/)
        const name = titleMatch ? titleMatch[1].trim() : ''
        if (pid && name) {
          products.push({ id: pid, name, company: extractVidalField(entry, 'company'), galenicalForm: extractVidalField(entry, 'galenicForm') })
        }
      }

      return new Response(JSON.stringify({ products }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    // ── ACTION: get-vmp-products ──
    if (action === 'get-vmp-products') {
      let resolvedVmpId = directVmpId

      // If no direct vmpId, resolve from productId
      if (!resolvedVmpId && productId) {
        const prodUrl = `${baseUrl}/product/${productId}?${authParams}`
        const prodRes = await fetch(prodUrl, { headers: { 'Accept': 'application/atom+xml' } })
        if (prodRes.ok) {
          const prodXml = await prodRes.text()
          const vmpMatch = prodXml.match(/<link[^>]*title="VMP"[^>]*href="[^"]*\/(\d+)"/) ||
                           prodXml.match(/<vidal:vmp[^>]*vidalId="(\d+)"/) ||
                           prodXml.match(/<link[^>]*href="[^"]*\/vmp\/(\d+)"/)
          resolvedVmpId = vmpMatch ? parseInt(vmpMatch[1], 10) : null
        }
      }

      if (!resolvedVmpId) {
        return new Response(JSON.stringify({ products: [], vmpId: null }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
      }

      const url = `${baseUrl}/vmp/${resolvedVmpId}/products?${authParams}`
      console.log('VIDAL get-vmp-products:', url.replace(credentials.VIDAL_APP_KEY, '***'))

      const response = await fetch(url, { headers: { 'Accept': 'application/atom+xml' } })
      if (!response.ok) {
        if (response.status === 404) {
          return new Response(JSON.stringify({ products: [], vmpId: resolvedVmpId }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
        }
        return new Response(
          JSON.stringify({ error: 'VIDAL_API_ERROR', message: `Erreur API VIDAL: ${response.status}` }),
          { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      const xmlText = await response.text()
      const products: { id: number; name: string; company: string | null; galenicalForm: string | null }[] = []
      const entryRegexVMP = /<(?:atom:)?entry[^>]*>([\s\S]*?)<\/(?:atom:)?entry>/g
      let mVMP
      while ((mVMP = entryRegexVMP.exec(xmlText)) !== null) {
        const entry = mVMP[1]
        const idMatch = entry.match(/<id>([^<]*)<\/id>/)
        const pid = idMatch ? extractIdFromHref(idMatch[1].trim()) : null
        const titleMatch = entry.match(/<title[^>]*>([^<]*)<\/title>/)
        const name = titleMatch ? titleMatch[1].trim() : ''
        if (pid && name) {
          products.push({ id: pid, name, company: extractVidalField(entry, 'company'), galenicalForm: extractVidalField(entry, 'galenicForm') })
        }
      }

      return new Response(JSON.stringify({ products, vmpId: resolvedVmpId }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    // ── ACTION: get-product-atc ──
    if (action === 'get-product-atc') {
      if (!productId) {
        return new Response(
          JSON.stringify({ error: 'MISSING_PRODUCT_ID', message: 'productId requis.' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      const url = `${baseUrl}/product/${productId}/atc-classification?${authParams}`
      console.log('VIDAL get-product-atc:', url.replace(credentials.VIDAL_APP_KEY, '***'))

      const response = await fetch(url, { headers: { 'Accept': 'application/atom+xml' } })
      if (!response.ok) {
        if (response.status === 404) {
          return new Response(JSON.stringify({ classifications: [] }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
        }
        return new Response(
          JSON.stringify({ error: 'VIDAL_API_ERROR', message: `Erreur API VIDAL: ${response.status}` }),
          { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      const xmlText = await response.text()
      const classifications: { id: number; code: string; label: string }[] = []
      const entryRegexATC = /<(?:atom:)?entry[^>]*>([\s\S]*?)<\/(?:atom:)?entry>/g
      let mATC
      while ((mATC = entryRegexATC.exec(xmlText)) !== null) {
        const entry = mATC[1]
        const idMatch = entry.match(/<id>([^<]*)<\/id>/)
        const atcId = idMatch ? extractIdFromHref(idMatch[1].trim()) : null
        const titleMatch = entry.match(/<title[^>]*>([^<]*)<\/title>/)
        const label = titleMatch ? titleMatch[1].trim() : ''
        const codeMatch = entry.match(/<vidal:code>([^<]*)</) || entry.match(/<summary[^>]*>([^<]*)</)
        const code = codeMatch ? codeMatch[1].trim() : ''
        if (atcId && label) {
          classifications.push({ id: atcId, code, label })
        }
      }

      return new Response(JSON.stringify({ classifications }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    // ── ACTION: search-galenic-forms ──
    if (action === 'search-galenic-forms') {
      const qParam = query ? `?q=${encodeURIComponent(query)}&${authParams}` : `?${authParams}`
      const url = `${baseUrl}/galenic-forms${qParam}`
      console.log('VIDAL search-galenic-forms:', url.replace(credentials.VIDAL_APP_KEY, '***'))

      const response = await fetch(url, { headers: { 'Accept': 'application/atom+xml' } })
      if (!response.ok) {
        return new Response(
          JSON.stringify({ error: 'VIDAL_API_ERROR', message: `Erreur API VIDAL: ${response.status}` }),
          { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      const xmlText = await response.text()
      const forms: { id: number; name: string }[] = []
      const entryRegex3 = /<(?:atom:)?entry[^>]*>([\s\S]*?)<\/(?:atom:)?entry>/g
      let m3
      while ((m3 = entryRegex3.exec(xmlText)) !== null) {
        const entry = m3[1]
        const idMatch = entry.match(/<id>([^<]*)<\/id>/)
        const titleMatch = entry.match(/<title[^>]*>([^<]*)<\/title>/)
        const formId = idMatch ? extractIdFromHref(idMatch[1].trim()) : null
        const name = titleMatch ? titleMatch[1].trim() : ''
        if (formId && name) {
          forms.push({ id: formId, name })
        }
      }

      return new Response(
        JSON.stringify({ forms }),
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
