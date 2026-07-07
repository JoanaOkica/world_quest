/**
 * Device integrity (App Attest on iOS, Play Integrity on Android).
 *
 * This is the control that stops spoofed / emulated clients and virtual
 * cameras (docs/architecture.md §Verification pipeline). Real verification
 * calls Apple's App Attest and Google's Play Integrity APIs with server-side
 * secrets — do NOT do pixel analysis; we never ship AI-image detection.
 *
 * The full attestation dance is platform-specific and out of scope to hand-roll
 * here; this module exposes the single decision the rest of the pipeline needs
 * (`verifyAttestation`) so callers stay clean. Wire the real provider calls in
 * before launch. In non-production it can be relaxed via ATTESTATION_MODE.
 */
export type AttestationVerdict = { ok: true } | { ok: false; reason: string };

const MODE = Deno.env.get("ATTESTATION_MODE") ?? "enforce"; // "enforce" | "dev"

export async function verifyAttestation(
  attestation: string,
): Promise<AttestationVerdict> {
  if (!attestation || attestation.length < 8) {
    return { ok: false, reason: "missing_or_malformed_attestation" };
  }

  if (MODE === "dev") {
    // Local development: accept a well-formed token without contacting Apple/Google.
    return { ok: true };
  }

  // TODO(before launch): verify with Apple App Attest / Google Play Integrity.
  //  - iOS:     validate the attestation object + assertion against your app id.
  //  - Android: send the integrity token to Play Integrity; check the verdicts.
  // Until wired, fail closed in enforce mode so nothing unattested ever scores.
  return { ok: false, reason: "attestation_provider_not_configured" };
}
