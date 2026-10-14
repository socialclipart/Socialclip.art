#!/bin/bash
cd "$(dirname "$0")"
if command -v python3 >/dev/null; then python3 server.py; else echo "Python 3 fehlt: https://www.python.org/downloads/"; read -r; fi
