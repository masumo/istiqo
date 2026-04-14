import fs from 'node:fs/promises';
import path from 'node:path';

const OUTPUT_FILE = path.resolve('src/utils/wordFrequency.data.js');
const CACHE_FILE = path.resolve('scripts/.cache/vocab_roadmap_cache.json');

const BASE_QURAN_API = 'https://api.quran.com/api/v4';
const FREQUENCY_URL = 'https://qurananalysis.com/analysis/word-frequency.php?lang=AR';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const ensureDir = async (dir) => {
  await fs.mkdir(dir, { recursive: true });
};

const stripTags = (s) => s.replace(/<[^>]*>/g, '').trim();

const decodeHtmlEntities = (s) =>
  s
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');

const normalizeArabic = (s) => {
  if (!s) return '';
  return s
    .replace(/[\u064B-\u065F\u0670\u06D6-\u06ED]/g, '')
    .replace(/\u0640/g, '')
    .replace(/[إأآٱ]/g, 'ا')
    .replace(/ى/g, 'ي')
    .replace(/ؤ/g, 'و')
    .replace(/ئ/g, 'ي')
    .replace(/ة/g, 'ه')
    .trim();
};

const fetchJson = async (url, { retries = 6 } = {}) => {
  let attempt = 0;
  while (attempt <= retries) {
    const res = await fetch(url);
    if (res.ok) return res.json();

    const retryAfter = Number(res.headers.get('retry-after') || 0);
    const backoff = retryAfter ? retryAfter * 1000 : 500 * Math.pow(2, attempt);
    if (res.status === 429 || res.status >= 500) {
      await sleep(Math.min(backoff, 10_000));
      attempt += 1;
      continue;
    }

    const text = await res.text().catch(() => '');
    throw new Error(`HTTP ${res.status} for ${url}\n${text.slice(0, 200)}`);
  }
  throw new Error(`Failed after retries: ${url}`);
};

const fetchText = async (url) => {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  return res.text();
};

const parseTopWordsFromQuranAnalysis = (html, limit) => {
  const rows = [];
  const re = /<tr[^>]*>\s*<td[^>]*>\s*(\d+)\s*<\/td>\s*<td[^>]*>\s*([^<]+?)\s*<\/td>/g;
  let match;
  while ((match = re.exec(html)) !== null) {
    const rank = Number(match[1]);
    const word = decodeHtmlEntities(stripTags(match[2]));
    if (!Number.isFinite(rank) || !word) continue;
    rows.push({ rank, word });
    if (rows.length >= limit) break;
  }

  if (rows.length === 0) {
    const flat = html
      .replace(/\r/g, '')
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean);
    const pairs = [];
    for (let i = 0; i < flat.length - 1; i += 1) {
      const a = Number(flat[i]);
      const b = flat[i + 1];
      if (Number.isFinite(a) && b && /[ء-ي]/.test(b)) {
        pairs.push({ rank: a, word: b });
      }
      if (pairs.length >= limit) break;
    }
    return pairs;
  }

  return rows;
};

const searchVerseKeyForWord = async (word) => {
  const q = encodeURIComponent(word);
  const url = `${BASE_QURAN_API}/search?q=${q}&size=1&page=1&language=ar`;
  const data = await fetchJson(url);
  const first = data?.search?.results?.[0];
  return first?.verse_key || null;
};

const fetchVerseWithWords = async (verseKey, language) => {
  const url = `${BASE_QURAN_API}/verses/by_key/${encodeURIComponent(
    verseKey
  )}?words=true&word_fields=text_uthmani,translation,transliteration&language=${language}`;
  return fetchJson(url);
};

const extractWordTranslationFromVerse = ({ versePayload, targetWord }) => {
  const verse = versePayload?.verse || versePayload?.verses?.[0] || versePayload;
  const words = verse?.words || [];
  const needle = normalizeArabic(targetWord);
  for (const w of words) {
    const text = w?.text_uthmani || w?.text || '';
    if (normalizeArabic(text) === needle) {
      return w?.translation?.text || null;
    }
  }
  return null;
};

const loadCache = async () => {
  try {
    const raw = await fs.readFile(CACHE_FILE, 'utf8');
    return JSON.parse(raw);
  } catch {
    return { byRank: {} };
  }
};

const saveCache = async (cache) => {
  await ensureDir(path.dirname(CACHE_FILE));
  await fs.writeFile(CACHE_FILE, JSON.stringify(cache, null, 2), 'utf8');
};

const toJsModule = (items) => {
  const safe = items.map((it) => ({
    rank: it.rank,
    word: it.word,
    translation: { id: it.translation.id || '', en: it.translation.en || '' },
    context_verse: it.context_verse || '1:1',
  }));

  return `export const VOCAB_WORDS_DATA = ${JSON.stringify(safe, null, 2)};\nexport default VOCAB_WORDS_DATA;\n`;
};

const main = async () => {
  const limitArgIndex = process.argv.findIndex((a) => a === '--limit');
  const limit = limitArgIndex >= 0 ? Number(process.argv[limitArgIndex + 1]) : 300;
  const LIMIT = Number.isFinite(limit) ? Math.max(1, Math.min(300, limit)) : 300;

  console.log(`Fetching frequency list (Top ${LIMIT})...`);
  const html = await fetchText(FREQUENCY_URL);
  const top = parseTopWordsFromQuranAnalysis(html, LIMIT);
  if (top.length < LIMIT) {
    console.log(`Parsed ${top.length} rows. Continuing with parsed data.`);
  }

  const cache = await loadCache();
  const out = [];

  for (const { rank, word } of top) {
    const cached = cache.byRank[String(rank)];
    if (cached && cached.word === word && cached.translation?.id && cached.translation?.en && cached.context_verse) {
      out.push(cached);
      continue;
    }

    let contextVerse = null;
    try {
      contextVerse = await searchVerseKeyForWord(word);
    } catch (e) {
      console.log(`Rank ${rank}: search failed for "${word}".`);
    }
    contextVerse = contextVerse || '1:1';

    let translationId = null;
    let translationEn = null;

    try {
      const verseId = await fetchVerseWithWords(contextVerse, 'id');
      translationId = extractWordTranslationFromVerse({ versePayload: verseId, targetWord: word });
    } catch {
      translationId = null;
    }

    try {
      const verseEn = await fetchVerseWithWords(contextVerse, 'en');
      translationEn = extractWordTranslationFromVerse({ versePayload: verseEn, targetWord: word });
    } catch {
      translationEn = null;
    }

    const item = {
      rank,
      word,
      translation: {
        id: translationId || '',
        en: translationEn || '',
      },
      context_verse: contextVerse,
    };

    cache.byRank[String(rank)] = item;
    out.push(item);

    if (rank % 10 === 0) {
      await saveCache(cache);
      console.log(`Generated up to rank ${rank}...`);
    }

    await sleep(150);
  }

  await saveCache(cache);
  await ensureDir(path.dirname(OUTPUT_FILE));
  await fs.writeFile(OUTPUT_FILE, toJsModule(out), 'utf8');
  console.log(`Wrote ${out.length} words to ${OUTPUT_FILE}`);
};

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

