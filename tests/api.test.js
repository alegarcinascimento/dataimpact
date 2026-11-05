import test from 'node:test';import assert from 'node:assert/strict';import http from 'node:http';
import graph from '../api/graph.js';import search from '../api/search.js';
test('HTTP: dados demo, busca, método e validação de entrada',async()=>{
 const server=http.createServer((req,res)=>{const url=new URL(req.url,'http://localhost');req.query=Object.fromEntries(url.searchParams);res.status=c=>{res.statusCode=c;return res;};res.json=x=>{res.setHeader('Content-Type','application/json');res.end(JSON.stringify(x));};return (url.pathname==='/api/search'?search:graph)(req,res);});
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));const base=`http://127.0.0.1:${server.address().port}`;
 try{const g=await(await fetch(base+'/api/graph')).json();assert.equal(g.mode,'demo');assert.equal(g.nodes.length,28);const s=await(await fetch(base+'/api/search?q=fechamento%20menores')).json();assert.equal(s.items[0].id,'INC-041');assert.equal((await fetch(base+'/api/search?q=x')).status,400);assert.equal((await fetch(base+'/api/graph',{method:'POST'})).status,405);}finally{await new Promise(resolve=>server.close(resolve));}
});
