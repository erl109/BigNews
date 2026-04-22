const GRAPH_API_BASE = 'https://graph.facebook.com/v23.0';

function buildFacebookMessage({ title, excerpt, link }) {
  return [title?.trim(), excerpt?.trim(), link?.trim()].filter(Boolean).join('\n\n');
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed.' });
  }

  const pageId = process.env.FACEBOOK_PAGE_ID?.trim();
  const pageAccessToken = process.env.FACEBOOK_PAGE_ACCESS_TOKEN?.trim();

  if (!pageId || !pageAccessToken) {
    return res.status(501).json({
      error:
        'Facebook posting nuk eshte konfiguruar ende ne server. Vendos FACEBOOK_PAGE_ID dhe FACEBOOK_PAGE_ACCESS_TOKEN ne environment variables.',
    });
  }

  const { title = '', excerpt = '', link = '' } = req.body || {};

  if (!title.trim() || !link.trim()) {
    return res.status(400).json({ error: 'Mungon titulli ose link-u i postimit.' });
  }

  const payload = new URLSearchParams();
  payload.set('message', buildFacebookMessage({ title, excerpt, link }));
  payload.set('link', link.trim());
  payload.set('access_token', pageAccessToken);

  try {
    const response = await fetch(`${GRAPH_API_BASE}/${pageId}/feed`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
      },
      body: payload.toString(),
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok || data?.error) {
      return res.status(400).json({
        error:
          data?.error?.message ||
          data?.error?.error_user_msg ||
          'Facebook Graph API e refuzoi publikimin.',
      });
    }

    return res.status(200).json({
      ok: true,
      id: data.id,
    });
  } catch (error) {
    return res.status(500).json({
      error: error.message || 'Gabim i papritur gjate publikimit ne Facebook.',
    });
  }
}
