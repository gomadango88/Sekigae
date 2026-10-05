// 名前の一覧（CSV など）の読み取り
(function (root) {
  "use strict";

  // CSV/TSV の1行をセルに分ける（"..." で囲んだセルに対応）
  function splitLine(line, sep) {
    const cells = [];
    let cell = "";
    let quoted = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (quoted) {
        if (ch === '"' && line[i + 1] === '"') { cell += '"'; i++; }
        else if (ch === '"') quoted = false;
        else cell += ch;
      } else if (ch === '"' && cell.trim() === "") {
        quoted = true;
        cell = "";
      } else if (ch === sep) {
        cells.push(cell);
        cell = "";
      } else {
        cell += ch;
      }
    }
    cells.push(cell);
    return cells.map((c) => c.trim());
  }

  // 姓と名の間の空白は全角スペース1つにそろえる
  const tidy = (s) => (s || "").trim().replace(/[\s　]+/g, "　");
  const isNo = (s) => /^\d+$/.test(s);
  const isKana = (s) => /^[ぁ-ゟ゠-ヿ\s　・ー]+$/.test(s);

  // text: 「出席番号, 名前, ふりがな」の CSV（タブ区切り・見出し行・ふりがな無しも可）
  // 戻り値: { entries: { 出席番号: { name, kana } }, warnings: [...] }
  function parseRoster(text, allNos) {
    const lines = text.replace(/^﻿/, "").split(/\r?\n/).filter((l) => l.trim());
    if (!lines.length) return { entries: {}, warnings: [] };
    const sep = lines.some((l) => l.includes("\t")) ? "\t" : ",";
    let rows = lines.map((l) => splitLine(l, sep));
    // 1行目だけ番号で始まらなければ見出し行とみなす
    if (rows.length > 1 && !isNo(rows[0][0]) && isNo(rows[1][0])) rows = rows.slice(1);

    const numbered = rows.every((r) => isNo(r[0]) && r.length > 1);
    // 「1 山田 太郎」のように1列に番号と名前が入っているとき
    const inline = !numbered && rows.every((r) => r.length === 1 && /^\d+[\s,、.:：番]+\S/.test(r[0]));
    if (inline) rows = rows.map((r) => { const m = r[0].match(/^(\d+)[\s,、.:：番]+(.+)$/); return [m[1], m[2]]; });

    const withNo = numbered || inline;
    const body = rows.map((r) => (withNo ? r.slice(1) : r));
    // 名前とふりがなの列が逆なら入れ替える
    const swap = body.every((r) => r[1] === undefined || r[1] === "" || !isKana(r[1])) &&
      body.some((r) => r[1]) && body.every((r) => isKana(r[0]));

    const entries = {};
    const extra = [];
    rows.forEach((r, i) => {
      const no = withNo ? Number(r[0]) : allNos[i];
      if (no === undefined) return;
      const [a, b] = body[i];
      const name = tidy(swap ? b : a);
      const kana = tidy(swap ? a : b);
      if (!name) return;
      if (!allNos.includes(no)) { extra.push(no); return; }
      entries[no] = kana ? { name, kana } : { name };
    });

    const warnings = [];
    const missing = allNos.filter((no) => !entries[no]);
    if (missing.length) warnings.push(`名前のない番号: ${missing.join(", ")}`);
    if (extra.length) warnings.push(`クラスにない番号: ${extra.join(", ")}`);
    if (!withNo && rows.length > allNos.length) warnings.push(`行が${allNos.length}人より多いため、${allNos.length + 1}行目以降は使いません。`);
    const noKana = Object.keys(entries).filter((no) => !entries[no].kana);
    if (noKana.length && noKana.length < Object.keys(entries).length) warnings.push(`ふりがなのない番号: ${noKana.join(", ")}`);
    return { entries, warnings };
  }

  // ファイルの中身を文字列に。UTF-8 でなければ Shift_JIS（Excel で保存した CSV）として読む
  function decodeBytes(buffer) {
    try {
      return new TextDecoder("utf-8", { fatal: true }).decode(buffer);
    } catch (e) {
      return new TextDecoder("shift_jis").decode(buffer);
    }
  }

  const api = { parseRoster, decodeBytes, tidy };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.Roster = api;
})(this);
