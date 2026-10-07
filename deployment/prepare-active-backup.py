"""Reproduce the observed pre-Foundation Cloud artifact offline for rollback.

Only the reviewed Python build steps from the pinned Main commit run.
No Actions, login, database, SQL or deployment step is executed.
"""
import hashlib
import io
import json
import shutil
import subprocess
import sys
import tarfile
import tempfile
from pathlib import Path

import yaml

SOURCE = "543df154885d017b0632832d5f2c19cda1a5ff6a"
destination = Path(sys.argv[1]).resolve()
if destination.exists() and any(destination.iterdir()):
    raise SystemExit("Backup output must be empty")
with tempfile.TemporaryDirectory(prefix="sikoyek-active-backup-") as temporary:
    work = Path(temporary)
    source = work / "_source"
    source.mkdir()
    archive = subprocess.check_output(["git", "archive", SOURCE])
    with tarfile.open(fileobj=io.BytesIO(archive)) as files:
        files.extractall(source, filter="data")
    pages = yaml.safe_load((source / ".github/workflows/pages.yml").read_text())
    for step in pages["jobs"]["deploy"]["steps"]:
        if step.get("shell") == "python":
            subprocess.run([sys.executable, "-c", step["run"]], cwd=source, check=True)
    unified = yaml.safe_load((source / ".github/workflows/unified-pages.yml").read_text())
    steps = [step for step in unified["jobs"]["deploy"]["steps"]
             if step["name"] == "Build unified Master and Konstruva site" and step.get("shell") == "python"]
    assert len(steps) == 1
    subprocess.run([sys.executable, "-c", steps[0]["run"]], cwd=work, check=True)
    site = work / "_site"
    observed = {"Master": "aa10e8141c304bdf366a2852aaf89c857855a7d9a5a753f5c5a52169d3e808f8",
                "konstruva": "6f2facba10c43d8ad1fdf7434670f936f31767fccb67ffb12ae6e13f6a44e844"}
    for directory, expected in observed.items():
        assert hashlib.sha256((site / directory / "index.html").read_bytes()).hexdigest() == expected
    hashes = {str(file.relative_to(site)): hashlib.sha256(file.read_bytes()).hexdigest()
              for file in sorted(site.rglob("*")) if file.is_file()}
    if destination.exists():
        destination.rmdir()
    shutil.copytree(site, destination)
    (destination / "ROLLBACK_MANIFEST.json").write_text(json.dumps({
        "sourceCommit": SOURCE, "scope": "static frontend only; no backend operations",
        "observedHtmlMatches": observed, "files": hashes}, indent=2) + "\n")
print(f"Verified pre-Foundation Cloud backup: {destination}")
