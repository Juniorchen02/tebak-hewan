/* =====================  KAMUS SINONIM  ===================== */
const S = {
  laut:["laut","lautan","samudra","samudera","perairan","air asin","bahari"],
  air:["air","sungai","danau","rawa","kolam"],
  daging:["daging","karnivora","pemangsa","predator","memangsa","buas","pemakan daging"],
  tumbuhan:["tumbuhan","herbivora","rumput","daun","nabati","vegetarian","pemakan tumbuhan"],
  afrika:["afrika","sabana","savana"],
  malam:["malam","nokturnal"],
  kelompok:["kelompok","kawanan","berkelompok","koloni","rombongan","bergerombol","gerombolan","pride"],
  garis:["garis","bergaris","belang","loreng"],
  terbang:["terbang","melayang","sayap"],
  hutan:["hutan","rimba","belantara"],
  reptil:["reptil","kadal","biawak"],
  mamalia:["mamalia","menyusui"],
  besar:["besar","raksasa","terbesar","gede","jumbo"]
};

/* Helper pembuat petunjuk + wadah daftar hewan.
   Setiap file di data/hewan/ cukup memanggil ANIMALS.push({...}). */
const t = (topic, text, groups, neg = false) => ({ topic, text, groups, neg });
const ANIMALS = [];
