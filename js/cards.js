/* =====================  KARTU SUPPORT  ===================== */
const hiddenIdx = p => A(p).traits.map((_,i)=>i).filter(i => !p.rev.includes(i));
const CARDS = [
  { id:"keyword", icon:"🔑", name:"Intip Kata", desc:"Melihat 1 kata kunci dari salah satu petunjuk tersembunyi.",
    use(p){ const idx = hiddenIdx(p).filter(i => !p.hinted.includes(i)); if(!idx.length) return null;
      const i = idx[Math.floor(Math.random()*idx.length)], tr = A(p).traits[i];
      p.hinted.push(i); p.kw.push({topic:tr.topic, word:tr.groups[0][0]});
      return `Kata kunci terbuka: "${tr.groups[0][0]}" (topik ${tr.topic})`; }},
  { id:"trait", icon:"💡", name:"Buka Petunjuk", desc:"Membuka 1 petunjuk tersembunyi secara penuh.",
    use(p){ const idx = hiddenIdx(p); if(!idx.length) return null;
      const i = idx[Math.floor(Math.random()*idx.length)]; p.rev.push(i);
      return `Petunjuk terbuka: ${A(p).traits[i].text}`; }},
  { id:"first", icon:"🔤", name:"Huruf Awal", desc:"Melihat huruf pertama nama hewan.",
    use(p){ if(p.first) return null; p.first = true; return `Nama hewan diawali huruf "${A(p).name[0].toUpperCase()}".`; }},
  { id:"category", icon:"🏷️", name:"Kategori", desc:"Melihat golongan hewan (mamalia, burung, dll).",
    use(p){ if(p.cat) return null; p.cat = true; return `Kategori: ${A(p).category}`; }},
  { id:"choice", icon:"🎲", name:"Pilihan Ganda", desc:"Menampilkan 3 pilihan nama hewan, 1 di antaranya benar.",
    use(p){ if(p.choices) return null;
      const others = ANIMALS.filter(a => a.name !== A(p).name).sort(() => Math.random()-.5).slice(0,2).map(a => a.name);
      p.choices = [...others, A(p).name].sort(() => Math.random()-.5);
      return "Pilihan ganda muncul di bagian jawaban."; }},
  { id:"shield", icon:"🛡️", name:"Perisai", desc:"Tebakan salah berikutnya tidak mengurangi darah.",
    use(p){ if(p.shield) return null; p.shield = true; return "Perisai aktif untuk 1 tebakan salah."; }},
  { id:"heal", icon:"💖", name:"Penyembuh", desc:"Menambah 1 darah.",
    use(p){ if(p.hp >= CONFIG.maxHp || p.hp <= 0) return null; p.hp++; return "Darah bertambah 1."; }}
];
