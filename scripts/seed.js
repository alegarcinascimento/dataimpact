import {demo} from '../lib/data.js';import {db,close} from '../lib/db.js';
try {const driver=await db();await driver.verifyConnectivity();const session=driver.session({database:process.env.NEO4J_DATABASE||'neo4j'});
try{
 await session.run('CREATE CONSTRAINT di_asset_id IF NOT EXISTS FOR (a:DIAsset) REQUIRE a.id IS UNIQUE');
 await session.run('CREATE CONSTRAINT di_incident_id IF NOT EXISTS FOR (i:DIIncident) REQUIRE i.id IS UNIQUE');
 await session.executeWrite(async tx=>{
 await tx.run('UNWIND $nodes AS item MERGE (a:DIAsset {id:item.id}) SET a += item',{nodes:demo.nodes});
 await tx.run('UNWIND $edges AS item MATCH (a:DIAsset {id:item.source}), (b:DIAsset {id:item.target}) MERGE (a)-[:FEEDS]->(b)',{edges:demo.edges});
 await tx.run('UNWIND $items AS item MERGE (i:DIIncident {id:item.id}) SET i += item WITH i,item MATCH (a:DIAsset {id:item.asset}) MERGE (i)-[:OCCURRED_ON]->(a)',{items:demo.incidents});
 });console.log('Carga idempotente concluída: '+demo.nodes.length+' ativos.');
}finally{await session.close();}}finally{await close();}
