import type { TransportMode, TripStatus } from "@terra/core";

export type { TransportMode, TripStatus };

export interface Region {
  id: string;
  name: string;
  kind: "city" | "region";
}

export interface Trip {
  id: string;
  user_id: string;
  started_at: string;
  ended_at: string | null;
  transport_mode: TransportMode;
  distance_m: number | null;
  status: TripStatus;
  created_at: string;
}

export interface Profile {
  id: string;
  display_name: string;
  avatar_url: string | null;
  handle: string | null;
  global_opt_in: boolean;
}

/** Cached ownership row joined to its region, for coloring the map. */
export interface OwnedRegion {
  region_id: string;
  owner_id: string;
  region_name: string;
}

export interface FriendScore {
  user_id: string;
  display_name: string;
  regions_owned: number;
}

export interface GlobalRow {
  handle: string;
  regions_owned: number;
  rank: number;
}

export interface Friendship {
  user_a: string;
  user_b: string;
  status: "pending" | "accepted";
}
