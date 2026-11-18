"""Print the requested tag's section of CHANGELOG.md for GitHub Releases."""
from pathlib import Path
import re
import sys


def extract(changelog, tag):
    if not re.fullmatch(r"v[0-9]+\.[0-9]+\.[0-9]+(?:-[0-9A-Za-z.-]+)?", tag):
        raise ValueError(f"Invalid version tag: {tag}")
    heading = r"^## \[" + re.escape(tag[1:]) + r"\][^\n]*\n"
    section = re.search(heading + r"(.*?)(?=^## |\Z)", changelog, re.M | re.S)
    if not section or not section[1].strip():
        raise ValueError(f"Missing release notes for {tag}")
    return section[1].strip()


if __name__ == "__main__":
    print(extract(Path("CHANGELOG.md").read_text(encoding="utf-8"), sys.argv[1]))
