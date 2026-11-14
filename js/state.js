/* =====================  STATE  =====================
   G dikelola host dan dikirim utuh ke tamu (JSON biasa, tanpa Set).
   p.ai = indeks hewan yang SEDANG DITEBAK pemain p (milik lawan). */
let G = null;
let ME = 0, IS_HOST = false, peer = null, conn = null;
const L = { name:"", target:CONFIG.targetPoints, code:"", msg:"", err:"", tab:"guess", key:"", peerGone:false };
const app = document.getElementById("app");
const A = p => ANIMALS[p.ai];
const esc = s => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

/* Riwayat kemunculan: G.hist[i] = { n: berapa kali muncul, last: nomor pembagian terakhir, by:[p0,p1] }
   G.deal = penghitung pembagian hewan (naik 1 setiap ada hewan baru dibagikan). */
function animalWeight(i){
  const h = G.hist[i];
  if(!h) return CONFIG.newBoost;                                   // belum pernah muncul → paling diprioritaskan
  const recover = Math.min(1, (G.deal - h.last) / CONFIG.cooldownDeals);   // 0 (baru muncul) → 1 (sudah lama)
  let w = Math.max(CONFIG.minWeight, recover * recover);
  if(h.by[0] && h.by[1]) w *= CONFIG.bothPenalty;                  // kedua pemain sudah pernah dapat
  return w / (1 + (h.n - 1) * CONFIG.repeatPenalty);               // sering muncul → makin kecil
}
function pickAnimal(pi){
  const other = G.players[1 - pi], me = G.players[pi];
  const busy = (other && other.ai !== undefined) ? other.ai : -1;   // jangan sama dengan lawan
  const mine = (me && me.ai !== undefined) ? me.ai : -1;             // ...dan dengan hewanmu sendiri
  const cand = [];
  ANIMALS.forEach((_, i) => { if(i !== busy && i !== mine) cand.push({ i, w: animalWeight(i) }); });
  let r = Math.random() * cand.reduce((s, c) => s + c.w, 0), pick = cand[cand.length - 1].i;
  for(const c of cand){ r -= c.w; if(r <= 0){ pick = c.i; break; } }
  G.deal++;
  const h = G.hist[pick] || (G.hist[pick] = { n:0, last:0, by:[false,false] });
  h.n++; h.last = G.deal; h.by[pi] = true;
  return pick;
}
function pickClues(animal){
  // ambil CONFIG.cluesPerAnimal indeks petunjuk secara acak (Fisher-Yates), lalu urutkan agar tampilan rapi
  const idx = animal.traits.map((_,i) => i);
  for(let i = idx.length - 1; i > 0; i--){
    const j = Math.floor(Math.random() * (i + 1));
    [idx[i], idx[j]] = [idx[j], idx[i]];
  }
  return idx.slice(0, Math.min(CONFIG.cluesPerAnimal, idx.length)).sort((a,b) => a - b);
}
function assign(p, pi){
  p.ai = pickAnimal(pi); p.active = pickClues(A(p)); p.hp = CONFIG.maxHp; p.hpLost = 0;
  p.rev = []; p.hinted = []; p.kw = [];
  p.first = false; p.cat = false; p.len = false; p.choices = null; p.shield = false;
}

function newGame(n0, n1, target, prev){
  // prev = game sebelumnya (saat main lagi): riwayat hewan dibawa agar tidak mengulang hewan yang sama
  G = { players:[{name:n0,points:0,cards:[],extra:false},{name:n1,points:0,cards:[],extra:false}],
        turn:0, log:"", over:null, view:{type:"play"}, target,
        hist: prev ? prev.hist : {}, deal: prev ? prev.deal : 0 };
  assign(G.players[0], 0); assign(G.players[1], 1);
}
function rerollAnimal(p){
  // ganti hewan tebakan: petunjuk direset, darah/perisai/kartu tetap
  const pi = G.players.indexOf(p);
  p.ai = pickAnimal(pi); p.active = pickClues(A(p));
  p.rev = []; p.hinted = []; p.kw = [];
  p.first = false; p.cat = false; p.len = false; p.choices = null;
}
function drawCard(p){
  const c = rollCard();            // peluang ditentukan tingkat kelangkaan (lihat RARITY di cards.js)
  p.cards.push(c.id); return c;
}