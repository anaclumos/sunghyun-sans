import unittest

from tests.fixtures import TempDir, make_fonts, package_files_under, run_build, snapshot


class MissingLicenseWritesNothing(unittest.TestCase):
    def setUp(self):
        self.tmp = TempDir()
        self.addCleanup(self.tmp.cleanup)
        make_fonts(self.tmp.path / "fonts", {"SunghyunSans": ["Regular"], "SunghyunSansKR": ["Bold"]})
        self.missing = self.tmp.path / "no-such-LICENSE"

    def build(self, out):
        return run_build(
            "1.2.0",
            "--fonts", str(self.tmp.path / "fonts"),
            "--license", str(self.missing),
            "--out", str(out),
        )

    def test_existing_output_directory_is_left_as_it_was(self):
        out = self.tmp.path / "release"
        out.mkdir()
        (out / "keep-me.zip").write_bytes(b"PK\x05\x06" + b"\0" * 18)
        before = snapshot(out)
        result = self.build(out)
        self.assertNotEqual(result.returncode, 0)
        self.assertTrue((result.stdout + result.stderr).strip())
        self.assertEqual(snapshot(out), before)

    def test_no_package_is_written_into_a_new_output_directory(self):
        result = self.build(self.tmp.path / "release")
        self.assertNotEqual(result.returncode, 0)
        self.assertTrue((result.stdout + result.stderr).strip())
        self.assertEqual(package_files_under(self.tmp.path), [])


if __name__ == "__main__":
    unittest.main()
