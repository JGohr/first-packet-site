#!/usr/bin/env python3
"""Assemble src/ into a single self-contained index.html for GitHub Pages."""
from pathlib import Path

SRC = Path(__file__).parent / "src"
JS_ORDER = ["diagrams.js", "weeks_a.js", "weeks_b.js", "snowball.js", "tests.js", "setup.js",
            "app1.js", "app2.js", "app3.js", "ide.js", "app4.js"]

shell = (SRC / "shell.html").read_text(encoding="utf-8")
css = (SRC / "style.css").read_text(encoding="utf-8")
js = "(function(){\n" + "".join((SRC / f).read_text(encoding="utf-8") + "\n" for f in JS_ORDER) + "\n})();"
assert "</script" not in js, "a source file contains </script>, which would break the page"

body = shell.replace("/*CSS*/", css).replace("/*JS*/", js)
page = ("<!doctype html>\n<html lang=\"en\">\n<head>\n<meta charset=\"utf-8\">\n"
        "<meta name=\"viewport\" content=\"width=device-width,initial-scale=1,viewport-fit=cover\">\n"
        "<style>:root{padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px)}"
        "body{margin:0}img{max-width:100%}[hidden]{display:none!important}</style>\n"
        "</head>\n<body>\n" + body + "\n</body>\n</html>\n")
(Path(__file__).parent / "index.html").write_text(page, encoding="utf-8", newline="\n")
print(f"index.html written ({len(page):,} bytes)")
