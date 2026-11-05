// Experimental residual k-means quantization. This is not an RQ-VAE or a generative recommender.
const squared=(a,b)=>a.reduce((s,v,i)=>s+(v-b[i])**2,0);
export function validateVectors(vectors){if(!Array.isArray(vectors)||!vectors.length||!Array.isArray(vectors[0])||!vectors[0].length)throw Error('Vetores vazios');const dim=vectors[0].length;if(vectors.some(v=>!Array.isArray(v)||v.length!==dim||v.some(x=>typeof x!=='number'||!Number.isFinite(x))))throw Error('Dimensões ou valores inválidos');return dim;}
function nearest(v,centers){let best=0;for(let i=1;i<centers.length;i++)if(squared(v,centers[i])<squared(v,centers[best]))best=i;return best;}
export function trainSIDs(vectors,{levels=3,size=4,iterations=15}={}){
 const dimensions=validateVectors(vectors);if(!Number.isInteger(levels)||levels<1||levels>8||!Number.isInteger(size)||size<1||size>256)throw Error('Configuração de quantização inválida');
 let residuals=vectors.map(v=>[...v]);const codebooks=[];
 for(let l=0;l<levels;l++){
  const centers=[[...residuals[0]]];
  while(centers.length<Math.min(size,residuals.length)){
   let farthest=0;for(let i=1;i<residuals.length;i++)if(squared(residuals[i],centers[nearest(residuals[i],centers)])>squared(residuals[farthest],centers[nearest(residuals[farthest],centers)]))farthest=i;
   if(squared(residuals[farthest],centers[nearest(residuals[farthest],centers)])<1e-12)break;centers.push([...residuals[farthest]]);
  }
  for(let t=0;t<iterations;t++){
   const sums=centers.map(()=>Array(dimensions).fill(0)), counts=centers.map(()=>0);
   for(const v of residuals){const i=nearest(v,centers);counts[i]++;v.forEach((x,d)=>sums[i][d]+=x);}
   centers.forEach((c,i)=>{if(counts[i])centers[i]=sums[i].map(x=>x/counts[i]);});
  }
  codebooks.push(centers);residuals=residuals.map(v=>{const c=centers[nearest(v,centers)];return v.map((x,d)=>x-c[d]);});
 }
 return {method:'residual-kmeans',version:1,dimensions,codebooks};
}
export function encodeSID(vector,model){validateVectors([vector]);if(vector.length!==model.dimensions)throw Error('Dimensão incompatível');let r=[...vector];const codes=[];for(const centers of model.codebooks){const i=nearest(r,centers);codes.push(i);r=r.map((x,d)=>x-centers[i][d]);}return codes;}
export function decodeSID(codes,model){if(codes.length!==model.codebooks.length)throw Error('Código incompatível');const vector=Array(model.dimensions).fill(0);codes.forEach((id,l)=>{const c=model.codebooks[l][id];if(!c)throw Error('Token inexistente');c.forEach((x,d)=>vector[d]+=x);});return vector;}
export function cosine(a,b){if(a.length!==b.length)throw Error('Dimensões incompatíveis');const aa=Math.sqrt(a.reduce((s,x)=>s+x*x,0)),bb=Math.sqrt(b.reduce((s,x)=>s+x*x,0));return aa&&bb?a.reduce((s,x,i)=>s+x*b[i],0)/(aa*bb):0;}
