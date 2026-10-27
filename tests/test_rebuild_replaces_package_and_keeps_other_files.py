import unittest

from tests.fixtures import (
    TempDir,
    listing,
    make_fonts,
    make_license,
    package_names,
    read_arch,
    read_deb,
    read_rpm,
    run_build,
)


class RebuildIntoExistingRelease(unittest.TestCase):
    def setUp(self):
        self.tmp = TempDir()
        self.addCleanup(self.tmp.cleanup)
        make_fonts(self.tmp.path / "fonts", {"SunghyunSans": ["Regular", "Bold"]})
        self.license_path = self.tmp.path / "LICENSE"
        make_license(self.license_path)
        self.out = self.tmp.path / "build" / "release"
        self.names = package_names("sunghyun-sans")

    def build(self, version):
        return run_build(
            version,
            "--fonts", str(self.tmp.path / "fonts"),
            "--license", str(self.license_path),
            "--out", str(self.out),
        )

    def test_second_build_replaces_packages_and_keeps_other_files(self):
        first = self.build("1.0.0")
        self.assertEqual(first.returncode, 0, first.stderr)
        self.assertEqual(listing(self.out), set(self.names.values()))

        kept = {"keep-me.zip": b"PK\x05\x06" + b"\0" * 18, "notes.txt": b"release notes\n"}
        for name, content in kept.items():
            (self.out / name).write_bytes(content)

        second = self.build("1.2.0")
        self.assertEqual(second.returncode, 0, second.stderr)
        self.assertEqual(listing(self.out), set(self.names.values()) | set(kept))
        for name, content in kept.items():
            self.assertEqual((self.out / name).read_bytes(), content, name)

        deb = read_deb(self.out / self.names["deb"])
        rpm = read_rpm(self.out / self.names["rpm"])
        arch = read_arch(self.out / self.names["arch"])
        self.assertEqual(
            {
                "deb": deb["control"].get("Version"),
                "rpm": f"{rpm['version']}-{rpm['release']}",
                "arch": arch["info"].get("pkgver", [None])[0],
            },
            {"deb": "1.2.0-1", "rpm": "1.2.0-1", "arch": "1.2.0-1"},
        )


if __name__ == "__main__":
    unittest.main()
