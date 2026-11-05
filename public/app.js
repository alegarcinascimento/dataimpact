import {traverse} from './graph.js';
const $=id=>document.getElementById(id), NS='http://www.w3.org/2000/svg';
let graph, selected='rawSales', direction='downstream', simulating=false, zoom=1, pan={x:0,y:0}, drag;
const labels={source:'Fonte',job:'Processo',table:'Tabela',report:'Relatório'};
const palette={source:['#edf3fa','#8aa7c8'],job:['#f4f0fa','#a392c4'],table:['#edf8f4','#6aaf9e'],report:['#fcf5ea','#cbae7b']};
const el=(tag,attrs={})=>{const e=document.createElementNS(NS,tag);for(const [k,v]of Object.entries(attrs))e.setAttribute(k,v);return e;};
function error(message){$('error').textContent=message;$('error').hidden=false;setTimeout(()=>$('error').hidden=true,7000);}
async function get(url){const response=await fetch(url);const data=await response.json();if(!response.ok)throw Error(data.error||'Não foi possível carregar os dados.');return data;}
function name(id){return graph.nodes.find(n=>n.id===id)?.label||id;}
function select(id){if(!graph?.nodes.some(n=>n.id===id))return;selected=id;simulating=false;$('asset-results').hidden=true;$('asset-search').value='';render();}
function layout(){
 const depth=new Map(graph.nodes.map(n=>[n.id,0]));
 // Bounded longest-path layering: cycles remain safe and cannot loop forever.
 for(let k=0;k<Math.min(graph.nodes.length,12);k++)for(const e of graph.edges)depth.set(e.target,Math.min(10,Math.max(depth.get(e.target)||0,(depth.get(e.source)||0)+1)));
 const columns=new Map();for(const n of graph.nodes){const d=depth.get(n.id)||0;if(!columns.has(d))columns.set(d,[]);columns.get(d).push(n);}
 const max=Math.max(...depth.values(),1), positions=new Map();
 for(const [d,items]of columns)items.forEach((n,i)=>positions.set(n.id,{x:70+d*(850/max),y:105+(i+0.5)*350/items.length}));
 return positions;
}
function render(){
 if(!graph)return;
 const asset=graph.nodes.find(n=>n.id===selected);if(!asset)return;
 const reach=traverse(graph,selected,direction), set=new Set(reach.ids);
 const affected=graph.nodes.filter(n=>n.id!==selected&&set.has(n.id));
 $('total').textContent=graph.nodes.length;$('affected').textContent=affected.length;$('reports').textContent=affected.filter(n=>n.kind==='report').length;$('teams').textContent=new Set(affected.map(n=>n.owner)).size;
 $('reach-label').textContent=direction==='upstream'?'Antecessores do ativo selecionado':'Dependentes do ativo selecionado';
 $('kind').textContent=labels[asset.kind]||asset.kind;$('selected-title').textContent=asset.label;$('description').textContent=asset.description;$('owner').textContent=asset.owner;
 $('simulate').textContent=simulating?'Encerrar simulação':'⚡ Simular indisponibilidade';$('simulate').classList.toggle('simulating',simulating);
 $('simulation-note').textContent=simulating?'Cenário hipotético ativo. O destaque representa dependência potencial, sem confirmar falhas.':'Simulação hipotética. Nenhum processo será alterado.';
 $('graph-status').textContent=simulating?'SIMULAÇÃO DE INDISPONIBILIDADE':'EXPLORANDO DEPENDÊNCIAS';$('graph-subtitle').textContent=asset.label+' · '+affected.length+' ativos no alcance';
 $('edge-count').textContent=graph.edges.length+' relações';$('paths-title').textContent=direction==='upstream'?'Caminhos até a origem':'Caminhos de impacto';
 const paths=$('paths');paths.replaceChildren();
 const relevant=direction==='downstream'?affected.filter(n=>n.kind==='report'):affected.filter(n=>n.kind==='source');
 for(const n of (relevant.length?relevant:affected).slice(0,8)){const d=document.createElement('div');d.className='path';d.textContent=n.label;const small=document.createElement('small');small.textContent=(direction==='upstream'?[...reach.paths[n.id]].reverse():reach.paths[n.id]).map(name).join(' → ');d.append(small);paths.append(d);}
 if(!affected.length)paths.textContent='Nenhuma dependência nesta direção.';
 const svg=$('graph');svg.replaceChildren();const defs=el('defs');
 for(const [id,color]of [['normal','#bdcfd4'],['active','#1d9c8d'],['failed','#d67344']]){const marker=el('marker',{id,viewBox:'0 0 10 10',refX:9,refY:5,markerWidth:5,markerHeight:5,orient:'auto-start-reverse'});marker.append(el('path',{d:'M 0 0 L 10 5 L 0 10 z',fill:color}));defs.append(marker);}svg.append(defs);
 const group=el('g',{id:'viewport'});svg.append(group);const pos=layout();
 for(const e of graph.edges){if(!pos.has(e.source)||!pos.has(e.target))continue;const a=pos.get(e.source),b=pos.get(e.target),active=set.has(e.source)&&set.has(e.target),state=active?(simulating?'failed':'active'):'normal';group.append(el('path',{d:`M ${a.x+48} ${a.y} C ${a.x+73} ${a.y} ${b.x-73} ${b.y} ${b.x-48} ${b.y}`,class:'edge '+(active?state:''),'marker-end':`url(#${state})`,opacity:active?1:.32}));}
 for(const n of graph.nodes){const point=pos.get(n.id), colors=palette[n.kind]||palette.table;const g=el('g',{class:'node '+(set.has(n.id)?'':'dim ')+(n.id===selected?'selected':''),transform:`translate(${point.x},${point.y})`,tabindex:0,role:'button','aria-label':n.label});
 g.append(el('rect',{x:-48,y:-21,width:96,height:42,rx:7,fill:simulating&&set.has(n.id)?'#fff3ea':colors[0],stroke:simulating&&set.has(n.id)?'#d67344':colors[1]}));
 const title=el('title');title.textContent=n.label+' · '+n.owner;g.append(title);
 const text=el('text',{x:0,y:0,'text-anchor':'middle'});text.textContent=n.label.length>19?n.label.slice(0,17)+'…':n.label;g.append(text);const kind=el('text',{x:0,y:12,'text-anchor':'middle',class:'kind-label'});kind.textContent=labels[n.kind]||n.kind;g.append(kind);g.addEventListener('click',()=>select(n.id));g.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();select(n.id);}});group.append(g);}
 updateView();
}
function updateView(){$('viewport')?.setAttribute('transform',`translate(${500+pan.x} ${285+pan.y}) scale(${zoom}) translate(-500 -285)`);}
$('direction').onchange=e=>{direction=e.target.value;simulating=false;render();};
$('simulate').onclick=()=>{if(direction!=='downstream'){direction='downstream';$('direction').value=direction;}simulating=!simulating;render();};
$('reset').onclick=()=>{direction='downstream';$('direction').value=direction;zoom=1;pan={x:0,y:0};select(graph.nodes.some(n=>n.id==='rawSales')?'rawSales':graph.nodes[0].id);};
$('zoom-in').onclick=()=>{zoom=Math.min(3,zoom+.2);updateView();};$('zoom-out').onclick=()=>{zoom=Math.max(.6,zoom-.2);updateView();};$('fit').onclick=()=>{zoom=1;pan={x:0,y:0};updateView();};
$('graph').addEventListener('pointerdown',e=>{if(e.target.closest('.node'))return;drag={x:e.clientX,y:e.clientY,px:pan.x,py:pan.y};$('graph').setPointerCapture(e.pointerId);});
$('graph').addEventListener('pointermove',e=>{if(!drag)return;const ratio=1000/$('graph').getBoundingClientRect().width;pan={x:drag.px+(e.clientX-drag.x)*ratio,y:drag.py+(e.clientY-drag.y)*ratio};updateView();});
for(const event of ['pointerup','pointercancel'])$('graph').addEventListener(event,()=>drag=null);
$('asset-search').oninput=e=>{if(!graph)return;const value=e.target.value.toLocaleLowerCase();const box=$('asset-results');box.replaceChildren();box.hidden=!value;if(!value)return;const matches=graph.nodes.filter(n=>n.label.toLocaleLowerCase().includes(value));for(const n of matches){const b=document.createElement('button');b.textContent=n.label+' · '+labels[n.kind];b.onclick=()=>select(n.id);box.append(b);}if(!matches.length)box.textContent='Nenhum ativo encontrado.';};
document.querySelectorAll('[data-scenario]').forEach(b=>b.onclick=()=>{direction='downstream';$('direction').value=direction;select(b.dataset.scenario);simulating=true;render();document.querySelector('.workspace').scrollIntoView({behavior:'smooth',block:'start'});});
function showIncidents(items){const box=$('incidents');box.replaceChildren();if(!items.length){box.textContent='Nenhuma ocorrência encontrada. Experimente outro termo.';return;}for(const i of items){const d=document.createElement('article');d.className='incident';const title=document.createElement('b');title.textContent=i.id+' · '+i.title;const desc=document.createElement('p');desc.textContent=i.description;const details=document.createElement('details');const summary=document.createElement('summary');summary.textContent='Ver evidência e solução histórica';const evidence=document.createElement('p');evidence.textContent=i.evidence;const resolution=document.createElement('p');resolution.textContent='Solução registrada: '+i.resolution;details.append(summary,evidence,resolution);const b=document.createElement('button');b.textContent='Explorar ativo relacionado →';b.onclick=()=>{select(i.asset);document.querySelector('.workspace').scrollIntoView({behavior:'smooth'});};d.append(title,desc,details,b);box.append(d);}}
$('incident-form').onsubmit=async e=>{e.preventDefault();const button=e.submitter;button.disabled=true;$('search-mode').textContent='Consultando ocorrências…';try{const data=await get('/api/search?q='+encodeURIComponent($('incident-query').value));$('search-mode').textContent=data.mode==='semantic'?'Busca semântica por embeddings · Similaridade não confirma causa raiz.':'Busca por palavras · Sem embeddings nesta consulta.';showIncidents(data.items);}catch(e){$('search-mode').textContent='A consulta não foi concluída.';error(e.message);}finally{button.disabled=false;}};
$('help').onclick=()=>$('guide').showModal();$('close-help').onclick=()=>$('guide').close();
$('export').onclick=()=>{if(!graph)return;const reach=traverse(graph,selected,direction);const data={project:'DataImpact',generatedAt:new Date().toISOString(),dataMode:graph.mode,syntheticData:graph.syntheticData??graph.mode==='demo',selected,direction,simulation:simulating,warning:'Alcance potencial por dependências cadastradas; não confirma falhas.',...reach};const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([JSON.stringify(data,null,2)],{type:'application/json'}));a.download='dataimpact-analise.json';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000);};
try{graph=await get('/api/graph');if(!graph.nodes.length)throw Error('Catálogo vazio. Importe seus ativos ou execute o seed de demonstração.');if(!graph.nodes.some(n=>n.id===selected))selected=graph.nodes[0].id;$('mode').textContent=graph.mode==='neo4j'?'● Neo4j conectado':graph.mode==='file'?'● Catálogo próprio':'● Demonstração · dados fictícios';render();showIncidents(graph.incidents.slice(0,2));showIssues();configureScenarios();}catch(e){$('mode').textContent='Conexão indisponível';$('selected-title').textContent='Não foi possível carregar';$('simulate').disabled=true;error(e.message);}

function configureScenarios(){
 const custom=graph.mode!=='demo';
 if(custom){document.querySelectorAll('[data-scenario]').forEach(b=>b.disabled=true);document.querySelector('.scenarios').hidden=true;document.querySelector('footer span:last-child').textContent='Catálogo próprio · Dados de monitoramento · Neo4j';}
 $('search-mode').textContent=graph.mode==='demo'?'Busca por palavras nos incidentes fictícios.':'Busca de incidentes cadastrados. O modo da consulta será informado no resultado.';
}
function showIssues(){
 const box=$('issues');if(!box)return;box.replaceChildren();const items=graph.issues||[];
 $('issue-summary').textContent=items.length?`${items.length} verificações requerem investigação`:'Nenhuma violação encontrada nas regras configuradas';
 if(!items.length){const p=document.createElement('p');p.className='note';p.textContent='Ausência de alerta não comprova qualidade: configure minRows ou maxAgeMinutes e colete métricas. Atualize a página após cada nova coleta.';box.append(p);return;}
 for(const issue of items){const article=document.createElement('article');article.className='issue';const title=document.createElement('strong');title.textContent=name(issue.asset);const desc=document.createElement('p');desc.textContent=issue.detail;const note=document.createElement('small');note.textContent=`${issue.affected.length} consumidores e ${issue.reports.length} relatórios potencialmente afetados. Coleta: ${issue.observedAt||'não informada'}`;const button=document.createElement('button');button.className='quiet';button.textContent='Rastrear dependências →';button.onclick=()=>{direction='downstream';$('direction').value=direction;select(issue.asset);document.querySelector('.workspace').scrollIntoView({behavior:'smooth'});};article.append(title,desc,note,button);box.append(article);}
}
