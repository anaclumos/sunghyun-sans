{
  description = "Sunghyun Sans — An open-source alternative to SF Pro Rounded";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixpkgs-unstable";
  };

  outputs =
    { self, nixpkgs }:
    let
      systems = [
        "x86_64-linux"
        "aarch64-linux"
        "x86_64-darwin"
        "aarch64-darwin"
      ];
      forAllSystems = f: nixpkgs.lib.genAttrs systems (system: f { pkgs = nixpkgs.legacyPackages.${system}; });
      # Track the GitHub release tag (font internal version is separate, e.g. 1.309).
      version = "1.1.0";

      mkFontPackage =
        {
          pkgs,
          pname,
          filePrefix,
          description,
        }:
        pkgs.stdenvNoCC.mkDerivation {
          inherit pname version;

          # Only the desktop font tree — keeps installFonts away from dist/web subsets.
          src = self + "/fonts";

          nativeBuildInputs = [ pkgs.installFonts ];

          # Nix packages target fontconfig; CDN/web assets stay in dist/web.
          dontInstallWebfonts = true;

          preInstall = ''
            # Keep a single family so sibling prefixes are not installed together.
            # filePrefix includes the trailing family boundary (e.g. SunghyunSans-).
            find otf ttf -type f ! -name '${filePrefix}-*' -delete
          '';

          meta = {
            inherit description;
            homepage = "https://github.com/anaclumos/sunghyun-sans";
            license = pkgs.lib.licenses.ofl;
            platforms = pkgs.lib.platforms.all;
          };
        };
    in
    {
      packages = forAllSystems (
        { pkgs }:
        {
          sunghyun-sans = mkFontPackage {
            inherit pkgs;
            pname = "sunghyun-sans";
            filePrefix = "SunghyunSans";
            description = "Sunghyun Sans — Latin script font, an open-source alternative to SF Pro Rounded";
          };

          sunghyun-sans-kr = mkFontPackage {
            inherit pkgs;
            pname = "sunghyun-sans-kr";
            filePrefix = "SunghyunSansKR";
            description = "Sunghyun Sans KR — Korean and Latin script font, an open-source alternative to SF Pro Rounded";
          };

          sunghyun-sans-kr-hanja = mkFontPackage {
            inherit pkgs;
            pname = "sunghyun-sans-kr-hanja";
            filePrefix = "SunghyunSansKRHanja";
            description = "Sunghyun Sans KR Hanja — Korean, Hanja, and Latin script font, an open-source alternative to SF Pro Rounded";
          };

          sunghyun-sans-jp = mkFontPackage {
            inherit pkgs;
            pname = "sunghyun-sans-jp";
            filePrefix = "SunghyunSansJP";
            description = "Sunghyun Sans JP — Japanese and Latin script font, an open-source alternative to SF Pro Rounded";
          };

          sunghyun-sans-disambiguated = mkFontPackage {
            inherit pkgs;
            pname = "sunghyun-sans-disambiguated";
            filePrefix = "SunghyunSansDisambiguated";
            description = "Sunghyun Sans Disambiguated — Korean, Japanese, and Latin script font with disambiguated glyphs";
          };

          default = pkgs.symlinkJoin {
            name = "sunghyun-sans-all-${version}";
            paths = with self.packages.${pkgs.stdenv.hostPlatform.system}; [
              sunghyun-sans
              sunghyun-sans-kr
              sunghyun-sans-kr-hanja
              sunghyun-sans-jp
              sunghyun-sans-disambiguated
            ];
          };
        }
      );

      overlays.default = final: prev: {
        sunghyun-sans = self.packages.${prev.system}.sunghyun-sans;
        sunghyun-sans-kr = self.packages.${prev.system}.sunghyun-sans-kr;
        sunghyun-sans-kr-hanja = self.packages.${prev.system}.sunghyun-sans-kr-hanja;
        sunghyun-sans-jp = self.packages.${prev.system}.sunghyun-sans-jp;
        sunghyun-sans-disambiguated = self.packages.${prev.system}.sunghyun-sans-disambiguated;
        sunghyun-sans-all = self.packages.${prev.system}.default;
      };
    };
}
