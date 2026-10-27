import unittest

from tests.fixtures import TempDir, make_license, package_files_under, run_build, snapshot


def empty(path):
    path.mkdir()


def only_other_formats(path):
    path.mkdir()
    (path / "SunghyunSans-Regular.ttf").write_bytes(b"\0\1\0\0 fake ttf")
    (path / "SunghyunSans-Bold.woff2").write_bytes(b"wOF2 fake woff2")
    (path / "README.txt").write_text("fonts go here\n")


def missing(path):
    pass


CASES = {
    "empty directory": empty,
    "only TTF, WOFF2, and text files": only_other_formats,
    "directory that does not exist": missing,
}


class FontsDirWithoutFamilyOtf(unittest.TestCase):
    def test_build_fails_and_writes_no_package(self):
        for label, prepare in CASES.items():
            with self.subTest(label):
                tmp = TempDir()
                self.addCleanup(tmp.cleanup)
                fonts = tmp.path / "fonts"
                prepare(fonts)
                license_path = tmp.path / "LICENSE"
                make_license(license_path)
                out = tmp.path / "out"
                out.mkdir()
                (out / "notes.txt").write_text("keep me\n")
                before = snapshot(out)
                result = run_build(
                    "1.2.0",
                    "--fonts", str(fonts),
                    "--license", str(license_path),
                    "--out", str(out),
                )
                self.assertNotEqual(result.returncode, 0)
                self.assertTrue((result.stdout + result.stderr).strip())
                self.assertEqual(snapshot(out), before)
                self.assertEqual(package_files_under(tmp.path), [])


if __name__ == "__main__":
    unittest.main()
