import unittest

from tests.fixtures import (
    TempDir,
    make_fonts,
    make_license,
    package_files_under,
    run_build,
    snapshot,
)

CASES = {
    "two-part version": (["1.2"], None),
    "word instead of version": (["latest"], None),
    "four-part version": (["1.2.0.1"], None),
    "no version anywhere": ([], None),
    "two-part version from environment": ([], "1.2"),
}


class BadVersionWritesNothing(unittest.TestCase):
    def test_each_bad_version_fails_and_leaves_output_untouched(self):
        for label, (args, env_version) in CASES.items():
            with self.subTest(label):
                tmp = TempDir()
                self.addCleanup(tmp.cleanup)
                make_fonts(tmp.path / "fonts", {"SunghyunSans": ["Regular", "Bold"]})
                license_path = tmp.path / "LICENSE"
                make_license(license_path)
                out = tmp.path / "out"
                out.mkdir()
                (out / "notes.txt").write_text("keep me\n")
                before = snapshot(out)
                result = run_build(
                    *args,
                    "--fonts", str(tmp.path / "fonts"),
                    "--license", str(license_path),
                    "--out", str(out),
                    env_version=env_version,
                )
                self.assertNotEqual(result.returncode, 0)
                self.assertTrue((result.stdout + result.stderr).strip())
                self.assertEqual(snapshot(out), before)
                self.assertEqual(package_files_under(tmp.path), [])


if __name__ == "__main__":
    unittest.main()
