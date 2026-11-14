/* =====================  JARINGAN (PeerJS)  ===================== */
const PREFIX = "tebakhewan-duel-";
const genCode = () => Array.from({length:4}, () => "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"[Math.floor(Math.random()*32)]).join("");

function send(a){
  a.player = ME;
  if(IS_HOST) handle(a);
  else if(conn && conn.open) conn.send(a);
}
function broadcast(){
  if(conn && conn.open) conn.send(JSON.stringify(G));
  render();
}

function hostRoom(){
  L.err = ""; IS_HOST = true; ME = 0;
  const code = genCode();
  peer = new Peer(PREFIX + code);
  L.code = ""; L.msg = "Membuat room"; renderLobby();
  peer.on("open", () => { L.code = code; renderLobby(); });
  peer.on("error", e => {
    if(e.type === "unavailable-id"){ peer.destroy(); return hostRoom(); }
    L.err = "Gagal membuat room (" + e.type + "). Coba lagi."; L.code = ""; renderSetup();
  });
  peer.on("connection", c => {
    if(conn && conn.open){ c.on("open", () => { c.send({type:"full"}); c.close(); }); return; }
    conn = c;
    c.on("data", a => {
      if(a && a.type === "hello"){
        newGame(L.name, (a.name || "Pemain 2").slice(0,16), L.target);
        L.peerGone = false; broadcast();
      } else if(a && a.player !== undefined){
        a.player = 1;                  // tamu selalu pemain 2
        handle(a);
      }
    });
    c.on("close", () => { L.peerGone = true; render(); });
  });
}

function joinRoom(code){
  code = code.trim().toUpperCase();
  if(code.length !== 4){ L.err = "Kode room terdiri dari 4 karakter."; return renderSetup(); }
  L.err = ""; IS_HOST = false; ME = 1;
  L.msg = "Menyambung ke room " + code; renderLobby(true);
  peer = new Peer();
  const fail = m => { L.err = m; try{ peer.destroy(); }catch(e){} G = null; renderSetup(); };
  const timer = setTimeout(() => { if(!G) fail("Room tidak ditemukan atau host tidak merespons."); }, 12000);
  peer.on("error", e => { clearTimeout(timer); fail(e.type === "peer-unavailable" ? "Room dengan kode itu tidak ada." : "Koneksi gagal (" + e.type + ")."); });
  peer.on("open", () => {
    conn = peer.connect(PREFIX + code, { reliable:true });
    conn.on("open", () => conn.send({ type:"hello", name:L.name }));
    conn.on("data", d => {
      if(d && d.type === "full"){ clearTimeout(timer); return fail("Room sudah penuh."); }
      if(typeof d === "string"){ clearTimeout(timer); G = JSON.parse(d); render(); }
    });
    conn.on("close", () => { L.peerGone = true; render(); });
  });
}
