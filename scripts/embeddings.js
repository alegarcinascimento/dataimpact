import {db,close} from '../lib/db.js';
if(!process.env.OPENAI_API_KEY)throw new Error('Configure OPENAI_API_KEY');
try{const driver=await db();const session=driver.session({database:process.env.NEO4J_DATABASE||'neo4j'});
try{
 const records=await session.run('MATCH (i:DIIncident) RETURN i.id AS id, i.title AS title, i.description AS description LIMIT 201');
 if(records.records.length>200)throw new Error('Mais de 200 incidentes: limite da versão atual');
 const incidents=records.records.map(r=>({id:r.get('id'),title:r.get('title'),description:r.get('description')}));
 if(!incidents.length)throw new Error('Cadastre incidentes no Neo4j antes de gerar embeddings');
 const response=await fetch('https://api.openai.com/v1/embeddings',{method:'POST',signal:AbortSignal.timeout(30000),headers:{Authorization:`Bearer ${process.env.OPENAI_API_KEY}`,'Content-Type':'application/json'},body:JSON.stringify({model:process.env.EMBEDDING_MODEL||'text-embedding-3-small',dimensions:1536,input:incidents.map(i=>i.title+' '+i.description)})});
 if(!response.ok)throw new Error('Provedor recusou a geração');const result=await response.json();
 const items=result.data.map(r=>({id:incidents[r.index].id,embedding:r.embedding}));
 await session.run('UNWIND $items AS item MATCH (i:DIIncident {id:item.id}) SET i.embedding=item.embedding',{items});
 await session.run("CREATE VECTOR INDEX di_incident_embedding IF NOT EXISTS FOR (i:DIIncident) ON i.embedding OPTIONS {indexConfig: {`vector.dimensions`:1536, `vector.similarity_function`:'cosine'}}");
 console.log('Embeddings gravados. Aguarde o índice ficar ONLINE antes de pesquisar.');
}finally{await session.close();}}finally{await close();}
