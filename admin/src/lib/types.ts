export type Me = { name: string; role: string; initials: string; email: string }
export type Cat = 'spirits' | 'liqueurs' | 'syrups' | 'purees' | 'packs'
export type AProduct = {
  h: string; t: string; b: string; c: Cat; p: number; cp: number; ok: 0 | 1; size: string; abv: string
  v: string; best: 0 | 1; img: string; origin: string; d: string
}
export type Inv = { st: number | null; rop: number; cost: number; inc: number; loc: string; s30: number }
export type FS = 'Unfulfilled' | 'Packing' | 'Ready to ship' | 'Shipped' | 'Delivered' | 'Returned'
export type PS = 'Paid' | 'Pending payment' | 'Refunded' | 'Partially refunded' | 'Due in 14 days'
export type Addr = { first: string; last: string; line1: string; line2: string; city: string; st: string; pc: string; phone: string; note: string }
export type Note = { text: string; at: string; by: string }
export type Item = { h: string; q: number; p: number }

export type RawCustomer = { id: string; n: string; contact: string; em: string; city: string; st: string; pc: string; trade: boolean; since: string; news: boolean }
export type RawOrder = {
  id: string; dt: string; cu: string; ch: string; items: Item[]; sub: number; disc: number; ship: number; tot: number
  fs: FS; ps: PS; code: string; carrier: string; track: string; addr: Addr | null; notes: Note[]
}
export type RawPO = { id: string; sup: string; dt: string; eta: string; st: 'Draft' | 'In transit' | 'At customs' | 'Received'; items: { h: string; q: number }[] }
export type RawReview = { id: number; h: string; cu: string | null; name: string; r: number; t: string; b: string; dt: string; st: 'Pending' | 'Published' | 'Hidden'; ver: boolean }
export type Discount = { c: string; t: string; ty: string; u: number; st: 'Active' | 'Scheduled' | 'Expired'; ends: string }
export type Campaign = { n: string; ch: string; aud: string; st: string; dt: string; sent: number; open: number; click: number; rev: number }
export type Staff = { n: string; r: string; a: string }
export type Supplier = { n: string; lead: string; terms: string; moq: string }
export type Settings = {
  freeShip: number; stdRate: number; signature: boolean; sameDay: boolean; licence: string
  ageGate: boolean; rsMessage: boolean; gstInclusive: boolean
}
export type Bootstrap = {
  me: Me; products: AProduct[]; inventory: Record<string, Inv>; customers: RawCustomer[]; orders: RawOrder[]
  pos: RawPO[]; suppliers: Record<string, Supplier>; reviews: RawReview[]; discounts: Discount[]
  campaigns: Campaign[]; staff: Staff[]; settings: Settings
  messages: Message[]
}

/* ---- derived model (mirrors the mockup's in-memory objects) ---- */
export type Customer = Omit<RawCustomer, 'since'> & {
  since: Date; orders: Order[]; spent: number; last?: Date; seg: 'Trade' | 'VIP' | 'Returning' | 'New' | 'Subscriber'
}
export type Order = Omit<RawOrder, 'dt' | 'cu'> & { dt: Date; cu: Customer }
export type PO = Omit<RawPO, 'dt' | 'eta'> & { dt: Date; eta: Date }
export type Review = Omit<RawReview, 'dt' | 'cu'> & { dt: Date; p: AProduct; cu: Customer | null }
export type Message = { id: number; n: string; em: string; ph: string; topic: string; msg: string; dt: string }
