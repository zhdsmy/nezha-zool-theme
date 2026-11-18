"""Write the Nezha installer ZIPs and their SHA-256 checksums."""
import argparse
import hashlib
from pathlib import Path
import stat
import tempfile
import zipfile


ROOT = Path(__file__).resolve().parents[1]
ASSETS = {"frontend": "dist.zip", "admin": "nezha-zool-admin-dist.zip"}


def package(dist, output):
    index = dist / "index.html"
    if dist.is_symlink() or not index.is_file() or not index.stat().st_size:
        raise ValueError(f"Expected a non-empty {index}")

    files = []
    total_size = 0
    for path in sorted(dist.rglob("*")):
        relative = path.relative_to(dist)
        if path.is_symlink() or not (path.is_file() or path.is_dir()):
            raise ValueError(f"Unsupported file type: {relative}")
        if path.is_dir() or ".vite" in relative.parts or path.suffix == ".map":
            continue
        if path.name in {"config.js", "size-report.json"}:
            continue
        if "\\" in relative.as_posix() or ":" in relative.as_posix():
            raise ValueError(f"Unsafe ZIP path: {relative}")
        files.append(relative)
        total_size += path.stat().st_size
    if len(files) > 10_000 or total_size > 256 * 1024 * 1024:
        raise ValueError("Build exceeds the Nezha entry or extracted size limit")

    output.parent.mkdir(parents=True, exist_ok=True)
    with tempfile.TemporaryDirectory(dir=output.parent) as staging:
        archive = Path(staging) / output.name
        with zipfile.ZipFile(archive, "w") as bundle:
            for relative in files:
                # Keep build timestamps and host file modes out of the archive.
                entry = zipfile.ZipInfo(f"dist/{relative.as_posix()}", (1980, 1, 1, 0, 0, 0))
                entry.create_system = 3
                entry.external_attr = (stat.S_IFREG | 0o644) << 16
                bundle.writestr(entry, (dist / relative).read_bytes(), zipfile.ZIP_DEFLATED, 9)
        if archive.stat().st_size > 64 * 1024 * 1024:
            raise ValueError("ZIP exceeds 64 MiB")
        with zipfile.ZipFile(archive) as bundle:
            if bundle.testzip() is not None:
                raise ValueError("ZIP integrity check failed")
        digest = hashlib.sha256(archive.read_bytes()).hexdigest()
        checksum = archive.with_suffix(".zip.sha256")
        checksum.write_bytes(f"{digest}  {output.name}\n".encode("ascii"))
        archive.replace(output)
        checksum.replace(output.with_suffix(".zip.sha256"))
    print(f"{digest}  {output.name}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("apps", nargs="+", choices=ASSETS)
    for app in parser.parse_args().apps:
        package(ROOT / "apps" / app / "dist", ROOT / "release" / ASSETS[app])
