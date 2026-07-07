import { useQuery } from "@tanstack/react-query";
import type { Feature, FeatureCollection, Polygon } from "geojson";
import { supabase } from "../../lib/supabase";
import { useUserId } from "../../state/authStore";
import { ownerColor } from "./ownerColor";

/** Which owners to paint on the globe. */
export type MapFilter = "all" | "me" | "friends";

interface RegionRow {
  id: string;
  name: string;
  min_lng: number;
  min_lat: number;
  max_lng: number;
  max_lat: number;
}

interface OwnerRow {
  region_id: string;
  owner_id: string;
}

export interface RegionFeatureProps {
  regionId: string;
  name: string;
  ownerId: string | null;
  color: string;
}

/** Region bounding box → GeoJSON Polygon (the schema stores bboxes, not PostGIS). */
function bboxPolygon(r: RegionRow): Polygon {
  return {
    type: "Polygon",
    coordinates: [[
      [r.min_lng, r.min_lat],
      [r.max_lng, r.min_lat],
      [r.max_lng, r.max_lat],
      [r.min_lng, r.max_lat],
      [r.min_lng, r.min_lat],
    ]],
  };
}

/**
 * Build a colored GeoJSON FeatureCollection of all regions. Ownership comes from
 * `region_owner`, which RLS already limits to you + your accepted friends, so a
 * stranger's claim is never colored in. The filter narrows which owners are
 * painted: "me" (only your regions), "friends" (only friends'), or "all".
 * Unclaimed/filtered-out regions render in the neutral color.
 */
export function useMapData(filter: MapFilter = "all") {
  const youId = useUserId();

  return useQuery({
    queryKey: ["map-data", youId, filter],
    queryFn: async (): Promise<FeatureCollection<Polygon, RegionFeatureProps>> => {
      const [{ data: regions, error: rErr }, { data: owners, error: oErr }] =
        await Promise.all([
          supabase.from("regions").select("id, name, min_lng, min_lat, max_lng, max_lat"),
          supabase.from("region_owner").select("region_id, owner_id"),
        ]);
      if (rErr) throw rErr;
      if (oErr) throw oErr;

      const ownerByRegion = new Map<string, string>();
      for (const o of (owners ?? []) as OwnerRow[]) {
        ownerByRegion.set(o.region_id, o.owner_id);
      }

      const features: Feature<Polygon, RegionFeatureProps>[] = (
        (regions ?? []) as RegionRow[]
      ).map((r) => {
        let ownerId = ownerByRegion.get(r.id) ?? null;
        if (ownerId) {
          const isYou = ownerId === youId;
          if (filter === "me" && !isYou) ownerId = null;
          if (filter === "friends" && isYou) ownerId = null;
        }
        return {
          type: "Feature",
          geometry: bboxPolygon(r),
          properties: {
            regionId: r.id,
            name: r.name,
            ownerId,
            color: ownerColor(ownerId, youId),
          },
        };
      });

      return { type: "FeatureCollection", features };
    },
  });
}
