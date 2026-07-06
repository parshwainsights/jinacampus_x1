import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

type WebManifest = {
  name: string;
  short_name: string;
  theme_color: string;
  background_color: string;
  icons: Array<{
    src: string;
    sizes: string;
    type: string;
    purpose?: string;
  }>;
};

function projectFile(path: string) {
  return resolve(process.cwd(), path);
}

function source(path: string) {
  return readFileSync(projectFile(path), "utf8");
}

function publicPath(url: string) {
  return projectFile(`public/${url.replace(/^\//, "")}`);
}

describe("app shell PWA and brand assets", () => {
  it("references the actual favicon, apple-touch icon, and web manifest from Next metadata", () => {
    const layoutSource = source("src/app/layout.tsx");

    expect(layoutSource).toContain('manifest: "/site.webmanifest"');
    expect(layoutSource).toContain('/favicon.ico');
    expect(layoutSource).toContain('/favicon-16x16.png');
    expect(layoutSource).toContain('/favicon-32x32.png');
    expect(layoutSource).toContain('/favicon-48x48.png');
    expect(layoutSource).toContain('/favicon-96x96.png');
    expect(layoutSource).toContain('/apple-touch-icon.png');
    expect(layoutSource).toContain('themeColor: "#12324A"');
    expect(layoutSource).not.toContain('/favicon.svg');
  });

  it("keeps all public PWA icon references backed by files in public/icons", () => {
    const manifest = JSON.parse(source("public/site.webmanifest")) as WebManifest;
    const iconSources = manifest.icons.map((icon) => icon.src);

    expect(manifest.name).toBe("JinaCampus");
    expect(manifest.short_name).toBe("JinaCampus");
    expect(manifest.theme_color).toBe("#12324A");
    expect(manifest.background_color).toBe("#F8FAFC");
    expect(iconSources).toEqual(
      expect.arrayContaining([
        "/icons/pwa-icon-48x48.png",
        "/icons/pwa-icon-192x192.png",
        "/icons/pwa-icon-512x512.png",
        "/icons/pwa-icon-1024x1024.png",
        "/icons/pwa-icon-maskable-192x192.png",
        "/icons/pwa-icon-maskable-512x512.png"
      ])
    );
    expect(manifest.icons.some((icon) => icon.purpose === "maskable")).toBe(true);

    for (const icon of manifest.icons) {
      expect(icon.type).toBe("image/png");
      expect(existsSync(publicPath(icon.src))).toBe(true);
    }
  });

  it("keeps brand logo assets available under public/brand", () => {
    for (const path of [
      "public/brand/jinacampus-horizontal-on-light.png",
      "public/brand/jinacampus-horizontal-transparent.png",
      "public/brand/jinacampus-mark-transparent.png"
    ]) {
      expect(existsSync(projectFile(path))).toBe(true);
    }
  });

  it("keeps legacy browser/PWA snippets aligned to the new asset paths without secrets", () => {
    const snippets = [
      source("public/head-snippet.html"),
      source("public/browserconfig.xml"),
      source("public/site.webmanifest")
    ].join("\n");

    expect(snippets).toContain("/site.webmanifest");
    expect(snippets).toContain("/apple-touch-icon.png");
    expect(snippets).toContain("/icons/pwa-icon-144x144.png");
    expect(snippets).toContain("/icons/pwa-icon-maskable-512x512.png");
    expect(snippets).not.toMatch(/passwordHash|tokenHash|rawToken|secret|bearer/i);
  });
});
