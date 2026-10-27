import unittest

from tests.fixtures import (
    TempDir,
    make_fonts,
    make_license,
    package_names,
    read_arch,
    read_deb,
    read_rpm,
    run_build,
)


class VersionReachesEveryPackage(unittest.TestCase):
    def build(self, *version_args, env_version=None):
        tmp = TempDir()
        self.addCleanup(tmp.cleanup)
        make_fonts(tmp.path / "fonts", {"SunghyunSans": ["Regular"]})
        license_path = tmp.path / "LICENSE"
        make_license(license_path)
        out = tmp.path / "out"
        result = run_build(
            *version_args,
            "--fonts", str(tmp.path / "fonts"),
            "--license", str(license_path),
            "--out", str(out),
            env_version=env_version,
        )
        self.assertEqual(result.returncode, 0, result.stderr)
        names = package_names("sunghyun-sans")
        deb = read_deb(out / names["deb"])
        rpm = read_rpm(out / names["rpm"])
        arch = read_arch(out / names["arch"])
        return {
            "deb": deb["control"].get("Version"),
            "rpm": f"{rpm['version']}-{rpm['release']}",
            "arch": arch["info"].get("pkgver", [None])[0],
        }

    def assertVersion(self, versions, expected):
        self.assertEqual(versions, {"deb": expected, "rpm": expected, "arch": expected})

    def test_leading_v_in_argument_is_dropped(self):
        self.assertVersion(self.build("v1.2.0"), "1.2.0-1")

    def test_environment_supplies_omitted_version(self):
        self.assertVersion(self.build(env_version="2.3.4"), "2.3.4-1")

    def test_leading_v_in_environment_is_dropped(self):
        self.assertVersion(self.build(env_version="v3.0.1"), "3.0.1-1")

    def test_argument_wins_over_environment(self):
        self.assertVersion(self.build("1.2.0", env_version="9.9.9"), "1.2.0-1")


if __name__ == "__main__":
    unittest.main()
