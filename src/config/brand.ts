export const JINACAMPUS_BRAND = {
  name: "JinaCampus",
  shortName: "JinaCampus",
  tagline: "The Complete School OS",
  poweredBy: "powered by Parshwa Insights",
  productByline: "A Parshwa Insights Product",
  description: "A secure, multi-tenant school operations platform for Indian schools.",
  assets: {
    logoPrimary: "/brand/jinacampus-logo-primary-transparent.png",
    logoOnLight: "/brand/jinacampus-logo-primary-light.png",
    logoInverse: "/brand/jinacampus-logo-inverse-dark.png",
    mark: "/brand/jinacampus-mark-transparent.png",
    markOnLight: "/brand/jinacampus-mark-on-light.png",
    appIcon: "/brand/jinacampus-app-icon-master.png",
    authBackground: "/brand/jinacampus-auth-campus-background.png"
  },
  colors: {
    royalBlue: "#2457E6",
    vividBlue: "#155EEF",
    insightIndigo: "#312E81",
    campusTeal: "#12B8A6",
    kernelGold: "#C8A44D",
    deepInk: "#0B1638",
    cloudWhite: "#F6F8FF",
    pureWhite: "#FFFFFF"
  }
} as const;

export type BrandLogoVariant = "primary" | "light" | "inverse";
