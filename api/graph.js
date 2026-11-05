import {demo} from '../lib/data.js';
import {loadGraph} from '../lib/db.js';
export default async function handler(req,res){
 res.setHeader('Cache-Control','no-store');
 if(req.method!=='GET')return res.status(405).json({error:'Método não permitido'});
 try {const live=process.env.DATA_MODE==='neo4j'; const graph=live?await loadGraph():demo;res.status(200).json({...graph,mode:live?'neo4j':'demo'});}
 catch {res.status(503).json({error:'Não foi possível consultar o Neo4j. Confira a configuração no servidor.'});}
}
