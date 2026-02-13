export type IndustrialAreaId = "area-1" | "area-2" | "area-3";

export interface IndustrialAreaConfig {
  id: IndustrialAreaId;
  name: string;
  officialMapPath: string;
  satelliteMapPath: string;
}

export const INDUSTRIAL_AREAS: IndustrialAreaConfig[] = [
  {
    id: "area-1",
    name: "Industrial Area 1",
    officialMapPath: "/assets/industrial-areas/area-1/official_map.jpg",
    satelliteMapPath: "/assets/industrial-areas/area-1/satellite_map.jpg",
  },
  {
    id: "area-2",
    name: "Industrial Area 2",
    officialMapPath: "/assets/industrial-areas/area-2/official_map.jpg",
    satelliteMapPath: "/assets/industrial-areas/area-2/satellite_map.jpg",
  },
  {
    id: "area-3",
    name: "Industrial Area 3",
    officialMapPath: "/assets/industrial-areas/area-3/official_map.jpg",
    satelliteMapPath: "/assets/industrial-areas/area-3/satellite_map.jpg",
  },
];

export function getIndustrialAreaById(
  id: IndustrialAreaId
): IndustrialAreaConfig | null {
  return INDUSTRIAL_AREAS.find((area) => area.id === id) ?? null;
}

