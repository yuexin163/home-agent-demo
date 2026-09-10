#!/usr/bin/env python3
"""Import the source home/equipment manuals without changing the originals."""

from __future__ import annotations

import argparse
import json
import re
import shutil
import subprocess
from pathlib import Path

from pypdf import PdfReader


HOUSE_META = {
    "1202入住手册.pdf": {
        "id": "house-1202-occupancy-guide",
        "title": "1202入住手册",
        "summary": "住宅入住、物业服务与日常居住相关资料。",
        "keywords": ["入住", "物业", "住宅", "交付", "使用"],
    },
    "上海市新建住宅使用说明书（2020年版）.pdf": {
        "id": "house-shanghai-use-guide-2020",
        "title": "上海市新建住宅使用说明书（2020年版）",
        "summary": "新建住宅的结构、设施使用、维护与注意事项说明。",
        "keywords": ["住宅使用", "结构", "设施", "维护", "注意事项"],
    },
    "上海市新建住宅质量保证书（2020年版）.pdf": {
        "id": "house-shanghai-quality-guarantee-2020",
        "title": "上海市新建住宅质量保证书（2020年版）",
        "summary": "新建住宅质量责任、保修范围与保修期限相关资料。",
        "keywords": ["质量保证", "保修", "责任", "期限", "住宅"],
    },
}


DEVICE_META = {
    "嘉格纳200系列冷藏箱-RC289800": ("device-gaggenau-refrigerator-rc289800", "嘉格纳200系列冷藏箱", "RC289800", "冷藏储存、功能设置、清洁保养与安全使用说明。"),
    "嘉格纳200系列冷冻箱-RF287800": ("device-gaggenau-freezer-rf287800", "嘉格纳200系列冷冻箱", "RF287800", "冷冻储存、温度设置、功能操作与清洁保养说明。"),
    "嘉格纳200系列组合冰箱": ("device-gaggenau-combi-fridge", "嘉格纳200系列组合冰箱", "RB282805", "组合冰箱功能、温度设置、家居互联与清洁保养说明。"),
    "嘉格纳200系列烤箱": ("device-gaggenau-oven-go240100", "嘉格纳200系列烤箱", "GO240100", "烤箱操作、程序设置、安全注意与清洁保养说明。"),
    "嘉格纳200系列燃气灶": ("device-gaggenau-gas-hob-vg273220cn", "嘉格纳200系列燃气灶", "VG273220CN", "燃气灶点火、火力调节、安全使用与日常清洁说明。"),
    "嘉格纳200系列中式烟机": ("device-gaggenau-hood-aw240190cn", "嘉格纳200系列中式烟机", "AW240190CN", "油烟机功能操作、滤网清洁、维护与安全说明。"),
    "嘉格纳200系列半嵌式洗碗机": ("device-gaggenau-dishwasher-di260800", "嘉格纳200系列半嵌式洗碗机", "DI260800", "洗涤程序、耗材添加、日常维护与故障处理说明。"),
    "安吉尔净水器": ("device-angel-water-purifier-j3402", "安吉尔净水器", "J3402-ROB120H", "净水器使用、滤芯维护、安全注意与常见问题说明。"),
    "AO史密斯热水器": ("device-ao-smith-water-heater", "A.O.史密斯燃气热水器", "JSLQ28-AJEWi", "燃气热水器操作、温度设置、安全防护与维护说明。"),
    "欧普浴霸": ("device-opple-bath-heater", "欧普浴霸", "MRGC2", "浴霸安装、照明、取暖、换气与安全使用说明。"),
    "恩仕浴缸": ("device-axent-smart-bathtub", "恩仕云控浴缸", "云控浴缸", "云控浴缸功能、操作流程、清洁维护与安全注意事项。"),
    "空调": ("device-daikin-air-conditioner", "大金空调", "机组说明", "空调机组操作、运行模式、维护和故障注意事项。"),
    "新风": ("device-huotong-erv", "霍通超低能耗新风系统", "ERV-GBHV", "新风系统控制、滤网维护、运行模式与使用注意事项。"),
    "凯迪仕电子锁": ("device-kaadas-smart-lock", "凯迪仕电子锁", "电子锁", "电子锁开锁、用户管理、电池维护与异常处理说明。"),
}

EXACT_DUPLICATE_DEVICE_FOLDERS = {
    "嘉格纳200系列冷冻箱-RF287800",
    "嘉格纳200系列冷藏箱-RC289800",
}


def clean_text(value: str) -> str:
    return re.sub(r"\s+", " ", value or "").strip()


def page_texts(pdf_path: Path) -> tuple[int, list[dict[str, object]]]:
    try:
        reader = PdfReader(str(pdf_path))
        pages = []
        for index, page in enumerate(reader.pages, start=1):
            try:
                text = clean_text(page.extract_text() or "")
            except Exception:
                text = ""
            pages.append({"page": index, "text": text})
        return len(reader.pages), pages
    except Exception:
        info = subprocess.run(["pdfinfo", str(pdf_path)], check=True, capture_output=True, text=True).stdout
        match = re.search(r"^Pages:\s+(\d+)$", info, flags=re.MULTILINE)
        if not match:
            raise RuntimeError(f"Unable to determine page count: {pdf_path}")
        count = int(match.group(1))
        return count, [{"page": index, "text": ""} for index in range(1, count + 1)]


def file_size_label(size: int) -> str:
    if size >= 1024 * 1024:
        return f"{size / 1024 / 1024:.1f} MB"
    return f"{size / 1024:.0f} KB"


def render_cover(pdf_path: Path, output_without_suffix: Path) -> Path:
    output_without_suffix.parent.mkdir(parents=True, exist_ok=True)
    command = [
        "pdftoppm", "-f", "1", "-singlefile", "-jpeg", "-jpegopt", "quality=86",
        "-scale-to", "1200", str(pdf_path), str(output_without_suffix),
    ]
    subprocess.run(command, check=True, capture_output=True)
    return output_without_suffix.with_suffix(".jpg")


def copy_and_index(
    source_pdf: Path,
    document: dict[str, object],
    public_root: Path,
    search_pages: list[dict[str, object]],
    source_cover: Path | None = None,
) -> dict[str, object]:
    kind = str(document["kind"])
    zone = str(document.get("zone") or "house")
    document_id = str(document["id"])
    destination_dir = public_root / "manuals" / kind / zone
    destination_dir.mkdir(parents=True, exist_ok=True)
    destination_pdf = destination_dir / f"{document_id}.pdf"
    shutil.copy2(source_pdf, destination_pdf)

    cover_dir = public_root / "manuals" / "covers"
    cover_dir.mkdir(parents=True, exist_ok=True)
    if source_cover and source_cover.exists():
        cover_path = cover_dir / f"{document_id}{source_cover.suffix.lower()}"
        shutil.copy2(source_cover, cover_path)
    else:
        cover_path = render_cover(source_pdf, cover_dir / document_id)

    count, pages = page_texts(source_pdf)
    for page in pages:
        search_pages.append({"documentId": document_id, **page})

    return {
        **document,
        "pdfUrl": f"/manuals/{kind}/{zone}/{document_id}.pdf",
        "coverImage": f"/manuals/covers/{cover_path.name}",
        "pageCount": count,
        "fileSize": file_size_label(source_pdf.stat().st_size),
        "searchablePageCount": sum(1 for page in pages if page["text"]),
        "sourceFile": source_pdf.name,
    }


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--source", type=Path, required=True)
    parser.add_argument("--project", type=Path, required=True)
    args = parser.parse_args()

    source = args.source.resolve()
    project = args.project.resolve()
    public_root = project / "public"
    documents: list[dict[str, object]] = []
    search_pages: list[dict[str, object]] = []

    for source_pdf in sorted((source / "house" / "pdf").glob("*.pdf")):
        meta = HOUSE_META.get(source_pdf.name)
        if not meta:
            continue
        documents.append(copy_and_index(source_pdf, {**meta, "kind": "house", "zone": "房屋资料", "deviceName": None, "model": None}, public_root, search_pages))

    original_doc = source / "house" / "pdf" / "上海市新建住宅质量保证书（2020年版）.doc"
    attachment_url = None
    if original_doc.exists():
        attachment_dir = public_root / "manuals" / "house" / "attachments"
        attachment_dir.mkdir(parents=True, exist_ok=True)
        attachment_path = attachment_dir / "上海市新建住宅质量保证书（2020年版）.doc"
        shutil.copy2(original_doc, attachment_path)
        attachment_url = f"/manuals/house/attachments/{attachment_path.name}"

    device_root = source / "设备"
    for source_pdf in sorted(device_root.glob("*/*/pdf/*.pdf")):
        relative = source_pdf.relative_to(device_root)
        zone, folder_name = relative.parts[0], relative.parts[1]
        if folder_name in EXACT_DUPLICATE_DEVICE_FOLDERS:
            continue
        meta = DEVICE_META.get(folder_name)
        if not meta:
            continue
        base_id, device_name, model, summary = meta
        document_id = base_id
        if folder_name == "欧普浴霸" and source_pdf.name.startswith("浴霸说明书"):
            document_id = f"{base_id}-supplement"
        cover = source_pdf.parents[1] / "img" / "cover.png"
        keywords = [zone, folder_name, device_name, model, *re.findall(r"[A-Za-z]+\d+[A-Za-z0-9-]*", source_pdf.name)]
        document = {
            "id": document_id,
            "kind": "equipment",
            "zone": zone,
            "deviceName": device_name,
            "title": source_pdf.stem,
            "model": model,
            "summary": summary,
            "keywords": list(dict.fromkeys(keyword for keyword in keywords if keyword)),
        }
        documents.append(copy_and_index(source_pdf, document, public_root, search_pages, cover))

    payload = {
        "sourceSummary": {
            "housePdfCount": sum(1 for item in documents if item["kind"] == "house"),
            "equipmentPdfCount": sum(1 for item in documents if item["kind"] == "equipment"),
            "equipmentDeviceCount": len({item["deviceName"] for item in documents if item["kind"] == "equipment"}),
            "equipmentZones": ["厨电", "卫浴", "暖通", "其他"],
            "houseOriginalAttachmentUrl": attachment_url,
            "note": "源目录包含3份房屋PDF和1份同名质量保证书DOC原文件；完全相同的RB282805重复PDF仅保留组合冰箱记录。",
        },
        "documents": documents,
    }

    data_dir = project / "src" / "data"
    data_dir.mkdir(parents=True, exist_ok=True)
    (data_dir / "manual-documents.json").write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
    (data_dir / "manual-search-index.json").write_text(json.dumps(search_pages, ensure_ascii=False), encoding="utf-8")

    print(json.dumps({
        "housePdfCount": payload["sourceSummary"]["housePdfCount"],
        "equipmentPdfCount": payload["sourceSummary"]["equipmentPdfCount"],
        "equipmentDeviceCount": payload["sourceSummary"]["equipmentDeviceCount"],
        "searchPages": len(search_pages),
        "searchablePages": sum(1 for page in search_pages if page["text"]),
        "documents": [{"id": item["id"], "pages": item["pageCount"], "searchable": item["searchablePageCount"]} for item in documents],
    }, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
