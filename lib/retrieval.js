import {lexicalSearch,traverse} from './graph.js';
export function contextualize(items,graph,asset){
 const upstream=traverse(graph,asset,'upstream'),downstream=traverse(graph,asset),connected=new Set([...upstream.ids,...downstream.ids]);
 return items.map(i=>({...i,connected:connected.has(i.asset),score:i.score+(connected.has(i.asset)?1:0)})).sort((a,b)=>Number(b.connected)-Number(a.connected)||b.score-a.score||a.id.localeCompare(b.id));
}
export function retrieveLexical(incidents,query,graph,asset,useGraph=false){const items=lexicalSearch(incidents,query);return useGraph?contextualize(items,graph,asset):items;}
export function measureRanking(items,relevant,k=3){const actual=new Set(relevant),top=items.slice(0,k);const hits=top.filter(i=>actual.has(i.id)).length;const dcg=top.reduce((s,i,index)=>s+(actual.has(i.id)?1/Math.log2(index+2):0),0);const ideal=Array.from({length:Math.min(k,actual.size)},(_,i)=>1/Math.log2(i+2)).reduce((a,b)=>a+b,0);return {recall:actual.size?hits/actual.size:0,precision:hits/k,ndcg:ideal?dcg/ideal:0};}
