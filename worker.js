// Cloudflare Worker — sirve TaxIA y hace proxy a Supabase
const SB_BASE = 'https://ysctgzbqaducghivamff.supabase.co';

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // Proxy /api/* → Supabase
    if (url.pathname.startsWith('/api/')) {
      const sbPath = url.pathname.replace('/api', '');
      const target = SB_BASE + sbPath + url.search;
      const h = request.headers;
      const headers = new Headers();
      if (h.get('apikey'))        headers.set('apikey',        h.get('apikey'));
      if (h.get('authorization')) headers.set('Authorization', h.get('authorization'));
      if (h.get('content-type'))  headers.set('Content-Type',  h.get('content-type'));
      if (h.get('prefer'))        headers.set('Prefer',        h.get('prefer'));
      if (h.get('x-upsert'))      headers.set('x-upsert',      h.get('x-upsert'));
      headers.set('Accept', 'application/json');

      if (request.method === 'OPTIONS') {
        return new Response(null, { status: 204, headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET,POST,PATCH,DELETE,OPTIONS',
          'Access-Control-Allow-Headers': 'apikey,authorization,content-type,prefer,x-upsert'
        }});
      }

      const body = ['GET','HEAD'].includes(request.method) ? undefined : request.body;
      const resp = await fetch(target, { method: request.method, headers, body });
      const out = new Headers(resp.headers);
      out.set('Access-Control-Allow-Origin', '*');
      return new Response(resp.body, { status: resp.status, headers: out });
    }

    // Todo lo demás → assets estáticos
    return env.ASSETS.fetch(request);
  }
};
