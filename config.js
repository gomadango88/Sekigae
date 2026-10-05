// 席替えの設定ファイル
// ここを書き換えて保存すれば、ページを開き直したときに反映されます。

window.SEKIGAE_CONFIG = {
  // 座席の配置。1行目が教室の前方（黒板側）です。
  //   S = 座席
  //   . = 座席なし（図の斜線部分）
  layout: [
    "...SS.",
    "SSSSSS",
    "SSSSSS",
    "SSSSSS",
    "SSSSSS",
    "SSSSSS",
    "SSSSSS",
    "SSSS..",
  ],

  // 「前希望」の人を入れる範囲（前から何列目まで）
  frontRows: 3,

  // 出席番号・名前・前希望
  //   name  : 名前（空欄なら番号だけ表示）
  //   front : 前希望なら true
  students: [
    { no: 1, name: "", front: false },
    { no: 2, name: "", front: false },
    { no: 3, name: "", front: false },
    { no: 4, name: "", front: false },
    { no: 5, name: "", front: false },
    { no: 6, name: "", front: false },
    { no: 7, name: "", front: false },
    { no: 8, name: "", front: false },
    { no: 9, name: "", front: false },
    { no: 10, name: "", front: false },
    { no: 11, name: "", front: false },
    { no: 12, name: "", front: false },
    { no: 13, name: "", front: false },
    { no: 14, name: "", front: false },
    { no: 15, name: "", front: false },
    { no: 16, name: "", front: false },
    { no: 17, name: "", front: false },
    { no: 18, name: "", front: false },
    { no: 19, name: "", front: false },
    { no: 20, name: "", front: false },
    { no: 21, name: "", front: false },
    { no: 22, name: "", front: false },
    { no: 23, name: "", front: false },
    { no: 24, name: "", front: false },
    { no: 25, name: "", front: false },
    { no: 26, name: "", front: false },
    { no: 27, name: "", front: false },
    { no: 28, name: "", front: false },
    { no: 29, name: "", front: false },
    { no: 30, name: "", front: false },
    { no: 31, name: "", front: false },
    { no: 32, name: "", front: false },
    { no: 33, name: "", front: false },
    { no: 34, name: "", front: false },
    { no: 35, name: "", front: false },
    { no: 36, name: "", front: false },
    { no: 37, name: "", front: false },
    { no: 38, name: "", front: false },
    { no: 39, name: "", front: false },
    { no: 40, name: "", front: false },
    { no: 41, name: "", front: false },
    { no: 42, name: "", front: false },
  ],
};
