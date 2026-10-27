import hashlib
import unittest
from pathlib import PurePosixPath

from tests.fixtures import (
    REAL_FONTS,
    REAL_LICENSE,
    TempDir,
    listing,
    otf_files,
    package_names,
    read_arch,
    read_deb,
    read_rpm,
    run_build,
)

SLUGS = {
    "SunghyunSans": "sunghyun-sans",
    "SunghyunSansKR": "sunghyun-sans-kr",
    "SunghyunSansKRHanja": "sunghyun-sans-kr-hanja",
    "SunghyunSansJP": "sunghyun-sans-jp",
    "SunghyunSansDisambiguated": "sunghyun-sans-disambiguated",
}


def digests(files):
    return {
        PurePosixPath(name).name: hashlib.sha256(content).hexdigest()
        for name, content in otf_files(files).items()
    }


def license_path(kind, slug):
    return {
        "deb": f"/usr/share/doc/fonts-{slug}/copyright",
        "rpm": f"/usr/share/licenses/{slug}-fonts/LICENSE",
        "arch": f"/usr/share/licenses/otf-{slug}/LICENSE",
    }[kind]


class DefaultBuildOfRealFonts(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.tmp = TempDir()
        cls.out = cls.tmp.path / "release"
        cls.result = run_build("1.2.0", "--out", str(cls.out))

    @classmethod
    def tearDownClass(cls):
        cls.tmp.cleanup()

    def setUp(self):
        self.assertEqual(self.result.returncode, 0, self.result.stderr)

    def expected_digests(self, family):
        return {
            path.name: hashlib.sha256(path.read_bytes()).hexdigest()
            for path in REAL_FONTS.glob("*.otf")
            if path.stem.rsplit("-", 1)[0] == family
        }

    def test_real_font_directory_holds_the_five_families(self):
        families = {path.stem.rsplit("-", 1)[0] for path in REAL_FONTS.glob("*.otf")}
        self.assertEqual(families, set(SLUGS))

    def test_writes_three_packages_per_family(self):
        expected = set()
        for slug in SLUGS.values():
            expected |= set(package_names(slug).values())
        self.assertEqual(listing(self.out), expected)

    def test_each_package_carries_its_family_fonts_and_the_license(self):
        readers = {"deb": read_deb, "rpm": read_rpm, "arch": read_arch}
        license_text = REAL_LICENSE.read_bytes()
        for family, slug in SLUGS.items():
            expected = self.expected_digests(family)
            for kind, file_name in package_names(slug).items():
                with self.subTest(family=family, kind=kind):
                    files = readers[kind](self.out / file_name)["files"]
                    self.assertEqual(digests(files), expected)
                    carried = files.get(license_path(kind, slug))
                    if kind == "deb":
                        carried_lines = [line.strip() for line in carried.decode().splitlines()]
                        self.assertIn("License: OFL-1.1", carried_lines)
                        for line in license_text.decode().splitlines():
                            if line.strip():
                                self.assertIn(line.strip(), carried_lines)
                    else:
                        self.assertEqual(carried, license_text)


if __name__ == "__main__":
    unittest.main()
