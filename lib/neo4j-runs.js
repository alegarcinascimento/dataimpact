import {db,query} from './db.js';import {createRun} from './runs.js';
export async function readNeo4jRuns(){const records=await query('MATCH (r:DIRun) RETURN r.payload AS payload ORDER BY r.at DESC LIMIT 30');return records.map(r=>JSON.parse(r.get('payload'))).reverse();}
export async function appendNeo4jRun(graph){
 const previous=(await readNeo4jRuns()).at(-1),run=createRun(graph,{previous});const driver=await db();const session=driver.session({database:process.env.NEO4J_DATABASE||'neo4j'});
 try{await session.run('CREATE CONSTRAINT di_run_id IF NOT EXISTS FOR (r:DIRun) REQUIRE r.id IS UNIQUE');
 await session.executeWrite(async tx=>{
 await tx.run('CREATE (r:DIRun {id:$id, at:$at, payload:$payload})',{id:run.id,at:run.at,payload:JSON.stringify(run)});
 await tx.run('MATCH (r:DIRun {id:$id}) UNWIND $assets AS asset MATCH (a:DIAsset {id:asset}) CREATE (r)-[:CHECKED]->(a)',{id:run.id,assets:graph.nodes.map(n=>n.id)});
 await tx.run('MATCH (r:DIRun {id:$id}) UNWIND $issues AS issue MATCH (a:DIAsset {id:issue.asset}) CREATE (r)-[:HAS_FINDING]->(f:DIFinding {id:$id+":"+issue.id, rule:issue.rule, detail:issue.detail}) CREATE (f)-[:AFFECTS]->(a)',{id:run.id,issues:run.issues.map(i=>({id:i.id,asset:i.asset,rule:i.rule,detail:i.detail}))});
 });return run;}finally{await session.close();}
}
