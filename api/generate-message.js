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

  const prompt = `Du er en prisvinnende kreativ tekstforfatter for en norsk bank. Skriv 3 ulike emosjonelle markedsbudskap for produktet "${product}".

Kategoriinngang: ${keywords}
Ønsket lengde per budskap: ${ordLengde}

Krav til hvert budskap:
- Direkte relatert til kategoriinngangen – la stikkordene forme budskapet konkret
- Treff følelser – skriv om drømmer, håp, livsøyeblikk, trygghet, frihet eller stolthet
- Bygg på menneskelig innsikt – vis at du forstår hvordan folk egentlig tenker, føler og lever
- Vær menneskelig – skriv som et menneske til et menneske, med varme og ekthet
- Unngå bankspråk og rasjonelle produktfordeler – snakk til hjertet, ikke hodet
- Kreativt og uventet – de 3 budskapene skal ha tydelig ulik vinkel og tone
- Egnet for banner og markedsmateriell
- Følger markedsføringsloven: ingen villedende påstander, ingen garanterte avkastningsløfter
- Nøyaktig ${ordLengde} langt

Svar med nøyaktig dette formatet – tre linjer, én per budskap, ingen nummerering, ingen anførselstegn:
BUDSKAP1
BUDSKAP2
BUDSKAP3`;

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 400,
      messages: [{ role: 'user', content: prompt }]
    })
  });

  if (!response.ok) {
    const err = await response.text();
    return res.status(500).json({ error: 'Klarte ikke å generere budskap', details: err });
  }

  const data = await response.json();
  const raw = data.content[0].text.trim();
  const messages = raw.split('\n').map(l => l.trim()).filter(l => l.length > 0).slice(0, 3);

  res.status(200).json({ messages });
};
