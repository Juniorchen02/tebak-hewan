/* =====================  LOGIKA (hanya jalan di HOST)  ===================== */
function findTrait(p, text){
  let best = -1, bestScore = 0, already = false;
  A(p).traits.forEach((tr, i) => {
    const sc = matchTrait(text, tr);
    if(sc === 0) return;
    if(p.rev.includes(i)){ already = true; return; }
    if(sc > bestScore){ best = i; bestScore = sc; }
  });
  return { index:best, already: already && best < 0 };
}
function isCorrect(p, text){
  const tx = normalize(text);
  if(!tx) return false;
  return [A(p).name, ...(A(p).alias || [])].some(n => { const x = normalize(n); return x === tx || (x.length >= 6 && lev(x, tx) <= 1); });
}
function applyWrong(p, msg){
  if(p.shield){
    p.shield = false;
    return { kind:"shield", icon:"🛡️", title:"Terlindungi!", msg, badge:"Perisai menahan serangan, darah aman" };
  }
  p.hp--; p.hpLost++;
  let extra = "";
  if(p.hpLost % CONFIG.cardEveryLost === 0){
    const c = drawCard(p);
    extra += `<div class="r-gift">🎁 Kartu baru: <b>${c.icon} ${c.name}</b><small>${c.desc}</small></div>`;
  }
  if(p.hp <= 0) extra += `<div class="alert">🩸 Darah ${esc(p.name)} habis! Di giliran berikutnya ${esc(p.name)} wajib menjawab nama hewan.</div>`;
  return { kind:"bad", icon:"💔", title:"Salah!", msg, badge:"−1 darah", extra };
}
function doClue(p, text){
  text = (text||"").trim();
  if(!text || p.hp <= 0) return;
  if(isCorrect(p, text)){ G.log = "Itu sudah nama hewannya! Pakai kolom 'Jawab nama hewan' (tidak ada hukuman untuk tebakan ini)."; return; }
  const m = findTrait(p, text);
  if(m.index >= 0){
    p.rev.push(m.index);
    const tr = A(p).traits[m.index];
    if(CONFIG.continueOnCorrectClue){ G.log = `✅ Tepat! Petunjuk terbuka: ${tr.text}. Boleh menebak lagi.`; return; }
    G.view = { type:"result", r:{ kind:"good", icon:"✅", title:"Tepat!", msg:"Satu petunjuk berhasil terbuka.",
      reveal:`${esc(tr.topic)}: ${esc(tr.text)}`, badge:"Darah aman" }};
    return;
  }
  if(m.already){ G.log = "Petunjuk itu sudah terbuka. Coba tebak yang lain (tidak ada hukuman)."; return; }
  G.view = { type:"result", r:applyWrong(p, `Tebakan "<b>${esc(text)}</b>" tidak cocok dengan petunjuk mana pun.`) };
}
function doAnswer(p, idx, text){
  text = (text||"").trim();
  if(!text) return;
  const forced = p.hp <= 0, animalName = A(p).name, animalEmoji = A(p).emoji;
  if(isCorrect(p, text)){
    const gain = forced ? CONFIG.pointsForced : CONFIG.pointsDirect;
    p.points += gain;
    if(p.points >= G.target){
      G.over = { winner:idx, reason:`${p.name} mencapai ${p.points} poin! Hewan terakhirnya: ${animalName}.` };
      return;
    }
    assign(p);
    G.view = { type:"result", r:{ kind:"good", icon:"🎉", title:"Benar!", msg:`${esc(p.name)} berhasil menebak hewannya.`,
      reveal:`<span class="big-emoji">${animalEmoji}</span>${esc(animalName)}`, badge:`+${gain} poin`,
      extra:`<p class="meta" style="margin:0 0 8px">Hewan baru dan darah penuh menunggu di giliran berikutnya.</p>` }};
    return;
  }
  if(forced){
    G.over = { winner:1-idx, reason:`${p.name} salah menjawab saat darah habis. Jawaban yang benar: ${animalName}.` };
    return;
  }
  G.view = { type:"result", r:applyWrong(p, `Jawaban "<b>${esc(text)}</b>" salah.`) };
}
function doCard(p, i){
  const card = CARDS.find(c => c.id === p.cards[i]);
  if(!card) return;
  const msg = card.use(p);
  if(msg === null) G.log = `Kartu "${card.name}" belum bisa dipakai sekarang.`;
  else { p.cards.splice(i, 1); G.log = `${card.icon} ${card.name}: ${msg}`; }
}

// semua aksi (dari host maupun tamu) masuk lewat sini, hanya di host
function handle(a){
  if(!G) return;
  const idx = a.player, p = G.players[idx];
  if(a.type === "again"){
    if(G.over) newGame(G.players[0].name, G.players[1].name, G.target);
  } else if(G.over){
    return;
  } else if(a.type === "next"){
    if(G.view.type === "result" && idx === G.turn){ G.turn = 1 - G.turn; G.view = { type:"play" }; G.log = ""; }
  } else if(G.view.type === "play" && idx === G.turn){
    if(a.type === "clue")   doClue(p, a.text);
    if(a.type === "answer") doAnswer(p, idx, a.text);
    if(a.type === "card")   doCard(p, a.i);
  }
  broadcast();
}
