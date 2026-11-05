import {retrievalDataset} from './retrieval-data.js';
import {retrieveLexical} from './retrieval.js';
export function initializeLab(graph){
 const byId=id=>document.getElementById(id),select=byId('lab-query'),output=byId('lab-results');if(!select)return;
 for(const q of retrievalDataset.queries){const option=document.createElement('option');option.value=q.id;option.textContent=q.text;select.append(option);}
 function compare(){const q=retrievalDataset.queries.find(q=>q.id===select.value);output.replaceChildren();
  for(const [label,context]of [['Busca por palavras',false],['Palavras + grafo',true]]){const column=document.createElement('div');const title=document.createElement('h3');title.textContent=label;column.append(title);const items=retrieveLexical(retrievalDataset.incidents,q.text,graph,q.asset,context).slice(0,3);
   for(const i of items){const article=document.createElement('article');article.className='lab-result';const h=document.createElement('strong');h.textContent=i.id+' · '+i.title;const tag=document.createElement('small');tag.textContent=(q.relevant.includes(i.id)?'Relevante no gabarito sintético':'Fora do gabarito sintético')+(context?(i.connected?' · Conectado ao ativo':' · Sem conexão direta na investigação'):'');const p=document.createElement('p');p.textContent='Passo registrado: '+i.resolution;article.append(h,tag,p);column.append(article);}if(!items.length)column.append('Nenhuma correspondência.');output.append(column);}
  byId('lab-context').textContent='Ativo investigado: '+(graph.nodes.find(n=>n.id===q.asset)?.label||q.asset)+'. Gabarito manual; não representa avaliação em produção.';
 }
 select.onchange=compare;compare();
 fetch('/retrieval-report.json').then(r=>{if(!r.ok)throw Error();return r.json();}).then(report=>{
  const box=byId('benchmark-results');box.replaceChildren();const table=document.createElement('table');const head=document.createElement('thead');head.innerHTML='<tr><th>Método</th><th title="Quanto dos incidentes relevantes apareceu nas três primeiras sugestões">Cobertura nos 3 primeiros (Recall@3)</th><th title="Quanto a ordem dos resultados se aproxima da melhor ordem do gabarito">Qualidade da ordem (NDCG@3)</th></tr>';table.append(head);const body=document.createElement('tbody');
  for(const r of report.results||[]){const row=document.createElement('tr');for(const value of [r.method,(r.recallAt3*100).toFixed(1)+'%',r.ndcgAt3.toFixed(3)]){const cell=document.createElement('td');cell.textContent=value;row.append(cell);}body.append(row);}table.append(body);box.append(table);byId('semantic-status').textContent=report.semanticStatus==='evaluated'?'Embeddings e quantização residual avaliados; consulte as condições e os resultados completos no relatório.':'Embeddings e Semantic IDs: não avaliados nesta execução. Configure o provedor e execute npm run evaluate -- --embed.';
 }).catch(()=>{byId('semantic-status').textContent='Relatório numérico indisponível. A comparação interativa por palavras continua disponível.';});
}
