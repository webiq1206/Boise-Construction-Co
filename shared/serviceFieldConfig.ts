/**
 * Service field configuration for new residential construction project types.
 * Defines which measurement fields are shown in the quote/lead forms for each service.
 */

export type MeasurementType =
  | "propertySize"      // finished sq ft of the home being built
  | "budgetRange"       // approximate budget
  | "roomCount"         // number of rooms
  | "stories"           // number of stories
  | "lotSize"           // parcel size for feasibility work
  | "notes";            // free-form project notes

export interface FieldConfig {
  id: string;
  label: string;
  helpText?: string;
  placeholder?: string;
  unit?: string;
  type: "number" | "text" | "select" | "textarea";
  required?: boolean;
  options?: { value: string; label: string }[];
}

export interface ServiceFieldConfig {
  serviceId: string;
  displayName: string;
  measurementType: MeasurementType;
  fields: FieldConfig[];
}

/** Reused across the whole-home build types so the finish tiers stay aligned. */
const FINISH_LEVEL_FIELD: FieldConfig = {
  id: "finishLevel",
  label: "Finish level",
  helpText: "Drives roughly a $150 per square foot spread on a new build",
  type: "select",
  options: [
    { value: "standard", label: "Standard" },
    { value: "premium", label: "Premium" },
    { value: "luxury", label: "Luxury / Custom" },
  ],
  required: false,
};

const LOT_STATUS_FIELD: FieldConfig = {
  id: "lotStatus",
  label: "Where are you with land?",
  type: "select",
  options: [
    { value: "owned", label: "I already own the lot" },
    { value: "under-contract", label: "Under contract" },
    { value: "searching", label: "Still looking" },
  ],
  required: false,
};

const STORIES_FIELD: FieldConfig = {
  id: "stories",
  label: "Number of stories",
  type: "select",
  options: [
    { value: "1", label: "Single-story" },
    { value: "2", label: "Two-story" },
    { value: "daylight-basement", label: "Single-story with daylight basement" },
  ],
  required: false,
};

export const SERVICE_FIELD_CONFIGS: ServiceFieldConfig[] = [
  {
    serviceId: "custom-home-builder",
    displayName: "Custom Home Building",
    measurementType: "propertySize",
    fields: [
      {
        id: "propertySize",
        label: "Finished square footage",
        helpText: "Heated living space, excluding garage and unfinished basement",
        placeholder: "e.g., 2400",
        unit: "sq ft",
        type: "number",
        required: false,
      },
      STORIES_FIELD,
      FINISH_LEVEL_FIELD,
      LOT_STATUS_FIELD,
    ],
  },
  {
    serviceId: "semi-custom-homes",
    displayName: "Semi-Custom Homes",
    measurementType: "propertySize",
    fields: [
      {
        id: "propertySize",
        label: "Finished square footage",
        helpText: "Approximate size of the home you have in mind",
        placeholder: "e.g., 2000",
        unit: "sq ft",
        type: "number",
        required: false,
      },
      STORIES_FIELD,
      FINISH_LEVEL_FIELD,
      LOT_STATUS_FIELD,
    ],
  },
  {
    serviceId: "build-on-your-lot",
    displayName: "Build on Your Lot",
    measurementType: "propertySize",
    fields: [
      {
        id: "propertySize",
        label: "Finished square footage",
        helpText: "Heated living space, excluding garage and unfinished basement",
        placeholder: "e.g., 2400",
        unit: "sq ft",
        type: "number",
        required: false,
      },
      {
        id: "lotSize",
        label: "Lot size",
        helpText: "Acres, or leave blank if you are not sure",
        placeholder: "e.g., 1.5",
        unit: "acres",
        type: "number",
        required: false,
      },
      {
        id: "utilities",
        label: "Utilities at the lot",
        helpText: "Rural parcels needing a well and septic add meaningful cost",
        type: "select",
        options: [
          { value: "city", label: "City water and sewer available" },
          { value: "well-septic", label: "Needs well and/or septic" },
          { value: "unknown", label: "Not sure" },
        ],
        required: false,
      },
      FINISH_LEVEL_FIELD,
    ],
  },
  {
    serviceId: "design-build",
    displayName: "Design-Build",
    measurementType: "propertySize",
    fields: [
      {
        id: "propertySize",
        label: "Finished square footage",
        placeholder: "e.g., 2400",
        unit: "sq ft",
        type: "number",
        required: false,
      },
      FINISH_LEVEL_FIELD,
      LOT_STATUS_FIELD,
    ],
  },
  {
    serviceId: "home-plans-design",
    displayName: "Home Design & Plans",
    measurementType: "propertySize",
    fields: [
      {
        id: "propertySize",
        label: "Target finished square footage",
        placeholder: "e.g., 2400",
        unit: "sq ft",
        type: "number",
        required: false,
      },
      {
        id: "designStage",
        label: "Where are you in the process?",
        type: "select",
        options: [
          { value: "concept", label: "Just an idea so far" },
          { value: "sketches", label: "I have sketches or a wish list" },
          { value: "existing-plans", label: "I have plans that need adapting" },
        ],
        required: false,
      },
      LOT_STATUS_FIELD,
    ],
  },
  {
    serviceId: "lot-evaluation",
    displayName: "Lot Evaluation & Feasibility",
    measurementType: "lotSize",
    fields: [
      {
        id: "lotSize",
        label: "Lot size",
        placeholder: "e.g., 5",
        unit: "acres",
        type: "number",
        required: false,
      },
      {
        id: "lotStatus",
        label: "Do you own it yet?",
        type: "select",
        options: [
          { value: "owned", label: "Yes, I own it" },
          { value: "under-contract", label: "Under contract" },
          { value: "considering", label: "Considering an offer" },
        ],
        required: false,
      },
      {
        id: "notes",
        label: "Anything you already know about the parcel?",
        helpText: "Address or parcel number, slope, access, utilities, known issues",
        placeholder: "Describe the lot...",
        type: "textarea",
        required: false,
      },
    ],
  },
  {
    serviceId: "shop-homes-barndominiums",
    displayName: "Shop Homes & Barndominiums",
    measurementType: "propertySize",
    fields: [
      {
        id: "propertySize",
        label: "Finished living square footage",
        placeholder: "e.g., 1600",
        unit: "sq ft",
        type: "number",
        required: false,
      },
      {
        id: "shopSize",
        label: "Shop square footage",
        helpText: "The living-to-shop ratio drives blended cost more than total size",
        placeholder: "e.g., 1200",
        unit: "sq ft",
        type: "number",
        required: false,
      },
      FINISH_LEVEL_FIELD,
      LOT_STATUS_FIELD,
    ],
  },
  {
    serviceId: "energy-efficient-homes",
    displayName: "Energy-Efficient Homes",
    measurementType: "propertySize",
    fields: [
      {
        id: "propertySize",
        label: "Finished square footage",
        placeholder: "e.g., 2400",
        unit: "sq ft",
        type: "number",
        required: false,
      },
      {
        id: "performanceTarget",
        label: "Performance target",
        type: "select",
        options: [
          { value: "above-code", label: "Comfortably above code" },
          { value: "high-performance", label: "High performance" },
          { value: "net-zero-ready", label: "Net-zero ready" },
        ],
        required: false,
      },
      FINISH_LEVEL_FIELD,
      LOT_STATUS_FIELD,
    ],
  },
];

export function getServiceFieldConfig(serviceId: string): ServiceFieldConfig | undefined {
  return SERVICE_FIELD_CONFIGS.find(c => c.serviceId === serviceId);
}
