"""Claude のアーティファクト（プレビュー）用のファイルを作る。

- sekigae.html : index.html から <!doctype>/<html>/<head>/<body> を外したもの
                 （アーティファクトが自動で付けるため）
- names.html   : names.html そのまま（別ページとして公開される）
どちらも <script src="..."> を中身に置き換えて1ファイルにする。

使い方: python3 tools/build_artifact.py <出力先フォルダ>
"""
import pathlib
import re
import sys

root = pathlib.Path(__file__).resolve().parent.parent
out = pathlib.Path(sys.argv[1])
out.mkdir(parents=True, exist_ok=True)
PREVIEW = "<script>window.SEKIGAE_PREVIEW = true;</script>\n"


def inline_scripts(html):
    """artifact:scripts の範囲の <script src> を中身に置き換える"""
    def repl(m):
        srcs = re.findall(r'<script src="([^"]+)"></script>', m.group(1))
        return PREVIEW + "".join(
            f"<script>\n{(root / s).read_text(encoding='utf-8')}</script>\n" for s in srcs
        )
    return re.sub(r"<!-- artifact:scripts:start -->\n(.*?)<!-- artifact:scripts:end -->\n", repl, html, flags=re.S)


def between(html, name):
    return re.search(rf"<!-- artifact:{name}:start -->\n(.*?)<!-- artifact:{name}:end -->", html, re.S).group(1)


index = (root / "index.html").read_text(encoding="utf-8")
(out / "sekigae.html").write_text(between(index, "head") + inline_scripts(between(index, "body")), encoding="utf-8")

names = (root / "names.html").read_text(encoding="utf-8")
(out / "names.html").write_text(inline_scripts(names), encoding="utf-8")
