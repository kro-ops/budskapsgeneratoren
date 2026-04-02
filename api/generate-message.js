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

  const prompt = `Du er en norsk reklameskribent kjent for å skrive tekster som folk husker lenge etter. Du skriver aldri som en bank – du skriver som et menneske som forstår hvordan livet føles.

Produkt: ${product}
Kategoriinngang: ${keywords}
Lengde per budskap: ${ordLengde}

Skriv 3 budskap. Hvert budskap skal:
- Ta utgangspunkt i et ekte, gjenkjennelig øyeblikk fra hverdagslivet knyttet til kategoriinngangen
- Snakke direkte til magen, ikke hodet – det skal kjennes, ikke bare leses
- Bruke enkelt, folkelig norsk – slik folk faktisk snakker, ikke slik en bank skriver
- Ha en uventet vinkel eller et bilde som overrasker – unngå det åpenbare
- Være tydelig forskjellig fra de to andre i tone og innfallsvinkel

Unngå absolutt: "drøm", "fremtid", "trygghet", "ta steget", "din reise", "muligheter", "smart valg", bankklisjeer og abstrakte ord.
Følger markedsføringsloven: ingen villedende påstander eller garanterte avkastningsløfter.

Svar med nøyaktig tre linjer – én per budskap, ingen nummerering, ingen anførselstegn:
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
