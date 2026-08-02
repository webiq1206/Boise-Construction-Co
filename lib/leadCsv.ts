export type CsvFormat = "yardbook" | "full";

export interface ExportableLead {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  address?: string | null;
  city: string;
  propertyType: string;
  serviceType: string;
  selectedServices?: string[] | null;
  frequency?: string | null;
  finalQuote?: string | null;
  lineItems?: readonly unknown[] | null;
  message?: string | null;
  propertySize?: string | number | null;
  purchasePrice?: string | null;
  currentLeadPrice?: string | null;
  purchasedAt?: string | Date | null;
  createdAt: string | Date;
}

export interface CsvBuildOptions {
  format: CsvFormat;
  getServiceName?: (slug: string) => string;
}

// Defuse spreadsheet formula injection: cells starting with =, +, -, @,
// tab, or carriage return can be interpreted as formulas by Excel/Sheets.
// Prefix with a single quote so the cell renders literally.
function sanitizeForFormulaInjection(str: string): string {
  if (str.length === 0) return str;
  const first = str.charCodeAt(0);
  // = + - @ \t \r
  if (first === 0x3d || first === 0x2b || first === 0x2d || first === 0x40 || first === 0x09 || first === 0x0d) {
    return "'" + str;
  }
  return str;
}

function escapeCsvValue(value: unknown): string {
  if (value === null || value === undefined) return "";
  const safe = sanitizeForFormulaInjection(String(value));
  if (/[",\r\n]/.test(safe)) {
    return `"${safe.replace(/"/g, '""')}"`;
  }
  return safe;
}

function rowsToCsv(headers: string[], rows: Array<Record<string, unknown>>): string {
  const headerLine = headers.map(escapeCsvValue).join(",");
  const dataLines = rows.map(row =>
    headers.map(h => escapeCsvValue(row[h])).join(",")
  );
  // UTF-8 BOM so Excel opens it cleanly
  return "\uFEFF" + [headerLine, ...dataLines].join("\r\n") + "\r\n";
}

function splitName(fullName: string): { firstName: string; lastName: string } {
  const trimmed = (fullName || "").trim().replace(/\s+/g, " ");
  if (!trimmed) return { firstName: "", lastName: "" };
  const parts = trimmed.split(" ");
  if (parts.length === 1) return { firstName: parts[0], lastName: "" };
  return {
    firstName: parts.slice(0, -1).join(" "),
    lastName: parts[parts.length - 1],
  };
}

function parseAddress(address: string | null | undefined, city: string): {
  street: string;
  city: string;
  state: string;
  zip: string;
} {
  const raw = (address || "").trim();
  if (!raw) {
    return { street: "", city: city || "", state: "ID", zip: "" };
  }

  // Try to match a US zip at the end (5 or 9 digits)
  const zipMatch = raw.match(/\b(\d{5}(?:-\d{4})?)\b\s*$/);
  const zip = zipMatch ? zipMatch[1] : "";
  let withoutZip = zip ? raw.slice(0, raw.length - zipMatch![0].length).trim() : raw;
  // Strip trailing punctuation
  withoutZip = withoutZip.replace(/[,\s]+$/, "");

  // State: look for ", ID" or " ID" near the end
  let state = "ID";
  const stateMatch = withoutZip.match(/[,\s]+(ID|Idaho)\b\s*$/i);
  let withoutState = withoutZip;
  if (stateMatch) {
    state = "ID";
    withoutState = withoutZip.slice(0, withoutZip.length - stateMatch[0].length).trim();
    withoutState = withoutState.replace(/[,\s]+$/, "");
  }

  // City: prefer the explicit city field; otherwise pull last comma-separated segment
  let detectedCity = city || "";
  let street = withoutState;
  if (!detectedCity) {
    const idx = withoutState.lastIndexOf(",");
    if (idx >= 0) {
      detectedCity = withoutState.slice(idx + 1).trim();
      street = withoutState.slice(0, idx).trim();
    } else {
      street = withoutState;
    }
  } else {
    // If the address contains the city at the end, strip it from the street
    const cityRe = new RegExp(`[,\\s]+${escapeRegExp(detectedCity)}\\s*$`, "i");
    const m = withoutState.match(cityRe);
    if (m) {
      street = withoutState.slice(0, withoutState.length - m[0].length).trim();
      street = street.replace(/[,\s]+$/, "");
    } else {
      street = withoutState;
    }
  }

  return { street, city: detectedCity, state, zip };
}

function escapeRegExp(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function calcQuoteRange(value: string | null | undefined, variance = 0.15): string {
  if (!value) return "";
  const n = typeof value === "number" ? value : parseFloat(value);
  if (!Number.isFinite(n) || n <= 0) return "";
  const min = Math.round(n * (1 - variance));
  const max = Math.round(n * (1 + variance));
  return `$${min.toLocaleString()} - $${max.toLocaleString()}`;
}

function formatPurchaseDate(d: string | Date | null | undefined): string {
  if (!d) return "";
  const date = typeof d === "string" ? new Date(d) : d;
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

function buildNotes(
  lead: ExportableLead,
  getServiceName: (slug: string) => string,
): string {
  const lines: string[] = [];
  const primary = getServiceName(lead.serviceType);
  if (primary) lines.push(`Service: ${primary}`);
  if (lead.selectedServices && lead.selectedServices.length > 1) {
    lines.push(
      `All services: ${lead.selectedServices.map(getServiceName).join(", ")}`,
    );
  }
  if (lead.frequency) lines.push(`Frequency: ${lead.frequency}`);
  const range = calcQuoteRange(lead.finalQuote);
  if (range) lines.push(`Estimated quote: ${range}`);
  if (lead.propertySize) lines.push(`Property size: ${lead.propertySize}`);
  if (lead.propertyType) lines.push(`Property type: ${lead.propertyType}`);
  if (lead.message) lines.push(`Customer message: ${lead.message}`);
  const purchasedOn = formatPurchaseDate(lead.purchasedAt || lead.createdAt);
  lines.push(
    `Lead source: Boise Construction Co${purchasedOn ? ` - purchased ${purchasedOn}` : ""}`,
  );
  return lines.join("\n");
}

const YARDBOOK_HEADERS = [
  "First Name",
  "Last Name",
  "Email",
  "Phone",
  "Address",
  "City",
  "State",
  "Zip",
  "Notes",
];

const FULL_HEADERS = [
  "Lead ID",
  "Purchased At",
  "Lead Created At",
  "Name",
  "Email",
  "Phone",
  "Address",
  "City",
  "State",
  "Zip",
  "Property Type",
  "Property Size",
  "Primary Service",
  "Service Type (raw)",
  "All Services",
  "Selected Services (raw)",
  "Frequency",
  "Estimated Quote Range",
  "Estimated Quote (raw)",
  "Lead Price Paid",
  "Customer Message",
  "Line Items (JSON)",
];

function toFullDateTime(d: string | Date | null | undefined): string {
  if (!d) return "";
  const date = typeof d === "string" ? new Date(d) : d;
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString();
}

export function buildLeadCsv(leads: ExportableLead[], opts: CsvBuildOptions): string {
  const getServiceName =
    opts.getServiceName ||
    ((slug: string) =>
      slug ? slug.replace(/-/g, " ").replace(/\b\w/g, l => l.toUpperCase()) : "");

  if (opts.format === "yardbook") {
    const rows = leads.map(lead => {
      const { firstName, lastName } = splitName(lead.name);
      const { street, city, state, zip } = parseAddress(lead.address, lead.city);
      return {
        "First Name": firstName,
        "Last Name": lastName,
        Email: lead.email,
        Phone: lead.phone || "",
        Address: street,
        City: city,
        State: state,
        Zip: zip,
        Notes: buildNotes(lead, getServiceName),
      };
    });
    return rowsToCsv(YARDBOOK_HEADERS, rows);
  }

  // full
  const rows = leads.map(lead => {
    const { street, city, state, zip } = parseAddress(lead.address, lead.city);
    const allServices = (lead.selectedServices || [])
      .map(getServiceName)
      .join(", ");
    return {
      "Lead ID": lead.id,
      "Purchased At": toFullDateTime(lead.purchasedAt),
      "Lead Created At": toFullDateTime(lead.createdAt),
      Name: lead.name,
      Email: lead.email,
      Phone: lead.phone || "",
      Address: street,
      City: city,
      State: state,
      Zip: zip,
      "Property Type": lead.propertyType || "",
      "Property Size": lead.propertySize ? String(lead.propertySize) : "",
      "Primary Service": getServiceName(lead.serviceType),
      "Service Type (raw)": lead.serviceType || "",
      "All Services": allServices,
      "Selected Services (raw)": (lead.selectedServices || []).join(", "),
      Frequency: lead.frequency || "",
      "Estimated Quote Range": calcQuoteRange(lead.finalQuote),
      "Estimated Quote (raw)": lead.finalQuote || "",
      "Lead Price Paid": lead.purchasePrice || lead.currentLeadPrice || "",
      "Customer Message": lead.message || "",
      "Line Items (JSON)": lead.lineItems ? JSON.stringify(lead.lineItems) : "",
    };
  });
  return rowsToCsv(FULL_HEADERS, rows);
}

export function buildCsvFilename(format: CsvFormat, date: Date = new Date()): string {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  const stamp = `${yyyy}-${mm}-${dd}`;
  const suffix = format === "yardbook" ? "yardbook" : "full";
  return `boiseconstruction-purchased-leads-${suffix}-${stamp}.csv`;
}

export function downloadCsv(csv: string, filename: string): void {
  if (typeof window === "undefined") return;
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  // Allow the click to start before revoking
  setTimeout(() => URL.revokeObjectURL(url), 100);
}
