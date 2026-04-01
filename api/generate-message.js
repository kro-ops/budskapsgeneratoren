module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { product, keywords, length } = req.body || {};

  if (!product || !keywords) {
    return res.status(400).json({ error: 'Produkt og stikkord er påkrevd' });
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return res.status(500).json({ error: 'API-nøkkel mangler' });
  }

  const ordLengde = length === 'langt' ? '10–15 ord' : '5–10 ord';

  const prompt = `Du er en kreativ tekstforfatter for en norsk bank. Skriv ett markedsbudskap for produktet "${product}".

Stikkord: ${keywords}
Ønsket lengde: ${ordLengde}

Krav til budskapet:
- Kreativt, emosjonelt og kommersielt – egnet for banner og markedsmateriell
- Varm, moderne og tillitvekkende tone of voice
- Følger markedsføringsloven: ingen villedende påstander, ingen garanterte avkastningsløfter, ingen urimelig press
- Nøyaktig ${ordLengde} langt

Svar kun med selve budskapet. Ingen anførselstegn, ingen forklaring.`;

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 128,
      messages: [{ role: 'user', content: prompt }]
    })
  });

  if (!response.ok) {
    const err = await response.text();
    return res.status(500).json({ error: 'Klarte ikke å generere budskap', details: err });
  }

  const data = await response.json();
  res.status(200).json({ message: data.content[0].text.trim() });
};
