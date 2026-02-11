declare namespace opentype {
  interface Command {
    type: string;
    x?: number;
    y?: number;
    x1?: number;
    y1?: number;
    x2?: number;
    y2?: number;
  }

  interface BoundingBox {
    x1: number;
    y1: number;
    x2: number;
    y2: number;
  }

  interface Path {
    commands: Command[];
    toPathData(precision?: number): string;
    getBoundingBox(): BoundingBox;
  }

  interface Glyph {
    getPath(x: number, y: number, fontSize: number): Path;
  }

  interface Font {
    charToGlyph(char: string): Glyph;
    names: { fontFamily: { en: string } };
  }

  function load(url: string, callback: (err: Error | null, font: Font) => void): void;
}

declare module "opentype.js" {
  export = opentype;
}
