import {parseArgs} from 'node:util';import {readCatalog,saveCatalog} from '../lib/catalog.js';import {ingestNeo4j} from '../lib/ingest.js';
const {values}=parseArgs({options:{input:{type:'string'},target:{type:'string',default:'file'},output:{type:'string',default:'.data/catalog.json'},validate:{type:'boolean',default:false}}});
try{
 if(!values.input)throw Error('Use --input catalog.json ou --input diretório-com-CSVs');
 const graph=await readCatalog(values.input);
 if(!['file','neo4j'].includes(values.target))throw Error('--target deve ser file ou neo4j');
 if(!values.validate){if(values.target==='neo4j')await ingestNeo4j(graph);else await saveCatalog(graph,values.output);}
 console.log(JSON.stringify({validated:true,written:!values.validate,target:values.target,assets:graph.nodes.length,edges:graph.edges.length,incidents:graph.incidents.length}));
}catch(e){console.error('Importação não concluída: '+e.message);process.exitCode=1;}
