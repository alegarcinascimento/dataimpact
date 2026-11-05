import {traverse} from './graph.js';
export function detectIssues(graph,now=new Date()){
 const issues=[];
 for(const n of graph.nodes){
  const add=(rule,detail)=>{const reach=traverse(graph,n.id);const affected=graph.nodes.filter(a=>a.id!==n.id&&reach.ids.includes(a.id));issues.push({id:n.id+':'+rule,asset:n.id,rule,detail,observedAt:n.observedAt||null,affected:affected.map(a=>a.id),reports:affected.filter(a=>a.kind==='report').map(a=>a.id),paths:reach.paths});};
  if(n.minRows!==undefined){if(n.rowCount===undefined)add('missing_volume','Volume ainda não coletado para a regra configurada.');else if(n.rowCount<n.minRows)add('low_volume',`Volume observado: ${n.rowCount}; mínimo configurado: ${n.minRows}.`);}
  if(n.maxAgeMinutes!==undefined){
   if(!n.updatedAt)add('missing_freshness','Nenhum timestamp válido de atualização disponível para a regra.');
   else {const age=(now-Date.parse(n.updatedAt))/60000;if(age< -5)add('future_timestamp','Atualização está no futuro; confira o relógio e o timezone da origem.');else if(age>n.maxAgeMinutes)add('stale',`Última atualização: ${n.updatedAt}; idade: ${Math.floor(age)} min; limite: ${n.maxAgeMinutes} min.`);}
  }
 }
 return issues;
}
