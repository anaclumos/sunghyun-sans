#!/usr/bin/env python3
"""Fix font metadata for Google Fonts compliance.

Updates copyright, license, licenseURL and removes trademark
in all .glyphspackage/fontinfo.plist sources.

Uses regex-based editing on the Glyphs text plist format since
glyphsLib cannot save back to .glyphspackage directories.
"""

import glob
import re
import sys

# Target metadata
COPYRIGHT = "Copyright 2026 The Sunghyun Sans Project Authors (https://github.com/anaclumos/sunghyun-sans)"
LICENSE = "This Font Software is licensed under the SIL Open Font License, Version 1.1. This license is available with a FAQ at: https://openfontlicense.org"
LICENSE_URL = "https://openfontlicense.org"

plist_files = sorted(glob.glob("sources/*.glyphspackage/fontinfo.plist"))
if not plist_files:
    print("ERROR: No fontinfo.plist files found in sources/", file=sys.stderr)
    sys.exit(1)

print(f"Found {len(plist_files)} fontinfo.plist file(s):")
for f in plist_files:
    print(f"  {f}")
print()


def update_simple_value(content: str, key: str, new_value: str):
    """Update a simple key = value; property entry."""
    pattern = re.compile(
        r'(key = ' + re.escape(key) + r';\s*\n\s*value = )"[^"]*"(;)',
        re.MULTILINE,
    )
    new_content = pattern.sub(
        r'\g<1>"' + new_value.replace('\\', '\\\\') + r'"\g<2>',
        content,
    )
    count = len(pattern.findall(content))
    return new_content, count


def update_localized_value(content: str, key: str, new_value: str):
    """Update a localized key with values = (...) containing language/value pairs."""
    pattern = re.compile(
        r'(key = ' + re.escape(key) + r';\s*\nvalues = \(\s*\n\{\s*\nlanguage = dflt;\s*\nvalue = )"[^"]*"(;)',
        re.MULTILINE,
    )
    new_content = pattern.sub(
        r'\g<1>"' + new_value.replace('\\', '\\\\') + r'"\g<2>',
        content,
    )
    count = len(pattern.findall(content))
    return new_content, count


def remove_trademark_block(content: str):
    """Remove the trademarks property dict from the properties array.

    Matches the pattern:
      ,\\n{\\nkey = trademarks;\\nvalues = (\\n{\\nlanguage = dflt;\\nvalue = "...";\\n}\\n);\\n}
    """
    pattern = re.compile(
        r',\n\{\nkey = trademarks;\nvalues = \(\n\{\nlanguage = dflt;\nvalue = "[^"]*";\n\}\n\);\n\}',
    )
    matches = pattern.findall(content)
    new_content = pattern.sub('', content, count=1)
    return new_content, len(matches)


for plist_file in plist_files:
    print(f"Processing: {plist_file}")

    with open(plist_file, 'r', encoding='utf-8') as f:
        content = f.read()

    original = content

    content, n = update_localized_value(content, 'copyrights', COPYRIGHT)
    if n:
        print(f"  copyrights: updated ({n} occurrence(s))")
    else:
        content, n = update_simple_value(content, 'copyrights', COPYRIGHT)
        if n:
            print(f"  copyrights: updated simple format ({n})")
        else:
            print(f"  copyrights: NOT FOUND - manual check needed!")

    content, n = update_localized_value(content, 'licenses', LICENSE)
    if n:
        print(f"  licenses: updated ({n} occurrence(s))")
    else:
        content, n = update_simple_value(content, 'licenses', LICENSE)
        if n:
            print(f"  licenses: updated simple format ({n})")
        else:
            print(f"  licenses: NOT FOUND - manual check needed!")

    content, n = update_simple_value(content, 'licenseURL', LICENSE_URL)
    if n:
        print(f"  licenseURL: updated ({n} occurrence(s))")
    else:
        print(f"  licenseURL: NOT FOUND - manual check needed!")

    content, n = remove_trademark_block(content)
    if n:
        print(f"  trademarks: REMOVED ({n} block(s))")
    else:
        print(f"  trademarks: not present (OK)")

    if content != original:
        with open(plist_file, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"  Saved!")
    else:
        print(f"  No changes needed.")

    print()

print("Done! All fontinfo.plist files updated.")
