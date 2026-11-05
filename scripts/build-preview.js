import {readFile,writeFile} from 'node:fs/promises';
const read=p=>readFile(new URL('../'+p,import.meta.url),'utf8');
let html=await read('public/index.html');const css=await read('public/style.css');
const graph=await read('lib/graph.js'), data=await read('lib/data.js');
const checks=(await read('lib/checks.js')).replace("import {traverse} from './graph.js';",'').replace('export function','function');
let app=await read('public/app.js');app=app.replace("import {traverse} from './graph.js';",'');
app=app.replace("async function get(url){",`async function get(url){
 if(url==='/api/graph')return {...demo,mode:'demo',syntheticData:true,issues:detectIssues(demo)};
 if(url.startsWith('/api/search'))return {mode:'lexical',items:lexicalSearch(demo.incidents,new URL(url,'http://demo').searchParams.get('q'))};
`);
html=html.replace('<link rel="stylesheet" href="/style.css">','<style>'+css+'</style>').replace('<script type="module" src="/app.js"></script>','<script type="module">'+data.replaceAll('export const','const')+'\n'+graph.replaceAll('export function','function')+'\n'+checks+'\n'+app+'</script>');
await writeFile(new URL('../DataImpact_Demo.html',import.meta.url),html);console.log('Preview autônomo criado.');
