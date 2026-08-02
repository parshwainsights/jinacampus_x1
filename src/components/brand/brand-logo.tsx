import Image from "next/image";

import { JINACAMPUS_BRAND, type BrandLogoVariant } from "@/config/brand";

type BrandLogoProps = {
  variant?: BrandLogoVariant;
  className?: string;
  priority?: boolean;
};

const logoByVariant = {
  primary: JINACAMPUS_BRAND.assets.logoPrimary,
  light: JINACAMPUS_BRAND.assets.logoOnLight,
  inverse: JINACAMPUS_BRAND.assets.logoInverse
} satisfies Record<BrandLogoVariant, string>;

export function BrandLogo({ variant = "primary", className = "", priority = false }: BrandLogoProps) {
  return (
    <Image
      src={logoByVariant[variant]}
      alt={`${JINACAMPUS_BRAND.name} - ${JINACAMPUS_BRAND.tagline}`}
      width={1914}
      height={522}
      priority={priority}
      className={`h-auto max-w-full object-contain ${className}`}
      sizes="(max-width: 640px) 280px, 420px"
    />
  );
}
