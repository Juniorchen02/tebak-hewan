/* =====================  PENCOCOKAN TEKS  ===================== */
const NEG = new Set(["tidak","tak","bukan","gak","ga","nggak","enggak","ngga","ndak","tanpa","belum"]);
const norm = s => s.toLowerCase().replace(/[^a-z0-9\s]/g," ").replace(/\s+/g," ").trim();
const normalize = s => s.toLowerCase().replace(/[^a-z0-9]/g,"");
function lev(a,b){
  if(a===b) return 0;
  const m=a.length, n=b.length;
  if(Math.abs(m-n) > 2) return 3;
  let prev = Array.from({length:n+1}, (_,j) => j);
  for(let i=1;i<=m;i++){
    const row=[i];
    for(let j=1;j<=n;j++) row[j] = Math.min(prev[j]+1, row[j-1]+1, prev[j-1] + (a[i-1]===b[j-1] ? 0 : 1));
    prev=row;
  }
  return prev[n];
}
function groupHit(text, tokens, group){
  return group.some(raw => {
    const s = norm(raw);
    if(s.includes(" ")) return text.includes(s);
    return tokens.some(tok => {
      if(tok === s) return true;
      if(s.length >= 4 && tok.includes(s)) return true;
      if(s.length >= 6 && tok.length >= 5) return lev(tok, s) <= (s.length >= 9 ? 2 : 1);
      return false;
    });
  });
}
function matchTrait(text, trait){
  const tx = norm(text), tokens = tx.split(" ");
  if(trait.neg !== null){
    const hasNeg = tokens.some(w => NEG.has(w));
    if(hasNeg !== trait.neg) return 0;
  }
  let score = 0;
  for(const g of trait.groups){ if(!groupHit(tx, tokens, g)) return 0; score++; }
  return score;
}
