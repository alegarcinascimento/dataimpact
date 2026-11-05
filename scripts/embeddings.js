import {demo} from '../lib/data.js';import {db,close} from '../lib/db.js';
if(!process.env.OPENAI_API_KEY)throw new Error('Configure OPENAI_API_KEY');
try{const driver=await db();const session=driver.session({database:process.env.NEO4J_DATABASE||'neo4j'});
try{
 const response=await fetch('https://api.openai.com/v1/embeddings',{method:'POST',signal:AbortSignal.timeout(30000),headers:{Authorization:`Bearer ${process.env.OPENAI_API_KEY}`,'Content-Type':'application/json'},body:JSON.stringify({model:process.env.EMBEDDING_MODEL||'text-embedding-3-small',dimensions:1536,input:demo.incidents.map(i=>i.title+' '+i.description)})});
 if(!response.ok)throw new Error('Provedor recusou a geração');const result=await response.json();
 const items=result.data.map(r=>({id:demo.incidents[r.index].id,embedding:r.embedding}));
 await session.run('UNWIND $items AS item MATCH (i:DIIncident {id:item.id}) SET i.embedding=item.embedding',{items});
 await session.run("CREATE VECTOR INDEX di_incident_embedding IF NOT EXISTS FOR (i:DIIncident) ON i.embedding OPTIONS {indexConfig: {`vector.dimensions`:1536, `vector.similarity_function`:'cosine'}}");
 console.log('Embeddings gravados. Aguarde o índice ficar ONLINE antes de pesquisar.');
}finally{await session.close();}}finally{await close();}
