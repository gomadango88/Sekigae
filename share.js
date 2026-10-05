// 座席の共有：乱数シードと、座席をそのまま表す「完全再現コード」
(function (root) {
  "use strict";

  // 席替えの手順を変えたら上げる（古いシードで違う結果にならないように）
  const ALGORITHM_VERSION = 1;

  // 32ビットのシードから再現できる乱数（mulberry32）
  function seededRandom(seed) {
    let a = seed >>> 0;
    return function () {
      a = (a + 0x6d2b79f5) >>> 0;
      let t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  // 短い確認用の値（FNV-1a の下位8ビット）。入力ミスや設定の違いに気づくため
  function check(text) {
    let h = 0x811c9dc5;
    for (let i = 0; i < text.length; i++) {
      h ^= text.charCodeAt(i);
      h = Math.imul(h, 0x01000193) >>> 0;
    }
    return (h & 0xff).toString(16).toUpperCase().padStart(2, "0");
  }

  const clean = (code) => String(code).toUpperCase().replace(/[^0-9A-F]/g, "");

  // ---- シード（8桁）＋ 設定の確認（2桁） ----
  // settings: 席替えの結果を左右する設定（座席の配置・前希望など）
  function settingsKey(config, frontNos) {
    return JSON.stringify([
      ALGORITHM_VERSION,
      config.layout,
      config.frontRows ?? 3,
      [...(config.fixedFront || [])].sort((a, b) => a - b),
      config.students.map((s) => s.no).sort((a, b) => a - b),
      [...frontNos].sort((a, b) => a - b),
    ]);
  }
  function encodeSeed(seed, config, frontNos) {
    const hex = (seed >>> 0).toString(16).toUpperCase().padStart(8, "0");
    return hex + check(settingsKey(config, frontNos) + hex);
  }
  // 戻り値: { seed } / { error: "format" | "settings" }
  function decodeSeed(code, config, frontNos) {
    const c = clean(code);
    if (c.length !== 10) return { error: "format" };
    const hex = c.slice(0, 8);
    if (c.slice(8) !== check(settingsKey(config, frontNos) + hex)) return { error: "settings" };
    return { seed: parseInt(hex, 16) };
  }

  // ---- 完全再現コード（座席の並べ方の通し番号）＋ 確認（2桁） ----
  function factorial(n) {
    let f = 1n;
    for (let i = 2n; i <= BigInt(n); i++) f *= i;
    return f;
  }
  const rankDigits = (seatCount) => (factorial(seatCount) - 1n).toString(16).length;
  const layoutKey = (layout, allNos) => JSON.stringify([layout, allNos]);

  // assignment: 座席順の [出席番号 | null]、allNos: 出席番号（昇順）
  function encodeSeats(assignment, layout, allNos) {
    const n = assignment.length;
    // 空席は区別しないので、出てきた順に番号を振る
    let empty = 0;
    const perm = assignment.map((no) => (no === null ? allNos.length + empty++ : allNos.indexOf(no)));
    let rank = 0n;
    for (let i = 0; i < n; i++) {
      let smaller = 0;
      for (let j = i + 1; j < n; j++) if (perm[j] < perm[i]) smaller++;
      rank = rank * BigInt(n - i) + BigInt(smaller);
    }
    const hex = rank.toString(16).toUpperCase().padStart(rankDigits(n), "0");
    return hex + check(layoutKey(layout, allNos) + hex);
  }
  // 戻り値: { seats } / { error: "format" | "check" }
  function decodeSeats(code, layout, allNos, seatCount) {
    const c = clean(code);
    const digits = rankDigits(seatCount);
    if (c.length !== digits + 2) return { error: "format" };
    const hex = c.slice(0, digits);
    if (c.slice(digits) !== check(layoutKey(layout, allNos) + hex)) return { error: "check" };
    let rank = BigInt("0x" + hex);
    if (rank >= factorial(seatCount)) return { error: "check" };
    const digitsLehmer = [];
    for (let i = 1; i <= seatCount; i++) {
      digitsLehmer.unshift(Number(rank % BigInt(i)));
      rank /= BigInt(i);
    }
    const pool = Array.from({ length: seatCount }, (_, i) => i);
    const seats = digitsLehmer.map((d) => {
      const idx = pool.splice(d, 1)[0];
      return idx < allNos.length ? allNos[idx] : null;
    });
    return { seats };
  }

  // 4〜5桁ごとに区切って読みやすく
  const group = (code, size) => clean(code).match(new RegExp(`.{1,${size || 5}}`, "g")).join(" ");

  const api = { seededRandom, encodeSeed, decodeSeed, encodeSeats, decodeSeats, rankDigits, group, clean, ALGORITHM_VERSION };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.Share = api;
})(this);
