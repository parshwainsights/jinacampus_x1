"use client";

import { useState } from "react";

type InstitutionLogoProps = {
  name: string;
  logoUrl?: string | null;
  className?: string;
  imageClassName?: string;
};

function initials(name: string) {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return "JC";
  return words.slice(0, 2).map((word) => word.charAt(0)).join("").toUpperCase();
}

export function InstitutionLogo({
  name,
  logoUrl,
  className = "h-11 w-11",
  imageClassName = "object-contain"
}: InstitutionLogoProps) {
  const [failedUrl, setFailedUrl] = useState<string | null>(null);
  const imageFailed = Boolean(logoUrl && failedUrl === logoUrl);

  return (
    <span
      className={`relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-lg border border-campus-border bg-white text-xs font-bold text-brand-700 shadow-sm ${className}`}
      aria-label={logoUrl && !imageFailed ? undefined : `${name} logo fallback`}
    >
      {logoUrl && !imageFailed ? (
        <img
          src={logoUrl}
          alt={`${name} logo`}
          className={`h-full w-full ${imageClassName}`}
          onError={() => setFailedUrl(logoUrl)}
          referrerPolicy="no-referrer"
        />
      ) : (
        <span aria-hidden="true">{initials(name)}</span>
      )}
    </span>
  );
}
