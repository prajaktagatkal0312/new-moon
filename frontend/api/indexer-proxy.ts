export const config = { runtime: 'edge' };

export default async function handler(req: Request) {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }
  const body = await req.text();
  const upstream = await fetch('https://indexer.preview.midnight.network/api/v4/graphql', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body,
  });
  const data = await upstream.text();
  return new Response(data, {
    status: upstream.status,
    headers: { 'Content-Type': 'application/json' },
  });
}
