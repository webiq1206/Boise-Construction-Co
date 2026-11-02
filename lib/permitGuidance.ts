/**
 * City-specific permit answers for area pages (Phase 6 / X10).
 * Addresses outside city limits go through the county; we check this at the first visit.
 */
export function permitGuidance(city: string): string {
  const key = city.toLowerCase();
  const hedge =
    'Addresses outside city limits go through the county instead; we check this for you at the first visit.';

  if (key === 'boise') {
    return `Permits inside Boise city limits come from the City of Boise Planning and Development Services. ${hedge}`;
  }
  if (key === 'meridian') {
    return `Permits inside Meridian city limits come from the City of Meridian Building Department. ${hedge}`;
  }
  if (key === 'eagle') {
    return `Permits inside Eagle city limits come from the City of Eagle Building Department. ${hedge}`;
  }
  if (key === 'nampa') {
    return `Permits inside Nampa city limits come from the City of Nampa Building Department. ${hedge}`;
  }
  if (key === 'caldwell') {
    return `Permits inside Caldwell city limits come from the City of Caldwell Building Safety Division. The city's first plan review takes about 7 to 10 business days once the application is complete and fees are paid, and each resubmittal restarts that clock. ${hedge}`;
  }
  if (key === 'garden city' || key === 'garden-city') {
    return `Permits inside Garden City limits come from the City of Garden City Development Services at City Hall, 6015 N Glenwood St. Unincorporated addresses go through Ada County Development Services. We check this for you at the first visit.`;
  }
  if (key === 'kuna') {
    return `Permits inside Kuna city limits come from the City of Kuna Building Department. ${hedge}`;
  }
  if (key === 'star') {
    return `Permits inside Star city limits come from the City of Star Building Department. ${hedge}`;
  }
  if (key === 'middleton') {
    return `Permits inside Middleton city limits come from the City of Middleton. ${hedge}`;
  }
  return `For a project in ${city}, property within city limits is permitted by that city's building office; unincorporated property follows the county process. ${hedge}`;
}

export function permitSource(city: string): string | null {
  if (city.toLowerCase() === 'eagle') return 'https://www.cityofeagle.org/153/Building';
  if (city.toLowerCase() === 'star') return 'https://www.staridaho.org/1243/Building-Department';
  if (city.toLowerCase() === 'middleton') return 'https://middleton.id.gov/';
  if (city.toLowerCase() === 'boise')
    return 'https://www.cityofboise.org/departments/planning-and-development-services/building/building-permits/';
  if (city.toLowerCase() === 'nampa') return 'https://www.cityofnampa.us/428/Residential-Permit-Applications';
  if (city.toLowerCase() === 'caldwell') return 'https://www.cityofcaldwell.org/';
  if (city.toLowerCase() === 'garden city' || city.toLowerCase() === 'garden-city')
    return 'https://www.gardencityidaho.org/';
  return null;
}

export function permitGuidanceHtml(city: string): string {
  const url = permitSource(city);
  return (
    permitGuidance(city) +
    (url ? ` <a href="${url}">Check the official ${city} permit guidance</a>.` : '')
  );
}
