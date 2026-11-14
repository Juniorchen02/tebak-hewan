/* =====================  TAMPILAN  ===================== */
function renderSetup(){
  const hashCode = (location.hash || "").replace("#","").toUpperCase().slice(0,4);
  app.innerHTML = `
    <h1>🐾 Tebak Hewan Duel</h1>
    <div class="sub">Main online berdua, di dua browser berbeda</div>
    <div class="card">
      <label for="nm">Namamu</label>
      <input type="text" id="nm" value="${esc(L.name)}" placeholder="Nama pemain" maxlength="16">
      ${L.err ? `<div class="err">${esc(L.err)}</div>` : ""}
    </div>
    <div class="card">
      <b>🏠 Buat room baru</b>
      <div class="meta">Kamu jadi pemain 1. Bagikan kode room ke temanmu.</div>
      <label for="target">Poin untuk menang</label>
      <input type="number" id="target" value="${L.target}" min="2" max="50">
      <button class="big" id="host">Buat Room</button>
    </div>
    <div class="card">
      <b>🔑 Gabung ke room</b>
      <div class="meta">Masukkan 4 karakter kode dari temanmu.</div>
      <div class="row">
        <input type="text" id="code" placeholder="KODE" maxlength="4" value="${esc(hashCode)}" style="text-transform:uppercase;letter-spacing:6px;text-align:center">
        <button id="join">Gabung</button>
      </div>
    </div>
    <div class="card">
      <b>Aturan singkat</b>
      <ul>
        <li>Tiap pemain punya 1 hewan rahasia sendiri (hanya terlihat olehnya) dan ${CONFIG.maxHp} darah.</li>
        <li>Tugasmu <b>menebak hewan milik lawan</b>. Gambar dan namanya disembunyikan, tapi tiap petunjuk yang kamu tebak benar akan terbuka. Tebak dengan kalimatmu sendiri, misalnya <i>"hidup di laut"</i>.</li>
        <li>Tebakan petunjuk <b>benar</b>: petunjuk terbuka, darah aman. <b>Salah</b>: -1 darah.</li>
        <li>Selama darah masih ada, kamu boleh <b>langsung jawab nama hewan</b>: benar <b>+${CONFIG.pointsDirect} poin</b>, salah <b>-1 darah</b>.</li>
        <li>Tiap kehilangan ${CONFIG.cardEveryLost} darah, kamu dapat <b>1 kartu support</b> lewat spin. Ada 4 kelangkaan: Biasa, Langka, Epik, Legendaris.</li>
        <li>Darah habis: kamu <b>wajib menjawab nama hewan</b>. Benar <b>+${CONFIG.pointsForced} poin</b>, salah berarti <b>kalah</b>.</li>
        <li>Setelah menjawab benar, kamu mendapat hewan baru dengan darah penuh. Yang pertama mencapai target poin menang.</li>
      </ul>
    </div>`;
  const nm = document.getElementById("nm");
  const getName = () => (L.name = nm.value.trim() || "Pemain");
  document.getElementById("host").onclick = () => {
    getName(); L.target = Math.max(2, parseInt(document.getElementById("target").value) || 10);
    CONFIG.targetPoints = L.target; hostRoom();
  };
  const go = () => { getName(); joinRoom(document.getElementById("code").value); };
  document.getElementById("join").onclick = go;
  document.getElementById("code").onkeydown = e => { if(e.key === "Enter") go(); };
}

function renderLobby(joining){
  if(joining){
    app.innerHTML = `<h1>🐾 Tebak Hewan Duel</h1>
      <div class="card center"><h2>${esc(L.msg)}<span class="dots"></span></h2>
      <button class="ghost big" id="cancel">Batal</button></div>`;
  } else {
    const link = location.href.split("#")[0] + "#" + L.code;
    app.innerHTML = `<h1>🐾 Tebak Hewan Duel</h1>
      <div class="card center">
        ${L.code ? `
          <div class="meta">Kode room</div>
          <div class="code">${esc(L.code)}</div>
          <p class="sub" style="margin-bottom:10px">Bagikan kode ini, atau kirim tautan di bawah.<br>Menunggu lawan bergabung<span class="dots"></span></p>
          <button class="ghost" id="copycode">📋 Salin tautan</button>`
        : `<h2>${esc(L.msg)}<span class="dots"></span></h2>`}
        <button class="ghost big" id="cancel">Batal</button>
      </div>`;
    const cc = document.getElementById("copycode");
    if(cc) cc.onclick = () => navigator.clipboard.writeText(link).then(() => cc.textContent = "✅ Tersalin!").catch(() => cc.textContent = link);
  }
  document.getElementById("cancel").onclick = () => { try{ peer.destroy(); }catch(e){} peer = conn = G = null; renderSetup(); };
}

function scoreboard(){
  return `<div class="scoreboard">` + G.players.map((p,i) => {
    const hp = Math.max(p.hp,0);
    const hearts = "❤️".repeat(hp) + "🖤".repeat(CONFIG.maxHp - hp);
    return `<div class="pl p${i} ${i===G.turn && !G.over ? "active":""}">
      <div class="name">${esc(p.name)}${i===ME ? " (kamu)" : ""}</div>
      <div class="hearts">${hearts}</div>
      <div class="meta">⭐ ${p.points}/${G.target} poin · 🃏 ${p.cards.length} kartu</div>
    </div>`;
  }).join("") + `</div>`;
}
const connBanner = () => L.peerGone ? `<div class="conn bad">⚠️ Koneksi dengan lawan terputus</div>` : "";

function render(){
  if(!G) return;
  if(G.over) return drawEnd();
  if(G.view.type === "result") return drawResult();
  drawGame();
}

function confettiHtml(){
  const colors = ["#ffb703","#4ade80","#5ee0ff","#ff6fb5","#a78bfa","#fb8500"];
  let h = "";
  for(let i = 0; i < 36; i++)
    h += `<i style="left:${Math.random()*100}%;background:${colors[i%colors.length]};animation-delay:${(Math.random()*.6).toFixed(2)}s;animation-duration:${(1.6+Math.random()*1.2).toFixed(2)}s"></i>`;
  return `<div class="r-confetti">${h}</div>`;
}

const cardOf = id => CARDS.find(c => c.id === id);
const rtag = c => `<em class="rtag">${RARITY[c.rar].label}</em>`;

/* Spin kartu: reel bergerak dari kanan ke kiri lalu berhenti di kartu yang didapat.
   Animasi hanya diputar sekali per undian; kalau layar digambar ulang, posisinya dilanjutkan (delay negatif). */
function spinState(spin){
  if(L.spinId !== spin.id){ L.spinId = spin.id; L.spinStart = Date.now(); }
  const reduced = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  const el = reduced ? CONFIG.spinMs : Math.min(Date.now() - L.spinStart, CONFIG.spinMs);
  return { el, left: CONFIG.spinMs - el, done: el >= CONFIG.spinMs };
}
function spinHtml(r, actor){
  const s = r.spin; if(!s) return "";
  const st = spinState(s), win = cardOf(s.card);
  const items = s.strip.map((id, i) => { const c = cardOf(id);
    return `<div class="reel-item rar-${c.rar}${i === s.win ? " win" : ""}" style="--d:${st.left}ms"><span class="ri-icon">${c.icon}</span><span class="ri-name">${c.name}</span></div>`;
  }).join("");
  return `<div class="spin-box">
      <div class="spin-title">🎁 ${esc(actor.name)} mendapat kartu support!</div>
      <div class="reel"><div class="reel-pointer"></div>
        <div class="reel-track" style="--dur:${CONFIG.spinMs}ms;--delay:${-st.el}ms">${items}</div></div>
      <div class="r-gift after-spin rar-${win.rar}" style="--d:${st.left}ms">${rtag(win)}<br>${win.icon} <b>${win.name}</b><small>${win.desc}</small></div>
    </div>`;
}
function setupReel(r){
  const s = r.spin, reel = document.querySelector(".reel"), track = document.querySelector(".reel-track");
  if(!s || !reel || !track) return;
  const w = track.children[s.win], size = w.offsetWidth;
  const end = -(w.offsetLeft + size/2 + s.jit*size - reel.clientWidth/2);   // posisi akhir: kartu pemenang tepat di garis tengah
  track.style.setProperty("--end", end + "px");
  if(spinState(s).done){ track.style.animation = "none"; track.style.transform = `translateX(${end}px)`; }
}

function drawResult(){
  const r = G.view.r, actor = G.players[G.turn], mine = G.turn === ME;
  app.innerHTML = scoreboard() + `
    <div class="card result-card ${r.kind}">
      ${r.kind === "good" ? confettiHtml() : ""}
      <div class="r-icon">${r.icon}</div>
      <div class="r-title">${r.title}</div>
      <p class="r-msg">${mine ? "" : `<b>${esc(actor.name)}</b> menebak. `}${r.msg}</p>
      ${r.reveal ? `<div class="r-reveal">${r.reveal}</div><br>` : ""}
      ${r.badge ? `<div class="r-badge">${r.badge}</div>` : ""}
      ${spinHtml(r, actor)}
      ${r.extra || ""}
      ${mine ? `<button class="big ${r.spin ? "after-spin" : ""}" id="next" style="--d:${r.spin ? spinState(r.spin).left : 0}ms">Lanjut</button>`
             : `<p class="meta">Menunggu ${esc(actor.name)} menekan Lanjut<span class="dots"></span></p>`}
    </div>` + connBanner();
  setupReel(r);
  if(mine) document.getElementById("next").onclick = () => send({ type:"next" });
}

function drawEnd(){
  const w = G.players[G.over.winner];
  app.innerHTML = scoreboard() + `
    <div class="card center">
      <h1>🏆 ${esc(w.name)} Menang!</h1>
      <p class="r-msg">${esc(G.over.reason)}</p>
      <button class="big" id="again">Main Lagi</button>
    </div>` + connBanner();
  document.getElementById("again").onclick = () => send({ type:"again" });
}

function drawGame(){
  const me = G.players[ME], opp = G.players[1-ME];
  const myTurn = G.turn === ME;
  const forced = me.hp <= 0;
  const a = A(me);            // hewan LAWAN (yang kamu tebak)
  const mine = A(opp);        // hewan KAMU (yang ditebak lawan)

  // tab otomatis: giliranmu = tebak, giliran lawan = lihat hewanmu
  const key = G.turn + "|" + G.view.type + "|" + G.players.map(p => p.points).join(",");
  if(L.key !== key){ L.key = key; L.tab = myTurn ? "guess" : "mine"; }
  const tab = L.tab;

  const total = me.active.length, opened = me.rev.length, oppGuessed = opp.rev.length;
  const myImgHtml = mine.img ? `<img src="${esc(mine.img)}" alt="hewan kamu">` : `<div class="emoji">${mine.emoji}</div>`;
  const myTraits = opp.active.map(i => {
    const tr = mine.traits[i], g = opp.rev.includes(i);
    return `<li class="${g ? "open" : ""}">${g ? "👀" : "•"} <b>${esc(tr.topic)}:</b> ${esc(tr.text)}${g ? " <small>(sudah ditebak lawan)</small>" : ""}</li>`;
  }).join("");
  const tags = [
    me.cat ? `<span class="tag">🏷️ ${esc(a.category)}</span>` : "",
    me.first ? `<span class="tag">🔤 Huruf ${esc(a.name[0].toUpperCase())}</span>` : "",
    me.len ? `<span class="tag">🔢 ${a.name.replace(/[^A-Za-z]/g,"").length} huruf</span>` : "",
    ...me.kw.map(h => `<span class="tag">🔑 ${esc(h.topic)}: "${esc(h.word)}"</span>`),
    me.shield ? `<span class="tag">🛡️ Perisai aktif</span>` : "",
    me.extra ? `<span class="tag">⏩ Giliran ekstra aktif</span>` : ""
  ].join("");
  const traits = me.active.map(i => { const tr = a.traits[i]; return me.rev.includes(i)
    ? `<li class="open">✅ <b>${esc(tr.topic)}:</b> ${esc(tr.text)}</li>`
    : `<li class="hid">❓ <b>${esc(tr.topic)}:</b> ???</li>`; }).join("");
  const cardsHtml = me.cards.length
    ? me.cards.map((id,idx) => { const c = CARDS.find(x => x.id === id);
        return `<button class="sup rar-${c.rar}" data-card="${idx}">${rtag(c)}<br>${c.icon} <b>${c.name}</b><small>${c.desc}</small></button>`; }).join("")
    : `<div class="meta">Belum punya kartu. Kehilangan ${CONFIG.cardEveryLost} darah untuk mendapat 1 kartu.</div>`;
  const choices = me.choices ? `<div class="choices">${me.choices.map(c => `<button data-choice="${esc(c)}">${esc(c)}</button>`).join("")}</div>` : "";

  const actions = myTurn ? `
      <div class="card">
        ${G.log ? `<div class="info">${esc(G.log)}</div>` : ""}
        <b>🔍 Tebak petunjuk</b>
        <div class="meta">Tulis dengan kalimatmu sendiri. Benar: petunjuk terbuka. Salah: -1 darah.</div>
        <form id="fclue" class="row" autocomplete="off">
          <input type="text" id="clue" placeholder="Contoh: hidup di laut" maxlength="60" ${forced ? "disabled" : ""}>
          <button type="submit" ${forced ? "disabled" : ""}>Tebak</button>
        </form>
        <hr>
        <b>🐾 Jawab nama hewan</b>
        <div class="meta">${forced ? `Wajib: benar +${CONFIG.pointsForced} poin, salah = kalah.` : `Benar +${CONFIG.pointsDirect} poin, salah -1 darah.`}</div>
        ${choices}
        <form id="fans" class="row" autocomplete="off">
          <input type="text" id="ans" placeholder="Nama hewan..." maxlength="30">
          <button type="submit">Jawab</button>
        </form>
      </div>
      <div class="card"><b>🃏 Kartu Support</b><div class="cards" style="margin-top:10px">${cardsHtml}</div></div>`
    : `<div class="card"><b>🃏 Kartu Support</b><div class="meta" style="margin-top:6px">${me.cards.length} kartu disimpan. Bisa dipakai di giliranmu.</div></div>`;

  app.innerHTML = scoreboard() + `
    <div class="tabs">
      <button class="tab ${tab==="guess"?"on":""}" data-tab="guess">🎯 Tebak Lawan</button>
      <button class="tab ${tab==="mine"?"on":""}" data-tab="mine">🙈 Hewan Saya${oppGuessed ? `<span class="badge">${oppGuessed}</span>` : ""}</button>
    </div>

    <section class="screen ${tab==="guess"?"show":""}" id="screen-guess">
      ${myTurn && forced ? `<div class="alert">🩸 Darah habis! Kamu <b>wajib menjawab nama hewan</b>. Benar +${CONFIG.pointsForced} poin, salah berarti kalah.</div>` : ""}
      ${myTurn ? "" : `<div class="wait">⏳ Giliran ${esc(opp.name)}. Tunggu ya<span class="dots"></span></div>`}
      <div class="stage">
        <div class="card mystery">
          <div class="who">Hewan milik ${esc(opp.name)}</div>
          <div class="imgbox" style="margin-top:8px"><div class="emoji">❓</div></div>
          <div>${tags || `<span class="meta">Belum ada bantuan</span>`}</div>
        </div>
        <div class="card">
          <div class="section-title"><span>🔎 Petunjuk</span><span class="meta">${opened}/${total} terbuka</span></div>
          <div class="progress"><i style="width:${(opened/total)*100}%"></i></div>
          <ul class="traits">${traits}</ul>
        </div>
      </div>
      ${actions}
    </section>

    <section class="screen ${tab==="mine"?"show":""}" id="screen-mine">
      <div class="secret">🙈 Rahasia! Hanya kamu yang melihat layar ini. ${myTurn ? "" : `${esc(opp.name)} sedang menebak hewanmu, pantau petunjuk yang terbuka.`}</div>
      <div class="mine-grid">
        <div class="card">
          <div class="imgbox">${myImgHtml}</div>
          <div class="animal-name">${esc(mine.name)}</div>
          <div class="center-tags"><span class="tag">🏷️ ${esc(mine.category)}</span></div>
        </div>
        <div class="card">
          <div class="section-title"><span>📋 Petunjuk hewanmu</span><span class="meta">👀 ${oppGuessed}/${opp.active.length} ditebak</span></div>
          <div class="progress"><i style="width:${(oppGuessed/opp.active.length)*100}%;background:linear-gradient(90deg,var(--p2),var(--accent))"></i></div>
          <ul class="traits">${myTraits}</ul>
        </div>
      </div>
    </section>` + connBanner();

  document.querySelectorAll("[data-tab]").forEach(btn => {
    btn.onclick = () => {
      L.tab = btn.dataset.tab;
      document.querySelectorAll(".tab").forEach(x => x.classList.toggle("on", x.dataset.tab === L.tab));
      document.getElementById("screen-guess").classList.toggle("show", L.tab === "guess");
      document.getElementById("screen-mine").classList.toggle("show", L.tab === "mine");
      window.scrollTo({ top:0, behavior:"smooth" });
    };
  });
  if(myTurn){
    document.querySelectorAll("[data-card]").forEach(b => b.onclick = () => send({ type:"card", i:parseInt(b.dataset.card) }));
    document.querySelectorAll("[data-choice]").forEach(b => b.onclick = () => send({ type:"answer", text:b.dataset.choice }));
    document.getElementById("fclue").onsubmit = e => { e.preventDefault(); send({ type:"clue", text:document.getElementById("clue").value }); };
    document.getElementById("fans").onsubmit = e => { e.preventDefault(); send({ type:"answer", text:document.getElementById("ans").value }); };
    if(tab === "guess") (forced ? document.getElementById("ans") : document.getElementById("clue")).focus();
  }
}