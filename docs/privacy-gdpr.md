# Privacy & GDPR

EU users are in scope from day one. Location + photos are sensitive personal data.

## Rules
- **RLS on every table.** A user reads/writes only their own rows. Leaderboards expose
  only aggregates among accepted friends, never another user's raw location history.
- **Data minimization.** Store the coarsest location that still works: for v1 that's the
  *region touched* + capture point, not a dense continuous GPS trace.
- **Export.** A profile screen action that returns all of the user's data (trips,
  captures, claims, friendships) as a downloadable file.
- **Hard delete.** Account deletion cascades and truly removes rows + storage objects
  (not a soft "deleted" flag). Verify no orphaned captures remain in Storage.
- **No sensitive data in URLs, query strings, or logs.** Ever.
- **Consent** for location + camera is explicit and revocable; the app degrades gracefully
  if permission is withheld.
