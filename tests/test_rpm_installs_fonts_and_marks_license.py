import unittest

from tests.fixtures import (
    RPMFILE_LICENSE,
    TempDir,
    make_fonts,
    make_license,
    read_rpm,
    run_build,
)

FONT_DIR = "/usr/share/fonts/sunghyun-sans-disambiguated/"
LICENSE = "/usr/share/licenses/sunghyun-sans-disambiguated-fonts/LICENSE"


class RpmPackageLayout(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.tmp = TempDir()
        cls.fonts = make_fonts(
            cls.tmp.path / "fonts", {"SunghyunSansDisambiguated": ["Regular", "Medium"]}
        )
        license_path = cls.tmp.path / "LICENSE"
        cls.license = make_license(license_path)
        out = cls.tmp.path / "out"
        cls.result = run_build(
            "1.2.0",
            "--fonts", str(cls.tmp.path / "fonts"),
            "--license", str(license_path),
            "--out", str(out),
        )
        rpm = out / "sunghyun-sans-disambiguated-fonts.noarch.rpm"
        cls.rpm = read_rpm(rpm) if rpm.exists() else None

    @classmethod
    def tearDownClass(cls):
        cls.tmp.cleanup()

    def setUp(self):
        self.assertEqual(self.result.returncode, 0, self.result.stderr)
        self.assertIsNotNone(self.rpm, "the .noarch.rpm was not written")

    def test_header_names_package_version_release_arch_and_license(self):
        self.assertEqual(self.rpm["name"], "sunghyun-sans-disambiguated-fonts")
        self.assertEqual(self.rpm["version"], "1.2.0")
        self.assertEqual(self.rpm["release"], "1")
        self.assertEqual(self.rpm["arch"], "noarch")
        self.assertEqual(self.rpm["license"], "OFL-1.1")

    def test_installs_family_fonts_and_license_only(self):
        expected = {FONT_DIR + name: content for name, content in self.fonts.items()}
        expected[LICENSE] = self.license
        self.assertEqual(self.rpm["files"], expected)

    def test_license_is_marked_as_license_file(self):
        flags = self.rpm["file_flags"]
        self.assertTrue(flags.get(LICENSE, 0) & RPMFILE_LICENSE)
        for name in self.fonts:
            self.assertFalse(flags.get(FONT_DIR + name, 0) & RPMFILE_LICENSE, name)


if __name__ == "__main__":
    unittest.main()
