export const WORDPRESS_SITE = 'bignews9.wordpress.com';
export const WORDPRESS_API = `https://public-api.wordpress.com/rest/v1.1/sites/${WORDPRESS_SITE}`;
export const DEFAULT_CATEGORY_NAMES = [
  'KATEGORIA A',
  'KATEGORIA B',
  'KATEGORIA C',
  'KATEGORIA D',
  'KATEGORIA E',
];

export const fallbackCategories = DEFAULT_CATEGORY_NAMES.map((name, index) => ({
  name,
  slug: `kategoria-${String.fromCharCode(97 + index)}`,
  articles: [],
}));

export const CATEGORY_RULES = {
  'KATEGORIA A': ['lajm', 'breaking', 'qeveri', 'bashki', 'zhvillim', 'urgjent'],
  'KATEGORIA B': ['turizem', 'biznes', 'ekonomi', 'investim', 'teknologji', 'digital'],
  'KATEGORIA C': ['analize', 'koment', 'shpjegim', 'fokus', 'trend', 'opinion'],
  'KATEGORIA D': ['komunitet', 'lokal', 'shkolle', 'banore', 'sociale', 'kulture'],
  'KATEGORIA E': ['speciale', 'interviste', 'ekskluzive', 'reportazh', 'seri', 'profil'],
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

  return doc.body.innerHTML;
}

export function mapWordPressPost(post) {
  const categories = Object.values(post.categories || {});
  const primaryCategory = categories[0]?.name || 'Pa kategori';

  return {
    id: post.ID,
    title: htmlToText(post.title),
    excerpt: buildExcerpt(post.excerpt || post.content),
    time: formatPostTime(post.date),
    author: post.author?.name || 'Redaksia BIgNews',
    bodyHtml: sanitizeArticleHtml(post.content || ''),
    image: post.featured_image || post.post_thumbnail?.URL || '',
    link: post.URL,
    category: primaryCategory,
    label: primaryCategory,
  };
}

export function buildCategories(categoriesResponse, postsResponse) {
  const wpCategories = (categoriesResponse?.categories || [])
    .filter((category) => DEFAULT_CATEGORY_NAMES.includes(category.name))
    .sort(
      (left, right) =>
        DEFAULT_CATEGORY_NAMES.indexOf(left.name) - DEFAULT_CATEGORY_NAMES.indexOf(right.name)
    );

  const mappedPosts = (postsResponse?.posts || []).map(mapWordPressPost);

  return DEFAULT_CATEGORY_NAMES.map((categoryName, index) => {
    const wpCategory = wpCategories.find((category) => category.name === categoryName);
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
