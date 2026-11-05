let driver;
export async function db() {
 if (!driver) {
  const {default:neo4j}=await import('neo4j-driver');
  for (const key of ['NEO4J_URI','NEO4J_USERNAME','NEO4J_PASSWORD']) if (!process.env[key]) throw new Error(`Missing ${key}`);
  driver=neo4j.driver(process.env.NEO4J_URI,neo4j.auth.basic(process.env.NEO4J_USERNAME,process.env.NEO4J_PASSWORD),{connectionTimeout:8000,maxConnectionPoolSize:5});
 }
 return driver;
}
export async function query(cypher,params={}) {
 const d=await db(); const result=await d.executeQuery(cypher,params,{database:process.env.NEO4J_DATABASE||'neo4j',routing:'READ',transactionConfig:{timeout:10000}});
 return result.records;
}
export async function close(){if(driver){await driver.close();driver=undefined;}}
export async function loadGraph(){
 const [nodes,edges,incidents]=await Promise.all([
 query('MATCH (a:DIAsset) RETURN properties(a) AS item LIMIT 501'),
 query('MATCH (a:DIAsset)-[:FEEDS]->(b:DIAsset) RETURN a.id AS source,b.id AS target LIMIT 2001'),
 query('MATCH (i:DIIncident) RETURN i {.*, embedding:null} AS item LIMIT 201')]);
 if(nodes.length>500||edges.length>2000||incidents.length>200)throw new Error('Demo graph size exceeded');
 return {nodes:nodes.map(r=>r.get('item')),edges:edges.map(r=>({source:r.get('source'),target:r.get('target')})),incidents:incidents.map(r=>{const i=r.get('item');delete i.embedding;return i;})};
}
