// 名前の一覧の暗号化・復号（ブラウザの Web Crypto を使う）
// パスワードから PBKDF2 で鍵を作り、AES-GCM で暗号化する。
(function (root) {
  "use strict";
  const ITERATIONS = 600000;
  const subtle = () => root.crypto.subtle;

  const toB64 = (buf) => {
    const bytes = new Uint8Array(buf);
    let s = "";
    for (let i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i]);
    return btoa(s);
  };
  const fromB64 = (b64) => Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));

  async function deriveKey(password, salt, iterations) {
    const base = await subtle().importKey("raw", new TextEncoder().encode(password), "PBKDF2", false, ["deriveKey"]);
    return subtle().deriveKey(
      { name: "PBKDF2", salt, iterations, hash: "SHA-256" },
      base,
      { name: "AES-GCM", length: 256 },
      true,
      ["encrypt", "decrypt"]
    );
  }

  // names: { 出席番号: 名前 } → names.js に書く暗号文
  async function encryptNames(names, password) {
    const salt = root.crypto.getRandomValues(new Uint8Array(16));
    const iv = root.crypto.getRandomValues(new Uint8Array(12));
    const key = await deriveKey(password, salt, ITERATIONS);
    const data = await subtle().encrypt({ name: "AES-GCM", iv }, key, new TextEncoder().encode(JSON.stringify(names)));
    return { v: 1, iterations: ITERATIONS, salt: toB64(salt), iv: toB64(iv), data: toB64(data) };
  }

  async function decryptWith(blob, key) {
    const plain = await subtle().decrypt({ name: "AES-GCM", iv: fromB64(blob.iv) }, key, fromB64(blob.data));
    return JSON.parse(new TextDecoder().decode(plain));
  }

  // パスワードで開く。端末に覚えさせる用の鍵（文字列）も返す。違えば例外。
  async function unlockWithPassword(blob, password) {
    const key = await deriveKey(password, fromB64(blob.salt), blob.iterations);
    const names = await decryptWith(blob, key);
    return { names, savedKey: toB64(await subtle().exportKey("raw", key)) };
  }

  // 端末に覚えさせた鍵で開く。合わなければ例外。
  async function unlockWithSavedKey(blob, savedKey) {
    const key = await subtle().importKey("raw", fromB64(savedKey), "AES-GCM", false, ["decrypt"]);
    return decryptWith(blob, key);
  }

  const api = { encryptNames, unlockWithPassword, unlockWithSavedKey };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.Secret = api;
})(typeof window !== "undefined" ? window : globalThis);
