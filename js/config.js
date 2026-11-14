/* =====================  PENGATURAN  ===================== */
const CONFIG = {
  maxHp: 5, targetPoints: 10, cluesPerAnimal: 7, pointsDirect: 2, pointsForced: 1,
  cardEveryLost: 2, continueOnCorrectClue: false,
  /* --- pengacakan hewan (anti-monoton) --- */
  newBoost: 3,        // bobot hewan yang belum pernah muncul (hewan biasa = 1)
  cooldownDeals: 10,  // berapa kali pembagian hewan sampai hewan "pulih" penuh (1 ronde ≈ 2 pembagian)
  minWeight: 0.03,    // bobot terendah hewan yang baru saja muncul (tetap tidak mustahil)
  bothPenalty: 0.4,   // pengali tambahan jika KEDUA pemain sudah pernah mendapat hewan itu
  repeatPenalty: 0.35, // makin sering sebuah hewan muncul, makin kecil peluangnya
  /* --- animasi spin kartu --- */
  spinMs: 5000,       // lama putaran (milidetik)
  spinLen: 40         // jumlah kartu di dalam reel
};