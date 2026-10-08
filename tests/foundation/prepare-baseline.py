"""Rebuild only the Closed static artifact in an empty temporary directory.

Requires PyYAML. This never runs Actions, deploys or contacts a backend.
"""
import io
import subprocess
import sys
import tarfile
from pathlib import Path

import yaml

baseline = "dcd50d137c26cb62aeb91292b46c3de56fe05a2a"
destination = Path(sys.argv[1]).resolve()
destination.mkdir(parents=True, exist_ok=True)
if any(destination.iterdir()):
    raise SystemExit("Baseline destination must be empty")
archive = subprocess.check_output(["git", "archive", baseline])
with tarfile.open(fileobj=io.BytesIO(archive)) as files:
    files.extractall(destination, filter="data")
workflow = yaml.safe_load((destination / ".github/workflows/pages.yml").read_text())
for step in workflow["jobs"]["deploy"]["steps"]:
    if step.get("shell") == "python":
        print(step["name"], flush=True)
        subprocess.run([sys.executable, "-c", step["run"]], cwd=destination, check=True)
print(f"Closed static artifact ready: {destination}")
