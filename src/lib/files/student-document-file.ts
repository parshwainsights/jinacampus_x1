const MIME_EXTENSIONS: Record<string, string> = {
  "application/pdf": "pdf",
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp"
};

function hasPrefix(bytes: Uint8Array, signature: readonly number[]) {
  return signature.every((value, index) => bytes[index] === value);
}

export function detectStudentDocumentMimeType(bytes: Uint8Array) {
  if (hasPrefix(bytes, [0x25, 0x50, 0x44, 0x46])) return "application/pdf";
  if (hasPrefix(bytes, [0xff, 0xd8, 0xff])) return "image/jpeg";
  if (hasPrefix(bytes, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) return "image/png";
  if (
    hasPrefix(bytes, [0x52, 0x49, 0x46, 0x46]) &&
    bytes.length >= 12 &&
    String.fromCharCode(...bytes.slice(8, 12)) === "WEBP"
  ) return "image/webp";
  return null;
}

export function safeStudentDocumentObjectName(value: string, mimeType: string) {
  const base = value
    .normalize("NFKD")
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 100) || "document";
  const withoutExtension = base.replace(/\.[a-zA-Z0-9]{1,8}$/, "");
  return `${withoutExtension}.${MIME_EXTENSIONS[mimeType] ?? "bin"}`;
}
