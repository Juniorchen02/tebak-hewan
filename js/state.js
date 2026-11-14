/* =====================  STATE  =====================
   G dikelola host dan dikirim utuh ke tamu (JSON biasa, tanpa Set).
   p.ai = indeks hewan yang SEDANG DITEBAK pemain p (milik lawan). */
let G = null;
let ME = 0, IS_HOST = false, peer = null, conn = null;
const L = { name:"", target:CONFIG.targetPoints, code:"", msg:"", err:"", tab:"guess", key:"", peerGone:false };
const app = document.getElementById("app");
const A = p => ANIMALS[p.ai];
const esc = s => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

function pickAnimal(){
  let pool = ANIMALS.map((_,i)=>i).filter(i => !G.used.includes(i));
  if(!pool.length){ G.used = []; pool = ANIMALS.map((_,i)=>i); }
  const i = pool[Math.floor(Math.random()*pool.length)];
  G.used.push(i);
  return i;
}
function assign(p){
  p.ai = pickAnimal(); p.hp = CONFIG.maxHp; p.hpLost = 0;
  p.rev = []; p.hinted = []; p.kw = [];
  p.first = false; p.cat = false; p.choices = null; p.shield = false;
}

function newGame(n0, n1, target){
  G = { players:[{name:n0,points:0,cards:[]},{name:n1,points:0,cards:[]}],
        turn:0, used:[], log:"", over:null, view:{type:"play"}, target };
  assign(G.players[0]); assign(G.players[1]);
}
function drawCard(p){
  const c = CARDS[Math.floor(Math.random()*CARDS.length)];
  p.cards.push(c.id); return c;
}
