const aud = new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD' });

/** $72.99 — AUD, Australian locale */
export const money = (n: number) => aud.format(n);

export const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString('en-AU', { day: 'numeric', month: 'long', year: 'numeric' });

export const pluralise = (n: number, word: string, plural = `${word}s`) => `${n} ${n === 1 ? word : plural}`;

/** Remove the store's habit of stuffing size/ABV into product titles for display headings */
export const shortTitle = (title: string) =>
  title
    .replace(/\s*\|\s*\d+\s?m?L\s*$/i, '')
    .replace(/\s+-\s+1L$/i, '')
    .replace(/\s+1L$/i, '')
    .trim();
