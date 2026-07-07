import { useQuery } from "@tanstack/react-query";
import type { Feature, FeatureCollection, Geometry } from "geojson";
import { supabase } from "../../lib/supabase";
import { useUserId } from "../../state/authStore";
import { ownerColor } from "./ownerColor";

interface RegionGeo {
  id: string;
  name: string;
  geojson: Geometry;
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

/**
 * Build a colored GeoJSON FeatureCollection of all regions. Ownership comes from
 * `region_owner`, which RLS already limits to you + your accepted friends, so a
 * stranger's claim is never colored in. Regions with no visible owner render as
 * "unclaimed".
 */
export function useMapData() {
  const youId = useUserId();

  return useQuery({
    queryKey: ["map-data", youId],
    queryFn: async (): Promise<FeatureCollection<Geometry, RegionFeatureProps>> => {
      const [{ data: regions, error: rErr }, { data: owners, error: oErr }] =
        await Promise.all([
          supabase.from("regions_geojson").select("id, name, geojson"),
          supabase.from("region_owner").select("region_id, owner_id"),
        ]);
      if (rErr) throw rErr;
      if (oErr) throw oErr;

      const ownerByRegion = new Map<string, string>();
      for (const o of (owners ?? []) as OwnerRow[]) {
        ownerByRegion.set(o.region_id, o.owner_id);
      }

      const features: Feature<Geometry, RegionFeatureProps>[] = (
        (regions ?? []) as RegionGeo[]
      ).map((r) => {
        const ownerId = ownerByRegion.get(r.id) ?? null;
        return {
          type: "Feature",
          geometry: r.geojson,
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
