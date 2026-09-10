"""Print compact product-row data from selected XLSX sheets without loading media.

The workbook is opened as a ZIP archive. Only workbook metadata, shared strings,
and the requested worksheet XML are read. Embedded images remain untouched.
"""

from __future__ import annotations

import argparse
import json
import re
import zipfile
import xml.etree.ElementTree as ET


MAIN_NS = "{http://schemas.openxmlformats.org/spreadsheetml/2006/main}"
DOC_REL_NS = "{http://schemas.openxmlformats.org/officeDocument/2006/relationships}"
PKG_REL_NS = "{http://schemas.openxmlformats.org/package/2006/relationships}"


def read_shared_strings(archive: zipfile.ZipFile) -> list[str]:
    root = ET.fromstring(archive.read("xl/sharedStrings.xml"))
    return ["".join(node.text or "" for node in item.iter(f"{MAIN_NS}t")) for item in root]


def sheet_paths(archive: zipfile.ZipFile) -> dict[str, str]:
    workbook = ET.fromstring(archive.read("xl/workbook.xml"))
    relationships = ET.fromstring(archive.read("xl/_rels/workbook.xml.rels"))
    targets = {rel.attrib["Id"]: rel.attrib["Target"] for rel in relationships.findall(f"{PKG_REL_NS}Relationship")}
    result: dict[str, str] = {}
    for sheet in workbook.findall(f".//{MAIN_NS}sheet"):
        relationship_id = sheet.attrib[f"{DOC_REL_NS}id"]
        target = targets[relationship_id].lstrip("/")
        result[sheet.attrib["name"]] = target if target.startswith("xl/") else f"xl/{target}"
    return result


def cell_text(cell: ET.Element, shared_strings: list[str]) -> str:
    cell_type = cell.attrib.get("t")
    value = cell.find(f"{MAIN_NS}v")
    formula = cell.find(f"{MAIN_NS}f")
    if formula is not None and formula.text:
        image_id = re.search(r'ID_[A-F0-9]+', formula.text)
        if image_id:
            return image_id.group(0)
    if cell_type == "inlineStr":
        return "".join(node.text or "" for node in cell.iter(f"{MAIN_NS}t"))
    if value is None or value.text is None:
        return ""
    if cell_type == "s":
        return shared_strings[int(value.text)]
    return value.text


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("workbook")
    parser.add_argument("sheet")
    parser.add_argument("--start-row", type=int, default=1)
    parser.add_argument("--max-rows", type=int, default=120)
    parser.add_argument("--only-column-a", action="store_true")
    args = parser.parse_args()

    with zipfile.ZipFile(args.workbook) as archive:
        strings = read_shared_strings(archive)
        paths = sheet_paths(archive)
        if args.sheet not in paths:
            raise KeyError(f"Unknown sheet: {args.sheet}")
        root = ET.fromstring(archive.read(paths[args.sheet]))
        output: list[dict[str, object]] = []
        for row in root.findall(f".//{MAIN_NS}row"):
            row_number = int(row.attrib["r"])
            if row_number < args.start_row:
                continue
            values = {
                cell.attrib["r"]: cell_text(cell, strings)
                for cell in row.findall(f"{MAIN_NS}c")
                if cell_text(cell, strings)
            }
            if args.only_column_a and f"A{row_number}" not in values:
                continue
            if values:
                output.append({"row": row_number, "cells": values})
            if len(output) >= args.max_rows:
                break
        print(json.dumps({"sheet": args.sheet, "rows": output}, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
