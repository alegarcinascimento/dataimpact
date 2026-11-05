import test from 'node:test';import assert from 'node:assert/strict';import http from 'node:http';
import graph from '../api/graph.js';import search from '../api/search.js';
test('HTTP: dados demo, busca, método e validação de entrada',async()=>{
 const server=http.createServer((req,res)=>{const url=new URL(req.url,'http://localhost');req.query=Object.fromEntries(url.searchParams);res.status=c=>{res.statusCode=c;return res;};res.json=x=>{res.setHeader('Content-Type','application/json');res.end(JSON.stringify(x));};return (url.pathname==='/api/search'?search:graph)(req,res);});
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));const base=`http://127.0.0.1:${server.address().port}`;
 try{const g=await(await fetch(base+'/api/graph')).json();assert.equal(g.mode,'demo');assert.equal(g.nodes.length,28);const s=await(await fetch(base+'/api/search?q=fechamento%20menores')).json();assert.equal(s.items[0].id,'INC-041');assert.equal((await fetch(base+'/api/search?q=x')).status,400);assert.equal((await fetch(base+'/api/graph',{method:'POST'})).status,405);}finally{await new Promise(resolve=>server.close(resolve));}
});
test('API lê catálogo próprio e retorna violações rastreáveis sem dados demo',async()=>{
 const {mkdtemp,rm}=await import('node:fs/promises');const os=await import('node:os');const path=await import('node:path');const {saveCatalog,readCatalog}=await import('../lib/catalog.js');const {profileCSV}=await import('../connectors/csv.js');
 const dir=await mkdtemp(path.join(os.tmpdir(),'di-api-'));const oldMode=process.env.DATA_MODE,oldFile=process.env.GRAPH_FILE;
 const res=()=>({statusCode:200,setHeader(){},status(c){this.statusCode=c;return this;},json(v){this.body=v;}});
 try{const g=await profileCSV(await readCatalog('examples/catalog.json'),{file:'examples/orders.csv',assetId:'orders',timestampColumn:'updated_at'});process.env.DATA_MODE='file';process.env.GRAPH_FILE=path.join(dir,'catalog.json');await saveCatalog(g,process.env.GRAPH_FILE);const r=res();await graph({method:'GET'},r);assert.equal(r.statusCode,200);assert.equal(r.body.mode,'file');assert.equal(r.body.nodes.length,3);assert(r.body.issues.some(i=>i.rule==='low_volume'));assert.deepEqual(r.body.issues[0].paths.report,['orders','transform','report']);const s=res();await search({method:'GET',query:{q:'fechamento'}},s);assert.deepEqual(s.body.items,[]);
 }finally{if(oldMode===undefined)delete process.env.DATA_MODE;else process.env.DATA_MODE=oldMode;if(oldFile===undefined)delete process.env.GRAPH_FILE;else process.env.GRAPH_FILE=oldFile;await rm(dir,{recursive:true,force:true});}
});
