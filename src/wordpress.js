export const WORDPRESS_SITE = 'bignews9.wordpress.com';
export const WORDPRESS_API = `https://public-api.wordpress.com/rest/v1.1/sites/${WORDPRESS_SITE}`;
export const DEFAULT_CATEGORY_NAMES = [
  'Politika&Aktualiteti',
  'Ekonomi&Sociale',
  'Kosove&Rajon',
  'Bota&Teknologjia',
  'Art&Shendet',
  'Foto&Video',
];

export const CATEGORY_SUBCATEGORY_MAP = {
  'Politika&Aktualiteti': ['Politika', 'Aktualiteti'],
  'Ekonomi&Sociale': ['Ekonomi', 'Sociale'],
  'Kosove&Rajon': ['Kosove', 'Rajon'],
  'Bota&Teknologjia': ['Bota', 'Teknologjia'],
  'Art&Shendet': ['Art', 'Shendet'],
  'Foto&Video': ['Foto', 'Video'],
};

export const fallbackCategories = DEFAULT_CATEGORY_NAMES.map((name, index) => ({
  name,
  slug: `kategoria-${String.fromCharCode(97 + index)}`,
  articles: [],
}));

export const CATEGORY_RULES = {
  'Politika&Aktualiteti': [
    'politike',
    'qeveri',
    'parlament',
    'zgjedhje',
    'aktualitet',
    'ministri',
    'president',
    'kryeminister',
  ],
  'Ekonomi&Sociale': [
    'ekonomi',
    'biznes',
    'sociale',
    'punesim',
    'cmim',
    'inflacion',
    'page',
    'mireqenie',
  ],
  'Kosove&Rajon': [
    'kosove',
    'kosova',
    'prishtine',
    'ballkan',
    'rajon',
    'shkup',
    'tirane',
    'podgorice',
  ],
  'Bota&Teknologjia': [
    'bota',
    'nderkombetare',
    'teknologji',
    'ai',
    'digital',
    'telefon',
    'software',
    'internet',
  ],
  'Art&Shendet': [
    'art',
    'kulture',
    'muzike',
    'film',
    'shendet',
    'mjekesi',
    'spital',
    'wellness',
  ],
  'Foto&Video': [
    'foto',
    'video',
    'galeri',
    'pamje',
    'vizuale',
    'reportazh',
    'klip',
    'kamera',
  ],
};

export function htmlToText(html) {
  if (!html) {
    return '';
  }

  if (typeof window === 'undefined') {
    return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  }

  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  return (doc.body.textContent || '').replace(/\s+/g, ' ').trim();
}

export function formatPostTime(dateValue) {
  if (!dateValue) {
    return '';
  }

  const date = new Date(dateValue);
  return new Intl.DateTimeFormat('sq-AL', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date);
}

export function normalizeText(text) {
  return (text || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

export function detectCategory(title, body) {
  const haystack = normalizeText(`${title} ${body}`);
  let bestMatch = { category: DEFAULT_CATEGORY_NAMES[0], score: 0 };

  for (const [category, keywords] of Object.entries(CATEGORY_RULES)) {
    const score = keywords.reduce(
      (total, keyword) => total + (haystack.includes(normalizeText(keyword)) ? 1 : 0),
      0
    );

    if (score > bestMatch.score) {
      bestMatch = { category, score };
    }
  }

  return {
    category: bestMatch.category,
    confidence:
      bestMatch.score === 0 ? 'Default' : bestMatch.score >= 3 ? 'Larte' : 'Mesatare',
  };
}

export function buildExcerpt(body) {
  return htmlToText(body).slice(0, 180).trim();
}

function extractFirstImageFromHtml(html) {
  if (!html) {
    return '';
  }

  if (typeof window === 'undefined') {
    const match = html.match(/<img[^>]+src=["']([^"']+)["']/i);
    return match?.[1] || '';
  }

  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  return doc.querySelector('img')?.getAttribute('src') || '';
}

function sanitizeArticleHtml(html) {
  if (!html) {
    return '';
  }

  const marker = 'Ky artikull u perpunua automatikisht nga burimet RSS te agjentit';

  if (typeof window === 'undefined') {
    return html.replace(/<p>[^<]*Ky artikull u perpunua automatikisht nga burimet RSS te agjentit[\s\S]*?<\/p>/i, '');
  }

  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');

  Array.from(doc.querySelectorAll('p')).forEach((paragraph) => {
    if ((paragraph.textContent || '').includes(marker)) {
      paragraph.remove();
    }
  });

  const firstImage = doc.querySelector('img');
  if (firstImage) {
    firstImage.remove();
  }

  return doc.body.innerHTML;
}

export function getSubcategoriesForCategory(categoryName) {
  return CATEGORY_SUBCATEGORY_MAP[categoryName] || [];
}

export function resolveMainCategory(categoryName) {
  if (!categoryName) {
    return DEFAULT_CATEGORY_NAMES[0];
  }

  if (DEFAULT_CATEGORY_NAMES.includes(categoryName)) {
    return categoryName;
  }

  const normalizedCategory = normalizeText(categoryName);

  for (const [mainCategory, subcategories] of Object.entries(CATEGORY_SUBCATEGORY_MAP)) {
    if (subcategories.some((subcategory) => normalizeText(subcategory) === normalizedCategory)) {
      return mainCategory;
    }
  }

  return categoryName;
}

export function buildCategoryPayload(category, subcategory = '') {
  const categories = [category, subcategory]
    .map((value) => value.trim())
    .filter(Boolean);

  return categories.join(',');
}

function normalizeCategoryName(name) {
  return htmlToText(name || '').trim();
}

function findSubcategoryForPost(categoryNames, mainCategory) {
  const subcategories = getSubcategoriesForCategory(mainCategory);

  return (
    categoryNames.find((categoryName) =>
      subcategories.some(
        (subcategory) => normalizeText(subcategory) === normalizeText(normalizeCategoryName(categoryName))
      )
    ) || ''
  );
}

export function mapWordPressPost(post) {
  const categories = Object.values(post.categories || {});
  const categoryNames = categories.map((category) => normalizeCategoryName(category.name));
  const primaryCategory = categoryNames[0] || 'Pa kategori';
  const mainCategory = resolveMainCategory(primaryCategory);
  const subcategory = findSubcategoryForPost(categoryNames, mainCategory);
  const rawBodyHtml = post.content || '';
  const sanitizedBodyHtml = sanitizeArticleHtml(rawBodyHtml);
  const derivedImage =
    post.featured_image ||
    post.post_thumbnail?.URL ||
    extractFirstImageFromHtml(rawBodyHtml);

  return {
    id: post.ID,
    title: htmlToText(post.title),
    excerpt: buildExcerpt(post.excerpt || post.content),
    time: formatPostTime(post.date),
    author: post.author?.name || 'Redaksia BigNews',
    bodyHtml: sanitizedBodyHtml,
    image: derivedImage,
    link: post.URL,
    category: mainCategory,
    subcategory,
    label: subcategory || primaryCategory,
  };
}

export function buildCategories(categoriesResponse, postsResponse) {
  const wpCategories = (categoriesResponse?.categories || [])
    .filter((category) => DEFAULT_CATEGORY_NAMES.includes(resolveMainCategory(category.name)))
    .sort(
      (left, right) =>
        DEFAULT_CATEGORY_NAMES.indexOf(resolveMainCategory(left.name)) -
        DEFAULT_CATEGORY_NAMES.indexOf(resolveMainCategory(right.name))
    );

  const mappedPosts = (postsResponse?.posts || []).map(mapWordPressPost);

  return DEFAULT_CATEGORY_NAMES.map((categoryName, index) => {
    const wpCategory = wpCategories.find(
      (category) => resolveMainCategory(category.name) === categoryName
    );
    const categoryPosts = mappedPosts.filter((post) => post.category === categoryName);

    return {
      name: categoryName,
      slug: wpCategory?.slug || `kategoria-${String.fromCharCode(97 + index)}`,
      articles: categoryPosts,
    };
  });
}

export async function publishWordPressPost({
  token,
  site = WORDPRESS_SITE,
  title,
  body,
  excerpt,
  category,
  image,
  status = 'draft',
}) {
  if (!token) {
    throw new Error('Mungon access token i WordPress.com.');
  }

  if (!title?.trim()) {
    throw new Error('Mungon titulli i postimit.');
  }

  if (!body?.trim()) {
    throw new Error('Mungon permbajtja e postimit.');
  }

  const payload = new URLSearchParams();
  payload.set('title', title.trim());
  payload.set('content', body.trim());
  payload.set('status', status);

  if (excerpt?.trim()) {
    payload.set('excerpt', excerpt.trim());
  }

  if (category?.trim()) {
    payload.set('categories', category.trim());
  }

  if (image?.trim()) {
    payload.append('media_urls[]', image.trim());
  }

  const response = await fetch(`https://public-api.wordpress.com/rest/v1/sites/${site}/posts/new`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token.trim()}`,
      'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
    },
    body: payload.toString(),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok || data?.error) {
    throw new Error(
      data?.message ||
        data?.error_description ||
        data?.error ||
        'Publikimi ne WordPress deshtoi.'
    );
  }

  return data;
}
