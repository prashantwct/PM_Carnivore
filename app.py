"""Serves the PM Form F1 app. It is a static, offline-first PWA; Flask only hosts the files.

    python app.py            # http://localhost:5000
    FLASK_DEBUG=1 python app.py
"""
import os

from flask import Flask, abort, send_from_directory

BASE = os.path.dirname(os.path.abspath(__file__))
TOP_LEVEL = {"style.css", "form.js", "app.js", "pdf.js", "manifest.json", "sw.js"}
FOLDERS = ("vendor/", "icons/")

app = Flask(__name__, static_folder=None)


@app.route("/")
def index():
    return send_from_directory(BASE, "index.html")


@app.route("/<path:name>")
def asset(name):
    # Allow-list: never expose app.py, the repo, or anything else in this folder.
    if name not in TOP_LEVEL and not name.startswith(FOLDERS):
        abort(404)
    response = send_from_directory(BASE, name)
    if name == "sw.js":
        response.headers["Cache-Control"] = "no-cache"
    return response


if __name__ == "__main__":
    app.run(
        host=os.environ.get("HOST", "0.0.0.0"),
        port=int(os.environ.get("PORT", "5000")),
        debug=os.environ.get("FLASK_DEBUG") == "1",  # never debug on 0.0.0.0 by default
    )
