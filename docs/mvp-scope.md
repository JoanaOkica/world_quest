# MVP scope

## Build in v1
- Phone (SMS) sign-in — also the primary anti-spam gate.
- **Manual** trip logging + transport-mode picker.
- **Live in-app** photo capture (gallery upload disabled).
- Device integrity check on capture (App Attest / Play Integrity).
- City/region **claims with decay**; map colored by current owner.
- Friends: add/accept, contest territory among friends.
- Friends leaderboard.
- GDPR: export my data, hard-delete my account.

## Explicitly NOT in v1
- **Passive/background location tracking + automatic transport detection.** Hard and
  battery-hungry. Prove the manual loop is fun first. This is the biggest deferral.
- **AI-generated-image detection.** Never build this. Detectors are unreliable and
  adversarial; screenshotting/re-shooting defeats them. Trust = live capture + attestation
  + GPS binding instead.
- Heavy anti-fraud ML.
- Payments, subscriptions, B2B / company or school leagues.

## Why this order
The logbook gives solo value on day one (survives the cold-start problem). Manual logging
lets you validate the competitive loop cheaply. Only once people log trips to beat their
friends is the automation worth its cost.

## First user wedge (recommended)
Interrailers / backpackers: already competitive about routes, already ground-travel-heavy
(so the green scoring rewards what they already do), and clustered on a shared network to
seed from.
