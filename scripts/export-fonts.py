# /// script
# requires-python = ">=3.11"
# dependencies = ["glyphs-cli==0.7.0", "fonttools[woff]==4.67.0"]
# ///

from __future__ import annotations

import argparse
import fcntl
import json
import shutil
import subprocess
import sys
import tempfile
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

from fontTools.ttLib import TTFont

ROOT = Path(__file__).resolve().parent.parent
GLYPHS_BUILD = "3436"
WEIGHTS = (
    "Thin",
    "ExtraLight",
    "Light",
    "Regular",
    "Medium",
    "SemiBold",
    "Bold",
    "ExtraBold",
    "Black",
)
SETTINGS = {
    "autohint": True,
    "removeOverlap": True,
    "useSubroutines": False,
    "useProductionNames": True,
}
OUTLINES = {
    "cff": {"standard": "otf", "woff": "woff", "woff2": "woff2"},
    "tt": {"standard": "ttf"},
}


def install(glyphs: str) -> None:
    with (Path(tempfile.gettempdir()) / "glyphs-cli-install.lock").open("w") as lock:
        fcntl.flock(lock, fcntl.LOCK_EX)
        if subprocess.run([glyphs, "version", "resolve", "--quiet", GLYPHS_BUILD], capture_output=True).returncode != 0:
            run([glyphs, "version", "install", GLYPHS_BUILD])


def run(command: list[str]) -> None:
    result = subprocess.run(command)
    if result.returncode != 0:
        sys.exit(f"{' '.join(command[:3])} exited with {result.returncode}")


def export(glyphs: str, source: Path, outline: str, staging: Path) -> None:
    output = staging / outline
    report = staging / f"{outline}.jsonl"
    config = staging / f"{outline}.json"
    config.write_text(
        json.dumps(
            {
                "settings": {
                    **SETTINGS,
                    "outlineFormats": [outline],
                    "containerFormats": list(OUTLINES[outline]),
                    "outputPath": str(output),
                },
                "sourceFiles": [{"filePath": str(source), "instances": [{"selector": {"type": "single"}}]}],
            }
        ),
        encoding="utf-8",
    )
    run([glyphs, "export", "--app", GLYPHS_BUILD, "--plugins", "", "--quiet", "--config", str(config), "--json-output", str(report)])
    if not report.exists():
        sys.exit(f"glyphs export wrote no report for {source.name} ({outline})")
    reports = [json.loads(line) for line in report.read_text(encoding="utf-8").splitlines()]
    for entry in reports:
        for warning in entry["warnings"]:
            print(f"warning: {outline} {entry['instanceName']}: {warning['title']}: {warning['description']}")
    errors = [
        f"{outline} {entry['instanceName']}: {error['title']}: {error['description']}"
        for entry in reports
        for error in entry["errors"]
    ]
    if errors:
        sys.exit("Glyphs export reported errors:\n" + "\n".join(errors))
    instances = sorted(entry["instanceName"] for entry in reports)
    if instances != sorted(WEIGHTS):
        sys.exit(f"{source.name} ({outline}): exported instances {instances}, expected {sorted(WEIGHTS)}")


def verify(family: str, staging: Path) -> dict[Path, Path]:
    expected = {
        staging / outline / f"{family}-{weight}.{extension}": ROOT / "fonts" / extension / f"{family}-{weight}.{extension}"
        for outline, containers in OUTLINES.items()
        for extension in containers.values()
        for weight in WEIGHTS
    }
    written = {path for outline in OUTLINES for path in (staging / outline).iterdir()}
    if written != set(expected):
        missing = sorted(path.name for path in set(expected) - written)
        extra = sorted(path.name for path in written - set(expected))
        sys.exit(f"{family}: export wrote the wrong files (missing {missing}, unexpected {extra})")

    for path in expected:
        font = TTFont(path, checkChecksums=2)
        for tag in font.reader.keys():
            font.reader[tag]
        font.close()
    return expected


def main() -> None:
    parser = argparse.ArgumentParser(description="Export one family's static fonts into fonts/ with the Glyphs CLI.")
    parser.add_argument("family", choices=sorted(source.stem for source in (ROOT / "sources").glob("*.glyphspackage")))
    family = parser.parse_args().family

    glyphs = shutil.which("glyphs")
    if glyphs is None:
        sys.exit("glyphs-cli is not installed in this environment")
    source = ROOT / "sources" / f"{family}.glyphspackage"
    install(glyphs)

    with tempfile.TemporaryDirectory(prefix=f"{family}-export-") as directory:
        staging = Path(directory)
        with ThreadPoolExecutor() as pool:
            for future in [pool.submit(export, glyphs, source, outline, staging) for outline in OUTLINES]:
                future.result()
        moves = verify(family, staging)
        for staged, target in moves.items():
            target.parent.mkdir(parents=True, exist_ok=True)
            shutil.move(staged, target)
    print(f"{family}: exported {len(moves)} files with Glyphs build {GLYPHS_BUILD}")


if __name__ == "__main__":
    main()
