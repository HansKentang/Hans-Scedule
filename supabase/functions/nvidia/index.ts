/* Havën Schedule — NVIDIA NIM relay

   NVIDIA's API only allows browser requests from build.nvidia.com, so the PWA
   cannot call it directly. This function forwards the request and adds CORS
   headers. The caller's own key is used; nothing is stored server-side.

   Deploy (JWT verification off, because guests have no Supabase session):
     supabase functions deploy nvidia --no-verify-jwt

   The app calls it automatically at <SUPABASE_URL>/functions/v1/nvidia.
*/

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-nvidia-key, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, 'Content-Type': 'application/json' }
  });
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: CORS });
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  const headerKey = (req.headers.get('x-nvidia-key') || '').trim();
  const auth = (req.headers.get('authorization') || '').trim();
  const key = headerKey || (auth.toLowerCase().startsWith('bearer ') ? auth.slice(7).trim() : '');
  if (!key) return json({ error: 'Missing NVIDIA API key' }, 401);

  let body: string;
  try { body = await req.text(); } catch { return json({ error: 'Empty request body' }, 400); }

  const upstream = await fetch('https://integrate.api.nvidia.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${key}`
    },
    body
  });

  // Pass the body through unchanged (including SSE) and keep the upstream
  // content type, otherwise streaming replies arrive as one buffered blob.
  return new Response(upstream.body, {
    status: upstream.status,
    headers: {
      ...CORS,
      'Content-Type': upstream.headers.get('content-type') || 'application/json'
    }
  });
});
