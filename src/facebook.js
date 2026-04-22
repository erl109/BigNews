export async function publishFacebookPagePost({ title, excerpt, link }) {
  const response = await fetch('/api/facebook-post', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      title,
      excerpt,
      link,
    }),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data?.error || 'Publikimi ne Facebook deshtoi.');
  }

  return data;
}
