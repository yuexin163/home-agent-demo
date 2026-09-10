#!/usr/bin/env python3

from __future__ import annotations

import argparse
import os
from pathlib import Path, PurePosixPath
from zipfile import ZIP_DEFLATED, ZipFile


IGNORED_NAMES = {".DS_Store", "__MACOSX"}


def should_skip(path: Path) -> bool:
    return any(part in IGNORED_NAMES or part.startswith("._") for part in path.parts)


def create_archive(source: Path, output: Path, root_name: str) -> tuple[int, int]:
    if not source.is_dir():
        raise FileNotFoundError(f"Source directory not found: {source}")

    output.parent.mkdir(parents=True, exist_ok=True)
    temporary_output = output.with_suffix(f"{output.suffix}.tmp")
    file_count = 0
    directory_count = 0

    with ZipFile(temporary_output, "w", compression=ZIP_DEFLATED, compresslevel=6, allowZip64=True) as archive:
        for item in sorted(source.rglob("*")):
            relative = item.relative_to(source)
            if should_skip(relative):
                continue
            archive_name = str(PurePosixPath(root_name, *relative.parts))
            if item.is_dir():
                archive.writestr(f"{archive_name}/", b"")
                directory_count += 1
                continue
            archive.write(item, archive_name)
            file_count += 1

    os.replace(temporary_output, output)
    return file_count, directory_count


def main() -> None:
    parser = argparse.ArgumentParser(description="Create a Windows-compatible UTF-8 ZIP archive.")
    parser.add_argument("source", type=Path)
    parser.add_argument("output", type=Path)
    parser.add_argument("--root-name", default="yipin-smart-home-preview")
    arguments = parser.parse_args()

    files, directories = create_archive(arguments.source.resolve(), arguments.output.resolve(), arguments.root_name)
    print(f"Created {arguments.output}: {files} files, {directories} directories")


if __name__ == "__main__":
    main()
