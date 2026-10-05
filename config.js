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

  // 出席番号と、前希望の初期値（前希望なら front: true）
  // 前希望は画面の「前希望」ボタンからも変えられます。画面で変えた内容は、その端末で優先されます。
  // 名前はここには書きません（names.html で暗号化して names.js に入れます）。
  students: [
    { no: 1, front: false },
    { no: 2, front: true },
    { no: 3, front: false },
    { no: 4, front: false },
    { no: 5, front: false },
    { no: 6, front: false },
    { no: 7, front: false },
    { no: 8, front: false },
    { no: 9, front: true },
    { no: 10, front: true },
    { no: 11, front: true },
    { no: 12, front: false },
    { no: 13, front: false },
    { no: 14, front: true },
    { no: 15, front: true },
    { no: 16, front: false },
    { no: 17, front: false },
    { no: 18, front: true },
    { no: 19, front: false },
    { no: 20, front: false },
    { no: 21, front: false },
    { no: 22, front: false },
    { no: 23, front: true },
    { no: 24, front: false },
    { no: 25, front: true },
    { no: 26, front: false },
    { no: 27, front: true },
    { no: 28, front: true },
    { no: 29, front: true },
    { no: 30, front: true },
    { no: 31, front: false },
    { no: 32, front: false },
    { no: 33, front: true },
    { no: 34, front: false },
    { no: 35, front: false },
    { no: 36, front: false },
    { no: 37, front: true },
    { no: 38, front: true },
    { no: 39, front: false },
    { no: 40, front: false },
    { no: 41, front: true },
    { no: 42, front: false },
  ],
};
