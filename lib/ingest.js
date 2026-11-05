import {validateCatalog} from './catalog.js';import {db,close} from './db.js';
export async function ingestNeo4j(input){
 const graph=validateCatalog(input);const driver=await db();const session=driver.session({database:process.env.NEO4J_DATABASE||'neo4j'});
 try{
 await session.run('CREATE CONSTRAINT di_asset_id IF NOT EXISTS FOR (a:DIAsset) REQUIRE a.id IS UNIQUE');
 await session.run('CREATE CONSTRAINT di_incident_id IF NOT EXISTS FOR (i:DIIncident) REQUIRE i.id IS UNIQUE');
 await session.executeWrite(async tx=>{
 await tx.run('UNWIND $nodes AS item MERGE (a:DIAsset {id:item.id}) SET a += item, a.rowCount=item.rowCount, a.updatedAt=item.updatedAt, a.observedAt=item.observedAt, a.minRows=item.minRows, a.maxAgeMinutes=item.maxAgeMinutes',{nodes:graph.nodes});
 await tx.run('UNWIND $edges AS item MATCH (a:DIAsset {id:item.source}), (b:DIAsset {id:item.target}) MERGE (a)-[:FEEDS]->(b)',{edges:graph.edges});
 await tx.run('UNWIND $items AS item MERGE (i:DIIncident {id:item.id}) SET i += item WITH i,item MATCH (a:DIAsset {id:item.asset}) MERGE (i)-[:OCCURRED_ON]->(a)',{items:graph.incidents});
 });
 }finally{await session.close();await close();}
}
