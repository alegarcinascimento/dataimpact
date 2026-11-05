export function traverse(graph, start, direction = 'downstream') {
  const visited = new Set([start]), queue = [start], paths = {[start]: [start]};
  for (let i=0; i<queue.length; i++) {
    const current=queue[i];
    for (const edge of graph.edges) {
      const from=direction==='upstream'?edge.target:edge.source;
      const to=direction==='upstream'?edge.source:edge.target;
      if (from===current && !visited.has(to)) { visited.add(to); queue.push(to); paths[to]=[...paths[current],to]; }
    }
  }
  return {ids:[...visited],paths};
}
export function normalize(s) { return s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase(); }
export function lexicalSearch(incidents, query) {
 const words=normalize(query).split(/\W+/).filter(w=>w.length>2);
 return incidents.map(i=>({...i,score:words.filter(w=>normalize([i.title,i.description,...i.tags].join(' ')).includes(w)).length})).filter(i=>i.score>0).sort((a,b)=>b.score-a.score);
}
