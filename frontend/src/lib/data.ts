export type Cat = 'spirits' | 'liqueurs' | 'syrups' | 'purees' | 'packs'
export type Product = {
  h: string; t: string; b: string; c: Cat; v: string; p: number; cp?: number; ok: 0 | 1; best?: 1
  abv?: string; size?: string; origin?: string; img: string[]; cut?: string; tag?: string; d?: string
  notes?: [string, string][]; serve?: string; rec?: string[]; rating: { avg: number; n: number }
}
export type Recipe = { n: string; b: string; img: string; k: string; d: string; i: [string, string][]; m: string; shop: string }
export type Review = { id: number; n: string; city: string; r: number; t: string; b: string; d: string; v: boolean; help: number }

export const STORE = import.meta.env.VITE_SHOPIFY_STORE || 'https://drinksup.com.au'
/** Free-shipping threshold — updated from admin › Settings via /api/catalog. */
export let FREE = 150
export const setFree = (n: number) => { if (n >= 0) FREE = n }
export const SAMPLE_REVIEWS = false

export const src = (k: string) => (!k ? '' : k.startsWith('http') || k.startsWith('/') ? k : `/images/${k}.webp`)

export const CATS: Record<Cat, string> = { spirits: 'Spirits', liqueurs: 'Liqueurs', syrups: 'Syrups', purees: 'Fruit Purées', packs: 'Cocktail Packs' }
export const CATINFO: Record<string, { t: string; d: string; img: string }> = {
  '': { t: 'All products', d: 'Every bottle on our shelf is one Australia’s best bartenders already pour. Spirits, Giffard liqueurs, syrups, purées and cocktail packs.', img: 'l_neon' },
  spirits: { t: 'Spirits', d: 'Rum from Havana, whiskey built for the fire, tequila from the Jalisco highlands, pisco and cachaça.', img: 'bt_scene' },
  liqueurs: { t: 'Liqueurs', d: 'Real fruit, real distillation — the house of Giffard, Angers, since 1885.', img: 'l_feature' },
  syrups: { t: 'Syrups', d: 'Giffard syrups chosen by head bartenders — for cocktails, mocktails, coffee and sodas.', img: 's_mangos' },
  purees: { t: 'Fruit Purées', d: 'Giffard Fruit for Mix — real fruit purée, ready to pour into daiquiris, smoothies and spritzes.', img: 's_passp' },
  packs: { t: 'Cocktail Packs', d: 'Everything you need for a bar-quality cocktail, hand-picked by career bartenders.', img: 'sm_marg' },
  sale: { t: 'Sale', d: 'Bar-quality bottles, now for less. While stocks last.', img: 'be_ck' },
  'non-alcoholic': { t: 'Non-Alcoholic', d: 'Zero-proof Giffard syrups and Fruit for Mix purées — for mocktails, smoothies, coffee and sodas.', img: 's_mangos' },
}
/* virtual shop categories: sale = discounted, non-alcoholic = syrups + purées (liqueurs carry alcohol) */
export const NON_ALC: Cat[] = ['syrups', 'purees']
export const inCat = (p: Product, k: string) => (!k ? true : k === 'sale' ? !!p.cp : k === 'non-alcoholic' ? NON_ALC.includes(p.c) : p.c === k)
export const PRICES: Record<string, string> = { '': 'Any price', u30: 'Under $30', '30-75': '$30 – $75', '75-150': '$75 – $150', o150: '$150+' }
export const SORTS: Record<string, string> = { feat: 'Featured', top: 'Top rated', rev: 'Most reviewed', sale: 'Biggest saving', lo: 'Price: low → high', hi: 'Price: high → low', az: 'A – Z' }
export const STATES = ['ACT', 'NSW', 'NT', 'QLD', 'SA', 'TAS', 'VIC', 'WA']

export const MQ = ["be_ck","m_gbart","bt_cuba","wr_man","pvr_scene","m_pvpaloma","pv_sea","th_caip","m_smpaloma","wp_ck"]
export const LINEUP = ["black-tears-cuban-spiced-rum-700ml","burnt-ends","rey_sol","giffard-banana-liqueur-premium","giffard-green-apple-liqueur-modern","millionaires-margarita-cocktail-pack"]
export const BRANDS_SHELF: [string, string, string][] = [["Black Tears","bt_cut","Havana, Cuba"],["Burnt Ends","be_cut","Tennessee, USA"],["Giffard","giffard_bottle","Angers, France"],["Pueblo Viejo","pv_cut","Jalisco, Mexico"],["San Matías","sm_cut","Jalisco · 1886"],["Whiskey Row","wr_cut","Kentucky, USA"],["Worthy Park","wp_cut","Jamaica · 1670"],["Demonio de los Andes","dm_cut","Ica, Peru"]]
/* "On our shelf" category tiles: [label, image, subtitle, link] */
export const SHELF_CATS: [string, string, string, string][] = [
  ['Spirits', 'bt_scene', 'Rum, whiskey, tequila & pisco', '/shop/spirits'],
  ['Liqueurs', 'g_raspberry_liqueur', 'Giffard · Angers, France', '/shop/liqueurs'],
  ['Syrups', 'g_strawberry_syrup', 'For cocktails, coffee & sodas', '/shop/syrups'],
  ['Smoothies', 'th_coco', 'Fruit for Mix purées', '/shop/purees'],
  ['Cocktails', 'ck_bdaiq', 'Bartender recipes', '/recipes'],
  ['Cocktail Packs', 'bt_tiki', 'Everything in one box', '/shop/packs'],
  ['Non-Alcoholic', 'ck_moj', 'Zero-proof mixers', '/shop/non-alcoholic'],
  ['Sale', 'be_scene', 'Bar-quality, for less', '/shop/sale'],
]
export const HOUSES: [string, string, string, string][] = [["Giffard","Angers, France · 1885","Liqueurs, syrups & purées","l_backbar"],["Black Tears","Havana, Cuba","Dry spiced rum","bt_ck"],["Burnt Ends","Tennessee, USA","Peated rye whiskey","be_sour"],["San Matías","Jalisco · 1886","Tequila","sm_scene"],["Pueblo Viejo","Jalisco, Mexico","100% agave tequila","pv_scene"],["Demonio de los Andes","Ica, Peru","Pisco","dm_scene"],["Thoquino","Rio de Janeiro · 1906","Cachaça","th_scene"],["Whiskey Row","Louisville, Kentucky","Straight bourbon","wr_scene"],["Worthy Park","Jamaica · Est. 1670","Single estate rum","wp_scene"]]
export const POL: Record<string, { t: string; k: [string, string][] }> = {"shipping":{"t":"Shipping policy","k":[["Dispatch","Orders are packed within 24 hours and dispatched within 1–2 business days of receipt."],["Rates","Shipping is calculated at checkout based on your order, delivery address and chosen option. Australian orders over $150 ship free."],["Tracking","Tracking details are emailed as soon as your order is dispatched."],["Delivery times","Times may vary with location, courier delays, public holidays and peak periods. Please check your delivery details at checkout — orders may not be changeable after dispatch."],["Alcohol deliveries","The recipient may be required to show proof of age (18+) and accept delivery in person."],["Problems with an order","If your order arrives damaged, incomplete or late, contact us as soon as possible."]]},"returns":{"t":"Returns & refunds","k":[["30-day returns","Returns are accepted within 30 days of purchase. Items must be unused, in original condition and packaging, with proof of purchase."],["Non-returnable items","Perishable goods, gift cards, hazardous materials and flammable liquids, and some other items cannot be returned."],["Sale items","Only regular-priced items can be refunded."],["Exchanges","We replace items only if they are defective or damaged — email us first."],["Refunds","We email you when your return is received and when it’s approved. Approved refunds go to your original payment method."],["Return shipping","Return shipping is paid by the customer and is non-refundable. For items over $75 we recommend a trackable service."]]},"privacy":{"t":"Privacy policy","k":[["What we collect","Details you give us (contact, order, account and support information), usage data via cookies, and data from partners such as Shopify and payment processors."],["How we use it","To process orders and returns, run your account, prevent fraud, support you, and — with your choice — send marketing."],["Cookies","Used for site functions, analytics and tailored advertising. You can control cookies in your browser."],["Sharing","With service providers, business partners and as required by law."],["Your rights","You can request access, correction or deletion of your data, and opt out of marketing at any time."],["Contact","Questions or complaints can be sent to us directly, or to your local data protection authority."]]},"terms":{"t":"Terms of sale","k":[["Who we are","Sales are made by 3Two1 Import Pty Ltd t/a 3Two1 Drinks. Accepting delivery means accepting these terms."],["Delivery & risk","Risk passes to you on delivery to the address you provide."],["Ownership","Ownership of goods passes on full payment."],["Claims","Please inspect goods on delivery and make any claim in writing within 7 days."],["Liability","Our liability is limited to replacement, equivalent goods or a refund, at our discretion, subject to Australian Consumer Law."],["Governing law","These terms are governed by the laws of Western Australia."]]}}
export const POL_URL: Record<string, string> = { shipping: 'shipping-policy', returns: 'refund-policy', privacy: 'privacy-policy', terms: 'terms-of-service' }
export const FAQ: [string, string][] = [['How fast do you ship?', 'Orders are packed within 24 hours and dispatched within 1–2 business days, with tracking sent once your parcel is on its way.'], ['Is shipping free?', 'Yes — on Australian orders over $150. Otherwise shipping is calculated at checkout.'], ['Do I need to show ID?', 'Alcohol is only sold to customers aged 18 and over. Proof of age may be required on delivery.'], ['Who is behind Drinks Up?', 'Drinks Up is run by 3Two1 Drinks, the Australian importer and distributor of Giffard, Black Tears, Burnt Ends, San Matías and more.'], ['Can I return a product?', 'See our return policy for details on damaged or incorrect items.']]

/* helpers */
export const money = (n: number) => '$' + n.toFixed(2)
export const save = (p: Product) => (p.cp ? Math.round((1 - p.p / p.cp) * 100) : 0)
export const full = (p: Product) => (p.c === 'packs' ? '' : p.b + ' ') + p.t
export const typeOf = (p: Product) =>
  ({ spirits: ({ 'Black Tears': 'Spiced rum', 'Burnt Ends': 'Rye whiskey', 'Whiskey Row': 'Bourbon', 'Worthy Park': 'Rum', 'San Matías': 'Tequila', 'Pueblo Viejo': 'Tequila', 'Demonio de los Andes': 'Pisco', Thoquino: 'Cachaça' } as Record<string, string>)[p.b] || 'Spirit', liqueurs: 'Liqueur', syrups: 'Syrup', purees: 'Fruit purée', packs: 'Cocktail pack' })[p.c]
export const fmtD = (d: string | Date) => new Date(d).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })
export function delivery() {
  const add = (d0: Date, n: number) => { const d = new Date(d0); while (n > 0) { d.setDate(d.getDate() + 1); if (d.getDay() % 6) n-- } return d }
  const t = new Date()
  const f = (d: Date) => d.toLocaleDateString('en-AU', { weekday: 'short', day: 'numeric', month: 'short' })
  return `${f(add(t, 3))} – ${f(add(t, 7))}`
}
export const inPrice = (p: Product, k: string) => !k || (k === 'u30' && p.p < 30) || (k === '30-75' && p.p >= 30 && p.p < 75) || (k === '75-150' && p.p >= 75 && p.p < 150) || (k === 'o150' && p.p >= 150)
