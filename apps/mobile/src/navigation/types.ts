import type { TransportMode } from "@terra/core";

/** Bottom tabs shown once signed in. */
export type TabParamList = {
  Map: undefined;
  Logbook: undefined;
  Leaderboard: undefined;
  Friends: undefined;
  Profile: undefined;
};

/** Root stack: the tabs plus the modal-ish trip-logging flow on top. */
export type RootStackParamList = {
  Tabs: undefined;
  NewTrip: undefined;
  Capture: { tripId: string; mode: TransportMode; regionIds: string[] };
};
