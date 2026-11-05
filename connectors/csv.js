import {parseCSV,readBounded,validateCatalog} from '../lib/catalog.js';
export async function profileCSV(graph,{file,assetId,timestampColumn,delimiter=',',now=new Date()}){
 const asset=graph.nodes.find(a=>a.id===assetId);if(!asset)throw Error('Ativo não encontrado no catálogo.');
 const records=parseCSV(await readBounded(file),delimiter);
 if(timestampColumn&&records.length&&!Object.hasOwn(records[0],timestampColumn))throw Error('Coluna de atualização não encontrada.');
 let updatedAt=null;
 for(const row of records)if(timestampColumn&&row[timestampColumn]){const value=row[timestampColumn];if(!/^\d{4}-\d{2}-\d{2}T.*(?:Z|[+-]\d{2}:\d{2})$/.test(value)||!Number.isFinite(Date.parse(value)))throw Error('Timestamp CSV inválido; use ISO 8601 com timezone.');if(!updatedAt||Date.parse(value)>Date.parse(updatedAt))updatedAt=new Date(value).toISOString();}
 return validateCatalog({...graph,nodes:graph.nodes.map(n=>n.id===assetId?{...n,rowCount:records.length,observedAt:now.toISOString(),...(timestampColumn?{updatedAt}:{})}:n)});
}
