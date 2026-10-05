"""index.html から、Claude のアーティファクト（プレビュー）用の1ファイルを作る。

アーティファクトは <!doctype>/<html>/<head>/<body> を自動で付けるので、
それらを外し、config.js と seating.js を中に埋め込む。

使い方: python3 tools/build_artifact.py <出力先.html>
"""
import pathlib
import re
import sys

root = pathlib.Path(__file__).resolve().parent.parent
html = (root / "index.html").read_text(encoding="utf-8")


def between(name):
    m = re.search(rf"<!-- artifact:{name}:start -->\n(.*?)<!-- artifact:{name}:end -->", html, re.S)
    return m.group(1)


inline = "".join(
    f"<script>\n{(root / f).read_text(encoding='utf-8')}</script>\n" for f in ("config.js", "seating.js")
)
body = between("body").replace(between("scripts"), inline)
body = re.sub(r"<!-- artifact:scripts:(start|end) -->\n", "", body)
out = between("head") + "<script>window.SEKIGAE_PREVIEW = true;</script>\n" + body

pathlib.Path(sys.argv[1]).write_text(out, encoding="utf-8")
