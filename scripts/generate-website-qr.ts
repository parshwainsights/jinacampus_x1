import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

import jsQR from "jsqr";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { QRCodeSVG } from "qrcode.react";
import sharp from "sharp";

const WEBSITE_URL = "https://jinacampus.vercel.app";
const QR_SIZE = 1200;
const LOGO_SIZE = 184;

const brandMarkPath = resolve(process.cwd(), "public/brand/jinacampus-mark-transparent.png");
const svgOutputPath = resolve(process.cwd(), "public/brand/jinacampus-website-qr.svg");
const pngOutputPath = resolve(process.cwd(), "public/brand/jinacampus-website-qr.png");

async function main() {
  const brandMark = await readFile(brandMarkPath);
  const optimizedMark = await sharp(brandMark)
    .resize(256, 256, { fit: "contain" })
    .png({ compressionLevel: 9, palette: false })
    .toBuffer();
  const embeddedMark = `data:image/png;base64,${optimizedMark.toString("base64")}`;
  const svgMarkup = renderToStaticMarkup(createElement(QRCodeSVG, {
    value: WEBSITE_URL,
    size: QR_SIZE,
    level: "H",
    boostLevel: true,
    marginSize: 4,
    bgColor: "#FFFFFF",
    fgColor: "#0B1638",
    title: "Open the JinaCampus website",
    role: "img",
    "aria-label": "QR code linking to the JinaCampus website",
    imageSettings: {
      src: embeddedMark,
      width: LOGO_SIZE,
      height: LOGO_SIZE,
      excavate: true
    }
  }));
  const svg = `<?xml version="1.0" encoding="UTF-8"?>\n${svgMarkup}\n`;

  await writeFile(svgOutputPath, svg, "utf8");
  await sharp(Buffer.from(svg))
    .png({ compressionLevel: 9, palette: false })
    .toFile(pngOutputPath);

  const { data, info } = await sharp(pngOutputPath)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const decoded = jsQR(
    new Uint8ClampedArray(data.buffer, data.byteOffset, data.byteLength),
    info.width,
    info.height,
    { inversionAttempts: "dontInvert" }
  );

  if (decoded?.data !== WEBSITE_URL) {
    throw new Error("Generated QR verification failed.");
  }

  process.stdout.write(JSON.stringify({
    ok: true,
    value: WEBSITE_URL,
    svg: "public/brand/jinacampus-website-qr.svg",
    png: "public/brand/jinacampus-website-qr.png",
    width: info.width,
    height: info.height
  }));
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : "Unknown QR generation error";
  process.stderr.write(JSON.stringify({ ok: false, error: message }));
  process.exitCode = 1;
});
