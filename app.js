const NAV = [
  { id: 'vraag', label: 'Vraag', icon: '✳' },
  { id: 'uitleg', label: 'Uitleg', icon: '▤' },
  { id: 'waarden', label: 'Waarden', icon: '⌁' },
  { id: 'geschiedenis', label: 'Geschiedenis', icon: '◷' },
  { id: 'info', label: 'Info', icon: 'ⓘ' }
];
const ranges = {
  'HSS vingerfrees': { 'Aluminium': { vc:[60,120], fz:[.05,.10] }, 'Staal': { vc:[20,35], fz:[.03,.06] }, 'RVS': { vc:[10,20], fz:[.02,.05] }, 'POM': { vc:[100,200], fz:[.05,.15] } },
  'Hardmetaal vingerfrees': { 'Aluminium': { vc:[200,400], fz:[.05,.12] }, 'Staal': { vc:[100,180], fz:[.04,.08] }, 'RVS': { vc:[60,120], fz:[.03,.06] }, 'POM': { vc:[200,400], fz:[.05,.15] } },
  'Plaatfrees / wisselplaten': { 'Aluminium': { vc:[300,800], fz:[.08,.20] }, 'Staal': { vc:[150,250], fz:[.10,.20] }, 'RVS': { vc:[100,180], fz:[.08,.15] }, 'POM': { vc:[300,600], fz:[.10,.20] } },
  'Boor HSS': { 'Aluminium': { vc:[40,80], fn:[.01,.02] }, 'Staal': { vc:[20,30], fn:[.01,.02] }, 'RVS': { vc:[10,15], fn:[.01,.02] }, 'POM': { vc:[40,80], fn:[.01,.02] } },
  'Ruimer': { 'Aluminium': { vc:[20,40], fn:[.02,.04] }, 'Staal': { vc:[10,15], fn:[.02,.04] }, 'RVS': { vc:[5,7.5], fn:[.02,.04] }, 'POM': { vc:[20,40], fn:[.02,.04] } }
};
const $ = (s, root=document) => root.querySelector(s);
const esc = (s='') => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let chosenImage = null, topics = [], activeTopic = null, activeProgram = 'EZ-DNC';

function navMarkup(className) { return NAV.map(n => `<a class="nav-item ${location.hash.slice(1)===n.id?'selected':''}" href="#${n.id}" data-go="${n.id}"><span class="nav-icon" aria-hidden="true">${n.icon}</span><span>${n.label}</span></a>`).join(''); }
$('#side-nav').innerHTML = navMarkup('side'); $('#tab-nav').innerHTML = navMarkup('tab');
function cardIcon(){return '<span class="card-arrow" aria-hidden="true">↗</span>';}
function renderVraag(){
  $('#screen-vraag').innerHTML = `<div class="page-head"><p class="eyebrow">EZ-MILL Express · EZ-DNC Express</p><h1>Waar kan ik je mee helpen?</h1><p>Vraag advies over je post of G-code, eventueel met een foto.</p></div>
  <div class="question-layout"><section class="panel question-panel"><div class="segmented" role="group" aria-label="Programma"><button type="button" data-program="EZ-MILL">EZ-MILL</button><button type="button" class="active" data-program="EZ-DNC">EZ-DNC</button></div>
  <form id="ask-form"><label class="field-label" for="question">Je vraag</label><textarea id="question" rows="4" placeholder="Beschrijf wat je wilt doen of waar je tegenaan loopt…" required></textarea>
  <label class="field-label" for="code-text">Post of G-code <span class="optional">optioneel</span></label><textarea id="code-text" rows="5" spellcheck="false" placeholder="Plak hier de relevante regels…"></textarea>
  <div class="upload-row"><label class="upload-button" for="image-file">＋ Foto toevoegen</label><span class="upload-hint">Plakken, slepen of kiezen</span><input id="image-file" type="file" accept="image/*" capture="environment" hidden></div><div id="image-preview" class="image-preview" hidden></div>
  <button id="ask-button" class="primary-button" type="submit">Stel je vraag <span>↗</span></button><p class="privacy-note">Je vraag en foto gaan naar OpenAI om antwoord te maken. Deze app bewaart ze niet op de server; de geschiedenis blijft op dit toestel.</p></form></section>
  <section class="panel answer-placeholder"><div class="placeholder-icon">✳</div><h2>Antwoord verschijnt hier</h2><p>Je krijgt uitleg, een permanente oplossing voor de post en een eenmalige wijziging in EZ-DNC.</p><div class="safety-mini">Veilig werken begint met een kopie en een test met Z hoog.</div></section></div>
  <div class="disclaimer"><strong>Controleer elk advies.</strong> Test zonder werkstuk, met Z hoog en in enkelvoudige-regel-modus.</div>`;
  document.querySelectorAll('[data-program]').forEach(b=>b.classList.toggle('active',b.dataset.program===activeProgram));
}
function renderUitleg(){
  $('#screen-uitleg').innerHTML = `<div class="page-head"><p class="eyebrow">Naslag</p><h1>Uitleg</h1><p>Praktische stappen voor EZ-MILL en EZ-DNC.</p></div><div class="help-layout"><section class="panel topic-list"><div class="search-wrap"><input id="topic-search" type="search" placeholder="Zoek een onderwerp…" aria-label="Zoek uitleg"></div><div class="program-filters"><button class="filter active" data-filter="Alles">Alles</button><button class="filter" data-filter="EZ-MILL">EZ-MILL</button><button class="filter" data-filter="EZ-DNC">EZ-DNC</button></div><div id="topic-items"></div></section><article class="panel topic-detail" id="topic-detail"><div class="empty-detail"><div class="placeholder-icon">▤</div><h2>Kies een onderwerp</h2><p>De kennisbasis is bedoeld voor controleerbare, programmaspecifieke uitleg.</p></div></article></div>`;
  fetch('/kennis/index.json').then(r=>r.json()).then(data=>{topics=data; renderTopicList(); if(!activeTopic && topics[0]) openTopic(topics[0]);}).catch(()=>{$('#topic-items').innerHTML='<p class="muted pad">Onderwerpen zijn offline niet geladen. Open de app via een webserver.</p>';});
}
function renderTopicList(){
  const q=($('#topic-search')?.value||'').toLowerCase(); const filter=$('.filter.active')?.dataset.filter||'Alles';
  const filtered=topics.filter(t=>(filter==='Alles'||t.program===filter)&&`${t.title} ${t.summary} ${t.program}`.toLowerCase().includes(q));
  $('#topic-items').innerHTML=filtered.length?filtered.map(t=>`<button class="topic-row ${activeTopic?.id===t.id?'chosen':''}" data-topic="${esc(t.id)}"><span class="topic-program">${esc(t.program)}</span><strong>${esc(t.title)}</strong><small>${esc(t.summary)}</small>${cardIcon()}</button>`).join(''):'<p class="muted pad">Geen onderwerpen gevonden.</p>';
}
async function openTopic(topic){
  activeTopic=topic; renderTopicList(); const panel=$('#topic-detail'); panel.innerHTML='<p class="muted">Onderwerp laden…</p>';
  try{const md=await fetch(topic.file).then(r=>r.text()); panel.innerHTML=`<p class="eyebrow">${esc(topic.program)} · ${esc(topic.group)}</p><h2>${esc(topic.title)}</h2><div class="markdown">${renderMarkdown(md)}</div>`;}catch{panel.innerHTML='<p>Dit onderwerp is nog niet beschikbaar.</p>';}
}
function renderMarkdown(md){
  return md.split(/\n/).map(line=>{if(line.startsWith('# '))return '';if(line.startsWith('## '))return `<h3>${esc(line.slice(3))}</h3>`;if(/^\d+\. /.test(line))return `<p class="step-line">${esc(line.replace(/^\d+\. /,''))}</p>`;if(line.startsWith('**'))return `<p>${esc(line.replaceAll('**',''))}</p>`;if(line.startsWith('- '))return `<p>• ${esc(line.slice(2))}</p>`;return line?`<p>${esc(line.replaceAll('`',''))}</p>`:'';}).join('');
}
function renderWaarden(){
  const material='Aluminium'; const tool='HSS vingerfrees';
  $('#screen-waarden').innerHTML=`<div class="page-head"><p class="eyebrow">Startwaarden</p><h1>Freeswaarden</h1><p>Bekijk indicatieve waarden en bereken toerental en aanzet.</p></div>
  <p class="notice"><strong>Indicatieve startwaarden.</strong> Controleer altijd de gegevens van de gereedschapsfabrikant en pas aan op stabiliteit, opspanning en machinevermogen.</p>
  <div class="values-layout"><section class="panel"><div class="panel-heading"><div><p class="eyebrow">Referentie</p><h2>Tabellen</h2></div></div><div class="table-wrap"><table><thead><tr><th>Gereedschap</th><th>Materiaal</th><th>vc (m/min)</th><th>fz / fn (mm)</th></tr></thead><tbody>${Object.entries(ranges).flatMap(([t,materials])=>Object.entries(materials).map(([m,v])=>`<tr><td>${esc(t)}</td><td>${esc(m)}</td><td>${v.vc[0]}–${v.vc[1]}</td><td>${v.fn ? `${v.fn[0].toFixed(2)}–${v.fn[1].toFixed(2)} × D` : v.fz.map(n=>Number(n.toFixed(3))).join('–')}</td></tr>`)).join('')}</tbody></table></div><p class="footnote">Bij kleinere diameter hoort meestal een kleinere tandvoeding (fz), grofweg evenredig met de diameter. Ruimers: vc ongeveer de helft van boren en fn ongeveer tweemaal.</p></section>
  <section class="panel calculator"><div class="panel-heading"><div><p class="eyebrow">Rekenhulp</p><h2>Bereken je instellingen</h2></div></div><p class="notice small-notice">Indicatieve startwaarden. Controleer fabrikantgegevens en machinevermogen.</p>
  <div class="form-grid"><label>Gereedschap<select id="tool-select">${Object.keys(ranges).map(t=>`<option>${esc(t)}</option>`).join('')}</select></label><label>Materiaal<select id="material-select"><option>Aluminium</option><option>Staal</option><option>RVS</option><option>POM</option></select></label><label>Diameter D (mm)<input id="diameter" type="number" min="0.1" step="0.1" value="10"></label><label>Aantal tanden z<input id="teeth" type="number" min="1" step="1" value="4"></label><label>Max. toerental machine (omw/min)<input id="max-rpm" type="number" min="1" step="100" value="6000"></label></div>
  <div class="slider-row"><label for="vc-range">Snijsnelheid vc <output id="vc-output"></output></label><input id="vc-range" type="range"></div><div class="slider-row"><label for="feed-range"><span id="feed-name">Tandvoeding fz</span> <output id="feed-output"></output></label><input id="feed-range" type="range" step="0.001"></div>
  <div class="result-grid"><div><span>Toerental n</span><strong id="rpm-result">—</strong><small>omw/min</small></div><div><span>Aanzet vf</span><strong id="feed-result">—</strong><small>mm/min</small></div></div><p id="rpm-warning" class="warning" hidden></p><p id="used-values" class="muted"></p><button id="copy-values" class="secondary-button">Kopieer waarden <span>↗</span></button></section></div>`;
  updateCalc();
}
function formatRangeInput(el, pair, mid){el.min=pair[0];el.max=pair[1];el.step=(pair[1]-pair[0])>1?'1':'0.001';el.value=mid;}
function updateCalc(){
  const tool=$('#tool-select').value, material=$('#material-select').value, d=Math.max(.01,Number($('#diameter').value)||10), z=Math.max(1,Number($('#teeth').value)||1), max=Math.max(1,Number($('#max-rpm').value)||6000), data=ranges[tool][material], feedPair=data.fz||data.fn, isDrill=!!data.fn;
  const vcEl=$('#vc-range'), fEl=$('#feed-range');
  if(vcEl.dataset.tool!==tool||vcEl.dataset.material!==material){formatRangeInput(vcEl,data.vc,(data.vc[0]+data.vc[1])/2);formatRangeInput(fEl,feedPair,(feedPair[0]+feedPair[1])/2);vcEl.dataset.tool=tool;vcEl.dataset.material=material;}
  const vc=Number(vcEl.value), selectedFeed=Number(fEl.value), ff=isDrill?selectedFeed*d:selectedFeed, raw=(vc*1000)/(Math.PI*d), n=Math.min(raw,max), actualVc=n*Math.PI*d/1000, vf=n*(isDrill?ff:z*ff);
  $('#vc-output').value=`${vc.toFixed(1)} m/min`;$('#feed-name').textContent=isDrill?'Voeding fn':'Tandvoeding fz';$('#feed-output').value=`${ff.toFixed(3)} mm/${isDrill?'omw':'tand'}`;
  $('#rpm-result').textContent=Math.round(n).toLocaleString('nl-NL');$('#feed-result').textContent=Math.round(vf).toLocaleString('nl-NL');$('#rpm-warning').hidden=raw<=max;$('#rpm-warning').textContent=`Gevraagd toerental ${Math.round(raw).toLocaleString('nl-NL')} omw/min is hoger dan het ingestelde maximum. Begrensd op ${Math.round(max).toLocaleString('nl-NL')} omw/min; werkelijke vc is ${actualVc.toFixed(1)} m/min.`;
  $('#used-values').textContent=`Gebruikt: vc ${actualVc.toFixed(1)} m/min · ${isDrill?'fn':'fz'} ${ff.toFixed(3)} mm/${isDrill?'omw':'tand'}${isDrill?'':` · z ${z}`}`;
}
function renderGeschiedenis(){
  const items=JSON.parse(localStorage.getItem('freesadviseur-history')||'[]');
  $('#screen-geschiedenis').innerHTML=`<div class="page-head"><p class="eyebrow">Op dit toestel</p><h1>Geschiedenis</h1><p>Je recente vragen worden alleen in deze browser bewaard.</p></div><div class="panel history-panel">${items.length?items.map((i,n)=>`<div class="history-row"><button data-history="${n}"><span class="topic-program">${esc(i.program)} · ${esc(i.date)}</span><strong>${esc(i.question)}</strong></button><button class="delete-history" data-delete="${n}" aria-label="Verwijder vraag">×</button></div>`).join(''):'<div class="empty-detail"><div class="placeholder-icon">◷</div><h2>Nog geen vragen</h2><p>Je vragen en antwoorden verschijnen hier op dit toestel.</p></div>'}</div>${items.length?'<button id="clear-history" class="text-button">Wis geschiedenis</button>':''}`;
}
function renderInfo(){
  $('#screen-info').innerHTML=`<div class="page-head"><p class="eyebrow">Over de app</p><h1>Info</h1><p>Praktische ondersteuning voor jouw werkwijze in EZ-MILL en EZ-DNC.</p></div><div class="info-grid"><article class="panel info-card"><span class="info-icon">✳</span><h2>Adviseur</h2><p>Stel een vraag over post of G-code. AI-antwoorden kunnen onjuist zijn; controleer en test elke wijziging zorgvuldig.</p></article><article class="panel info-card"><span class="info-icon">▤</span><h2>Kennisbasis</h2><p>Programmaspecifieke uitleg hoort onderbouwd te zijn met jouw handleidingen en screenshots. Die kun je later aanvullen in de map <code>kennis</code>.</p></article><article class="panel info-card"><span class="info-icon">⌁</span><h2>Freeswaarden</h2><p>Alle waarden zijn indicatief. Controleer gegevens van gereedschapsfabrikant en machine.</p></article><article class="panel info-card"><span class="info-icon">◷</span><h2>Privacy</h2><p>Geen login. Vraaggeschiedenis blijft in localStorage op dit toestel. Foto’s worden alleen tijdelijk naar de AI-functie verstuurd en niet door de app opgeslagen.</p></article></div><section class="panel setup-panel"><h2>Installatie en publicatie</h2><ol><li>Maak een GitHub-repository en upload de appbestanden.</li><li>Verbind de repository aan Cloudflare Pages; kies de hoofdmap als root en laat de buildopdracht leeg.</li><li>Voeg in Cloudflare Pages → Settings → Variables and Secrets de secret <code>OPENAI_API_KEY</code> toe en variabele <code>MODEL</code>.</li><li>Gebruik de Cloudflare Pages URL om de app te openen en op iPhone via Deel → Zet op beginscherm te installeren.</li></ol><p>Voor de kennisbasis ontbreken nog jouw officiële handleidingen, eigen screenshots en controle van de startwaarden.</p></section>`;
}
function renderAll(){renderVraag();renderUitleg();renderWaarden();renderGeschiedenis();renderInfo();}
function toast(message){const el=$('#toast');el.textContent=message;el.classList.add('visible');setTimeout(()=>el.classList.remove('visible'),1800);}
function saveHistory(item){const items=JSON.parse(localStorage.getItem('freesadviseur-history')||'[]');items.unshift(item);localStorage.setItem('freesadviseur-history',JSON.stringify(items.slice(0,50)));}
function markdownToHtml(input){
  const lines=String(input||'').split('\n');let out='',code=false,buf=[];
  for(const line of lines){if(line.trim().startsWith('```')){if(code){out+=`<div class="code-wrap"><button class="copy-code" type="button">Kopieer</button><pre><code>${esc(buf.join('\n'))}</code></pre></div>`;buf=[];}code=!code;continue;}if(code){buf.push(line);continue;}if(/^#{1,3} /.test(line))out+=`<h3>${esc(line.replace(/^#{1,3} /,''))}</h3>`;else if(/^\s*[-*] /.test(line))out+=`<p>• ${esc(line.replace(/^\s*[-*] /,''))}</p>`;else if(/^\d+\. /.test(line))out+=`<p class="step-line">${esc(line.replace(/^\d+\. /,''))}</p>`;else if(line.trim())out+=`<p>${esc(line).replace(/\*\*(.+?)\*\*/g,'<strong>$1</strong>')}</p>`;}
  return out;
}
async function resizeImage(file){
  if(!file.type.startsWith('image/'))throw new Error('Kies een afbeeldingsbestand.');
  const url=URL.createObjectURL(file);try{const img=new Image();img.src=url;await img.decode();const scale=Math.min(1,1600/Math.max(img.width,img.height));const canvas=document.createElement('canvas');canvas.width=Math.round(img.width*scale);canvas.height=Math.round(img.height*scale);canvas.getContext('2d').drawImage(img,0,0,canvas.width,canvas.height);return await new Promise(resolve=>canvas.toBlob(resolve,'image/jpeg',.82));}finally{URL.revokeObjectURL(url);}
}
async function setImage(file){try{const blob=await resizeImage(file);if(blob.size>5*1024*1024)throw new Error('Deze foto is te groot. Kies een kleinere afbeelding.');chosenImage=blob;const url=URL.createObjectURL(blob);$('#image-preview').hidden=false;$('#image-preview').innerHTML=`<img src="${url}" alt="Foto bij je vraag"><span>${esc(file.name||'Foto verkleind')}</span><button type="button" class="remove-image" aria-label="Verwijder foto">×</button>`;}catch(e){toast(e.message);}}
function dataUrl(blob){return new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(String(reader.result).split(',')[1]);reader.onerror=reject;reader.readAsDataURL(blob);});}
async function askQuestion(event){
  event.preventDefault();const question=$('#question').value.trim();if(!question)return;const button=$('#ask-button');button.disabled=true;button.innerHTML='Even nadenken…';
  try{const image=chosenImage?{mimeType:'image/jpeg',data:await dataUrl(chosenImage)}:undefined;const payload={program:activeProgram,question,text:$('#code-text').value.trim()||undefined,image};const response=await fetch('/api/ask',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});const result=await response.json();if(!response.ok)throw new Error(result.error||'Het antwoord kon niet worden opgehaald.');$('#answer-content').innerHTML=markdownToHtml(result.answer||'Er is geen antwoord ontvangen.');$('#answer-dialog').showModal();saveHistory({...payload,image:undefined,answer:result.answer,date:new Date().toLocaleDateString('nl-NL')});}catch(e){$('#answer-content').innerHTML=`<div class="error-card"><h3>Antwoord niet beschikbaar</h3><p>${esc(e.message||'Controleer je verbinding en probeer opnieuw.')}</p><p>De AI-verbinding is beschikbaar zodra de app op Cloudflare Pages staat met een geldige <code>OPENAI_API_KEY</code>.</p></div>`;$('#answer-dialog').showModal();}finally{button.disabled=false;button.innerHTML='Stel je vraag <span>↗</span>';}
}
renderAll();
function setActivePage(scroll=true){const requested=location.hash.slice(1)||'vraag';const id=NAV.some(n=>n.id===requested)?requested:'vraag';document.querySelectorAll('.screen').forEach(s=>s.classList.toggle('active',s.dataset.screen===id));document.querySelectorAll('.nav-item').forEach(a=>a.classList.toggle('selected',a.dataset.go===id));if(id==='geschiedenis')renderGeschiedenis();if(scroll){$('#main').focus({preventScroll:true});window.scrollTo({top:0,behavior:'smooth'});}}
window.addEventListener('hashchange',()=>setActivePage());setActivePage(false);
document.addEventListener('click',async e=>{
  const program=e.target.closest('[data-program]');if(program){activeProgram=program.dataset.program;document.querySelectorAll('[data-program]').forEach(b=>b.classList.toggle('active',b.dataset.program===activeProgram));}
  const topic=e.target.closest('[data-topic]');if(topic){const t=topics.find(x=>x.id===topic.dataset.topic);if(t)openTopic(t);}
  const filter=e.target.closest('[data-filter]');if(filter){document.querySelectorAll('.filter').forEach(b=>b.classList.toggle('active',b===filter));renderTopicList();}
  if(e.target.id==='close-answer')$('#answer-dialog').close();
  const copyButton=e.target.closest('.copy-code');if(copyButton){await navigator.clipboard.writeText(copyButton.parentElement.querySelector('code').textContent);copyButton.textContent='Gekopieerd';setTimeout(()=>{if(copyButton.isConnected)copyButton.textContent='Kopieer';},1400);}
  if(e.target.closest('.remove-image')){chosenImage=null;$('#image-preview').hidden=true;$('#image-preview').innerHTML='';}
  if(e.target.id==='copy-values'){const txt=`${$('#tool-select').value} · ${$('#material-select').value}\nn ${$('#rpm-result').textContent} omw/min\nvf ${$('#feed-result').textContent} mm/min\n${$('#used-values').textContent}`;await navigator.clipboard.writeText(txt);toast('Gekopieerd');}
  const del=e.target.closest('[data-delete]');if(del){const a=JSON.parse(localStorage.getItem('freesadviseur-history')||'[]');a.splice(Number(del.dataset.delete),1);localStorage.setItem('freesadviseur-history',JSON.stringify(a));renderGeschiedenis();}
  const hist=e.target.closest('[data-history]');if(hist){const item=JSON.parse(localStorage.getItem('freesadviseur-history')||'[]')[Number(hist.dataset.history)];$('#answer-content').innerHTML=markdownToHtml(item.answer);$('#answer-dialog').showModal();}
  if(e.target.id==='clear-history'){localStorage.removeItem('freesadviseur-history');renderGeschiedenis();}
});
document.addEventListener('input',e=>{if(e.target.id==='topic-search')renderTopicList();if(['tool-select','material-select','diameter','teeth','max-rpm','vc-range','feed-range'].includes(e.target.id))updateCalc();});
document.addEventListener('change',e=>{if(e.target.id==='image-file'&&e.target.files[0])setImage(e.target.files[0]);if(['tool-select','material-select'].includes(e.target.id)){const vc=$('#vc-range');vc.dataset.tool='';updateCalc();}});
document.addEventListener('submit',e=>{if(e.target.id==='ask-form')askQuestion(e);});
const questionArea=$('#question');document.addEventListener('paste',e=>{const item=[...(e.clipboardData?.items||[])].find(i=>i.type.startsWith('image/'));if(item){e.preventDefault();setImage(item.getAsFile());}});
document.addEventListener('dragover',e=>{if([...e.dataTransfer?.items||[]].some(i=>i.kind==='file'&&i.type.startsWith('image/')))e.preventDefault();});
document.addEventListener('drop',e=>{const file=[...e.dataTransfer?.files||[]].find(f=>f.type.startsWith('image/'));if(file){e.preventDefault();setImage(file);}});
if('serviceWorker' in navigator)window.addEventListener('load',()=>navigator.serviceWorker.register('/service-worker.js').catch(()=>{}));
