import pg from 'pg';import {validateCatalog} from '../lib/catalog.js';
export const quoteIdentifier=value=>{if(typeof value!=='string'||!value||value.includes('\0'))throw Error('Identificador inválido');return '"'+value.replaceAll('"','""')+'"';};
export async function collectPostgres(config,{client,now=new Date()}={}){
 if(!Array.isArray(config.tables)||!config.tables.length||config.tables.length>50||!config.tables.every(t=>typeof t.schema==='string'&&typeof t.table==='string'))throw Error('Configure de 1 a 50 tabelas/views explícitas.');
 if(!config.namespace||!/^[a-zA-Z0-9_-]{1,60}$/.test(config.namespace))throw Error('namespace inválido.');
 const names=new Set();for(const t of config.tables){const key=JSON.stringify([t.schema,t.table]);if(names.has(key))throw Error('Tabela repetida na configuração.');names.add(key);}
 const own=!client;if(!client){if(!process.env.SOURCE_DATABASE_URL)throw Error('Configure SOURCE_DATABASE_URL no ambiente.');client=new pg.Client({connectionString:process.env.SOURCE_DATABASE_URL,connectionTimeoutMillis:8000,statement_timeout:10000,application_name:'dataimpact-readonly'});await client.connect();}
 let begun=false;
 try{
 await client.query('BEGIN TRANSACTION ISOLATION LEVEL REPEATABLE READ READ ONLY');begun=true;
 const metadata=await client.query("SELECT c.oid::text AS oid,n.nspname AS schema,c.relname AS name,c.relkind FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE c.relkind IN ('r','p','v','m') AND n.nspname=ANY($1::text[])",[[...new Set(config.tables.map(t=>t.schema))]]);
 const selected=[];
 for(const t of config.tables){const m=metadata.rows.find(m=>m.schema===t.schema&&m.name===t.table);if(!m)throw Error('Tabela/view selecionada não encontrada.');const qualified=quoteIdentifier(t.schema)+'.'+quoteIdentifier(t.table);
 const result=await client.query('SELECT count(*)::text AS count'+(t.timestampColumn?', max('+quoteIdentifier(t.timestampColumn)+') AS updated_at':'')+' FROM '+qualified);
 const raw=result.rows[0];const rowCount=Number(raw.count);if(!Number.isSafeInteger(rowCount))throw Error('Volume fora da precisão suportada.');
 const n={id:config.namespace+':'+JSON.stringify([t.schema,t.table]),label:t.schema+'.'+t.table,kind:t.kind||'table',owner:t.owner||config.owner||'Equipe não informada',description:t.description||'Ativo PostgreSQL; métricas coletadas em leitura.',observedAt:now.toISOString(),rowCount,...(t.minRows!==undefined?{minRows:t.minRows}:{}),...(t.maxAgeMinutes!==undefined?{maxAgeMinutes:t.maxAgeMinutes}:{})};
 if(t.maxAgeMinutes!==undefined&&!t.timestampColumn)throw Error('Regra de atualização requer timestampColumn.');
 if(t.timestampColumn){if(raw.updated_at===null)n.updatedAt=null;else {if(!(raw.updated_at instanceof Date))throw Error('timestampColumn deve retornar timestamp/timestamptz; prefira timestamptz.');n.updatedAt=raw.updated_at.toISOString();}}
 selected.push({meta:m,node:n});
 }
 const dependencies=await client.query("SELECT DISTINCT d.refobjid::text AS source,r.ev_class::text AS target FROM pg_depend d JOIN pg_rewrite r ON r.oid=d.objid WHERE d.classid='pg_rewrite'::regclass AND d.refclassid='pg_class'::regclass AND d.deptype='n' AND d.refobjid<>r.ev_class AND d.refobjid=ANY($1::oid[]) AND r.ev_class=ANY($1::oid[])",[selected.map(x=>x.meta.oid)]);
 const byOid=new Map(selected.map(x=>[x.meta.oid,x.node.id]));const edges=dependencies.rows.map(r=>({source:byOid.get(r.source),target:byOid.get(r.target)}));
 const graph=validateCatalog({nodes:selected.map(x=>x.node),edges,incidents:[]});await client.query('COMMIT');begun=false;return graph;
 }finally{if(begun)try{await client.query('ROLLBACK');}catch{}if(own)await client.end();}
}
