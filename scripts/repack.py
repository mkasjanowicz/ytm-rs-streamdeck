#!/usr/bin/env python3
"""Rewrite a .streamDeckPlugin so Windows can read it.

`streamdeck pack` marks the zip as made by Unix. Stream Deck on Windows
then skips the files, fails to read manifest.json, and reports that the
plugin requires Stream Deck 0.0.
"""

import sys
import zipfile
from pathlib import Path


def main() -> None:
    path = Path(sys.argv[1])
    src = zipfile.ZipFile(path)
    tmp = path.with_suffix(path.suffix + ".tmp")
    with zipfile.ZipFile(tmp, "w") as out:
        for info in src.infolist():
            data = src.read(info)
            new = zipfile.ZipInfo(filename=info.filename.replace("\\", "/"), date_time=(2026, 11, 11, 12, 0, 0))
            new.compress_type = zipfile.ZIP_DEFLATED
            new.create_system = 0
            # 0 is rewritten by Python to a Unix mode. 0x20 is the DOS archive bit.
            new.external_attr = 0x20
            new.flag_bits = 0
            out.writestr(new, data)
    src.close()
    tmp.replace(path)


if __name__ == "__main__":
    main()
