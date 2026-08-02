import { env } from "@/lib/env";

function normalizeHost(value: string) {
  return value.trim().toLowerCase().replace(/\.$/, "");
}

export function isWebAuthnRpIdAllowed(originHostname: string, rpID: string) {
  const hostname = normalizeHost(originHostname);
  const relyingPartyId = normalizeHost(rpID);
  if (!relyingPartyId || !/^[a-z0-9.-]+$/.test(relyingPartyId)) return false;
  if (
    relyingPartyId.startsWith(".") ||
    relyingPartyId.endsWith(".") ||
    relyingPartyId.includes("..")
  ) {
    return false;
  }
  return hostname === relyingPartyId || hostname.endsWith(`.${relyingPartyId}`);
}

export function getWebAuthnConfig() {
  const origin = new URL(env.WEBAUTHN_ORIGIN ?? env.APP_URL).origin;
  const originHostname = new URL(origin).hostname;
  const rpID = normalizeHost(env.WEBAUTHN_RP_ID ?? originHostname);
  if (!isWebAuthnRpIdAllowed(originHostname, rpID)) {
    throw new Error("WEBAUTHN_CONFIGURATION_INVALID");
  }

  return {
    origin,
    rpID,
    rpName: "JinaCampus"
  };
}
