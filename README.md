# Freesadviseur

Een Nederlandstalige PWA voor EZ-MILL Express en EZ-DNC Express. De app is mobiel en desktopvriendelijk. De vraagfunctie gebruikt een Cloudflare Pages Function; de API-sleutel staat alleen op de server.

## Lokaal bekijken

Open `index.html` via een lokale webserver (niet rechtstreeks als `file://`, omdat de kennisbestanden en service worker een webserver vereisen). Met Python geïnstalleerd:

```powershell
py -m http.server 8788
```

Open daarna `http://localhost:8788`. In deze eenvoudige lokale preview werkt de AI-functie niet, omdat de Cloudflare Pages Function lokaal niet wordt uitgevoerd.

## Publiceren met GitHub en Cloudflare Pages

1. Maak op GitHub een lege repository aan, bijvoorbeeld `freesadviseur`.
2. Upload alle bestanden en mappen uit deze projectmap naar de hoofdmap van de repository. GitHub Desktop kan ook worden gebruikt om de Desktop-map als repository toe te voegen en te publiceren.
3. Open Cloudflare Dashboard → **Workers & Pages** → **Create** → **Pages** en koppel de GitHub-repository.
4. Laat het framework op **None** staan, laat de buildopdracht leeg en stel de build output directory in op `.` (de projecthoofdmap). De map `functions` moet naast `index.html` staan.
5. Na de eerste deployment vind je de app op het toegewezen `*.pages.dev`-adres.

## API-sleutel instellen

1. Maak in je OpenAI-platform een API-sleutel.
2. Open in Cloudflare de Pages-app → **Settings** → **Variables and Secrets**.
3. Voeg `OPENAI_API_KEY` toe als **Secret**. Plak de waarde alleen in Cloudflare; zet hem nooit in `app.js`, GitHub of een screenshot.
4. Voeg `MODEL` toe als gewone variabele, bijvoorbeeld `gpt-5.4-mini`. De standaard in de Function is `gpt-5.4-mini`; kies een model dat volgens de actuele OpenAI API-documentatie afbeeldingsinvoer ondersteunt.
5. Start een nieuwe deployment zodat de Function de instellingen gebruikt.
6. Stel voor openbaar delen een Cloudflare rate-limit- of WAF-regel in op /api/ask om misbruik en onverwacht API-gebruik te beperken.

## Kennisbasis en screenshots aanvullen

- Zet EZ-MILL-uitleg in `kennis/ez-mill/` en EZ-DNC-uitleg in `kennis/ez-dnc/` als Markdown-bestanden.
- Voeg elk onderwerp toe aan `kennis/index.json` met een unieke `id`, `program`, `group`, `title`, `summary` en pad naar het bestand.
- Voeg alleen eigen screenshots toe onder `kennis/afbeeldingen/`; verwijs er vanuit het onderwerp naar. Deel geen vertrouwelijke klant- of machinegegevens.
- De AI krijgt de inhoud van de geïndexeerde Markdown-pagina’s als context. De huidige startpagina’s zijn algemene werkwijze uit de aangeleverde opdracht; exacte schermstappen zijn nog niet gecontroleerd tegen handleidingen.

## Wat nog van jou nodig is

- Officiële EZ-MILL Express 2020- en EZ-DNC Express handleidingen/helpteksten.
- Eigen screenshots van relevante schermen, postformats en voorbeelden (zonder gevoelige gegevens).
- Controle van de opgegeven freeswaarden met gereedschapsfabrikanten en je machine.
- Na deployment: je eigen test van echte programma’s en de AI-antwoorden; wijzig of verstuur geen machinecode zonder veilige controle.

## Architectuur

- Statische HTML/CSS/JavaScript frontend; geen buildstap vereist.
- Cloudflare Pages Function: POST /api/ask. _routes.json zorgt ervoor dat alleen API-aanvragen de Function uitvoeren en gewone bestanden rechtstreeks worden geleverd.
- API-afspraken staan in `docs/api.md`.
- De browser bewaart maximaal 50 recente vragen in localStorage. Afbeeldingen worden niet in de geschiedenis opgeslagen. Vraag en foto gaan naar OpenAI om antwoord te maken. De app slaat ze niet in een serverdatabase op en vraagt store:false aan; raadpleeg het OpenAI-beleid voor hun verwerking.
- PWA manifest en service worker cachen appbestanden en de uitleg voor offline lezen. AI-advies vereist internet.

