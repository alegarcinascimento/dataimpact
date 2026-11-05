import {randomUUID} from 'node:crypto';import {readFile,mkdir,writeFile,rename} from 'node:fs/promises';import path from 'node:path';import {detectIssues} from './checks.js';
export function createRun(graph,{now=new Date(),previous}={}){
 const issues=detectIssues(graph,now);const before=new Set(previous?.issues.map(i=>i.id)||[]),current=new Set(issues.map(i=>i.id));
 return {id:randomUUID(),at:now.toISOString(),mode:graph.mode||'file',assets:graph.nodes.length,issues,opened:issues.filter(i=>!before.has(i.id)).map(i=>i.id),resolved:[...before].filter(id=>!current.has(id)),metrics:graph.nodes.filter(n=>n.observedAt).map(n=>({asset:n.id,observedAt:n.observedAt,rowCount:n.rowCount??null,updatedAt:n.updatedAt??null}))};
}
export async function readRuns(file=process.env.HISTORY_FILE||'.data/runs.json'){
 try{const input=JSON.parse(await readFile(file,'utf8'));if(!Array.isArray(input)||input.length>500)throw Error('Histórico inválido');return input;}catch(e){if(e.code==='ENOENT')return [];throw e;}
}
export async function appendRun(graph,{file=process.env.HISTORY_FILE||'.data/runs.json',now=new Date()}={}){
 const runs=await readRuns(file);if(runs.length>=500)throw Error('Limite de 500 execuções atingido; arquive o histórico antes de continuar.');const run=createRun(graph,{now,previous:runs.at(-1)});runs.push(run);await mkdir(path.dirname(file),{recursive:true});const temp=file+'.'+process.pid+'.tmp';await writeFile(temp,JSON.stringify(runs,null,2),{mode:0o600});await rename(temp,file);return run;
}
