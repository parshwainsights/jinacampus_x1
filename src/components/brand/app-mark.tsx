import Image from "next/image";

import { JINACAMPUS_BRAND } from "@/config/brand";

type AppMarkProps = {
  className?: string;
  priority?: boolean;
};

export function AppMark({ className = "", priority = false }: AppMarkProps) {
  return (
    <Image
      src={JINACAMPUS_BRAND.assets.mark}
      alt=""
      aria-hidden="true"
      width={1024}
      height={1024}
      priority={priority}
      className={`h-auto w-auto object-contain ${className}`}
      sizes="64px"
    />
  );
}
