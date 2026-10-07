/**
 * Imports the @drinks_up_please TikTok feed shown on drinksup.com.au.
 *
 *   node scripts/import-tiktok.mjs <posts.json>
 *
 * <posts.json> is the response of the store's Elfsight TikTok widget
 * (widget-data.service.elfsight.com/api/posts…). That endpoint needs the
 * widget's token, so capture it from the live site's network tab and save it.
 *
 * TikTok cover URLs are signed and expire, so covers are downloaded into
 * public/tiktok/ and the post data is written to src/data/tiktok.json.
 *
 * Videos play through TikTok's official player, which only works where
 * tiktok.com is reachable. To play a clip everywhere, save it as
 * public/tiktok/<video id>.mp4 and re-run this script.
 */
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';

const [, , input] = process.argv;
if (!input) {
  console.error('Usage: node scripts/import-tiktok.mjs <posts.json>');
  process.exit(1);
}

const raw = JSON.parse(await readFile(input, 'utf8'));
const list = raw.payload ?? raw.posts ?? raw;
await mkdir('public/tiktok', { recursive: true });

const posts = [];
for (const p of list) {
  const cover = p.media?.[0]?.cover?.original?.url ?? p.media?.[0]?.cover?.thumbnail?.url;
  if (!cover) continue;
  // Fetch through Elfsight's image proxy (the same one the live widget uses);
  // TikTok's CDN rejects direct hotlinks and is blocked on some networks.
  const res = await fetch(`https://phosphor.utils.elfsightcdn.com/?url=${encodeURIComponent(cover)}`, {
    headers: { 'User-Agent': 'Mozilla/5.0', Referer: 'https://drinksup.com.au/' },
  }).catch(() => ({ ok: false, status: 'network error' }));
  if (!res.ok) {
    console.warn('skip (cover unavailable)', p.vendorId, res.status);
    continue;
  }
  const tmp = `public/tiktok/${p.vendorId}.src`;
  await writeFile(tmp, Buffer.from(await res.arrayBuffer()));
  // Resize to a 9:16-friendly 540px wide WebP with Pillow
  const brightness = Number(
    execFileSync('python', [
      '-c',
      `from PIL import Image, ImageStat; import os
im = Image.open(r"${tmp}").convert("RGB"); os.remove(r"${tmp}")
mean = sum(ImageStat.Stat(im.convert("L")).mean)
if mean >= 12:
    im.thumbnail((540, 960)); im.save(r"public/tiktok/${p.vendorId}.webp", "WEBP", quality=80, method=6)
print(round(mean))`,
    ])
      .toString()
      .trim(),
  );
  // Some TikTok covers are a blank black first frame: leave those out
  if (brightness < 12) {
    console.warn('skip (blank cover)', p.vendorId);
    continue;
  }
  posts.push({
    id: p.vendorId,
    url: p.link,
    caption: (p.caption ?? '').trim(),
    publishedAt: p.publishedAt,
    likes: p.likesCount ?? 0,
    comments: p.commentsCount ?? 0,
    plays: p.extra?.playsCount ?? 0,
    cover: `/tiktok/${p.vendorId}.webp`,
    // Drop the downloaded clip in as public/tiktok/<id>.mp4 to play it on-site, even where TikTok is blocked
    ...(existsSync(`public/tiktok/${p.vendorId}.mp4`) ? { video: `/tiktok/${p.vendorId}.mp4` } : {}),
  });
}

posts.sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
const author = list[0]?.author;
await writeFile(
  'src/data/tiktok.json',
  JSON.stringify(
    {
      importedAt: new Date().toISOString(),
      profile: { username: author?.username ?? 'drinks_up_please', name: author?.name ?? 'Drinks Up', url: author?.url ?? 'https://www.tiktok.com/@drinks_up_please' },
      posts,
    },
    null,
    1,
  ),
);
console.log(`✓ ${posts.length} TikTok posts imported`);
