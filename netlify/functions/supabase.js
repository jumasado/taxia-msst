const https = require('https');
const SB_HOST = 'ysctgzbqaducghivamff.supabase.co';

exports.handler = function(event, context, callback) {
  // Extraer ruta y query
  const sbPath = event.path.replace('/.netlify/functions/supabase', '') || '/rest/v1/';
  const qs = event.rawQuery ? '?' + event.rawQuery : '';
  const fullPath = sbPath + qs;
  const h = event.headers || {};

  const options = {
    hostname: SB_HOST,
    port: 443,
    path: fullPath,
    method: event.httpMethod || 'GET',
    headers: {
      'apikey': h['apikey'] || h['Apikey'] || '',
      'Authorization': h['authorization'] || h['Authorization'] || '',
      'Content-Type': h['content-type'] || 'application/json',
      'Accept': 'application/json',
      'Prefer': h['prefer'] || h['Prefer'] || '',
    }
  };

  const req = https.request(options, function(res) {
    var body = '';
    res.setEncoding('utf8');
    res.on('data', function(chunk) { body += chunk; });
    res.on('end', function() {
      callback(null, {
        statusCode: res.statusCode,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'apikey, authorization, content-type, prefer',
        },
        body: body
      });
    });
  });

  req.on('error', function(e) {
    callback(null, {
      statusCode: 502,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: e.message })
    });
  });

  if (event.body && event.httpMethod !== 'GET') {
    req.write(event.body);
  }
  req.end();
};
