import unittest

from tests.fixtures import TempDir, make_fonts, make_license, read_deb, run_build

FONT_DIR = "/usr/share/fonts/opentype/sunghyun-sans-jp/"
COPYRIGHT = "/usr/share/doc/fonts-sunghyun-sans-jp/copyright"


class DebianPackageLayout(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.tmp = TempDir()
        cls.fonts = make_fonts(
            cls.tmp.path / "fonts", {"SunghyunSansJP": ["Regular", "Bold", "Light"]}
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
        deb = out / "fonts-sunghyun-sans-jp_all.deb"
        cls.deb = read_deb(deb) if deb.exists() else None

    @classmethod
    def tearDownClass(cls):
        cls.tmp.cleanup()

    def setUp(self):
        self.assertEqual(self.result.returncode, 0, self.result.stderr)
        self.assertIsNotNone(self.deb, "fonts-sunghyun-sans-jp_all.deb was not written")

    def test_control_names_package_version_and_architecture(self):
        control = self.deb["control"]
        self.assertEqual(control.get("Package"), "fonts-sunghyun-sans-jp")
        self.assertEqual(control.get("Version"), "1.2.0-1")
        self.assertEqual(control.get("Architecture"), "all")

    def test_installs_family_fonts_and_copyright_only(self):
        expected = {FONT_DIR + name: content for name, content in self.fonts.items()}
        self.assertEqual(set(self.deb["files"]), set(expected) | {COPYRIGHT})
        for path, content in expected.items():
            self.assertEqual(self.deb["files"][path], content)
        copyright_lines = [line.strip() for line in self.deb["files"][COPYRIGHT].decode().splitlines()]
        for line in self.license.decode().splitlines():
            if line.strip():
                self.assertIn(line.strip(), copyright_lines)

    def test_declares_ofl_license(self):
        control_values = [value.strip() for value in self.deb["control"].values()]
        copyright_lines = [
            line.strip() for line in self.deb["files"].get(COPYRIGHT, b"").decode().splitlines()
        ]
        self.assertTrue(
            "OFL-1.1" in control_values or "License: OFL-1.1" in copyright_lines,
            f"no OFL-1.1 declaration in control {self.deb['control']}",
        )


if __name__ == "__main__":
    unittest.main()
