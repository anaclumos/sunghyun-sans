import unittest
from pathlib import PurePosixPath

from tests.fixtures import (
    TempDir,
    make_fonts,
    make_license,
    otf_files,
    package_names,
    read_arch,
    read_deb,
    read_rpm,
    run_build,
)

FAMILIES = {
    "SunghyunSans": ("sunghyun-sans", ["Regular", "Bold"]),
    "SunghyunSansKR": ("sunghyun-sans-kr", ["Regular", "Black"]),
    "SunghyunSansKRHanja": ("sunghyun-sans-kr-hanja", ["Regular", "Thin"]),
}


def by_basename(files):
    return {PurePosixPath(name).name: content for name, content in otf_files(files).items()}


class PrefixFamiliesStaySeparate(unittest.TestCase):
    def setUp(self):
        self.tmp = TempDir()
        self.addCleanup(self.tmp.cleanup)
        self.fonts = make_fonts(
            self.tmp.path / "fonts",
            {family: styles for family, (_, styles) in FAMILIES.items()},
        )
        license_path = self.tmp.path / "LICENSE"
        make_license(license_path)
        self.out = self.tmp.path / "out"
        self.result = run_build(
            "1.2.0",
            "--fonts", str(self.tmp.path / "fonts"),
            "--license", str(license_path),
            "--out", str(self.out),
        )

    def expected(self, family):
        return {
            name: content
            for name, content in self.fonts.items()
            if name.rsplit("-", 1)[0] == family
        }

    def test_each_family_package_carries_only_its_own_fonts(self):
        self.assertEqual(self.result.returncode, 0, self.result.stderr)
        readers = {"deb": read_deb, "rpm": read_rpm, "arch": read_arch}
        for family, (slug, _) in FAMILIES.items():
            for kind, file_name in package_names(slug).items():
                with self.subTest(family=family, kind=kind):
                    package = readers[kind](self.out / file_name)
                    self.assertEqual(by_basename(package["files"]), self.expected(family))


if __name__ == "__main__":
    unittest.main()
