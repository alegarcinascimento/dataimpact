import {readFile,stat,mkdir,writeFile,rename} from 'node:fs/promises';
import path from 'node:path';
import {parse} from 'csv-parse/sync';
export const limits={nodes:500,edges:2000,incidents:200,bytes:10*1024*1024};
const text=(v,max=500)=>typeof v==='string'&&v.length>0&&v.length<=max;
export function validateCatalog(input){
 if(!input||!Array.isArray(input.nodes)||!Array.isArray(input.edges))throw Error('Catálogo requer arrays nodes e edges.');
 const graph={nodes:input.nodes,edges:input.edges,incidents:input.incidents||[]};
 if(!Array.isArray(graph.incidents)||!graph.nodes.length||graph.nodes.length>limits.nodes||graph.edges.length>limits.edges||graph.incidents.length>limits.incidents)throw Error('Catálogo vazio ou acima dos limites de ativos, relações ou incidentes.');
 const ids=new Set();
 const nodes=graph.nodes.map(n=>{
  if(!n||!text(n.id,200)||['__proto__','constructor','prototype'].includes(n.id)||ids.has(n.id))throw Error('ID de ativo inválido, reservado ou duplicado.');ids.add(n.id);
  if(!text(n.label,200)||!['source','job','table','report'].includes(n.kind)||!text(n.owner,200)||!text(n.description,2000))throw Error('Ativo requer label, kind, owner e description válidos.');
  const result={id:n.id,label:n.label,kind:n.kind,owner:n.owner,description:n.description};
  for(const key of ['rowCount','minRows','maxAgeMinutes'])if(n[key]!==undefined&&n[key]!==null){if(typeof n[key]!=='number'||!Number.isFinite(n[key])||n[key]<0||(key!=='maxAgeMinutes'&&!Number.isSafeInteger(n[key])))throw Error('Métrica inválida: '+key);result[key]=n[key];}
  for(const key of ['observedAt','updatedAt'])if(n[key]){if(typeof n[key]!=='string'||!/^\d{4}-\d{2}-\d{2}T.*(?:Z|[+-]\d{2}:\d{2})$/.test(n[key])||!Number.isFinite(Date.parse(n[key])))throw Error('Data requer ISO 8601 com timezone: '+key);result[key]=new Date(n[key]).toISOString();}
  if(n.updatedAt===null)result.updatedAt=null;
  return result;
 });
 const pairs=new Set();const edges=graph.edges.map(e=>{
  if(!e||!ids.has(e.source)||!ids.has(e.target)||e.source===e.target)throw Error('Relação inválida: referência ausente ou autorrelação.');
  const key=JSON.stringify([e.source,e.target]);if(pairs.has(key))throw Error('Relação duplicada.');pairs.add(key);return {source:e.source,target:e.target};
 });
 const incidentIds=new Set();const incidents=graph.incidents.map(i=>{
  if(!i||!text(i.id,200)||incidentIds.has(i.id)||!ids.has(i.asset)||!text(i.title,500)||!text(i.description,2000)||!text(i.resolution,4000)||!text(i.evidence,4000)||!Array.isArray(i.tags)||i.tags.length>100||i.tags.some(t=>!text(t,200)))throw Error('Incidente inválido.');incidentIds.add(i.id);
  return Object.fromEntries(['id','asset','title','description','resolution','evidence','tags'].map(k=>[k,i[k]]));
 });
 return {nodes,edges,incidents};
}
export async function readBounded(file){const info=await stat(file);if(!info.isFile()||info.size>limits.bytes)throw Error('Arquivo inválido ou maior que 10 MiB.');return readFile(file,'utf8');}
export function parseCSV(text,delimiter=','){return parse(text,{columns:true,bom:true,skip_empty_lines:true,trim:true,delimiter,max_record_size:1024*1024});}
export async function readCatalog(input){
 const info=await stat(input);if(!info.isDirectory())return validateCatalog(JSON.parse(await readBounded(input)));
 const nodes=parseCSV(await readBounded(path.join(input,'assets.csv'))).map(n=>{for(const k of ['rowCount','minRows','maxAgeMinutes'])if(n[k]!==undefined){if(n[k]==='')delete n[k];else n[k]=Number(n[k]);}for(const k of ['updatedAt','observedAt'])if(n[k]==='')delete n[k];return n;});
 const edges=parseCSV(await readBounded(path.join(input,'dependencies.csv')));return validateCatalog({nodes,edges,incidents:[]});
}
export async function saveCatalog(graph,file=process.env.GRAPH_FILE||'.data/catalog.json'){
 const value=validateCatalog(graph);await mkdir(path.dirname(file),{recursive:true});const temp=file+'.'+process.pid+'.tmp';await writeFile(temp,JSON.stringify(value,null,2),{mode:0o600});await rename(temp,file);return value;
}
