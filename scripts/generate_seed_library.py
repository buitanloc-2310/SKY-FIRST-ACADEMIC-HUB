"""Build a production import manifest from REAL PDF files and metadata.

This script intentionally does not generate demo/mock learning content.

Expected structure:
  seed-library/
    metadata.csv
    pdfs/
      <real files>.pdf

Required CSV columns: code,title,filename
Optional columns are copied into manifest when present.
"""
from __future__ import annotations

from pathlib import Path
from datetime import datetime, timezone
import csv
import hashlib
import json
import re
import uuid

ROOT = Path(__file__).resolve().parents[1]
SEED = ROOT / "seed-library"
PDF_DIR = SEED / "pdfs"
CSV_PATH = SEED / "metadata.csv"
MANIFEST_PATH = SEED / "manifest.json"
INSTANCE = "bc5bc5f5-b089-4102-a812-3b2666a802af"

REQUIRED = {"code", "title", "filename"}
OPTIONAL = [
    "slug", "summary", "document_type", "library_scope", "unit_id", "field_id",
    "category_id", "authors", "keywords", "language", "publication_year",
    "access_mode", "version_label", "status"
]


def slugify(value: str) -> str:
    value = value.strip().lower()
    value = re.sub(r"[^a-z0-9à-ỹđ]+", "-", value, flags=re.IGNORECASE)
    return value.strip("-")[:140]


def sha256(path: Path) -> str:
    h = hashlib.sha256()
    with path.open("rb") as f:
        for chunk in iter(lambda: f.read(1024 * 1024), b""):
            h.update(chunk)
    return h.hexdigest()


def main() -> None:
    if not CSV_PATH.exists():
        raise SystemExit(
            "Không tìm thấy seed-library/metadata.csv. "
            "Academic Hub 1.1 không tự sinh mock data; hãy cung cấp metadata của tài liệu thật."
        )
    if not PDF_DIR.exists():
        raise SystemExit("Không tìm thấy seed-library/pdfs/.")

    with CSV_PATH.open("r", encoding="utf-8-sig", newline="") as f:
        reader = csv.DictReader(f)
        headers = set(reader.fieldnames or [])
        missing = REQUIRED - headers
        if missing:
            raise SystemExit(f"metadata.csv thiếu cột bắt buộc: {', '.join(sorted(missing))}")
        rows = list(reader)

    docs = []
    seen_codes = set()
    seen_files = set()

    for i, row in enumerate(rows, 1):
        code = (row.get("code") or "").strip()
        title = (row.get("title") or "").strip()
        filename = (row.get("filename") or "").strip()
        if not code or not title or not filename:
            raise SystemExit(f"Dòng {i+1}: code/title/filename không được để trống.")
        if code.casefold() in seen_codes:
            raise SystemExit(f"Mã tài liệu trùng: {code}")
        if filename.casefold() in seen_files:
            raise SystemExit(f"Tên file trùng: {filename}")
        if Path(filename).name != filename:
            raise SystemExit(f"filename chỉ được chứa tên file thuần: {filename}")
        if not filename.lower().endswith(".pdf"):
            raise SystemExit(f"Chỉ chấp nhận PDF: {filename}")

        pdf = PDF_DIR / filename
        if not pdf.exists():
            raise SystemExit(f"Không tìm thấy PDF: {filename}")

        seen_codes.add(code.casefold())
        seen_files.add(filename.casefold())

        item = {
            "id": "doc_" + uuid.uuid5(uuid.NAMESPACE_URL, f"{INSTANCE}:{code}").hex,
            "code": code,
            "slug": (row.get("slug") or "").strip() or slugify(f"{code}-{title}"),
            "title": title,
            "filename": filename,
            "relative_path": f"pdfs/{filename}",
            "sha256": sha256(pdf),
            "file_size": pdf.stat().st_size,
            "instance_id": INSTANCE,
        }

        defaults = {
            "document_type": "Tài liệu học thuật",
            "library_scope": "sfn",
            "language": "vi",
            "access_mode": "view_download",
            "version_label": "1.0",
            "status": "draft",
        }
        for key in OPTIONAL:
            value = (row.get(key) or "").strip()
            if value:
                item[key] = int(value) if key == "publication_year" and value.isdigit() else value
            elif key in defaults:
                item[key] = defaults[key]

        docs.append(item)

    manifest = {
        "instance_id": INSTANCE,
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "count": len(docs),
        "documents": docs,
    }
    SEED.mkdir(parents=True, exist_ok=True)
    MANIFEST_PATH.write_text(json.dumps(manifest, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"Đã tạo manifest cho {len(docs)} tài liệu thật: {MANIFEST_PATH}")


if __name__ == "__main__":
    main()
