interface LocationLike {
  mapUrl?: string | null;
  venueName?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
}

/** A Google Maps *directions* link (destination pre-filled, origin = the
 *  viewer's current location). Prefers a real address when we have one;
 *  otherwise falls back to the saved place link. */
export function directionsHref(loc: LocationLike): string | null {
  const address = [loc.venueName, loc.city, loc.state, loc.country]
    .filter(Boolean)
    .join(", ")
    .trim();
  if (address) {
    return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(address)}`;
  }
  return loc.mapUrl || null;
}

/** A link that just shows the place on the map. */
export function viewOnMapHref(loc: LocationLike): string | null {
  if (loc.mapUrl) return loc.mapUrl;
  const address = [loc.venueName, loc.city, loc.state, loc.country]
    .filter(Boolean)
    .join(", ")
    .trim();
  return address
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`
    : null;
}
