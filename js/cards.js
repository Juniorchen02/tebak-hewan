/* =====================  KARTU SUPPORT  ===================== */
/* Tingkat kelangkaan: w = bobot peluang tingkat itu keluar saat undian (total 100 = persen). */
const RARITY = {
  common: { label:"Biasa",      w:50 },
  rare:   { label:"Langka",     w:30 },
  epic:   { label:"Epik",       w:14 },
  legend: { label:"Legendaris", w:6  }
};
/* Undi 1 kartu: pilih tingkat dulu berdasarkan bobot, lalu kartu acak di dalam tingkat itu. */
function rollCard(){
  const tiers = Object.keys(RARITY).filter(t => CARDS.some(c => c.rar === t));
  let r = Math.random() * tiers.reduce((s, t) => s + RARITY[t].w, 0), tier = tiers[tiers.length - 1];
  for(const t of tiers){ r -= RARITY[t].w; if(r <= 0){ tier = t; break; } }
  const pool = CARDS.filter(c => c.rar === tier);
  return pool[Math.floor(Math.random() * pool.length)];
}
/* Data reel untuk animasi spin: dibuat di host, dikirim ke kedua pemain agar reel-nya identik. */
function makeSpin(card){
  const n = CONFIG.spinLen, win = n - 6;                    // kartu pemenang berhenti di posisi ke-(n-6)
  const strip = Array.from({length:n}, () => rollCard().id);
  strip[win] = card.id;
  return { id: Date.now().toString(36) + Math.random().toString(36).slice(2,6), strip, win, card: card.id,
           jit: +(Math.random()*.6 - .3).toFixed(2) };      // geser sedikit dari tengah supaya berhenti terasa natural
}
const hiddenIdx = p => p.active.filter(i => !p.rev.includes(i));
const CARDS = [
  { id:"keyword", rar:"common", icon:"🔑", name:"Intip Kata", desc:"Melihat 1 kata kunci dari salah satu petunjuk tersembunyi.",
    use(p){ const idx = hiddenIdx(p).filter(i => !p.hinted.includes(i)); if(!idx.length) return null;
      const i = idx[Math.floor(Math.random()*idx.length)], tr = A(p).traits[i];
      p.hinted.push(i); p.kw.push({topic:tr.topic, word:tr.groups[0][0]});
      return `Kata kunci terbuka: "${tr.groups[0][0]}" (topik ${tr.topic})`; }},
  { id:"trait", rar:"rare", icon:"💡", name:"Buka Petunjuk", desc:"Membuka 1 petunjuk tersembunyi secara penuh.",
    use(p){ const idx = hiddenIdx(p); if(!idx.length) return null;
      const i = idx[Math.floor(Math.random()*idx.length)]; p.rev.push(i);
      return `Petunjuk terbuka: ${A(p).traits[i].text}`; }},
  { id:"first", rar:"common", icon:"🔤", name:"Huruf Awal", desc:"Melihat huruf pertama nama hewan.",
    use(p){ if(p.first) return null; p.first = true; return `Nama hewan diawali huruf "${A(p).name[0].toUpperCase()}".`; }},
  { id:"category", rar:"common", icon:"🏷️", name:"Kategori", desc:"Melihat golongan hewan (mamalia, burung, dll).",
    use(p){ if(p.cat) return null; p.cat = true; return `Kategori: ${A(p).category}`; }},
  { id:"choice", rar:"common", icon:"🎲", name:"Pilihan Ganda", desc:"Menampilkan 3 pilihan nama hewan, 1 di antaranya benar.",
    use(p){ if(p.choices) return null;
      const others = ANIMALS.filter(a => a.name !== A(p).name).sort(() => Math.random()-.5).slice(0,2).map(a => a.name);
      p.choices = [...others, A(p).name].sort(() => Math.random()-.5);
      return "Pilihan ganda muncul di bagian jawaban."; }},
  { id:"shield", rar:"rare", icon:"🛡️", name:"Perisai", desc:"Tebakan salah berikutnya tidak mengurangi darah.",
    use(p){ if(p.shield) return null; p.shield = true; return "Perisai aktif untuk 1 tebakan salah."; }},
  { id:"heal", rar:"rare", icon:"💖", name:"Penyembuh", desc:"Menambah 1 darah.",
    use(p){ if(p.hp >= CONFIG.maxHp || p.hp <= 0) return null; p.hp++; return "Darah bertambah 1."; }},

  /* ---------- KARTU BONUS BARU ---------- */
  { id:"length", rar:"common", icon:"🔢", name:"Jumlah Huruf", desc:"Melihat berapa huruf nama hewan.",
    use(p){ if(p.len) return null; p.len = true;
      return `Nama hewan terdiri dari ${A(p).name.replace(/[^A-Za-z]/g,"").length} huruf.`; }},
  { id:"double", rar:"epic", icon:"✨", name:"Petunjuk Ganda", desc:"Membuka 2 petunjuk tersembunyi sekaligus.",
    use(p){ const idx = hiddenIdx(p); if(idx.length < 2) return null;
      idx.sort(() => Math.random()-.5); const pick = idx.slice(0,2); p.rev.push(...pick);
      return `2 petunjuk terbuka: ${pick.map(i => A(p).traits[i].text).join(" • ")}`; }},
  { id:"reroll", rar:"rare", icon:"🔄", name:"Ganti Hewan", desc:"Mengganti hewan tebakan dengan yang baru (petunjuk terbuka hilang, darah tetap).",
    use(p){ if(!p.rev.length && !p.hinted.length && !p.first && !p.cat && !p.choices && !p.len) return null;
      rerollAnimal(p); return "Hewan tebakan diganti! Petunjuk dimulai dari awal, darah tetap."; }},
  { id:"extra", rar:"epic", icon:"⏩", name:"Giliran Ekstra", desc:"Setelah tebakan berikutnya, kamu main lagi sekali.",
    use(p){ if(p.extra) return null; p.extra = true; return "Giliran ekstra aktif! Kamu main lagi setelah tebakan berikutnya."; }},
  { id:"steal", rar:"epic", icon:"🕵️", name:"Curi Kartu", desc:"Mengambil 1 kartu acak dari lawan.",
    use(p){ const opp = G.players.find(q => q !== p); if(!opp.cards.length) return null;
      const k = Math.floor(Math.random()*opp.cards.length), id = opp.cards.splice(k,1)[0];
      p.cards.push(id); const c = CARDS.find(x => x.id === id);
      return `Kamu mencuri kartu ${c.icon} ${c.name} dari ${opp.name}!`; }},
  { id:"fullheal", rar:"legend", icon:"💞", name:"Ramuan Penuh", desc:"Mengisi darah sampai penuh.",
    use(p){ if(p.hp >= CONFIG.maxHp || p.hp <= 0) return null; p.hp = CONFIG.maxHp; return "Darah terisi penuh!"; }},
  { id:"star", rar:"legend", icon:"⭐", name:"Bintang Bonus", desc:"Langsung mendapat +1 poin.",
    use(p){ p.points++; return "Kamu mendapat +1 poin!"; }}
];