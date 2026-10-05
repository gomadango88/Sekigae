// 最小限の .xlsx（Excel ブック）書き出し。外部ライブラリなしで動かすための自前実装。
(function (root) {
  "use strict";

  const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

  function colName(i) {
    let s = "";
    for (i += 1; i > 0; i = Math.floor((i - 1) / 26)) s = String.fromCharCode(65 + ((i - 1) % 26)) + s;
    return s;
  }

  // スタイル番号（styles.xml の cellXfs の並び順）
  const STYLE = { plain: 0, title: 1, desk: 2, box: 3, num: 4, head: 5, cell: 6, right: 7, left: 8 };
  const STYLES_XML =
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
    '<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">' +
    '<fonts count="6">' +
    '<font><sz val="11"/><name val="游ゴシック"/><family val="3"/><charset val="128"/></font>' +
    '<font><b/><sz val="16"/><name val="游ゴシック"/><family val="3"/><charset val="128"/></font>' +
    '<font><sz val="12"/><name val="游ゴシック"/><family val="3"/><charset val="128"/></font>' +
    '<font><sz val="9"/><name val="游ゴシック"/><family val="3"/><charset val="128"/></font>' +
    '<font><b/><sz val="11"/><name val="游ゴシック"/><family val="3"/><charset val="128"/></font>' +
    '<font><sz val="14"/><name val="游ゴシック"/><family val="3"/><charset val="128"/></font>' +
    "</fonts>" +
    '<fills count="3"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill>' +
    '<fill><patternFill patternType="solid"><fgColor rgb="FFDDE6E2"/><bgColor indexed="64"/></patternFill></fill></fills>' +
    '<borders count="2"><border><left/><right/><top/><bottom/><diagonal/></border>' +
    '<border><left style="thin"><color auto="1"/></left><right style="thin"><color auto="1"/></right>' +
    '<top style="thin"><color auto="1"/></top><bottom style="thin"><color auto="1"/></bottom><diagonal/></border></borders>' +
    '<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>' +
    '<cellXfs count="9">' +
    '<xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>' +
    '<xf numFmtId="0" fontId="1" fillId="0" borderId="0" xfId="0" applyFont="1" applyAlignment="1"><alignment horizontal="center" vertical="center"/></xf>' +
    '<xf numFmtId="0" fontId="2" fillId="0" borderId="1" xfId="0" applyFont="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center"/></xf>' +
    '<xf numFmtId="0" fontId="5" fillId="0" borderId="1" xfId="0" applyFont="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center" wrapText="1" shrinkToFit="0"/></xf>' +
    '<xf numFmtId="0" fontId="3" fillId="0" borderId="0" xfId="0" applyFont="1" applyAlignment="1"><alignment horizontal="right" vertical="top"/></xf>' +
    '<xf numFmtId="0" fontId="4" fillId="2" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center"/></xf>' +
    '<xf numFmtId="0" fontId="0" fillId="0" borderId="1" xfId="0" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center"/></xf>' +
    '<xf numFmtId="0" fontId="2" fillId="0" borderId="0" xfId="0" applyFont="1" applyAlignment="1"><alignment horizontal="right" vertical="bottom"/></xf>' +
    '<xf numFmtId="0" fontId="2" fillId="0" borderId="0" xfId="0" applyFont="1" applyAlignment="1"><alignment horizontal="left" vertical="bottom"/></xf>' +
    "</cellXfs>" +
    '<cellStyles count="1"><cellStyle name="標準" xfId="0" builtinId="0"/></cellStyles>' +
    "</styleSheet>";

  // sheet: { name, rows: [[{v, s} | null]]（v は文字・数値・[{t, sz}]）, colWidths: [..], rowHeights: {行番号(0始まり): 高さ}, merges: ["A1:F1"], landscape }
  function sheetXml(sheet) {
    const cols = sheet.colWidths
      ? "<cols>" + sheet.colWidths.map((w, i) => `<col min="${i + 1}" max="${i + 1}" width="${w}" customWidth="1"/>`).join("") + "</cols>"
      : "";
    const rows = sheet.rows
      .map((row, r) => {
        const h = sheet.rowHeights && sheet.rowHeights[r];
        const cells = row
          .map((cell, c) => {
            if (!cell) return "";
            const ref = colName(c) + (r + 1);
            const s = cell.s ? ` s="${cell.s}"` : "";
            if (cell.v === "" || cell.v === null || cell.v === undefined) return `<c r="${ref}"${s}/>`;
            if (typeof cell.v === "number") return `<c r="${ref}"${s}><v>${cell.v}</v></c>`;
            // 文字の大きさが違う部分を含む文字列: [{ t: 文字, sz: ポイント }, ...]
            if (Array.isArray(cell.v)) {
              const runs = cell.v.map((run) =>
                `<r><rPr><sz val="${run.sz}"/><rFont val="游ゴシック"/><family val="3"/><charset val="128"/></rPr>` +
                `<t xml:space="preserve">${esc(run.t)}</t></r>`).join("");
              return `<c r="${ref}"${s} t="inlineStr"><is>${runs}</is></c>`;
            }
            return `<c r="${ref}"${s} t="inlineStr"><is><t xml:space="preserve">${esc(cell.v)}</t></is></c>`;
          })
          .join("");
        return `<row r="${r + 1}"${h ? ` ht="${h}" customHeight="1"` : ""}>${cells}</row>`;
      })
      .join("");
    const merges = sheet.merges && sheet.merges.length
      ? `<mergeCells count="${sheet.merges.length}">` + sheet.merges.map((m) => `<mergeCell ref="${m}"/>`).join("") + "</mergeCells>"
      : "";
    const setup = `<pageMargins left="0.5" right="0.5" top="0.6" bottom="0.6" header="0.3" footer="0.3"/>` +
      `<pageSetup paperSize="9" orientation="${sheet.landscape ? "landscape" : "portrait"}" fitToWidth="1" fitToHeight="1"/>`;
    return '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
      '<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">' +
      '<sheetPr><pageSetUpPr fitToPage="1"/></sheetPr>' +
      cols + `<sheetData>${rows}</sheetData>` + merges + setup + "</worksheet>";
  }

  function workbookFiles(sheets) {
    const files = {};
    files["[Content_Types].xml"] =
      '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
      '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">' +
      '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>' +
      '<Default Extension="xml" ContentType="application/xml"/>' +
      '<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>' +
      '<Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>' +
      sheets.map((_, i) => `<Override PartName="/xl/worksheets/sheet${i + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`).join("") +
      "</Types>";
    files["_rels/.rels"] =
      '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
      '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
      '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>' +
      "</Relationships>";
    files["xl/workbook.xml"] =
      '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
      '<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets>' +
      sheets.map((s, i) => `<sheet name="${esc(s.name)}" sheetId="${i + 1}" r:id="rId${i + 1}"/>`).join("") +
      "</sheets></workbook>";
    files["xl/_rels/workbook.xml.rels"] =
      '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
      '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
      sheets.map((_, i) => `<Relationship Id="rId${i + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${i + 1}.xml"/>`).join("") +
      `<Relationship Id="rId${sheets.length + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>` +
      "</Relationships>";
    files["xl/styles.xml"] = STYLES_XML;
    sheets.forEach((s, i) => { files[`xl/worksheets/sheet${i + 1}.xml`] = sheetXml(s); });
    return files;
  }

  // --- zip（無圧縮）---
  const CRC_TABLE = (() => {
    const t = new Uint32Array(256);
    for (let n = 0; n < 256; n++) {
      let c = n;
      for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
      t[n] = c >>> 0;
    }
    return t;
  })();
  function crc32(bytes) {
    let c = 0xffffffff;
    for (let i = 0; i < bytes.length; i++) c = CRC_TABLE[(c ^ bytes[i]) & 0xff] ^ (c >>> 8);
    return (c ^ 0xffffffff) >>> 0;
  }

  function zip(files) {
    const enc = new TextEncoder();
    const chunks = [];
    const central = [];
    let offset = 0;
    for (const [name, content] of Object.entries(files)) {
      const nameBytes = enc.encode(name);
      const data = enc.encode(content);
      const crc = crc32(data);
      const local = new DataView(new ArrayBuffer(30));
      local.setUint32(0, 0x04034b50, true);
      local.setUint16(4, 20, true);
      local.setUint16(6, 0x0800, true); // UTF-8 のファイル名
      local.setUint16(8, 0, true); // 無圧縮
      local.setUint16(10, 0, true);
      local.setUint16(12, 0x21, true); // 1980-01-01
      local.setUint32(14, crc, true);
      local.setUint32(18, data.length, true);
      local.setUint32(22, data.length, true);
      local.setUint16(26, nameBytes.length, true);
      local.setUint16(28, 0, true);
      chunks.push(new Uint8Array(local.buffer), nameBytes, data);

      const cen = new DataView(new ArrayBuffer(46));
      cen.setUint32(0, 0x02014b50, true);
      cen.setUint16(4, 20, true);
      cen.setUint16(6, 20, true);
      cen.setUint16(8, 0x0800, true);
      cen.setUint16(10, 0, true);
      cen.setUint16(12, 0, true);
      cen.setUint16(14, 0x21, true);
      cen.setUint32(16, crc, true);
      cen.setUint32(20, data.length, true);
      cen.setUint32(24, data.length, true);
      cen.setUint16(28, nameBytes.length, true);
      cen.setUint32(42, offset, true);
      central.push(new Uint8Array(cen.buffer), nameBytes);
      offset += 30 + nameBytes.length + data.length;
    }
    const centralSize = central.reduce((n, b) => n + b.length, 0);
    const end = new DataView(new ArrayBuffer(22));
    end.setUint32(0, 0x06054b50, true);
    end.setUint16(8, Object.keys(files).length, true);
    end.setUint16(10, Object.keys(files).length, true);
    end.setUint32(12, centralSize, true);
    end.setUint32(16, offset, true);
    const parts = chunks.concat(central, [new Uint8Array(end.buffer)]);
    const out = new Uint8Array(parts.reduce((n, b) => n + b.length, 0));
    let p = 0;
    for (const b of parts) { out.set(b, p); p += b.length; }
    return out;
  }

  // sheets を .xlsx のバイト列にする
  function build(sheets) {
    return zip(workbookFiles(sheets));
  }

  const api = { build, STYLE, colName };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.Xlsx = api;
})(this);
