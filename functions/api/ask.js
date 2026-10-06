const DEFAULT_MODEL = 'gpt-5.4-mini';
const MAX_TEXT = 50000;
const MAX_IMAGE_CHARS = 7_000_000;

const INSTRUCTIONS = `Je bent de technische uitlegassistent voor een beginner die werkt met EZ-MILL Express 2020, MILLPOSTEDITOR en EZ-DNC Express. Antwoord in eenvoudig Nederlands.

Gebruik uitsluitend feiten die in de vraag, de meegeleverde kennisbasis of de zichtbare post/G-code staan. Verzin nooit EZ-MILL- of EZ-DNC-menunamen, knopnamen, postvariabelen, tags, syntaxis of G-code. Als syntax of context niet aantoonbaar is, zeg wat ontbreekt en vraag om een screenshot of het relevante postfragment. Geef geen schijnzekerheid.

Noem bij uitleg het programma en onderdeel. Elke vraag over een post of G-code krijgt beide oplossingsroutes: (1) permanente aanpassing in de post via EZ-MILL/MILLPOSTEDITOR en (2) eenmalige wijziging van de concrete regel in EZ-DNC. Raad permanent aan als dit bij elk programma terugkomt; raad eenmalig aan als het alleen dit programma betreft. Als de wijziging onbekend of onveilig is, verzin geen plakklare machinecode: leg uit dat je eerst de postregel en omliggende regels nodig hebt.

Antwoord met deze kopjes: ## Korte uitleg, ## Permanent in de post (EZ-MILL), ## Eenmalig in EZ-DNC, ## Controlelijst. Noem bij de eenmalige route precies de G-code-regel en wijziging wanneer die zeker uit de invoer volgt. Anders vraag om de regels/screenshot. Voeg in de controlelijst altijd toe: maak een kopie van de originele post, test met Z hoog, zonder werkstuk en in enkelvoudige-regel-modus. Waarschuw bij elke wijziging aan bewegingen of posities dat de coördinaten G54/werkstukcoördinaten of G53/machinecoördinaten kunnen zijn en eerst veilig moet worden getest.

Gebruik de kennisbasis onderstaand als enige programmabron. Als die geen antwoord bevat, zeg dat expliciet en vraag om een screenshot van het betreffende scherm/format. Maak onderscheid tussen documentatie en algemene uitleg.`;

function json(data, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' } });
}

async function loadKnowledge(assets) {
  if (!assets) return '';
  const indexResponse = await assets.fetch(new Request('https://assets.local/kennis/index.json'));
  if (!indexResponse.ok) return '';
  const topics = await indexResponse.json();
  const sections = await Promise.all(topics.map(async topic => {
    const response = await assets.fetch(new Request(`https://assets.local${topic.file}`));
    return response.ok ? `\n### ${topic.program}: ${topic.title}\n${await response.text()}` : '';
  }));
  return sections.join('\n').slice(0, 60000);
}

export async function onRequestPost({ request, env }) {
  if (!env.OPENAI_API_KEY) return json({ error: 'De AI-sleutel is nog niet ingesteld. Voeg OPENAI_API_KEY toe als secret in Cloudflare Pages.' }, 503);
  let body;
  try { body = await request.json(); } catch { return json({ error: 'Het verzoek bevat geen geldige JSON.' }, 400); }
  const program = body.program === 'EZ-MILL' ? 'EZ-MILL' : 'EZ-DNC';
  const question = typeof body.question === 'string' ? body.question.trim().slice(0, 5000) : '';
  const text = typeof body.text === 'string' ? body.text.slice(0, MAX_TEXT) : '';
  const image = body.image;
  if (!question) return json({ error: 'Vul eerst je vraag in.' }, 400);
  if (image && (!['image/jpeg', 'image/png', 'image/webp'].includes(image.mimeType) || typeof image.data !== 'string' || image.data.length > MAX_IMAGE_CHARS)) {
    return json({ error: 'De foto moet JPEG, PNG of WebP zijn en kleiner dan ongeveer 5 MB.' }, 400);
  }
  const knowledge = await loadKnowledge(env.ASSETS);
  const userText = `Gekozen programma: ${program}\nVraag: ${question}\n\nPost/G-code (kan leeg zijn):\n${text || '(geen tekst aangeleverd)'}\n\nKENNISBASIS:\n${knowledge || '(kennisbasis niet beschikbaar)'}`;
  const content = [{ type: 'input_text', text: userText }];
  if (image) content.push({ type: 'input_image', image_url: `data:${image.mimeType};base64,${image.data}`, detail: 'high' });
  try {
    const response = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${env.OPENAI_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: env.MODEL || DEFAULT_MODEL, instructions: INSTRUCTIONS, input: [{ role: 'user', content }], max_output_tokens: 1800, store: false })
    });
    const result = await response.json();
    if (!response.ok) return json({ error: 'De AI-dienst kon de vraag niet verwerken. Controleer de API-sleutel, het model en de accountlimieten.' }, 502);
    const answer = (result.output || []).flatMap(item => item.content || []).filter(item => item.type === 'output_text').map(item => item.text).join('\n').trim();
    if (!answer) return json({ error: 'Er kwam geen tekstueel antwoord terug. Probeer het opnieuw of voeg meer context toe.' }, 502);
    return json({ answer });
  } catch {
    return json({ error: 'Er kon geen verbinding met de AI-dienst worden gemaakt. Probeer het later opnieuw.' }, 502);
  }
}

export async function onRequest({ request }) {
  if (request.method !== 'POST') return json({ error: 'Gebruik POST voor een vraag.' }, 405);
  return json({ error: 'Deze aanvraagmethode wordt niet ondersteund.' }, 405);
}
