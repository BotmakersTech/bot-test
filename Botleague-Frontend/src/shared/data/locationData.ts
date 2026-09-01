import INDIA_CITIES_BY_STATE from "./indiaLocations.generated.ts";

// The platform is India-only — every location form collects an Indian state
// and city (see <LocationSelects>). `COUNTRIES` is kept for the rare spot that
// still wants a country picker, but nothing does today.
export const COUNTRIES: string[] = ["India"];

// All 28 states + 8 union territories, canonical spellings.
export const INDIA_STATES: string[] = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar",
  "Chhattisgarh", "Goa", "Gujarat", "Haryana", "Himachal Pradesh",
  "Jharkhand", "Karnataka", "Kerala", "Madhya Pradesh", "Maharashtra",
  "Manipur", "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab",
  "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura",
  "Uttar Pradesh", "Uttarakhand", "West Bengal",
  "Andaman and Nicobar Islands", "Chandigarh",
  "Dadra and Nagar Haveli and Daman and Diu", "Delhi",
  "Jammu and Kashmir", "Ladakh", "Lakshadweep", "Puducherry",
];

// state -> full list of cities / towns (~4,200 entries).
// Generated from the countries-states-cities DB — see
// scripts/gen-india-locations.mjs. Do not hand-edit the map.
export const INDIA_CITIES: Record<string, string[]> = INDIA_CITIES_BY_STATE;

export function getStatesForCountry(_country?: string): string[] {
  return INDIA_STATES;
}

export function getCitiesForState(_country: string | undefined, state: string): string[] {
  if (!state) return [];
  return INDIA_CITIES[state] ?? [];
}
