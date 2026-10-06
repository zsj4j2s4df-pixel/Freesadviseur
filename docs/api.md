# API-afspraak

## Vraag — `POST /api/ask`

Verzoek als JSON:

```json
{
  "program": "EZ-DNC",
  "question": "Waarom staat deze regel in mijn programma?",
  "text": "G-code of posttekst; optioneel",
  "image": { "mimeType": "image/jpeg", "data": "base64 zonder data:-prefix" }
}
```

`program` is `EZ-MILL` of `EZ-DNC`; `question` is verplicht. `text` en `image` zijn optioneel, maar ten minste een vraag is vereist. Afbeeldingen zijn JPEG, PNG of WebP, maximaal 1600 px langste zijde en maximaal 5 MB na compressie.

Antwoord is JSON met `answer` (de volledige Nederlandse tekst van het model) en optioneel `error`. De frontend toont uitleg, twee oplossingsroutes, controlelijst en eventuele bronverwijzingen. Het antwoord wordt niet server-side bewaard. De browser bewaart een korte lokale vraaggeschiedenis.

De Function laadt de kennisbestanden mee als context. Bij ontbrekende broninformatie moet het model onzekerheid benoemen en om een screenshot van het betreffende format vragen. Het mag geen menu-items, postvariabelen of onbekende syntax verzinnen. Wijzigingen aan bewegingen/posities vereisen de waarschuwing over G54/werkstukcoördinaten versus G53/machinecoördinaten en eerst veilig testen.
