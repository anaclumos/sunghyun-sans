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
      version = "1.0.0";

      mkFontPackage =
        {
          pkgs,
          pname,
          filePrefix,
          description,
        }:
        pkgs.stdenvNoCC.mkDerivation {
          inherit pname version;
          src = self;

          installPhase = ''
            runHook preInstall
            install -Dm644 -t $out/share/fonts/opentype fonts/otf/${filePrefix}-*.otf
            install -Dm644 -t $out/share/fonts/truetype fonts/ttf/${filePrefix}-*.ttf
            runHook postInstall
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
      packages = forAllSystems ({ pkgs }: {
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
          paths = with self.packages.${pkgs.system}; [
            sunghyun-sans
            sunghyun-sans-kr
            sunghyun-sans-jp
            sunghyun-sans-disambiguated
          ];
        };
      });

      overlays.default = final: prev: {
        sunghyun-sans = self.packages.${prev.system}.sunghyun-sans;
        sunghyun-sans-kr = self.packages.${prev.system}.sunghyun-sans-kr;
        sunghyun-sans-jp = self.packages.${prev.system}.sunghyun-sans-jp;
        sunghyun-sans-disambiguated = self.packages.${prev.system}.sunghyun-sans-disambiguated;
        sunghyun-sans-all = self.packages.${prev.system}.default;
      };
    };
}