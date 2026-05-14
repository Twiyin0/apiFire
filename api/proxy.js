export default async function handler(req, res) {
  // Only allow POST
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { method, url, headers, body } = req.body;
  const startTime = Date.now();

  try {
    const opts = { method, headers: headers || {} };
    if (body && !['GET', 'HEAD'].includes(method.toUpperCase())) {
      opts.body = typeof body === 'string' ? body : JSON.stringify(body);
    }

    const resp = await fetch(url, opts);
    const respHeaders = Object.fromEntries(resp.headers.entries());
    const respBody = await resp.text();
    const size = Buffer.byteLength(respBody, 'utf8');

    res.json({
      status: resp.status,
      statusText: resp.statusText,
      headers: respHeaders,
      body: respBody,
      time: Date.now() - startTime,
      size,
    });
  } catch (err) {
    res.json({ error: err.message, time: Date.now() - startTime });
  }
}
