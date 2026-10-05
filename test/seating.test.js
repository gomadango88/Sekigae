// 実行: node --test test/*.test.js
const test = require("node:test");
const assert = require("node:assert");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const Seating = require("../seating.js");

function loadConfig() {
  const ctx = { window: {} };
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, "../config.js"), "utf8"), ctx);
  return ctx.window.SEKIGAE_CONFIG;
}

function withFront(config, nos) {
  return { ...config, students: config.students.map((s) => ({ ...s, front: nos.includes(s.no) })) };
}

function rowsOf(config, assignment) {
  const { seats } = Seating.parseLayout(config.layout);
  const rowByNo = new Map();
  assignment.forEach((no, i) => { if (no !== null) rowByNo.set(no, seats[i].row); });
  return rowByNo;
}

const base = loadConfig();
const range = (a, b) => Array.from({ length: b - a + 1 }, (_, i) => a + i);

test("設定どおり42席・42人", () => {
  assert.strictEqual(Seating.parseLayout(base.layout).seats.length, 42);
  assert.strictEqual(base.students.length, 42);
  assert.deepStrictEqual(Seating.validate(base), []);
});

test("全員がちょうど1回ずつ配置される", () => {
  for (let t = 0; t < 200; t++) {
    const a = Seating.assignSeats(base);
    assert.deepStrictEqual(a.slice().sort((x, y) => x - y), range(1, 42));
  }
});

test("前希望が14人以下なら全員3列目まで", () => {
  const cfg = withFront(base, [3, 8, 15, 22, 29, 36, 41]);
  for (let t = 0; t < 500; t++) {
    const rows = rowsOf(cfg, Seating.assignSeats(cfg));
    [3, 8, 15, 22, 29, 36, 41].forEach((no) => assert.ok(rows.get(no) < 3));
  }
});

test("前希望14人でちょうど3列目まで埋まる", () => {
  const nos = range(1, 14);
  const cfg = withFront(base, nos);
  const rows = rowsOf(cfg, Seating.assignSeats(cfg));
  nos.forEach((no) => assert.ok(rows.get(no) < 3));
});

test("入りきらない分だけ4列目に入る", () => {
  const nos = range(1, 17); // 3列目までは14席なので3人が4列目
  const cfg = withFront(base, nos);
  for (let t = 0; t < 500; t++) {
    const rows = rowsOf(cfg, Seating.assignSeats(cfg));
    const counts = [0, 0, 0, 0, 0, 0, 0, 0];
    nos.forEach((no) => counts[rows.get(no)]++);
    assert.strictEqual(counts[0] + counts[1] + counts[2], 14);
    assert.strictEqual(counts[3], 3);
  }
});

test("4列目も埋まると5列目へ", () => {
  const nos = range(1, 22); // 14 + 6 + 2
  const cfg = withFront(base, nos);
  const rows = rowsOf(cfg, Seating.assignSeats(cfg));
  const counts = [0, 0, 0, 0, 0, 0, 0, 0];
  nos.forEach((no) => counts[rows.get(no)]++);
  assert.deepStrictEqual(counts.slice(3), [6, 2, 0, 0, 0]);
});

test("fixedFront は前希望の人数にかかわらず3列目まで", () => {
  const fixed = [9, 10, 11, 14, 15, 18, 23];
  for (const nos of [range(1, 30), range(1, 42), range(20, 42), []]) {
    const cfg = withFront(base, nos.concat(fixed));
    for (let t = 0; t < 300; t++) {
      const rows = rowsOf(cfg, Seating.assignSeats(cfg));
      fixed.forEach((no) => assert.ok(rows.get(no) < 3));
    }
  }
});

test("fixedFront があっても前希望は前から詰めて入る", () => {
  const nos = range(12, 33);
  const cfg = withFront(base, nos);
  for (let t = 0; t < 300; t++) {
    const rows = rowsOf(cfg, Seating.assignSeats(cfg));
    const counts = [0, 0, 0, 0, 0, 0, 0, 0];
    nos.forEach((no) => counts[rows.get(no)]++);
    assert.deepStrictEqual(counts.slice(3), [6, 2, 0, 0, 0]);
  }
});

test("人数が座席より少なければ空席ができる", () => {
  const cfg = { ...base, students: base.students.slice(0, 40) };
  const a = Seating.assignSeats(cfg);
  assert.strictEqual(a.filter((x) => x === null).length, 2);
});

test("重複や人数超過を検出する", () => {
  const dup = { ...base, students: base.students.concat([{ no: 1, name: "", front: false }]) };
  assert.strictEqual(Seating.validate(dup).length, 2);
});

const Secret = require("../secret.js");

test("名前の暗号化と復号", async () => {
  const names = { 1: "山田 太郎", 2: "佐藤 花子" };
  const blob = await Secret.encryptNames(names, "correct horse");
  assert.ok(!JSON.stringify(blob).includes("山田"));
  const { names: got, savedKey } = await Secret.unlockWithPassword(blob, "correct horse");
  assert.deepStrictEqual(got, { 1: "山田 太郎", 2: "佐藤 花子" });
  assert.deepStrictEqual(await Secret.unlockWithSavedKey(blob, savedKey), got);
  await assert.rejects(Secret.unlockWithPassword(blob, "wrong password"));
});

const Roster = require("../roster.js");
const nos42 = range(1, 42);

test("CSV（番号・名前・ふりがな、見出しあり）を読む", () => {
  const csv = "﻿出席番号,氏名,ふりがな\r\n1,山田 太郎,やまだ たろう\r\n2,\"佐藤　花子\",さとう　はなこ\r\n";
  const { entries } = Roster.parseRoster(csv, nos42);
  assert.deepStrictEqual(entries[1], { name: "山田　太郎", kana: "やまだ　たろう" });
  assert.deepStrictEqual(entries[2], { name: "佐藤　花子", kana: "さとう　はなこ" });
});

test("タブ区切り・ふりがなと名前が逆の列でも読む", () => {
  const { entries } = Roster.parseRoster("1\tやまだ たろう\t山田 太郎\n2\tすずき じろう\t鈴木 次郎", nos42);
  assert.deepStrictEqual(entries[1], { name: "山田　太郎", kana: "やまだ　たろう" });
});

test("名前だけの一覧は出席番号順に割り当てる", () => {
  const { entries, warnings } = Roster.parseRoster("山田 太郎\n佐藤 花子", nos42);
  assert.deepStrictEqual(entries[2], { name: "佐藤　花子" });
  assert.ok(warnings[0].startsWith("名前のない番号: 3, 4"));
});

test("Shift_JIS の CSV を読む", () => {
  const sjis = Buffer.from([0x31, 0x2c, 0x8e, 0x52, 0x93, 0x63]); // "1,山田"
  assert.strictEqual(Roster.decodeBytes(sjis), "1,山田");
  assert.strictEqual(Roster.decodeBytes(Buffer.from("1,山田", "utf8")), "1,山田");
});
