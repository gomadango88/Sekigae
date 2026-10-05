// 席替えのロジック（画面に依存しない部分）
(function (root) {
  "use strict";

  // layout の文字列配列から座席の一覧を作る。row は前から 0, 1, 2...
  function parseLayout(layout) {
    const rows = layout.length;
    const cols = Math.max(...layout.map((line) => line.length));
    const seats = [];
    layout.forEach((line, row) => {
      Array.from(line).forEach((ch, col) => {
        if (ch === "S") seats.push({ row, col });
      });
    });
    return { rows, cols, seats };
  }

  function shuffle(items, random) {
    const a = items.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  function validate(config) {
    const errors = [];
    const { seats } = parseLayout(config.layout);
    const nos = config.students.map((s) => s.no);
    const dup = nos.filter((n, i) => nos.indexOf(n) !== i);
    if (dup.length) errors.push(`出席番号が重複しています: ${[...new Set(dup)].join(", ")}`);
    if (config.students.length > seats.length) {
      errors.push(`座席が足りません（座席 ${seats.length} / 人数 ${config.students.length}）`);
    }
    return errors;
  }

  // 全員をランダムに座席へ配置する。
  // 戻り値は parseLayout の seats と同じ順の配列で、各要素は出席番号（空席なら null）。
  //
  // 前希望の人は前から frontRows 列目までの席にランダムで入る。
  // 入りきらないときだけ、その後ろの列から順に（列の中ではランダムに）席を足す。
  function assignSeats(config, random) {
    random = random || Math.random;
    const frontRows = config.frontRows ?? 3;
    const { rows, seats } = parseLayout(config.layout);

    const front = config.students.filter((s) => s.front);
    const others = config.students.filter((s) => !s.front);

    let pool = seats.filter((s) => s.row < frontRows);
    for (let row = frontRows; row < rows && pool.length < front.length; row++) {
      const need = front.length - pool.length;
      const rowSeats = shuffle(seats.filter((s) => s.row === row), random);
      pool = pool.concat(rowSeats.slice(0, need));
    }

    const frontSeats = shuffle(pool, random).slice(0, front.length);
    const taken = new Set(frontSeats);
    const restSeats = shuffle(seats.filter((s) => !taken.has(s)), random);

    const bySeat = new Map();
    front.forEach((st, i) => bySeat.set(frontSeats[i], st.no));
    others.forEach((st, i) => bySeat.set(restSeats[i], st.no));
    return seats.map((seat) => (bySeat.has(seat) ? bySeat.get(seat) : null));
  }

  const api = { parseLayout, assignSeats, validate };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.Seating = api;
})(this);
