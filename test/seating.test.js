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

test("人数が座席より少なければ空席ができる", () => {
  const cfg = { ...base, students: base.students.slice(0, 40) };
  const a = Seating.assignSeats(cfg);
  assert.strictEqual(a.filter((x) => x === null).length, 2);
});

test("重複や人数超過を検出する", () => {
  const dup = { ...base, students: base.students.concat([{ no: 1, name: "", front: false }]) };
  assert.strictEqual(Seating.validate(dup).length, 2);
});
