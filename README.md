<p align="center">
  <img src=".github/hero.png" alt="Sunghyun Sans — SF Pro Rounded for Everyone" width="720" />
</p>

<p align="center">
  An open-source rounded typeface — SF Pro Rounded for everyone.<br>
  Supports Latin, Cyrillic, Greek, Vietnamese, Korean, Japanese, and Chinese across 9 weights.
</p>

<p align="center">
  <a href="https://cho.sh/mini/sans">Website</a> &middot;
  <a href="https://github.com/anaclumos/sunghyun-sans/releases/latest">Download</a> &middot;
  <a href="LICENSE">SIL Open Font License</a>
</p>

## Font Families

| Family | Script Support | Glyphs | Font Name |
|--------|---------------|--------|-----------|
| Sunghyun Sans | Latin, Cyrillic, Greek, Vietnamese | ~3,190 | `Sunghyun Sans` |
| Sunghyun Sans KR | Korean + Latin | ~14,716 | `Sunghyun Sans KR` |
| Sunghyun Sans KR Hanja | Korean + Hanja + Latin | ~22,926 | `Sunghyun Sans KR Hanja` |
| Sunghyun Sans JP | Japanese + Latin | ~22,926 | `Sunghyun Sans JP` |
| Sunghyun Sans Disambiguated | Korean + Japanese + Latin | ~23,400 | `Sunghyun Sans Disambiguated` |

## Weights

All families support 9 weights:

| Weight | Value |
|--------|-------|
| Thin | 100 |
| ExtraLight | 200 |
| Light | 300 |
| Regular | 400 |
| Medium | 500 |
| SemiBold | 600 |
| Bold | 700 |
| ExtraBold | 800 |
| Black | 900 |

## Formats

- **OTF** — `fonts/otf/`
- **TTF** — `fonts/ttf/`
- **WOFF / WOFF2** — `fonts/woff/`, `fonts/woff2/`
- **Web (WOFF2 + CSS)** — `dist/web/` (full and dynamic-subset CSS)

Pre-built archives (OTF, TTF, and Web per family) are attached to each [release](https://github.com/anaclumos/sunghyun-sans/releases/latest).

## OpenType Features

Sunghyun Sans includes built-in OpenType features:

| Feature | Description | Families |
|---------|-------------|----------|
| `tnum` | Tabular numbers | All except Disambiguated |
| `zero` | Slashed zero | All |
| `frac` | Fractions | All |
| `sups`, `subs` | Superscript and subscript | All |
| `case` | Case-sensitive forms | All except Disambiguated |
| `salt` | Stylistic alternates | All |
| `ordn` | Ordinals | All |
| `calt` | Contextual alternates | All |
| `jp78`, `jp83`, `jp90`, `nlck` | Japanese glyph standards | KR Hanja, JP, Disambiguated |

Stylistic sets and character variants are listed by the name each font gives them. Sunghyun Sans Disambiguated uses the disambiguated forms by default, so its sets switch to the other form.

| Feature | Sunghyun Sans, KR, KR Hanja, JP | Disambiguated |
|---------|---------------------------------|---------------|
| `ss01` | Straight-sided six and nine | Circular six and nine |
| `ss02` | Open four | Closed four |
| `ss03` | Vertically centered colon | Vertically centered colon |
| `ss05` | Korean localization (not in Sunghyun Sans) | Global localization |
| `ss06` | High legibility | Normal legibility |
| `ss07` | One-storey a | One-storey a |
| `ss08` | Flat-top three | Circular three |
| `ss10` | Medium symbols | Medium symbols |
| `ss11` | Outlined symbols | Outlined symbols |
| `ss12` | Circle symbols | Circle symbols |
| `ss13` | Square symbols | Square symbols |
| `ss14` | Filled symbols | Filled symbols |
| `ss15` | Small symbols | Small symbols |
| `ss16` | Large symbols | Large symbols |
| `ss20` | — | Original forms |
| `cv01` | Alternate one | Alternate one |
| `cv02` | Open four | Closed four |
| `cv03` | Open six | Closed six |
| `cv04` | Open nine | Closed nine |
| `cv05` | Lowercase l with tail | Lowercase l without tail |
| `cv07` | Alternate German double s | Alternate German double s |
| `cv08` | Uppercase I with serif | Uppercase I without serif |
| `cv09` | Flat-top three | Circular three |
| `cv10` | Capital G with spur | Capital G with spur |
| `cv11` | Single-storey a | Single-storey a |
| `cv12` | Vertically centered ellipsis (not in Sunghyun Sans) | Baseline-aligned ellipsis |
| `cv13` | High-legibility one | Normal-legibility one |

No family has `ss04`, `ss09`, or `cv06`.

```css
/* Example: enable tabular numbers and slashed zero */
font-feature-settings: "tnum" 1, "zero" 1;
```

## Web Embedding (CDN)

The easiest way to use Sunghyun Sans on the web is via the jsDelivr CDN.

### Quick Start

Add the stylesheet to your HTML `<head>`:

```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/anaclumos/sunghyun-sans@latest/dist/web/css/sunghyun-sans-kr-dynamic-subset.min.css" />
```

Then use the font in your CSS:

```css
body {
  font-family: 'Sunghyun Sans KR', sans-serif;
}
```

### Available CSS Files

All CSS files are served from:

```
https://cdn.jsdelivr.net/gh/anaclumos/sunghyun-sans@latest/dist/web/css/
```

| Family | Full | Dynamic Subset (Recommended) |
|--------|------|---------------------------|
| Sans | `sunghyun-sans.min.css` | `sunghyun-sans-dynamic-subset.min.css` |
| KR | `sunghyun-sans-kr.min.css` | `sunghyun-sans-kr-dynamic-subset.min.css` |
| KR Hanja | `sunghyun-sans-kr-hanja.min.css` | `sunghyun-sans-kr-hanja-dynamic-subset.min.css` |
| JP | `sunghyun-sans-jp.min.css` | `sunghyun-sans-jp-dynamic-subset.min.css` |
| Disambiguated | `sunghyun-sans-disambiguated.min.css` | `sunghyun-sans-disambiguated-dynamic-subset.min.css` |

### Full vs Dynamic Subset

- **Full** loads the entire font file for each weight. Suitable for Latin-only usage where font files are small.
- **Dynamic Subset** (recommended for CJK) splits each font into small chunks using `unicode-range`. The browser only downloads the characters actually needed on the page. This dramatically reduces initial load time for Korean and Japanese fonts.

### Using Multiple Families

```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/anaclumos/sunghyun-sans@latest/dist/web/css/sunghyun-sans-dynamic-subset.min.css" />
<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/anaclumos/sunghyun-sans@latest/dist/web/css/sunghyun-sans-kr-dynamic-subset.min.css" />
```

```css
body {
  font-family: 'Sunghyun Sans KR', 'Sunghyun Sans', sans-serif;
}
```

## Installation

### Homebrew

Each family is a cask in the [anaclumos/tap](https://github.com/anaclumos/homebrew-tap) tap, which installs the family's static OTF files from its GitHub release:

```sh
brew tap anaclumos/tap
brew trust --tap anaclumos/tap
brew install --cask anaclumos/tap/font-sunghyun-sans
```

Casks: `font-sunghyun-sans`, `font-sunghyun-sans-kr`, `font-sunghyun-sans-kr-hanja`, `font-sunghyun-sans-jp`, and `font-sunghyun-sans-disambiguated`.

### Linux

Each [release](https://github.com/anaclumos/sunghyun-sans/releases/latest) carries a package of each family for Debian and Ubuntu, Fedora, and Arch Linux. Each one installs the family's static OTF files and its license, and the package manager refreshes the font cache.

```sh
# Debian and Ubuntu
curl -LO https://github.com/anaclumos/sunghyun-sans/releases/latest/download/fonts-sunghyun-sans_all.deb
sudo apt install ./fonts-sunghyun-sans_all.deb

# Fedora
sudo dnf install https://github.com/anaclumos/sunghyun-sans/releases/latest/download/sunghyun-sans-fonts.noarch.rpm

# Arch Linux
curl -LO https://github.com/anaclumos/sunghyun-sans/releases/latest/download/otf-sunghyun-sans-any.pkg.tar.zst
sudo pacman -U ./otf-sunghyun-sans-any.pkg.tar.zst
```

| Family | Debian and Ubuntu | Fedora | Arch Linux |
| --- | --- | --- | --- |
| Sunghyun Sans | `fonts-sunghyun-sans_all.deb` | `sunghyun-sans-fonts.noarch.rpm` | `otf-sunghyun-sans-any.pkg.tar.zst` |
| Sunghyun Sans KR | `fonts-sunghyun-sans-kr_all.deb` | `sunghyun-sans-kr-fonts.noarch.rpm` | `otf-sunghyun-sans-kr-any.pkg.tar.zst` |
| Sunghyun Sans KR Hanja | `fonts-sunghyun-sans-kr-hanja_all.deb` | `sunghyun-sans-kr-hanja-fonts.noarch.rpm` | `otf-sunghyun-sans-kr-hanja-any.pkg.tar.zst` |
| Sunghyun Sans JP | `fonts-sunghyun-sans-jp_all.deb` | `sunghyun-sans-jp-fonts.noarch.rpm` | `otf-sunghyun-sans-jp-any.pkg.tar.zst` |
| Sunghyun Sans Disambiguated | `fonts-sunghyun-sans-disambiguated_all.deb` | `sunghyun-sans-disambiguated-fonts.noarch.rpm` | `otf-sunghyun-sans-disambiguated-any.pkg.tar.zst` |

The packages come straight from the release rather than a distribution repository, so a new release reaches you when you run the same commands again.

### Nix

Sunghyun Sans is packaged as a Nix flake:

```nix
# flake.nix
{
  inputs.sunghyun-sans.url = "github:anaclumos/sunghyun-sans";

  # Use the overlay
  nixpkgs.overlays = [ sunghyun-sans.overlays.default ];
}
```

Available packages: `sunghyun-sans`, `sunghyun-sans-kr`, `sunghyun-sans-kr-hanja`, `sunghyun-sans-jp`, `sunghyun-sans-disambiguated`, and `default` (all families).

### Self-Hosting

Download the `dist/web/` directory from this repository and serve it from your own infrastructure. The CSS files use relative paths to reference font files, so the directory structure must be preserved.

## Building from Source

The build runs on macOS with [bun](https://bun.sh) and [uv](https://docs.astral.sh/uv/). Each family is exported headlessly by the [Glyphs command-line tool](https://pypi.org/project/glyphs-cli/) with Glyphs 3.4.1 (build 3436), the build that exported the current release, which the tool downloads on first use.

```bash
bun install

# Every family, weight, and format, the web distribution, and the release archives
bunx turbo run build

# Render every character and compare it with the previous release
bunx turbo run regression

# The Debian, RPM, and Arch Linux packages of every family, for the version being released
SUNGHYUN_SANS_VERSION=1.2.0 bunx turbo run packages
```

The packages are built with [nFPM](https://nfpm.goreleaser.com), which the build runs through [mise](https://mise.jdx.dev).

Turborepo restores a task from its cache when its inputs did not change, so editing one family's source re-exports only that family.

## Project Structure

```
fonts/
  otf/                    # OpenType font files
  ttf/                    # TrueType font files
  woff/                   # Web Open Font Format
  woff2/                  # WOFF2 desktop/web builds
dist/
  web/
    css/                  # Web CSS (full + dynamic subset, minified + unminified)
    woff2/                # Full web font files
    woff2-dynamic-subset/ # unicode-range subset chunks
release/                  # Release archives and Linux packages built by turbo (not committed)
scripts/                  # Build and export scripts
sources/                  # Glyphs source packages (5 families)
```

## License

Sunghyun Sans is licensed under the [SIL Open Font License 1.1](LICENSE).

- Use in personal and commercial projects
- Embed on websites via CSS `@font-face`
- Bundle with applications and software
- Modify and create derivative fonts
- Redistribute freely

Restrictions: cannot sell font files standalone, derivatives must remain under OFL, don't use the reserved font name for modified versions.

## Credits

Sunghyun Sans is based on:

- [Inter](https://github.com/rsms/inter) by Rasmus Andersson
- [Pretendard](https://github.com/orioncactus/pretendard) by Kil Hyung-jin
- [Source Han Sans](https://github.com/adobe-fonts/source-han-sans) by Adobe
- [M PLUS 1p](https://github.com/coz-m/MPLUS_FONTS) by Coji Morishita

See [CONTRIBUTORS.txt](CONTRIBUTORS.txt) for details.
