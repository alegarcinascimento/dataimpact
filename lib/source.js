import {demo} from './data.js';import {loadGraph} from './db.js';import {readCatalog} from './catalog.js';import {detectIssues} from './checks.js';
export async function loadSource(){
 const mode=process.env.DATA_MODE||'demo';if(!['demo','file','neo4j'].includes(mode))throw Error('DATA_MODE inválido');
 const graph=mode==='neo4j'?await loadGraph():mode==='file'?await readCatalog(process.env.GRAPH_FILE||'.data/catalog.json'):demo;
 return {...graph,mode,syntheticData:mode==='demo',issues:detectIssues(graph),evaluatedAt:new Date().toISOString()};
}
