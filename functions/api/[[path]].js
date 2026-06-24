// Cloudflare Pages Function — Proxy a Supabase
// Ruta catch-all: /api/* → supabase.co/*

const SB_BASE = 'https://ysctgzbqaducghivamff.supabase.co';

export async function onRequest(context) {
  const { request } = context;
  const url = new URL(request.url);

  // /api/rest/v1/... → /rest/v1/...
  const sbPath = url.pathname.replace('/api', '') || '/';
  const targetUrl = SB_BASE + sbPath + url.search;

  // Reenviar headers de autenticación
  const headers = new Headers();
  const orig = request.headers;
  if (orig.get('apikey'))       headers.set('apikey',        orig.get('apikey'));
  if (orig.get('authorization'))headers.set('Authorization', orig.get('authorization'));
  if (orig.get('content-type')) headers.set('Content-Type',  orig.get('content-type'));
  if (orig.get('prefer'))       headers.set('Prefer',        orig.get('prefer'));
  if (orig.get('x-upsert'))     headers.set('x-upsert',      orig.get('x-upsert'));
  headers.set('Accept', 'application/json');

  // Manejar preflight CORS
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PATCH, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'apikey, authorization, content-type, prefer, x-upsert',
      }
    });
  }

  try {
    const body = ['GET','HEAD'].includes(request.method) ? undefined : request.body;
    const resp = await fetch(targetUrl, { method: request.method, headers, body });

    const resHeaders = new Headers(resp.headers);
    resHeaders.set('Access-Control-Allow-Origin', '*');
    resHeaders.set('Access-Control-Allow-Headers', 'apikey, authorization, content-type, prefer');

    return new Response(resp.body, { status: resp.status, headers: resHeaders });

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 502,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
  }
}
