import test from 'node:test';import assert from 'node:assert/strict';import {readFile} from 'node:fs/promises';import {JSDOM} from 'jsdom';import {demo} from '../lib/data.js';import {lexicalSearch} from '../lib/graph.js';
test('interface renderiza, simula, pesquisa e alterna direção',async()=>{
 const html=await readFile(new URL('../public/index.html',import.meta.url),'utf8');
 const dom=new JSDOM(html,{url:'http://localhost',runScripts:'outside-only'});const win=dom.window;
 win.HTMLElement.prototype.scrollIntoView=()=>{};
 win.fetch=async url=>({ok:true,json:async()=>url==='/api/graph'?{...demo,mode:'demo'}:{mode:'lexical',items:lexicalSearch(demo.incidents,'fechamento menores')}});
 const graphSource=(await readFile(new URL('../lib/graph.js',import.meta.url),'utf8')).replaceAll('export function','function');
 const source=(await readFile(new URL('../public/app.js',import.meta.url),'utf8')).replace("import {traverse} from './graph.js';",'');
 await win.eval('(async()=>{'+graphSource+'\n'+source+'})()');const doc=win.document;
 assert.equal(doc.querySelectorAll('.node').length,28);assert.equal(doc.getElementById('reports').textContent,'5');
 doc.getElementById('simulate').click();assert(doc.querySelectorAll('.edge.failed').length>0);
 doc.querySelector('[data-scenario="rawClients"]').click();assert.equal(doc.getElementById('selected-title').textContent,'raw.clientes');
 doc.getElementById('asset-search').value='fornecedor';doc.getElementById('asset-search').dispatchEvent(new win.Event('input'));assert(doc.querySelectorAll('#asset-results button').length>0);
 doc.getElementById('reset').click();assert.equal(doc.getElementById('selected-title').textContent,'raw.vendas');
 const report=[...doc.querySelectorAll('.node')].find(n=>n.getAttribute('aria-label')==='Fechamento executivo');report.dispatchEvent(new win.Event('click'));
 const select=doc.getElementById('direction');select.value='upstream';select.dispatchEvent(new win.Event('change'));assert(doc.getElementById('paths').textContent.includes('ERP comercial'));assert(doc.getElementById('paths').textContent.includes('CRM clientes'));
 dom.window.close();
});
test('interface de catálogo próprio oculta cenários fictícios e rastreia alerta',async()=>{
 const html=await readFile(new URL('../public/index.html',import.meta.url),'utf8');const dom=new JSDOM(html,{url:'http://localhost',runScripts:'outside-only'});const win=dom.window;win.HTMLElement.prototype.scrollIntoView=()=>{};
 const {readCatalog}=await import('../lib/catalog.js');const {detectIssues}=await import('../lib/checks.js');const g=await readCatalog('examples/catalog.json');g.nodes[0].rowCount=2;g.nodes[0].updatedAt='2026-01-01T10:00:00Z';
 win.fetch=async()=>({ok:true,json:async()=>({...g,mode:'file',issues:detectIssues(g)})});const graphSource=(await readFile(new URL('../lib/graph.js',import.meta.url),'utf8')).replaceAll('export function','function');const source=(await readFile(new URL('../public/app.js',import.meta.url),'utf8')).replace("import {traverse} from './graph.js';",'');
 await win.eval('(async()=>{'+graphSource+'\n'+source+'})()');const doc=win.document;assert.equal(doc.querySelectorAll('.node').length,3);assert.equal(doc.querySelector('.scenarios').hidden,true);assert(doc.getElementById('mode').textContent.includes('Catálogo próprio'));assert.equal(doc.querySelectorAll('.issue').length,2);doc.querySelector('.issue button').click();assert.equal(doc.getElementById('selected-title').textContent,'Pedidos');assert(doc.getElementById('paths').textContent.includes('Relatório comercial'));doc.getElementById('reset').click();assert.equal(doc.getElementById('selected-title').textContent,'Pedidos');dom.window.close();
});
