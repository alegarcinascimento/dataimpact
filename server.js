import http from 'node:http';
import {readFile} from 'node:fs/promises';
import path from 'node:path';
import history from './api/history.js';
import graph from './api/graph.js';import search from './api/search.js';
const root=path.resolve('public');
http.createServer(async(req,res)=>{
 const url=new URL(req.url,'http://localhost');
 res.status=code=>{res.statusCode=code;return res;};res.json=value=>{res.setHeader('Content-Type','application/json');res.end(JSON.stringify(value));};
 req.query=Object.fromEntries(url.searchParams);
 if(url.pathname==='/api/history')return history(req,res);
 if(url.pathname==='/api/graph')return graph(req,res);
 if(url.pathname==='/api/search')return search(req,res);
 const name=url.pathname==='/'?'index.html':url.pathname.slice(1); const file=path.resolve(root,name);
 if(!file.startsWith(root+path.sep)){res.statusCode=403;return res.end();}
 try{const content=await readFile(file);res.setHeader('Content-Type',({'html':'text/html; charset=utf-8','css':'text/css','js':'text/javascript','svg':'image/svg+xml'})[file.split('.').pop()]||'application/octet-stream');res.end(content);}catch{res.statusCode=404;res.end('Não encontrado');}
}).listen(process.env.PORT||3000,()=>console.log('DataImpact: http://localhost:'+(process.env.PORT||3000)));
