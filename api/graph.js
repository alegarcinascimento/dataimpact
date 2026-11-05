import {loadSource} from '../lib/source.js';
export default async function handler(req,res){
 res.setHeader('Cache-Control','no-store');
 if(req.method!=='GET')return res.status(405).json({error:'Método não permitido'});
 try {res.status(200).json(await loadSource());}
 catch {res.status(503).json({error:'Não foi possível carregar o catálogo. Confira modo, arquivo ou banco configurado.'});}
}
