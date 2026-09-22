"""로컬 Emulator — Firestore/Auth 변경 후 디스크 export (debounce)."""
from __future__ import annotations

import os
import subprocess
import threading
from pathlib import Path

_lock = threading.Lock()
_timer: threading.Timer | None = None

DEBOUNCE_SEC = float(os.getenv("DEV_EMULATOR_EXPORT_DEBOUNCE_SEC", "3") or "3")


def schedule_emulator_export(reason: str = "api") -> None:
    if os.getenv("USE_FIREBASE_EMULATOR", "").lower() not in ("1", "true", "yes"):
        return
    global _timer
    with _lock:
        if _timer is not None:
            _timer.cancel()
        _timer = threading.Timer(DEBOUNCE_SEC, _run_export, args=(reason,))
        _timer.daemon = True
        _timer.start()


def _run_export(reason: str) -> None:
    root = Path(__file__).resolve().parents[2]
    script = root / "scripts" / "emulator-export-now.js"
    if not script.is_file():
        return
    try:
        subprocess.run(
            ["node", str(script), reason],
            cwd=str(root),
            capture_output=True,
            timeout=180,
            check=False,
        )
    except (OSError, subprocess.TimeoutExpired):
        pass
