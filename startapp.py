#!/usr/bin/env python3
"""Startapp do Contas_exe — modal de inicializacao.

Sobe o servidor local (API + Vite) e abre o que voce escolher no navegador.
Tudo em Python puro (tkinter da stdlib) — nao precisa instalar nada. Requer
apenas Python 3 e o Node ja usado pelo projeto.

Uso: `python startapp.py` (ou duplo-clique em startapp.cmd).
"""

import os
import json
import signal
import subprocess
import sys
import threading
import time
import urllib.error
import urllib.request
import webbrowser
import tkinter as tk

REPO = os.path.dirname(os.path.abspath(__file__))
API_PORT = os.environ.get("PORT", "8787")
UI_PORT = "5175"
UI = f"http://127.0.0.1:{UI_PORT}"
API = f"http://127.0.0.1:{API_PORT}"
PID_FILE = os.path.join(REPO, ".startapp-pids.json")

# Paleta da marca (dark, quadrado, minimalista).
BG = "#070a12"
CARD = "#0e1424"
CARD_HOVER = "#131c2f"
CARD_DANGER = "#1c1216"
TEXT = "#f0f6ff"
MUTED = "#93a4bd"
ACCENT = "#22c55e"
DANGER = "#f87171"
BORDER = "#22304a"


def node_exe():
    """Caminho do node, ou None se nao estiver no PATH."""
    from shutil import which

    return which("node")


def url_up(url):
    try:
        urllib.request.urlopen(url, timeout=1)
        return True
    except urllib.error.HTTPError:
        # Respondeu com 4xx/5xx => esta no ar.
        return True
    except Exception:
        return False


def api_up():
    """True se a API responde ao healthcheck."""
    return url_up(f"{API}/api/health")


def ui_up():
    """True se o Vite responde."""
    return url_up(f"{UI}/")


def server_up():
    """True se API e Vite ja respondem."""
    return api_up() and ui_up()


def read_pids():
    try:
        with open(PID_FILE, "r", encoding="utf-8") as fh:
            data = json.load(fh)
    except Exception:
        return []
    pids = data.get("pids", [])
    return [int(pid) for pid in pids if isinstance(pid, int) or str(pid).isdigit()]


def write_pids(pids):
    try:
        with open(PID_FILE, "w", encoding="utf-8") as fh:
            json.dump({"pids": sorted(set(pids))}, fh)
    except Exception:
        pass


def pid_alive(pid):
    if os.name == "nt":
        result = subprocess.run(
            ["tasklist", "/FI", f"PID eq {pid}", "/FO", "CSV", "/NH"],
            stdout=subprocess.PIPE,
            stderr=subprocess.DEVNULL,
            text=True,
        )
        return str(pid) in result.stdout
    try:
        os.kill(pid, 0)
        return True
    except OSError:
        return False
    except Exception:
        return False


def prune_pids():
    live = [pid for pid in read_pids() if pid_alive(pid)]
    write_pids(live)
    return live


def start_server():
    """Sobe API + Vite em segundo plano (sem janela), sobrevivendo a este app."""
    node = node_exe()
    if not node:
        return False
    flags = 0
    if os.name == "nt":
        flags = subprocess.CREATE_NO_WINDOW | subprocess.DETACHED_PROCESS
    env = os.environ.copy()
    env["PORT"] = API_PORT
    common = dict(
        cwd=REPO,
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
        creationflags=flags,
        close_fds=True,
    )
    pids = prune_pids()
    if not api_up():
        api_proc = subprocess.Popen([node, "server/index.mjs"], env=env, **common)
        pids.append(api_proc.pid)
    if not ui_up():
        ui_proc = subprocess.Popen(
            [
                node,
                "node_modules/vite/bin/vite.js",
                "--host",
                "127.0.0.1",
                "--port",
                UI_PORT,
            ],
            **common,
        )
        pids.append(ui_proc.pid)
    write_pids(pids)
    return True


def stop_server():
    for pid in read_pids():
        if not pid_alive(pid):
            continue
        if os.name == "nt":
            subprocess.run(
                ["taskkill", "/F", "/PID", str(pid)],
                stdout=subprocess.DEVNULL,
                stderr=subprocess.DEVNULL,
            )
        else:
            try:
                os.kill(pid, signal.SIGTERM)
            except OSError:
                pass
    write_pids([])


class StartApp:
    def __init__(self, root):
        self.root = root
        root.title("Contas_exe — Inicializar")
        root.configure(bg=BG)
        root.resizable(False, False)
        self._center(460, 560)

        wrap = tk.Frame(root, bg=BG)
        wrap.pack(fill="both", expand=True, padx=24, pady=22)

        # Cabecalho
        head = tk.Frame(wrap, bg=BG)
        head.pack(fill="x")
        tk.Label(
            head, text="●", fg=ACCENT, bg=BG, font=("Segoe UI", 12)
        ).pack(side="left")
        tk.Label(
            head,
            text="  Contas_exe",
            fg=TEXT,
            bg=BG,
            font=("Segoe UI Semibold", 17),
        ).pack(side="left")
        tk.Label(
            wrap,
            text="Escolha o que iniciar.",
            fg=MUTED,
            bg=BG,
            font=("Segoe UI", 10),
        ).pack(anchor="w", pady=(2, 16))

        self._card(
            wrap,
            "⚡  Fazer tudo de uma vez",
            "Sobe o servidor e abre o App e o Painel /admin juntos.",
            lambda: self.ensure_and_open(["/", "/admin"]),
            accent=ACCENT,
            primary=True,
        )
        self._card(
            wrap,
            "Abrir Painel /admin",
            "Dashboard do dono: dados, usuarios, auditoria e logs.",
            lambda: self.ensure_and_open(["/admin"]),
            accent=ACCENT,
        )
        self._card(
            wrap,
            "Abrir App (cofre)",
            "A aplicacao normal de contas e senhas.",
            lambda: self.ensure_and_open(["/"]),
            accent=ACCENT,
        )
        self._card(
            wrap,
            "Abrir pasta do projeto",
            "Mostra os arquivos no Explorer.",
            self.open_folder,
            accent=ACCENT,
        )
        self._card(
            wrap,
            "Parar servidor",
            "Encerra apenas os processos iniciados por este app.",
            self.stop,
            accent=DANGER,
        )

        self.status = tk.StringVar(value="")
        tk.Label(
            wrap,
            textvariable=self.status,
            fg=ACCENT,
            bg=BG,
            font=("Segoe UI", 10),
            anchor="w",
        ).pack(fill="x", pady=(8, 0))
        tk.Label(
            wrap,
            text="O servidor sobe na 1a vez (alguns segundos) e o navegador abre sozinho.",
            fg="#5b6b82",
            bg=BG,
            font=("Segoe UI", 8),
            wraplength=410,
            justify="left",
            anchor="w",
        ).pack(fill="x", pady=(4, 0))

    def _center(self, w, h):
        sw = self.root.winfo_screenwidth()
        sh = self.root.winfo_screenheight()
        self.root.geometry(f"{w}x{h}+{(sw - w) // 2}+{(sh - h) // 2}")

    def _card(self, parent, title, desc, command, accent=ACCENT, primary=False):
        hover = CARD_DANGER if accent == DANGER else CARD_HOVER
        frame = tk.Frame(
            parent,
            bg=CARD,
            highlightbackground=accent if primary else BORDER,
            highlightthickness=1,
            cursor="hand2",
        )
        frame.pack(fill="x", pady=5)
        inner = tk.Frame(frame, bg=CARD)
        inner.pack(fill="x", padx=14, pady=11)
        t = tk.Label(
            inner,
            text=title,
            fg=TEXT,
            bg=CARD,
            font=("Segoe UI Semibold", 11),
            anchor="w",
        )
        t.pack(fill="x")
        d = tk.Label(
            inner,
            text=desc,
            fg=MUTED,
            bg=CARD,
            font=("Segoe UI", 9),
            anchor="w",
            justify="left",
        )
        d.pack(fill="x")

        widgets = [frame, inner, t, d]

        def on_enter(_):
            for wdg in widgets:
                wdg.configure(bg=hover)
            frame.configure(highlightbackground=accent)

        def on_leave(_):
            for wdg in widgets:
                wdg.configure(bg=CARD)
            frame.configure(highlightbackground=accent if primary else BORDER)

        def on_click(_):
            command()

        for wdg in widgets:
            wdg.bind("<Enter>", on_enter)
            wdg.bind("<Leave>", on_leave)
            wdg.bind("<Button-1>", on_click)

    def set_status(self, text):
        self.root.after(0, lambda: self.status.set(text))

    def ensure_and_open(self, paths):
        if not node_exe():
            self.set_status("Node nao encontrado no PATH. Instale o Node.js.")
            return

        def worker():
            if not server_up():
                self.set_status("Subindo o servidor...")
                start_server()
            for _ in range(100):
                if server_up():
                    break
                time.sleep(0.3)
            for p in paths:
                webbrowser.open(f"{UI}{p}")
                time.sleep(0.6)
            self.set_status("Pronto.")

        threading.Thread(target=worker, daemon=True).start()

    def open_folder(self):
        if os.name == "nt":
            os.startfile(REPO)
        elif sys.platform == "darwin":
            subprocess.Popen(["open", REPO])
        else:
            subprocess.Popen(["xdg-open", REPO])

    def stop(self):
        stop_server()
        self.set_status("Servidor parado.")


def main():
    root = tk.Tk()
    StartApp(root)
    root.mainloop()


if __name__ == "__main__":
    main()
