import unittest

from tests.fixtures import TempDir, make_fonts, make_license, read_arch, run_build

FONT_DIR = "/usr/share/fonts/OTF/"
LICENSE = "/usr/share/licenses/otf-sunghyun-sans-kr-hanja/LICENSE"


class ArchPackageLayout(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.tmp = TempDir()
        cls.fonts = make_fonts(
            cls.tmp.path / "fonts", {"SunghyunSansKRHanja": ["Regular", "Bold"]}
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
        package = out / "otf-sunghyun-sans-kr-hanja-any.pkg.tar.zst"
        cls.package = read_arch(package) if package.exists() else None

    @classmethod
    def tearDownClass(cls):
        cls.tmp.cleanup()

    def setUp(self):
        self.assertEqual(self.result.returncode, 0, self.result.stderr)
        self.assertIsNotNone(self.package, "the Arch package was not written")

    def test_pkginfo_names_package_version_arch_and_license(self):
        info = self.package["info"]
        self.assertEqual(info.get("pkgname"), ["otf-sunghyun-sans-kr-hanja"])
        self.assertEqual(info.get("pkgver"), ["1.2.0-1"])
        self.assertEqual(info.get("arch"), ["any"])
        self.assertEqual(info.get("license"), ["OFL-1.1"])

    def test_installs_family_fonts_and_license_only(self):
        expected = {FONT_DIR + name: content for name, content in self.fonts.items()}
        expected[LICENSE] = self.license
        self.assertEqual(self.package["files"], expected)


if __name__ == "__main__":
    unittest.main()
