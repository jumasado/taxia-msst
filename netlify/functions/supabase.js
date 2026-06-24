// Netlify Function — Proxy a Supabase usando https nativo de Node.js
// No depende de fetch ni de paquetes externos

const https = require('https');

const SB_HOST = 'ysctgzbqaducghivamff.supabase.co';

exports.handler = async (event) => {
  try {
    // Extraer ruta Supabase: /.netlify/functions/supabase/rest/v1/... → /rest/v1/...
    const sbPath = event.path.replace('/.netlify/functions/supabase', '') || '/';
    const qs     = event.rawQuery ? '?' + event.rawQuery : '';
    const path   = sbPath + qs;

    // Cabeceras a reenviar
    const h = event.headers || {};
    const headers = {
      'apikey':         h['apikey']         || '',
      'Authorization':  h['authorization']  || h['Authorization']  || '',
      'Content-Type':   h['content-type']   || 'application/json',
      'Accept':         'application/json',
    };
    if (h['prefer'])   headers['Prefer']   = h['prefer'];
    if (h['x-upsert']) headers['x-upsert'] = h['x-upsert'];

    const body = !['GET','HEAD','OPTIONS'].includes(event.httpMethod) && event.body
      ? (event.isBase64Encoded ? Buffer.from(event.body, 'base64') : event.body)
      : null;

    // Hacer la petición a Supabase con https nativo
    const result = await new Promise((resolve, reject) => {
      const opts = {
        hostname: SB_HOST,
        port: 443,
        path: path,
        method: event.httpMethod || 'GET',
        headers: headers,
      };

      const req = https.request(opts, (res) => {
        const chunks = [];
        res.on('data', chunk => chunks.push(chunk));
        res.on('end', () => resolve({
          status: res.statusCode,
          contentType: res.headers['content-type'] || 'application/json',
          body: Buffer.concat(chunks).toString('utf-8'),
        }));
      });

      req.on('error', reject);
      if (body) req.write(body);
      req.end();
    });

    return {
      statusCode: result.status,
      headers: {
        'Content-Type':                  result.contentType,
        'Access-Control-Allow-Origin':   '*',
        'Access-Control-Allow-Methods':  'GET, POST, PATCH, DELETE, OPTIONS',
        'Access-Control-Allow-Headers':  'apikey, authorization, content-type, prefer, x-upsert',
      },
      body: result.body,
    };

  } catch (err) {
    return {
      statusCode: 502,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Proxy error', detail: err.message }),
    };
  }
};
