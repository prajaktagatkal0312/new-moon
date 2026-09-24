export const config = { runtime: 'edge' };

export default async function handler(req: Request) {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: { 'Access-Control-Allow-Origin': '*' } });
  }
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }
  
  try {
    const body = await req.text();
    const upstream = await fetch('https://indexer.preview.midnight.network/api/v4/graphql', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Accept': 'application/json, text/plain, */*',
        'User-Agent': req.headers.get('user-agent') || 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Origin': 'https://preview.midnight.network',
        'Referer': 'https://preview.midnight.network/'
      },
      body,
    });
    
    const data = await upstream.text();
    return new Response(data, {
      status: upstream.status,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error("Proxy Error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
