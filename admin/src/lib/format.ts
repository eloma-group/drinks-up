import type { AProduct, Cat } from './types'

export const CATS: Record<Cat, string> = { spirits: 'Spirits', liqueurs: 'Liqueurs', syrups: 'Syrups', purees: 'Fruit purées', packs: 'Cocktail packs' }
export const money = (n: number, d = 2) => '$' + (+n).toLocaleString('en-AU', { minimumFractionDigits: d, maximumFractionDigits: d })
export const k$ = (n: number) => n >= 1000 ? '$' + (n / 1000).toFixed(n >= 10000 ? 1 : 2).replace(/\.0+$/, '') + 'k' : money(n, 0)
export const full = (p: AProduct) => p.c === 'packs' || p.b === 'Giffard' || p.b === 'Cocktail Pack' ? p.t : p.b + ' ' + p.t
export const fd = (d: Date) => d.toLocaleDateString('en-AU', { day: 'numeric', month: 'short' })
export const fdt = (d: Date) => d.toLocaleDateString('en-AU', { day: 'numeric', month: 'short' }) + ', ' + d.toLocaleTimeString('en-AU', { hour: 'numeric', minute: '2-digit' })
export const SKU = (p: AProduct) => 'DU-' + p.v.slice(-5)
export const sum = <T,>(l: T[], f: (x: T) => number) => l.reduce((a, x) => a + f(x), 0)
export const initials = (n: string) => n.split(' ').map(w => w[0]).join('').slice(0, 2)

export function today() { const t = new Date(); t.setHours(23, 59, 0, 0); return t }
export const TODAY = today()
export const dAgo = (n: number) => { const d = new Date(TODAY); d.setDate(d.getDate() - n); return d }
export const inRange = (o: { dt: Date }, days: number, off = 0) => { const a = (+TODAY - +o.dt) / 864e5; return a >= off && a < days + off }

const STORE = (import.meta.env.VITE_STORE_URL as string | undefined)?.replace(/\/$/, '') || 'http://localhost:5173'
const THUMBS = new Set(['g_apricot_syrup', 'r_peach', 'g_lychee_liqueur', 'pv_cut', 'g_blackberry_liqueur', 'g_caribbean_pineapple_liqueur', 'g_cinnamon_syrup', 'r_cocop', 'g_grenadine_syrup', 'r_banas', 'r_lemongrass', 's_mangos', 'dm_cut', 'g_raspberry_syrup', 'rb_scene', 'r_rose', 'g_cassis_noir_de_bourgogne', 'g_watermelon_liqueur', 'r_mojito', 'bt_tiki', 'g_raspberry_liqueur', 'bt_cut', 'pvr_scene', 'g_blackcurrant_liqueur', 'g_piment_d_espelette', 'wp_cut', 'g_agave_syrup', 'g_pineapple_syrup', 'g_white_chocolate_liqueur', 'g_peach_liqueur', 'g_caramel_syrup', 'g_dark_chocolate_liqueur', 'g_triple_sec_liqueur', 'g_vanille_de_madagascar', 'g_apricot_brandy', 's_mangop', 'g_blue_curacao_liqueur', 'g_menthe_pastille', 'pva_scene', 'g_blood_orange_syrup', 'bt_scene', 'wr_cut', 'g_hazelnut_syrup', 'g_rhubarb_liqueur', 'r_lychee', 's_cocos', 'sm_cut', 'g_watermelon_syrup', 'g_apricot_liqueur', 'r_gapples', 'g_strawberry_syrup', 'g_jasmine_syrup', 'g_maraschino_liqueur', 'g_ginger_syrup', 'g_strawberry_liqueur', 's_passp', 'r_straw', 'be_cut', 'th_coco', 'g_passion_fruit_liqueur', 'r_rasp', 'rs_cut', 'r_cocoliq', 'th_cut', 'r_gapple', 'r_elder', 's_cane', 'r_falernum', 'g_orgeat_syrup', 'sm_marg', 'g_coffee_liqueur', 'r_banane', 'dm_cap', 'g_amaretto_liqueur'])
export const thumbUrl = (k: string) => !k ? '' : /^(https?:)?\/\//.test(k) || k.startsWith('/') ? k : THUMBS.has(k) ? `/thumbs/${k}.webp` : `${STORE}/images/${k}.webp`
export const STORE_URL = STORE

export function csv(name: string, rows: (string | number)[][]) {
  const s = rows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n')
  const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([s], { type: 'text/csv' })); a.download = name; a.click()
}
