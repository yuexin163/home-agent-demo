"""Safely extract a reviewed set of product images from the source XLSX.

The script reads the XLSX as a ZIP archive, resolves WPS DISPIMG IDs through
xl/cellimages.xml, and writes only the explicitly allow-listed images below.
It never modifies or fully extracts the source workbook.
"""

from __future__ import annotations

import argparse
import io
import pathlib
import re
import zipfile
import xml.etree.ElementTree as ET

from PIL import Image, ImageOps


REL_NS = "{http://schemas.openxmlformats.org/officeDocument/2006/relationships}"
PACKAGE_REL_NS = "{http://schemas.openxmlformats.org/package/2006/relationships}"
XDR_NS = "{http://schemas.openxmlformats.org/drawingml/2006/spreadsheetDrawing}"
DRAWING_NS = "{http://schemas.openxmlformats.org/drawingml/2006/main}"

SELECTIONS = (
    ("ID_1DBB0514FAD74828A4A1D37D94A690AF", "floor-amber-oak.jpg"),
    ("ID_04C3342B9E4E46EBAA5F0BD009751E1E", "floor-begonia-oak.jpg"),
    ("ID_F9B0309C99F14348A71AF83100B1139A", "appliance-dishwasher.jpg"),
    ("ID_B0BC5A5900864DBF904EE18969C236B2", "appliance-steam-oven.jpg"),
    ("ID_2B43BA2A2EBC444CBF08D809EB09C6BB", "bathroom-smart-toilet.jpg"),
    ("ID_442BC8963F664C38ABDC559B6448FCD1", "bathroom-vanity.jpg"),
    ("ID_E2129206457342649F49CC987A9DFB6C", "appliance-range-hood.jpg"),
    ("ID_76BEE0E3032043E99FAFA6F6FE35525D", "appliance-gas-hob.jpg"),
    ("ID_0A5B4CC22EDC4519B79AC3769CE8D18D", "appliance-water-heater.jpg"),
    ("ID_E4A691A1E27841D786F6FF9BC59436D5", "appliance-water-purifier.jpg"),
    ("ID_32E0568B838C40CEB0B092BB7D0E5A8F", "bathroom-wall-hung-toilet.png"),
    ("ID_96AE26965F804A0EB29FB9053F6D4E6E", "bathroom-concealed-cistern.jpg"),
    ("ID_91A127945D9946E0AE97C1A1E8366E91", "floor-almond-oak.jpg"),
    ("ID_DF45FB41381346ADB0BBAF60AC2CF7C6", "floor-tea-realm.jpg"),
    ("ID_1AED00BB5FB44BE7A390595791CF45E0", "appliance-range-hood-compact.jpg"),
    ("ID_CCBF268BD5CB4670B33ED8DC01ED7431", "appliance-dishwasher-sink.jpg"),
    ("ID_49ED566F9B9D44D4A608C7403C4645AA", "appliance-dishwasher-integrated.jpg"),
    ("ID_AD80561061024BFBA1C7D0675FD65CF6", "appliance-range-hood-z7.jpg"),
    ("ID_0F5699D447BD4729B923B349076E22E6", "appliance-gas-hob-td7b.jpg"),
    ("ID_0ED0ED43E500440C898C627990C25D9B", "bathroom-smart-toilet-jzt300.jpg"),
    ("ID_E22D01D6D0074FDAAFC870658A62FFEC", "bathroom-vanity-almond.jpg"),
    ("ID_5B408C00F0A548228D44B39C795C8C6C", "bathroom-vanity-gray.jpg"),
    ("ID_793951FBF6B64B8CA6AB0199025E94F9", "hardware-kitchen-sink.jpg"),
    ("ID_35A0D2B416A3484C8D43C2B22EFEC0FC", "hardware-bathroom-shower.jpg"),
    ("ID_4AE3F5756B6540F091BBD1624124D3A5", "hardware-bathroom-set.jpg"),
    ("ID_318D011D02CE4B33821CDE487DF7D91F", "soft-sofa-chaise.jpg"),
    ("ID_64CC3A59FD2448F781FBC08A5DADDD43", "soft-table-set-25807.jpg"),
    ("ID_B55D2F25284C44339A4751051FAA6229", "soft-table-set-2373.jpg"),
    ("ID_067343D453C0421D97C865C4334142BA", "cabinet-tv-01.jpg"),
    ("ID_054DC5E14CE442AA820B61A3FDF4F5E9", "cabinet-sideboard-01.jpg"),
)


def write_optimized_image(data: bytes, destination: pathlib.Path) -> None:
    with Image.open(io.BytesIO(data)) as source:
        image = ImageOps.exif_transpose(source)
        image.thumbnail((1600, 1600), Image.Resampling.LANCZOS)
        if image.mode in {"RGBA", "LA"}:
            background = Image.new("RGB", image.size, "white")
            background.paste(image, mask=image.getchannel("A"))
            image = background
        elif image.mode != "RGB":
            image = image.convert("RGB")
        image.save(destination, format="JPEG", quality=86, optimize=True)


def build_image_map(archive: zipfile.ZipFile) -> dict[str, str]:
    relationships = ET.fromstring(archive.read("xl/_rels/cellimages.xml.rels"))
    relationship_targets = {
        element.attrib["Id"]: "xl/" + element.attrib["Target"]
        for element in relationships.findall(f"{PACKAGE_REL_NS}Relationship")
    }

    cell_images = ET.fromstring(archive.read("xl/cellimages.xml"))
    image_map: dict[str, str] = {}
    for picture in cell_images.findall(f".//{XDR_NS}pic"):
        properties = picture.find(f".//{XDR_NS}cNvPr")
        blip = picture.find(f".//{DRAWING_NS}blip")
        if properties is None or blip is None:
            continue
        relationship_id = blip.attrib.get(f"{REL_NS}embed")
        image_id = properties.attrib.get("name")
        if image_id and relationship_id in relationship_targets:
            image_map[image_id] = relationship_targets[relationship_id]
    return image_map


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("workbook", type=pathlib.Path)
    parser.add_argument("output", type=pathlib.Path)
    args = parser.parse_args()

    if len(SELECTIONS) > 30:
        raise RuntimeError("Safety limit exceeded: no more than 30 reviewed images per run")
    if args.workbook.suffix.lower() != ".xlsx":
        raise ValueError("Expected an .xlsx source workbook")

    args.output.mkdir(parents=True, exist_ok=True)
    with zipfile.ZipFile(args.workbook) as archive:
        image_map = build_image_map(archive)
        for image_id, output_name in SELECTIONS:
            if not re.fullmatch(r"[a-z0-9-]+\.(?:jpg|png)", output_name):
                raise ValueError(f"Unsafe output name: {output_name}")
            archive_path = image_map.get(image_id)
            if not archive_path or not archive_path.startswith("xl/media/"):
                raise KeyError(f"Image mapping not found: {image_id}")
            destination = args.output / output_name
            if destination.exists():
                print(f"{output_name}\tskipped existing")
                continue
            write_optimized_image(archive.read(archive_path), destination)
            print(f"{output_name}\t{archive_path}\t{destination.stat().st_size} bytes")


if __name__ == "__main__":
    main()
