import {demo} from '../lib/data.js';
import {lexicalSearch} from '../lib/graph.js';
import {query} from '../lib/db.js';
export default async function handler(req,res){
 res.setHeader('Cache-Control','no-store');
 if(req.method!=='GET')return res.status(405).json({error:'Método não permitido'});
 const q=String(req.query?.q||'').trim(); if(q.length<3||q.length>300)return res.status(400).json({error:'Descreva o problema em 3 a 300 caracteres.'});
 try {
 if(process.env.DATA_MODE!=='neo4j')return res.status(200).json({mode:'lexical',items:lexicalSearch(demo.incidents,q)});
 if(!process.env.OPENAI_API_KEY){
 const records=await query('MATCH (i:DIIncident) RETURN i {.*, embedding:null} AS item LIMIT 201');
 if(records.length>200)throw new Error('Search dataset too large');
 return res.status(200).json({mode:'lexical',items:lexicalSearch(records.map(r=>r.get('item')),q)});
 }
 const response=await fetch('https://api.openai.com/v1/embeddings',{method:'POST',signal:AbortSignal.timeout(10000),headers:{Authorization:`Bearer ${process.env.OPENAI_API_KEY}`,'Content-Type':'application/json'},body:JSON.stringify({model:process.env.EMBEDDING_MODEL||'text-embedding-3-small',input:q,dimensions:1536})});
 if(!response.ok)throw new Error('Embedding failed');
 const embedding=(await response.json()).data[0].embedding;
 const records=await query("CALL db.index.vector.queryNodes('di_incident_embedding', 4, $embedding) YIELD node, score RETURN node {.*, embedding:null} AS item, score",{embedding});
 return res.status(200).json({mode:'semantic',items:records.map(r=>{const i=r.get('item');delete i.embedding;return {...i,score:r.get('score')};})});
 } catch {res.status(503).json({error:'Busca indisponível. Verifique o banco, o índice vetorial e o provedor de embeddings.'});}
}
