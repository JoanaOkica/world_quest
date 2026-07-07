/**
 * Device-integrity token for a capture. On real devices this produces an
 * App Attest (iOS) / Play Integrity (Android) assertion that `verify-capture`
 * checks server-side — the control that blocks spoofed/emulated clients.
 *
 * Those native modules aren't wired in this scaffold, so we return a
 * development placeholder. Pair this with ATTESTATION_MODE=dev on the server
 * for local testing; in production the server fails closed until the real
 * provider calls are implemented on both ends.
 */
export async function getAttestationToken(): Promise<string> {
  // TODO(before launch): call the native App Attest / Play Integrity module.
  return "dev-attestation-placeholder";
}
