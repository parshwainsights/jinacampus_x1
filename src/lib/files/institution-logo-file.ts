const MIME_EXTENSIONS = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp"
} as const;

export const INSTITUTION_LOGO_MIME_TYPES = Object.keys(MIME_EXTENSIONS) as Array<keyof typeof MIME_EXTENSIONS>;

function hasPrefix(bytes: Uint8Array, signature: readonly number[]) {
  return signature.every((value, index) => bytes[index] === value);
}

export function detectInstitutionLogoMimeType(bytes: Uint8Array): keyof typeof MIME_EXTENSIONS | null {
  if (hasPrefix(bytes, [0xff, 0xd8, 0xff])) return "image/jpeg";
  if (hasPrefix(bytes, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) return "image/png";
  if (
    hasPrefix(bytes, [0x52, 0x49, 0x46, 0x46]) &&
    bytes.length >= 12 &&
    String.fromCharCode(...bytes.slice(8, 12)) === "WEBP"
  ) return "image/webp";
  return null;
}

export function institutionLogoExtension(mimeType: keyof typeof MIME_EXTENSIONS) {
  return MIME_EXTENSIONS[mimeType];
}
