// Netlify Function — Proxy a Supabase
// Evita que el ISP bloquee llamadas directas a supabase.co

const SB_BASE = 'https://ysctgzbqaducghivamff.supabase.co';

exports.handler = async (event) => {
  // Extraer la ruta de Supabase desde la URL de la función
  // /.netlify/functions/supabase/rest/v1/... → /rest/v1/...
  const sbPath = event.path.replace('/.netlify/functions/supabase', '') || '/';
  const qs = event.rawQuery ? '?' + event.rawQuery : '';
  const url = SB_BASE + sbPath + qs;

  // Cabeceras a reenviar a Supabase
  const headers = {};
  if (event.headers['apikey'])       headers['apikey']       = event.headers['apikey'];
  if (event.headers['authorization']) headers['Authorization'] = event.headers['authorization'];
  if (event.headers['content-type']) headers['Content-Type']  = event.headers['content-type'];
  if (event.headers['prefer'])       headers['Prefer']        = event.headers['prefer'];
  if (event.headers['x-upsert'])     headers['x-upsert']      = event.headers['x-upsert'];
  headers['Accept'] = 'application/json';

  try {
    const fetchOpts = {
      method: event.httpMethod,
      headers,
    };
    if (!['GET', 'HEAD', 'OPTIONS'].includes(event.httpMethod) && event.body) {
      fetchOpts.body = event.isBase64Encoded
        ? Buffer.from(event.body, 'base64')
        : event.body;
    }

    const resp = await fetch(url, fetchOpts);
    const body = await resp.text();

    return {
      statusCode: resp.status,
      headers: {
        'Content-Type':                resp.headers.get('content-type') || 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers':'apikey, authorization, content-type, prefer, x-upsert',
      },
      body: body,
    };
  } catch (err) {
    return {
      statusCode: 502,
      body: JSON.stringify({ error: 'Proxy error: ' + err.message }),
    };
  }
};
