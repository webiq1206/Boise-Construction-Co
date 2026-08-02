interface SeasonWindow {
  startMonth: number;
  startDay: number;
  endMonth: number;
  endDay: number;
}

interface ServiceSeasonConfig {
  seasons: SeasonWindow[];
  nearSeasonBufferDays: number;
  isRecurringEligible: boolean;
  maxFrequency: "weekly" | "bi-weekly" | "monthly" | null;
  recurringLeadPrice?: number;
}

/**
 * New home construction runs year-round in the Treasure Valley. Winter slows
 * foundation and flatwork rather than stopping the job, and design, permitting,
 * and interior work continue regardless of season, so every service carries a
 * full-year window. None are recurring by nature.
 */
const YEAR_ROUND: ServiceSeasonConfig = {
  seasons: [{ startMonth: 1, startDay: 1, endMonth: 12, endDay: 31 }],
  nearSeasonBufferDays: 0,
  isRecurringEligible: false,
  maxFrequency: null,
};

const SERVICE_SEASON_CONFIG: Record<string, ServiceSeasonConfig> = {
  "custom-home-builder": YEAR_ROUND,
  "semi-custom-homes": YEAR_ROUND,
  "build-on-your-lot": YEAR_ROUND,
  "design-build": YEAR_ROUND,
  "home-plans-design": YEAR_ROUND,
  "lot-evaluation": YEAR_ROUND,
  "shop-homes-barndominiums": YEAR_ROUND,
  "energy-efficient-homes": YEAR_ROUND,
};

function dateToYearDay(month: number, day: number): number {
  const daysInMonth = [0, 31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  let total = 0;
  for (let m = 1; m < month; m++) {
    total += daysInMonth[m];
  }
  return total + day;
}

function isDateInWindow(month: number, day: number, window: SeasonWindow): boolean {
  const current = dateToYearDay(month, day);
  const start = dateToYearDay(window.startMonth, window.startDay);
  const end = dateToYearDay(window.endMonth, window.endDay);

  if (start <= end) {
    return current >= start && current <= end;
  }
  return current >= start || current <= end;
}

function subtractDays(month: number, day: number, daysToSubtract: number): { month: number; day: number } {
  const date = new Date(2024, month - 1, day);
  date.setDate(date.getDate() - daysToSubtract);
  return { month: date.getMonth() + 1, day: date.getDate() };
}

export function isServiceInSeason(serviceId: string, date?: Date): boolean {
  const config = SERVICE_SEASON_CONFIG[serviceId];
  if (!config) return true;

  const now = date || new Date();
  const month = now.getMonth() + 1;
  const day = now.getDate();

  for (const window of config.seasons) {
    if (isDateInWindow(month, day, window)) return true;

    if (config.nearSeasonBufferDays > 0) {
      const bufferStart = subtractDays(window.startMonth, window.startDay, config.nearSeasonBufferDays);
      const bufferWindow: SeasonWindow = {
        startMonth: bufferStart.month,
        startDay: bufferStart.day,
        endMonth: window.startMonth,
        endDay: window.startDay,
      };
      if (isDateInWindow(month, day, bufferWindow)) return true;
    }
  }

  return false;
}

export function getAvailableServices(date?: Date): string[] {
  return Object.keys(SERVICE_SEASON_CONFIG).filter(id => isServiceInSeason(id, date));
}

export function getServiceSeasonLabel(serviceId: string): string | null {
  const config = SERVICE_SEASON_CONFIG[serviceId];
  if (!config) return null;

  const monthNames = ["", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  if (config.seasons.length === 1) {
    const s = config.seasons[0];
    if (s.startMonth === 1 && s.startDay === 1 && s.endMonth === 12 && s.endDay === 31) {
      return null;
    }
    return `${monthNames[s.startMonth]} - ${monthNames[s.endMonth]}`;
  }

  return config.seasons
    .map(s => `${monthNames[s.startMonth]} - ${monthNames[s.endMonth]}`)
    .join(", ");
}

export function getRecurringEligibleServices(): Set<string> {
  const result = new Set<string>();
  for (const [id, config] of Object.entries(SERVICE_SEASON_CONFIG)) {
    if (config.isRecurringEligible) {
      result.add(id);
    }
  }
  return result;
}

export function getRecurringLeadPrices(): Record<string, number> {
  const result: Record<string, number> = {};
  for (const [id, config] of Object.entries(SERVICE_SEASON_CONFIG)) {
    if (config.isRecurringEligible && config.recurringLeadPrice) {
      result[id] = config.recurringLeadPrice;
    }
  }
  return result;
}

export function getMaxFrequencyForServices(serviceIds: string[]): "weekly" | "bi-weekly" | "monthly" | null {
  let best: "weekly" | "bi-weekly" | "monthly" | null = null;
  const rank = { weekly: 3, "bi-weekly": 2, monthly: 1 };

  for (const id of serviceIds) {
    const config = SERVICE_SEASON_CONFIG[id];
    if (config?.maxFrequency) {
      const current = rank[config.maxFrequency] || 0;
      const bestRank = best ? rank[best] || 0 : 0;
      if (current > bestRank) {
        best = config.maxFrequency;
      }
    }
  }

  return best;
}

export function hasAnyRecurringService(serviceIds: string[]): boolean {
  const eligible = getRecurringEligibleServices();
  return serviceIds.some(id => eligible.has(id));
}

export function getServiceMaxFrequency(serviceId: string): "weekly" | "bi-weekly" | "monthly" | null {
  const config = SERVICE_SEASON_CONFIG[serviceId];
  return config?.maxFrequency || null;
}

export function getServiceDefaultFrequency(serviceId: string): string {
  const config = SERVICE_SEASON_CONFIG[serviceId];
  if (!config?.isRecurringEligible) return "one-time";
  if (config.maxFrequency === "weekly") return "bi-weekly";
  if (config.maxFrequency === "monthly") return "monthly";
  return "one-time";
}

export { SERVICE_SEASON_CONFIG };
export type { ServiceSeasonConfig, SeasonWindow };
