import {parseArgs} from 'node:util';import {readFile,writeFile,mkdir} from 'node:fs/promises';import path from 'node:path';import {performance} from 'node:perf_hooks';import {createHash} from 'node:crypto';
import {demo} from '../lib/data.js';import {retrieveLexical,contextualize,measureRanking} from '../lib/retrieval.js';import {trainSIDs,encodeSID,decodeSID,cosine,validateVectors} from '../lib/sids.js';
const {values:v}=parseArgs({options:{vectors:{type:'string'},embed:{type:'boolean',default:false},output:{type:'string',default:'.data/retrieval-report.json'}}});
const dataset=JSON.parse(await readFile(new URL('../experiments/dataset.json',import.meta.url),'utf8'));const datasetHash=createHash('sha256').update(JSON.stringify(dataset)).digest('hex');
let vectors,providerUsage=null,embeddingMs=null;if(v.vectors&&v.embed)throw Error('Escolha --vectors ou --embed');
if(v.embed){
 if(!process.env.OPENAI_API_KEY)throw Error('Configure OPENAI_API_KEY para gerar embeddings');
 const embeddingStart=performance.now();
 const input=[...dataset.incidents.map(i=>i.title+' '+i.description),...dataset.queries.map(q=>q.text)];
 const response=await fetch('https://api.openai.com/v1/embeddings',{method:'POST',signal:AbortSignal.timeout(30000),headers:{Authorization:`Bearer ${process.env.OPENAI_API_KEY}`,'Content-Type':'application/json'},body:JSON.stringify({model:process.env.EMBEDDING_MODEL||'text-embedding-3-small',input,dimensions:1536})});
 if(!response.ok)throw Error('Falha no provedor de embeddings');const result=await response.json();providerUsage=result.usage||null;embeddingMs=performance.now()-embeddingStart;const byIndex=new Map(result.data.map(x=>[x.index,x.embedding]));
 vectors={datasetHash,model:process.env.EMBEDDING_MODEL||'text-embedding-3-small',incidents:Object.fromEntries(dataset.incidents.map((i,j)=>[i.id,byIndex.get(j)])),queries:Object.fromEntries(dataset.queries.map((q,j)=>[q.id,byIndex.get(dataset.incidents.length+j)]))};
}
if(v.vectors)vectors=JSON.parse(await readFile(v.vectors,'utf8'));
let model,reconstructed;
if(vectors){if(vectors.datasetHash!==datasetHash||typeof vectors.model!=='string')throw Error('Vetores exigem datasetHash e model correspondentes ao conjunto');validateVectors([...dataset.incidents.map(i=>vectors.incidents[i.id]),...dataset.queries.map(q=>vectors.queries[q.id])]);model=trainSIDs(dataset.incidents.map(i=>vectors.incidents[i.id]));reconstructed=dataset.incidents.map(i=>({...i,sid:encodeSID(vectors.incidents[i.id],model)}));}
const modes=['lexical','lexical_graph',...(vectors?['vector','vector_graph','sid_reconstructed','sid_graph']:[])],results=[];
for(const mode of modes){const details=[];for(const q of dataset.queries){const start=performance.now();let ranking;
 if(mode.startsWith('lexical'))ranking=retrieveLexical(dataset.incidents,q.text,demo,q.asset,mode.endsWith('_graph'));
 else{ranking=(mode.startsWith('sid')?reconstructed:dataset.incidents).map(i=>({...i,score:cosine(vectors.queries[q.id],mode.startsWith('sid')?decodeSID(i.sid,model):vectors.incidents[i.id])})).sort((a,b)=>b.score-a.score||a.id.localeCompare(b.id));if(mode.endsWith('_graph'))ranking=contextualize(ranking,demo,q.asset);}
 const elapsed=performance.now()-start;details.push({query:q.id,top:ranking.slice(0,3).map(i=>i.id),...measureRanking(ranking,q.relevant,3),rankingMs:elapsed});}
 const sorted=details.map(x=>x.rankingMs).sort((a,b)=>a-b);const average=key=>details.reduce((s,d)=>s+d[key],0)/details.length;
 results.push({method:mode,recallAt3:average('recall'),precisionAt3:average('precision'),ndcgAt3:average('ndcg'),rankingP50Ms:sorted[Math.floor(sorted.length*.5)],rankingP95Ms:sorted[Math.min(sorted.length-1,Math.floor(sorted.length*.95))],details});}
const report={dataset:dataset.version,datasetHash,synthetic:true,incidents:dataset.incidents.length,queries:dataset.queries.length,k:3,generatedAt:new Date().toISOString(),environment:{node:process.version,platform:process.platform},methodology:'Single warm-process pass. Ranking CPU only: excludes embedding generation, network, database, training and UI. No production speed or accuracy claim.',semanticStatus:vectors?'evaluated':'not_evaluated_no_embeddings',embeddingModel:vectors?.model||null,vectorSource:v.embed?'provider':v.vectors?'provided_unverified':null,providerUsage,embeddingMs,results,...(model?{quantization:{method:model.method,levels:model.codebooks.length,codebooks:model.codebooks.map(c=>c.length),distinctCodes:new Set(reconstructed.map(i=>i.sid.join('.'))).size,collisions:reconstructed.length-new Set(reconstructed.map(i=>i.sid.join('.'))).size,codes:reconstructed.map(i=>({id:i.id,sid:i.sid}))}}:{})};
await mkdir(path.dirname(v.output),{recursive:true});await writeFile(v.output,JSON.stringify(report,null,2));console.log(JSON.stringify({report:v.output,semanticStatus:report.semanticStatus,results:results.map(({details,...r})=>r)},null,2));
