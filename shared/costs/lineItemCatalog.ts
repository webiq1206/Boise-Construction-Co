/**
 * GENERATED FILE - do not edit by hand.
 *
 * Source: two owner-supplied workbooks, cross-checked against each other:
 *   - "Record - Timber and Love - Master Estimate Buildertrend Import Template - v1.xlsx"
 *   - "Report - Timber and Love - Cost Estimates Schedule - v2.csv.xlsx"
 * Every cost agreed exactly between the two files (0 discrepancies across 209 codes).
 *
 * These are COST figures and carry NO margin. Margin is applied by the pricing
 * engine as a true gross margin (cost / (1 - GM)), never as a markup. See
 * shared/costs/pricing.ts.
 *
 * Two cost codes present in the schedule are DELIBERATELY EXCLUDED here:
 *   F-01-02  Phase 1 + 2 Design-Build Fees   25%
 *   F-03-00  Phase 3 Design-Build Fees       25%
 * Those are the source firm's own fee structure. Boise Construction Co applies its
 * own gross-margin target instead, so carrying both would double-count margin.
 *
 * Two source rows carry a BLANK unit-of-measure cell. They are defaulted to EA
 * and marked inline. Neither is referenced by any scope rule, so the default
 * never reaches a price; it exists so the catalog stays type-safe and complete.
 *
 * The 27 zero-cost "Other ..." rows ARE retained. They are per-division
 * catch-alls with no rate, used by an estimator to add custom scope by hand.
 * The automatic scope builder never selects them; they exist so the catalog is a
 * faithful copy of the source and so admin tooling can offer them.
 */

/** Unit of measure as published in the source workbooks. */
export type Uom = "%" | "EA" | "HR" | "LF" | "MO" | "SF";

/** Cost classification as published in the source workbooks. */
export type CostType = "Material" | "Labor" | "Subcontractor" | "Equipment" | "Other";

/** Project phase the line item belongs to. */
export type Phase = "PHASE 1 (PLAN)" | "PHASE 2 (DESIGN)" | "PHASE 3 (BUILD)";

export interface LineItem {
  /** Source cost code, e.g. "03-17-01-M". Suffix -M/-L marks a material/labor split. */
  code: string;
  phase: Phase;
  /** Parent trade. This is the level a homeowner-facing or admin rollup reports at. */
  division: string;
  description: string;
  type: CostType;
  uom: Uom;
  /** Unit cost in USD, excluding margin. Null only where the source left it blank. */
  cost: number;
  /** What the line covers, verbatim from the source workbook. */
  scope: string;
}

/** Stable slug per division, for keying scope rules without repeating display strings. */
export const DIVISIONS = {
  "planning": "PLANNING",
  "design": "DESIGN",
  "administration": "ADMINISTRATION",
  "site-requirements": "SITE REQUIREMENTS",
  "site-work": "SITE WORK",
  "foundation": "FOUNDATION",
  "framing": "FRAMING",
  "envelope-protection": "ENVELOPE PROTECTION",
  "exterior-openings": "EXTERIOR OPENINGS",
  "mechanical-hvac": "MECHANICAL (HVAC)",
  "electrical": "ELECTRICAL",
  "plumbing": "PLUMBING",
  "exterior-finishes": "EXTERIOR FINISHES",
  "insulation": "INSULATION",
  "drywall": "DRYWALL",
  "painting-and-wallpaper": "PAINTING + WALLPAPER",
  "flooring": "FLOORING",
  "tile-and-stone": "TILE + STONE",
  "countertops-and-cabinetry": "COUNTERTOPS + CABINETRY",
  "interior-doors-and-millwork": "INTERIOR DOORS + MILLWORK",
  "hardware-and-glass": "HARDWARE + GLASS",
  "appliances": "APPLIANCES",
  "specialty-elements": "SPECIALTY ELEMENTS",
  "landscape": "LANDSCAPE",
  "pre-occupancy": "PRE-OCCUPANCY",
  "furnishings": "FURNISHINGS",
  "design-and-build-labor": "DESIGN + BUILD LABOR",
} as const;

export type DivisionId = keyof typeof DIVISIONS;

export const LINE_ITEMS: LineItem[] = [
  { code: "01-00-01", phase: "PHASE 1 (PLAN)", division: "PLANNING", description: "Home Inspection", type: "Subcontractor", uom: "EA", cost: 850, scope: "Comprehensive evaluation of structural integrity, mechanical systems, electrical systems, plumbing, roofing, foundation, and existing deficiencies" },
  { code: "01-00-02", phase: "PHASE 1 (PLAN)", division: "PLANNING", description: "Hazardous Material Testing", type: "Subcontractor", uom: "EA", cost: 1200, scope: "Professional testing and analysis for asbestos, lead paint, mold, radon, and other hazardous materials including lab reports and remediation recommendations" },
  { code: "01-00-03", phase: "PHASE 1 (PLAN)", division: "PLANNING", description: "Location Analysis", type: "Subcontractor", uom: "EA", cost: 1500, scope: "Comprehensive evaluation of property including zoning requirements, setbacks, easements, HOA restrictions, utility locations, soil conditions, and environmental factors" },
  { code: "01-00-04", phase: "PHASE 1 (PLAN)", division: "PLANNING", description: "Special Needs", type: "Subcontractor", uom: "EA", cost: 1200, scope: "Analysis of specific project requirements including ADA compliance, aging-in-place features, smart home integration, security systems, and specialty equipment needs" },
  { code: "01-00-05", phase: "PHASE 1 (PLAN)", division: "PLANNING", description: "As Builts", type: "Subcontractor", uom: "SF", cost: 0.75, scope: "Detailed documentation of existing conditions including floor plans, elevations, sections, site plan, and system locations" },
  { code: "01-00-06", phase: "PHASE 1 (PLAN)", division: "PLANNING", description: "Architecture (Schematic)", type: "Subcontractor", uom: "SF", cost: 3.5, scope: "Initial design concept including space planning, preliminary floor plans, exterior elevations, 3D visualization, and material recommendations" },
  { code: "01-00-99", phase: "PHASE 1 (PLAN)", division: "PLANNING", description: "Other Planning", type: "Other", uom: "EA", cost: 0, scope: "Additional planning services including specialized consultants, feasibility studies, and supplementary investigations" },
  { code: "02-00-01", phase: "PHASE 2 (DESIGN)", division: "DESIGN", description: "Architecture (Design Development/Construction Docs)", type: "Subcontractor", uom: "SF", cost: 4.5, scope: "Complete architectural documentation including dimensioned floor plans, exterior elevations, building sections, interior elevations, reflected ceiling plans, door/window schedules, finish schedules, architectural details, built-in millwork drawings, and written specifications required for permitting and construction" },
  { code: "02-00-02", phase: "PHASE 2 (DESIGN)", division: "DESIGN", description: "Schematic MEPs", type: "Subcontractor", uom: "EA", cost: 2000, scope: "Preliminary mechanical, electrical, and plumbing design including equipment locations, distribution systems, and load calculations" },
  { code: "02-00-03", phase: "PHASE 2 (DESIGN)", division: "DESIGN", description: "Engineering", type: "Subcontractor", uom: "HR", cost: 150, scope: "Complete structural engineering including foundation design, framing plans, load calculations, and technical specifications" },
  { code: "02-00-04", phase: "PHASE 2 (DESIGN)", division: "DESIGN", description: "Landscape Design", type: "Subcontractor", uom: "SF", cost: 2.5, scope: "Comprehensive exterior design including hardscape plans, planting selections, irrigation systems, lighting design, and outdoor living spaces" },
  { code: "02-00-05", phase: "PHASE 2 (DESIGN)", division: "DESIGN", description: "Plan Approvals", type: "Other", uom: "EA", cost: 2500, scope: "Management of permit submission process including jurisdiction coordination, response to comments, and tracking of approvals" },
  { code: "02-00-06", phase: "PHASE 2 (DESIGN)", division: "DESIGN", description: "Architecture (Revisions)", type: "Subcontractor", uom: "SF", cost: 2, scope: "Design modifications during development including client requested changes, value engineering, and system coordination" },
  { code: "02-00-99", phase: "PHASE 2 (DESIGN)", division: "DESIGN", description: "Other Design", type: "Other", uom: "EA", cost: 0, scope: "Additional design services including specialty consultants, material research, and supplementary documentation" },
  { code: "03-01-01", phase: "PHASE 3 (BUILD)", division: "ADMINISTRATION", description: "Permitting Fees", type: "Other", uom: "EA", cost: 4000, scope: "All required municipal fees including building permits, plan review, impact fees, utility connections, and special permits" },
  { code: "03-01-02", phase: "PHASE 3 (BUILD)", division: "ADMINISTRATION", description: "Insurance", type: "Other", uom: "MO", cost: 350, scope: "Project-specific builder's risk coverage." },
  { code: "03-01-03", phase: "PHASE 3 (BUILD)", division: "ADMINISTRATION", description: "Architecture (Revisions)", type: "Subcontractor", uom: "SF", cost: 2, scope: "Design modifications during development including client requested changes, value engineering, and system coordination" },
  { code: "03-01-04", phase: "PHASE 3 (BUILD)", division: "ADMINISTRATION", description: "Engineering (Revisions)", type: "Subcontractor", uom: "HR", cost: 150, scope: "Construction phase engineering adjustments including structural modifications and systems coordination" },
  { code: "03-01-99", phase: "PHASE 3 (BUILD)", division: "ADMINISTRATION", description: "Other Administration", type: "Other", uom: "EA", cost: 0, scope: "Additional administrative costs including project management, documentation, and specialized reporting" },
  { code: "03-02-01", phase: "PHASE 3 (BUILD)", division: "SITE REQUIREMENTS", description: "Temp Utilities", type: "Equipment", uom: "MO", cost: 450, scope: "Temporary services including electrical power, water supply, gas, and communication systems during construction" },
  { code: "03-02-02", phase: "PHASE 3 (BUILD)", division: "SITE REQUIREMENTS", description: "Temp Restroom", type: "Equipment", uom: "MO", cost: 160, scope: "Portable sanitation facilities including regular maintenance, handwashing stations, and required site amenities" },
  { code: "03-02-03", phase: "PHASE 3 (BUILD)", division: "SITE REQUIREMENTS", description: "Temp Equipment Rentals", type: "Equipment", uom: "EA", cost: 800, scope: "Construction equipment including lifts, scaffolding, power tools, and specialized machinery" },
  { code: "03-02-04", phase: "PHASE 3 (BUILD)", division: "SITE REQUIREMENTS", description: "Temp Protection", type: "Material", uom: "SF", cost: 0.8, scope: "Site protection measures including weather barriers, security fencing, tree protection, and existing structure safeguards" },
  { code: "03-02-05", phase: "PHASE 3 (BUILD)", division: "SITE REQUIREMENTS", description: "Site Storage", type: "Equipment", uom: "MO", cost: 200, scope: "Secure storage solutions including containers, temporary structures, and material protection systems" },
  { code: "03-02-06", phase: "PHASE 3 (BUILD)", division: "SITE REQUIREMENTS", description: "Dumpster", type: "Equipment", uom: "MO", cost: 150, scope: "Construction waste management including sorting, recycling, regular removal, and environmental compliance" },
  { code: "03-02-07", phase: "PHASE 3 (BUILD)", division: "SITE REQUIREMENTS", description: "Daily Clean", type: "Labor", uom: "MO", cost: 200, scope: "Site maintenance including debris removal, walkway clearing, dust control, and general site organization" },
  { code: "03-02-99", phase: "PHASE 3 (BUILD)", division: "SITE REQUIREMENTS", description: "Other Site Requirements", type: "Other", uom: "EA", cost: 0, scope: "Additional site needs including traffic control, noise mitigation, and neighborhood impact management" },
  { code: "03-03-01", phase: "PHASE 3 (BUILD)", division: "SITE WORK", description: "BMPs", type: "Material", uom: "MO", cost: 125, scope: "Environmental protection including erosion control, water management, dust mitigation, and soil stabilization" },
  { code: "03-03-02", phase: "PHASE 3 (BUILD)", division: "SITE WORK", description: "Tree Cutting + Lot Clearing", type: "Subcontractor", uom: "EA", cost: 2500, scope: "Site preparation including vegetation removal, stump extraction, brush clearing, and initial grading" },
  { code: "03-03-03", phase: "PHASE 3 (BUILD)", division: "SITE WORK", description: "Hazardous Material Abatement", type: "Subcontractor", uom: "SF", cost: 8, scope: "Professional removal of hazardous materials including containment, disposal, and clearance testing" },
  { code: "03-03-04", phase: "PHASE 3 (BUILD)", division: "SITE WORK", description: "Building Demolition + Haul", type: "Subcontractor", uom: "SF", cost: 5, scope: "Structure removal including selective demolition, debris sorting, recycling, and proper disposal" },
  { code: "03-03-05", phase: "PHASE 3 (BUILD)", division: "SITE WORK", description: "Grading", type: "Subcontractor", uom: "SF", cost: 2, scope: "Site leveling including cut and fill, compaction, drainage slopes, and finish grading" },
  { code: "03-03-06", phase: "PHASE 3 (BUILD)", division: "SITE WORK", description: "Construction Staking", type: "Subcontractor", uom: "EA", cost: 500, scope: "Survey work including property lines, building corners, utilities, and elevation benchmarks" },
  { code: "03-03-07", phase: "PHASE 3 (BUILD)", division: "SITE WORK", description: "Shoring + Underpinning", type: "Subcontractor", uom: "EA", cost: 2250, scope: "Structural support systems including temporary bracing, excavation protection, and foundation reinforcement" },
  { code: "03-03-08", phase: "PHASE 3 (BUILD)", division: "SITE WORK", description: "Permanent Water + Sewer/Septic", type: "Subcontractor", uom: "EA", cost: 3000, scope: "Utility connections including water main, sewer lines, septic systems, and required inspections" },
  { code: "03-03-09", phase: "PHASE 3 (BUILD)", division: "SITE WORK", description: "Permanent Gas + Electrical", type: "Subcontractor", uom: "EA", cost: 4000, scope: "Primary service installations including gas lines, electrical service, transformers, and meters" },
  { code: "03-03-99", phase: "PHASE 3 (BUILD)", division: "SITE WORK", description: "Other Site Work", type: "Other", uom: "EA", cost: 0, scope: "Additional site preparation including specialized drainage, soil amendments, and site access improvements" },
  { code: "03-04-01", phase: "PHASE 3 (BUILD)", division: "FOUNDATION", description: "Excavation + Backfill", type: "Subcontractor", uom: "SF", cost: 9, scope: "Site preparation including foundation footprint excavation, soil preparation, compaction testing, and engineered backfill" },
  { code: "03-04-02", phase: "PHASE 3 (BUILD)", division: "FOUNDATION", description: "Footings", type: "Subcontractor", uom: "LF", cost: 120, scope: "Structural foundation elements including reinforcement, concrete placement, curing, and inspection" },
  { code: "03-04-03", phase: "PHASE 3 (BUILD)", division: "FOUNDATION", description: "Slab/Flatwork", type: "Subcontractor", uom: "SF", cost: 12, scope: "Concrete installation including vapor barriers, reinforcement, finish work, control joints, and curing" },
  { code: "03-04-04", phase: "PHASE 3 (BUILD)", division: "FOUNDATION", description: "Waterproofing + Drains", type: "Subcontractor", uom: "SF", cost: 2, scope: "Moisture protection including foundation wraps, drainage mats, perimeter drains, and sump systems" },
  { code: "03-04-05", phase: "PHASE 3 (BUILD)", division: "FOUNDATION", description: "Radon Mitigation", type: "Subcontractor", uom: "EA", cost: 1200, scope: "Radon control systems including sub-slab preparation, vent pipes, and monitoring equipment" },
  { code: "03-04-06", phase: "PHASE 3 (BUILD)", division: "FOUNDATION", description: "Foundation Insulation", type: "Material", uom: "SF", cost: 1.5, scope: "Thermal barrier installation including rigid insulation, protection board, and thermal breaks" },
  { code: "03-04-99", phase: "PHASE 3 (BUILD)", division: "FOUNDATION", description: "Other Foundation", type: "Other", uom: "EA", cost: 0, scope: "Additional foundation elements including specialized footings, grade beams, and structural pads" },
  { code: "03-05-01-M", phase: "PHASE 3 (BUILD)", division: "FRAMING", description: "Structural Steel - Materials", type: "Material", uom: "SF", cost: 4, scope: "Steel members including beams, columns, connectors, and hardware for structural framework" },
  { code: "03-05-01-L", phase: "PHASE 3 (BUILD)", division: "FRAMING", description: "Structural Steel - Labor", type: "Labor", uom: "SF", cost: 4, scope: "Professional installation of steel framework including welding, bolting, and structural connections" },
  { code: "03-05-02-M", phase: "PHASE 3 (BUILD)", division: "FRAMING", description: "Framing - Materials", type: "Material", uom: "SF", cost: 6, scope: "Wood framing materials including dimensional lumber, sheathing, hardware, and engineered products" },
  { code: "03-05-02-L", phase: "PHASE 3 (BUILD)", division: "FRAMING", description: "Framing - Labor", type: "Labor", uom: "SF", cost: 10, scope: "Wood frame construction including walls, floors, roof structures, and required bracing" },
  { code: "03-05-03-M", phase: "PHASE 3 (BUILD)", division: "FRAMING", description: "Trusses - Materials", type: "Material", uom: "SF", cost: 2, scope: "Engineered roof and floor trusses including hardware, brackets, and hurricane ties" },
  { code: "03-05-03-L", phase: "PHASE 3 (BUILD)", division: "FRAMING", description: "Trusses - Labor", type: "Labor", uom: "SF", cost: 8, scope: "Professional installation of engineered trusses including proper spacing, bracing, and connections" },
  { code: "03-05-99", phase: "PHASE 3 (BUILD)", division: "FRAMING", description: "Other Framing", type: "Other", uom: "EA", cost: 0, scope: "Additional framing elements including specialized supports, architectural features, and blocking" },
  { code: "03-06-01-M", phase: "PHASE 3 (BUILD)", division: "ENVELOPE PROTECTION", description: "House Wrap/Dry-in - Materials", type: "Material", uom: "SF", cost: 0.3, scope: "Weather barrier materials including building wrap, flashings, tapes, and sealing components" },
  { code: "03-06-01-L", phase: "PHASE 3 (BUILD)", division: "ENVELOPE PROTECTION", description: "House Wrap/Dry-in - Labor", type: "Labor", uom: "SF", cost: 0.2, scope: "Professional installation of weather barriers including proper overlaps, sealing, and integration with openings" },
  { code: "03-06-99", phase: "PHASE 3 (BUILD)", division: "ENVELOPE PROTECTION", description: "Other Envelope Protection", type: "Other", uom: "EA", cost: 0, scope: "Additional weatherization including specialized barriers, rainscreens, and moisture management systems" },
  { code: "03-07-01", phase: "PHASE 3 (BUILD)", division: "EXTERIOR OPENINGS", description: "Garage Doors", type: "Subcontractor", uom: "EA", cost: 1500, scope: "Complete garage door systems including tracks, openers, safety features, and weather sealing" },
  { code: "03-07-02-M", phase: "PHASE 3 (BUILD)", division: "EXTERIOR OPENINGS", description: "Exterior Doors - Materials", type: "Material", uom: "EA", cost: 1000, scope: "Door units including frames, thresholds, weatherstripping, and hardware" },
  { code: "03-07-02-L", phase: "PHASE 3 (BUILD)", division: "EXTERIOR OPENINGS", description: "Exterior Doors - Labor", type: "Labor", uom: "EA", cost: 200, scope: "Professional door installation including flashing, weatherproofing, and operational testing" },
  { code: "03-07-03-M", phase: "PHASE 3 (BUILD)", division: "EXTERIOR OPENINGS", description: "Windows - Materials", type: "Material", uom: "SF", cost: 7.6, scope: "Window units including frames, screens, energy-efficient glazing, and flashings" },
  { code: "03-07-03-L", phase: "PHASE 3 (BUILD)", division: "EXTERIOR OPENINGS", description: "Windows - Labor", type: "Labor", uom: "SF", cost: 1, scope: "Professional window installation including proper leveling, sealing, and weather protection" },
  { code: "03-07-04-M", phase: "PHASE 3 (BUILD)", division: "EXTERIOR OPENINGS", description: "Accordion Doors + Sliders - Materials", type: "Material", uom: "EA", cost: 1000, scope: "Large format door systems including tracks, hardware, and multi-point locking mechanisms" },
  { code: "03-07-04-L", phase: "PHASE 3 (BUILD)", division: "EXTERIOR OPENINGS", description: "Accordion Doors + Sliders - Labor", type: "Labor", uom: "EA", cost: 200, scope: "Specialized installation of large door systems including alignment, weatherproofing, and operation testing" },
  { code: "03-07-05-M", phase: "PHASE 3 (BUILD)", division: "EXTERIOR OPENINGS", description: "Window Wells (Ladders, Grates, etc.) - Materials", type: "Material", uom: "EA", cost: 300, scope: "Window well components including drains, covers, ladders, and gravel base" },
  { code: "03-07-05-L", phase: "PHASE 3 (BUILD)", division: "EXTERIOR OPENINGS", description: "Window Wells (Ladders, Grates, etc.) - Labor", type: "Labor", uom: "EA", cost: 100, scope: "Professional installation including proper drainage, anchoring, and safety features" },
  { code: "03-07-99", phase: "PHASE 3 (BUILD)", division: "EXTERIOR OPENINGS", description: "Other Exterior Openings", type: "Other", uom: "EA", cost: 0, scope: "Additional components including specialty doors, custom units, and automated systems" },
  { code: "03-08-01", phase: "PHASE 3 (BUILD)", division: "MECHANICAL (HVAC)", description: "HVAC System", type: "Subcontractor", uom: "EA", cost: 25000, scope: "Complete heating and cooling system including equipment, ductwork, zoning controls, and smart thermostats" },
  { code: "03-08-02", phase: "PHASE 3 (BUILD)", division: "MECHANICAL (HVAC)", description: "Exhaust Ducting", type: "Subcontractor", uom: "EA", cost: 300, scope: "Ventilation systems including bathroom fans, kitchen exhaust, dryer vents, and fresh air intake" },
  { code: "03-08-03", phase: "PHASE 3 (BUILD)", division: "MECHANICAL (HVAC)", description: "Custom Registers", type: "Material", uom: "EA", cost: 75, scope: "Specialized vent covers including floor, wall, and ceiling registers with custom finishes" },
  { code: "03-08-99", phase: "PHASE 3 (BUILD)", division: "MECHANICAL (HVAC)", description: "Other HVAC", type: "Other", uom: "EA", cost: 0, scope: "Additional mechanical elements including humidification, air purification, and specialized controls" },
  { code: "03-09-01", phase: "PHASE 3 (BUILD)", division: "ELECTRICAL", description: "Data + Cabling", type: "Subcontractor", uom: "SF", cost: 2, scope: "Low voltage systems including network, audio/visual, security, and home automation wiring" },
  { code: "03-09-02", phase: "PHASE 3 (BUILD)", division: "ELECTRICAL", description: "Radiant Heat", type: "Subcontractor", uom: "EA", cost: 3000, scope: "Electric floor heating including mats, thermostats, and load calculations" },
  { code: "03-09-03", phase: "PHASE 3 (BUILD)", division: "ELECTRICAL", description: "Solar", type: "Subcontractor", uom: "EA", cost: 20000, scope: "Solar power system including panels, inverters, batteries, and monitoring equipment" },
  { code: "03-09-04-M", phase: "PHASE 3 (BUILD)", division: "ELECTRICAL", description: "Standard Interior Electrical Fixtures - Materials", type: "Material", uom: "SF", cost: 2, scope: "Basic light fixtures, switches, and outlets for interior spaces" },
  { code: "03-09-05-M", phase: "PHASE 3 (BUILD)", division: "ELECTRICAL", description: "Standard Exterior Electrical Fixtures - Materials", type: "Material", uom: "SF", cost: 2, scope: "Basic outdoor lighting, outlets, and security fixtures" },
  { code: "03-09-06-M", phase: "PHASE 3 (BUILD)", division: "ELECTRICAL", description: "Decorative Interior Electrical Fixtures - Materials", type: "Material", uom: "SF", cost: 3.5, scope: "Designer light fixtures, specialty switches, and custom electrical elements" },
  { code: "03-09-07-M", phase: "PHASE 3 (BUILD)", division: "ELECTRICAL", description: "Decorative Exterior Electrical Fixtures - Materials", type: "Material", uom: "SF", cost: 3.5, scope: "Designer landscape lighting, architectural accents, and specialty outdoor fixtures" },
  { code: "03-09-08-L", phase: "PHASE 3 (BUILD)", division: "ELECTRICAL", description: "Electrical - Labor", type: "Labor", uom: "SF", cost: 6, scope: "Professional installation of all electrical systems including rough-in and finish work" },
  { code: "03-09-99", phase: "PHASE 3 (BUILD)", division: "ELECTRICAL", description: "Other Electrical", type: "Other", uom: "EA", cost: 0, scope: "Additional electrical components including generators, charging stations, and specialty systems" },
  { code: "03-10-01", phase: "PHASE 3 (BUILD)", division: "PLUMBING", description: "Water Heater", type: "Subcontractor", uom: "EA", cost: 1500, scope: "Water heating system including tank or tankless units, recirculation pumps, and thermal protection" },
  { code: "03-10-02", phase: "PHASE 3 (BUILD)", division: "PLUMBING", description: "Gas Lines", type: "Subcontractor", uom: "LF", cost: 25, scope: "Gas piping for appliances including pressure testing, regulators, and safety features" },
  { code: "03-10-03-M", phase: "PHASE 3 (BUILD)", division: "PLUMBING", description: "Plumbing Fixtures - Materials", type: "Material", uom: "SF", cost: 4, scope: "All fixtures including faucets, sinks, toilets, tubs, showers, and specialty water features" },
  { code: "03-10-03-L", phase: "PHASE 3 (BUILD)", division: "PLUMBING", description: "Plumbing - Labor", type: "Labor", uom: "SF", cost: 6, scope: "Professional installation of all water supply, drainage systems, and fixture mounting" },
  { code: "03-10-99", phase: "PHASE 3 (BUILD)", division: "PLUMBING", description: "Other Plumbing", type: "Other", uom: "EA", cost: 0, scope: "Additional components including water filtration, softeners, and specialized systems" },
  { code: "03-11-01-M", phase: "PHASE 3 (BUILD)", division: "EXTERIOR FINISHES", description: "Roofing - Materials", type: "Material", uom: "SF", cost: 3.5, scope: "Complete roofing system including underlayment, shingles/tiles, flashings, and ventilation" },
  { code: "03-11-01-L", phase: "PHASE 3 (BUILD)", division: "EXTERIOR FINISHES", description: "Roofing - Labor", type: "Labor", uom: "SF", cost: 2.5, scope: "Professional installation of all roofing components including proper water management" },
  { code: "03-11-02", phase: "PHASE 3 (BUILD)", division: "EXTERIOR FINISHES", description: "Custom Downspouts", type: "Material", uom: "LF", cost: 8, scope: "Specialized rainwater management including decorative downspouts and collection systems" },
  { code: "03-11-03", phase: "PHASE 3 (BUILD)", division: "EXTERIOR FINISHES", description: "Gutters", type: "Subcontractor", uom: "LF", cost: 8, scope: "Complete gutter system including collectors, downspouts, splash blocks, and leaf protection" },
  { code: "03-11-04", phase: "PHASE 3 (BUILD)", division: "EXTERIOR FINISHES", description: "Stucco", type: "Subcontractor", uom: "SF", cost: 10, scope: "Full stucco system including lath, multiple coats, texture finish, and proper moisture barriers" },
  { code: "03-11-05-M", phase: "PHASE 3 (BUILD)", division: "EXTERIOR FINISHES", description: "Timbers + Accents - Materials", type: "Material", uom: "SF", cost: 10, scope: "Decorative exterior elements including beams, brackets, and architectural details" },
  { code: "03-11-05-L", phase: "PHASE 3 (BUILD)", division: "EXTERIOR FINISHES", description: "Timbers + Accents - Labor", type: "Labor", uom: "SF", cost: 3, scope: "Professional installation of decorative elements including proper structural support" },
  { code: "03-11-06-M", phase: "PHASE 3 (BUILD)", division: "EXTERIOR FINISHES", description: "Exterior Siding + Trim - Materials", type: "Material", uom: "SF", cost: 4, scope: "Complete siding system including moisture barrier, trim, and decorative elements" },
  { code: "03-11-06-L", phase: "PHASE 3 (BUILD)", division: "EXTERIOR FINISHES", description: "Exterior Siding + Trim - Labor", type: "Labor", uom: "SF", cost: 5, scope: "Professional installation of all siding components and architectural details" },
  { code: "03-11-07-M", phase: "PHASE 3 (BUILD)", division: "EXTERIOR FINISHES", description: "Exterior Brick/Stone - Materials", type: "Material", uom: "SF", cost: 10, scope: "Masonry materials including brick/stone, mortar, ties, and moisture protection" },
  { code: "03-11-07-L", phase: "PHASE 3 (BUILD)", division: "EXTERIOR FINISHES", description: "Exterior Brick/Stone - Labor", type: "Labor", uom: "SF", cost: 10, scope: "Professional masonry installation including proper ties, weeping, and sealing" },
  { code: "03-11-99", phase: "PHASE 3 (BUILD)", division: "EXTERIOR FINISHES", description: "Other Exterior Finishes", type: "Other", uom: "EA" /* source UOM cell was blank; defaulted to EA */, cost: 0, scope: "14" },
  { code: "03-12-01-M", phase: "PHASE 3 (BUILD)", division: "INSULATION", description: "Insulation + Foam - Materials", type: "Material", uom: "SF", cost: 1, scope: "Complete insulation package including batts, blown-in, foam products, and vapor barriers" },
  { code: "03-12-01-L", phase: "PHASE 3 (BUILD)", division: "INSULATION", description: "Insulation + Foam - Labor", type: "Labor", uom: "SF", cost: 0.5, scope: "Professional installation of all insulation systems including air sealing and proper coverage" },
  { code: "03-12-99", phase: "PHASE 3 (BUILD)", division: "INSULATION", description: "Other Insulation", type: "Other", uom: "EA", cost: 0, scope: "Specialized insulation applications including soundproofing and thermal breaks" },
  { code: "03-13-01-M", phase: "PHASE 3 (BUILD)", division: "DRYWALL", description: "Drywall - Materials", type: "Material", uom: "SF", cost: 5, scope: "Complete wall/ceiling system including gypsum board, specialty boards, and finishing materials" },
  { code: "03-13-01-L", phase: "PHASE 3 (BUILD)", division: "DRYWALL", description: "Drywall - Labor", type: "Labor", uom: "SF", cost: 7.5, scope: "Professional installation including hanging, taping, texturing, and finish work" },
  { code: "03-13-99", phase: "PHASE 3 (BUILD)", division: "DRYWALL", description: "Other Drywall", type: "Other", uom: "EA", cost: 0, scope: "Specialty applications including curved walls, acoustical treatments, and access panels" },
  { code: "03-14-01-M", phase: "PHASE 3 (BUILD)", division: "PAINTING + WALLPAPER", description: "Interior Paint - Materials", type: "Material", uom: "SF", cost: 1.5, scope: "Complete paint system including primers, finish coats, and specialty finishes" },
  { code: "03-14-01-L", phase: "PHASE 3 (BUILD)", division: "PAINTING + WALLPAPER", description: "Interior Paint - Labor", type: "Labor", uom: "SF", cost: 4.5, scope: "Professional painting including surface prep, multiple coats, and detail work" },
  { code: "03-14-02-M", phase: "PHASE 3 (BUILD)", division: "PAINTING + WALLPAPER", description: "Exterior Paint - Materials", type: "Material", uom: "SF", cost: 1.5, scope: "Complete exterior finish including primers, weatherproof coatings, and sealants" },
  { code: "03-14-02-L", phase: "PHASE 3 (BUILD)", division: "PAINTING + WALLPAPER", description: "Exterior Paint - Labor", type: "Labor", uom: "SF", cost: 4.5, scope: "Professional application including surface prep, weather considerations, and trim details" },
  { code: "03-14-03-M", phase: "PHASE 3 (BUILD)", division: "PAINTING + WALLPAPER", description: "Wallpaper - Materials", type: "Material", uom: "EA", cost: 400, scope: "Wall coverings including papers, fabrics, and specialty architectural finishes" },
  { code: "03-14-03-L", phase: "PHASE 3 (BUILD)", division: "PAINTING + WALLPAPER", description: "Wallpaper - Labor", type: "Labor", uom: "EA", cost: 1200, scope: "Professional installation including surface prep, pattern matching, and detail work" },
  { code: "03-14-99", phase: "PHASE 3 (BUILD)", division: "PAINTING + WALLPAPER", description: "Other Painting + Wallpaper", type: "Other", uom: "EA", cost: 0, scope: "Specialized finishes including faux treatments, murals, and custom applications" },
  { code: "03-15-01-M", phase: "PHASE 3 (BUILD)", division: "FLOORING", description: "Hardwood Flooring - Materials", type: "Material", uom: "SF", cost: 8, scope: "Solid and engineered wood including underlayment, trim, and transition pieces" },
  { code: "03-15-01-L", phase: "PHASE 3 (BUILD)", division: "FLOORING", description: "Hardwood Flooring - Labor", type: "Labor", uom: "SF", cost: 12, scope: "Professional installation including subfloor prep, layout, and finish work" },
  { code: "03-15-02-M", phase: "PHASE 3 (BUILD)", division: "FLOORING", description: "LVP Flooring - Materials", type: "Material", uom: "SF", cost: 5, scope: "Luxury vinyl plank including underlayment, transitions, and trim pieces" },
  { code: "03-15-02-L", phase: "PHASE 3 (BUILD)", division: "FLOORING", description: "LVP Flooring - Labor", type: "Labor", uom: "SF", cost: 5, scope: "Professional installation including subfloor prep, moisture testing, and detail work" },
  { code: "03-15-03-M", phase: "PHASE 3 (BUILD)", division: "FLOORING", description: "Laminate Flooring - Materials", type: "Material", uom: "SF", cost: 4, scope: "Laminate materials including underlayment, moisture barriers, and trim pieces" },
  { code: "03-15-03-L", phase: "PHASE 3 (BUILD)", division: "FLOORING", description: "Laminate Flooring - Labor", type: "Labor", uom: "SF", cost: 4, scope: "Professional installation including proper expansion allowance and transitions" },
  { code: "03-15-04-M", phase: "PHASE 3 (BUILD)", division: "FLOORING", description: "Vinyl Flooring - Materials", type: "Material", uom: "SF", cost: 5, scope: "Sheet vinyl and tile including underlayment, adhesives, and trim pieces" },
  { code: "03-15-04-L", phase: "PHASE 3 (BUILD)", division: "FLOORING", description: "Vinyl Flooring - Labor", type: "Labor", uom: "SF", cost: 5, scope: "Professional installation including subfloor prep, seam welding, and flash coving" },
  { code: "03-15-05-M", phase: "PHASE 3 (BUILD)", division: "FLOORING", description: "Carpet - Materials", type: "Material", uom: "SF", cost: 5, scope: "Carpet and pad including adhesives, transition strips, and specialty treatments" },
  { code: "03-15-05-L", phase: "PHASE 3 (BUILD)", division: "FLOORING", description: "Carpet - Labor", type: "Labor", uom: "SF", cost: 2.5, scope: "Professional installation including pattern matching, seaming, and transitions" },
  { code: "03-15-99", phase: "PHASE 3 (BUILD)", division: "FLOORING", description: "Other Flooring", type: "Other", uom: "EA", cost: 0, scope: "Specialized flooring including cork, bamboo, and custom installations" },
  { code: "03-16-01-M", phase: "PHASE 3 (BUILD)", division: "TILE + STONE", description: "Tile - Materials", type: "Material", uom: "SF", cost: 10, scope: "Complete tile system including setting materials, grout, waterproofing, and trim pieces" },
  { code: "03-16-01-L", phase: "PHASE 3 (BUILD)", division: "TILE + STONE", description: "Tile - Labor", type: "Labor", uom: "SF", cost: 18, scope: "Professional installation including surface prep, waterproofing, layout, and grouting" },
  { code: "03-16-02-M", phase: "PHASE 3 (BUILD)", division: "TILE + STONE", description: "Interior Brick/Stone - Materials", type: "Material", uom: "SF", cost: 12, scope: "Interior masonry including stone, brick, mortar, and specialty anchoring systems" },
  { code: "03-16-02-L", phase: "PHASE 3 (BUILD)", division: "TILE + STONE", description: "Interior Brick/Stone - Labor", type: "Labor", uom: "SF", cost: 15, scope: "Professional masonry installation including proper backing, support, and finishing" },
  { code: "03-16-99", phase: "PHASE 3 (BUILD)", division: "TILE + STONE", description: "Other Tile", type: "Other", uom: "EA", cost: 0, scope: "Specialty applications including mosaics, custom patterns, and artistic installations" },
  { code: "03-17-01-M", phase: "PHASE 3 (BUILD)", division: "COUNTERTOPS + CABINETRY", description: "Cabinets - Materials", type: "Material", uom: "LF", cost: 250, scope: "Custom or manufactured cabinets including boxes, doors, drawers, and interior fittings" },
  { code: "03-17-01-L", phase: "PHASE 3 (BUILD)", division: "COUNTERTOPS + CABINETRY", description: "Cabinets - Labor", type: "Labor", uom: "LF", cost: 200, scope: "Professional installation including leveling, securing, and hardware mounting" },
  { code: "03-17-02-M", phase: "PHASE 3 (BUILD)", division: "COUNTERTOPS + CABINETRY", description: "Countertops - Materials", type: "Material", uom: "LF", cost: 200, scope: "Countertop materials including stone, solid surface, laminate, and specialty products" },
  { code: "03-17-02-L", phase: "PHASE 3 (BUILD)", division: "COUNTERTOPS + CABINETRY", description: "Countertops - Labor", type: "Labor", uom: "LF", cost: 100, scope: "Professional fabrication and installation including templates, seaming, and edge details" },
  { code: "03-17-03-M", phase: "PHASE 3 (BUILD)", division: "COUNTERTOPS + CABINETRY", description: "Vanities - Materials", type: "Material", uom: "LF", cost: 250, scope: "Bathroom vanity cabinets including tops, hardware, and specialty features" },
  { code: "03-17-03-L", phase: "PHASE 3 (BUILD)", division: "COUNTERTOPS + CABINETRY", description: "Vanities - Labor", type: "Labor", uom: "LF", cost: 200, scope: "Professional installation including plumbing coordination and hardware mounting" },
  { code: "03-17-04-M", phase: "PHASE 3 (BUILD)", division: "COUNTERTOPS + CABINETRY", description: "Custom Built-Ins - Materials", type: "Material", uom: "LF", cost: 300, scope: "Custom cabinetry including entertainment centers, bookcases, and specialty units" },
  { code: "03-17-04-L", phase: "PHASE 3 (BUILD)", division: "COUNTERTOPS + CABINETRY", description: "Custom Built-Ins - Labor", type: "Labor", uom: "LF", cost: 250, scope: "Professional fabrication and installation of custom cabinet elements" },
  { code: "03-17-05-M", phase: "PHASE 3 (BUILD)", division: "COUNTERTOPS + CABINETRY", description: "Custom Closets - Materials", type: "Material", uom: "LF", cost: 200, scope: "Closet organization systems including rods, shelving, drawers, and accessories" },
  { code: "03-17-05-L", phase: "PHASE 3 (BUILD)", division: "COUNTERTOPS + CABINETRY", description: "Custom Closets - Labor", type: "Labor", uom: "LF", cost: 150, scope: "Professional installation of closet systems including layout and adjustable components" },
  { code: "03-17-99", phase: "PHASE 3 (BUILD)", division: "COUNTERTOPS + CABINETRY", description: "Other Countertops + Cabinetry", type: "Other", uom: "EA", cost: 0, scope: "Specialized cabinet work including wine storage, media cabinets, and custom features" },
  { code: "03-18-01-M", phase: "PHASE 3 (BUILD)", division: "INTERIOR DOORS + MILLWORK", description: "Interior Doors - Materials", type: "Material", uom: "EA", cost: 250, scope: "Complete door packages including frames, hardware, stops, and specialty finishes" },
  { code: "03-18-01-L", phase: "PHASE 3 (BUILD)", division: "INTERIOR DOORS + MILLWORK", description: "Interior Doors - Labor", type: "Labor", uom: "EA", cost: 75, scope: "Professional door installation including hanging, hardware mounting, and adjustments" },
  { code: "03-18-02-M", phase: "PHASE 3 (BUILD)", division: "INTERIOR DOORS + MILLWORK", description: "Trim - Materials", type: "Material", uom: "LF", cost: 3, scope: "All interior trim including baseboards, crown molding, door/window casings, and specialty profiles" },
  { code: "03-18-02-L", phase: "PHASE 3 (BUILD)", division: "INTERIOR DOORS + MILLWORK", description: "Trim - Labor", type: "Labor", uom: "LF", cost: 2, scope: "Professional installation of all trim elements including mitering, coping, and proper finishing" },
  { code: "03-18-03-M", phase: "PHASE 3 (BUILD)", division: "INTERIOR DOORS + MILLWORK", description: "Closet - Materials", type: "Material", uom: "EA", cost: 1000, scope: "Standard closet components including bifold doors, shelving, and basic organization" },
  { code: "03-18-03-L", phase: "PHASE 3 (BUILD)", division: "INTERIOR DOORS + MILLWORK", description: "Closet - Labor", type: "Labor", uom: "EA", cost: 500, scope: "Installation of basic closet systems including doors, shelving, and hardware" },
  { code: "03-18-04-M", phase: "PHASE 3 (BUILD)", division: "INTERIOR DOORS + MILLWORK", description: "Feature Walls - Materials", type: "Material", uom: "SF", cost: 15, scope: "Decorative wall treatments including paneling, wainscoting, and architectural details" },
  { code: "03-18-04-L", phase: "PHASE 3 (BUILD)", division: "INTERIOR DOORS + MILLWORK", description: "Feature Walls - Labor", type: "Labor", uom: "SF", cost: 12, scope: "Professional installation of wall features including layout and detail work" },
  { code: "03-18-99", phase: "PHASE 3 (BUILD)", division: "INTERIOR DOORS + MILLWORK", description: "Other Interior Doors + Millwork", type: "Other", uom: "EA", cost: 0, scope: "Additional millwork including specialty trim profiles and custom details" },
  { code: "03-19-01-M", phase: "PHASE 3 (BUILD)", division: "HARDWARE + GLASS", description: "Bath Hardware - Materials", type: "Material", uom: "EA", cost: 150, scope: "Complete bath accessories including towel bars, paper holders, and specialty items" },
  { code: "03-19-01-L", phase: "PHASE 3 (BUILD)", division: "HARDWARE + GLASS", description: "Bath Hardware - Labor", type: "Labor", uom: "EA", cost: 50, scope: "Professional mounting of all bath accessories including proper backing and alignment" },
  { code: "03-19-02-M", phase: "PHASE 3 (BUILD)", division: "HARDWARE + GLASS", description: "Cabinet + Vanity Hardware - Materials", type: "Material", uom: "LF", cost: 8, scope: "All cabinet pulls, knobs, hinges, drawer slides, and specialty hardware" },
  { code: "03-19-02-L", phase: "PHASE 3 (BUILD)", division: "HARDWARE + GLASS", description: "Cabinet + Vanity Hardware - Labor", type: "Labor", uom: "LF", cost: 2, scope: "Professional installation of all cabinet hardware including templates and alignment" },
  { code: "03-19-03-M", phase: "PHASE 3 (BUILD)", division: "HARDWARE + GLASS", description: "Closet Hardware - Materials", type: "Material", uom: "LF", cost: 6, scope: "Closet rods, brackets, shelf supports, and specialty organization hardware" },
  { code: "03-19-03-L", phase: "PHASE 3 (BUILD)", division: "HARDWARE + GLASS", description: "Closet Hardware - Labor", type: "Labor", uom: "LF", cost: 2, scope: "Installation of closet hardware including proper support and adjustments" },
  { code: "03-19-04-M", phase: "PHASE 3 (BUILD)", division: "HARDWARE + GLASS", description: "Door Hardware - Materials", type: "Material", uom: "EA", cost: 75, scope: "All door hardware including locksets, hinges, stops, and specialty mechanisms" },
  { code: "03-19-04-L", phase: "PHASE 3 (BUILD)", division: "HARDWARE + GLASS", description: "Door Hardware - Labor", type: "Labor", uom: "EA", cost: 20, scope: "Professional hardware installation including keying and operational testing" },
  { code: "03-19-05-M", phase: "PHASE 3 (BUILD)", division: "HARDWARE + GLASS", description: "Exterior Hardware - Materials", type: "Material", uom: "EA", cost: 30, scope: "Exterior door hardware including weatherproof locks, handles, and security features" },
  { code: "03-19-05-L", phase: "PHASE 3 (BUILD)", division: "HARDWARE + GLASS", description: "Exterior Hardware - Labor", type: "Labor", uom: "EA", cost: 20, scope: "Installation of exterior hardware including weather sealing and security testing" },
  { code: "03-19-06-M", phase: "PHASE 3 (BUILD)", division: "HARDWARE + GLASS", description: "Shower Glass - Materials", type: "Material", uom: "EA", cost: 1200, scope: "Custom shower enclosures including glass, hardware, and water management" },
  { code: "03-19-06-L", phase: "PHASE 3 (BUILD)", division: "HARDWARE + GLASS", description: "Shower Glass - Labor", type: "Labor", uom: "EA", cost: 300, scope: "Professional installation including waterproofing, alignment, and safety features" },
  { code: "03-19-07-M", phase: "PHASE 3 (BUILD)", division: "HARDWARE + GLASS", description: "Mirrors - Materials", type: "Material", uom: "EA", cost: 160, scope: "Decorative and functional mirrors including mounting hardware and specialty edges" },
  { code: "03-19-07-L", phase: "PHASE 3 (BUILD)", division: "HARDWARE + GLASS", description: "Mirrors - Labor", type: "Labor", uom: "EA", cost: 40, scope: "Professional mirror installation including proper backing and safety mounting" },
  { code: "03-19-99", phase: "PHASE 3 (BUILD)", division: "HARDWARE + GLASS", description: "Other Hardware + Glass", type: "Other", uom: "EA", cost: 0, scope: "Specialty hardware and glass elements including custom applications" },
  { code: "03-20-01-M", phase: "PHASE 3 (BUILD)", division: "APPLIANCES", description: "Appliances - Materials", type: "Material", uom: "EA", cost: 10000, scope: "Complete appliance package including kitchen, laundry, and specialty equipment" },
  { code: "03-20-01-L", phase: "PHASE 3 (BUILD)", division: "APPLIANCES", description: "Appliances - Labor", type: "Labor", uom: "EA", cost: 800, scope: "Professional delivery, installation, and testing of all appliance systems" },
  { code: "03-20-99", phase: "PHASE 3 (BUILD)", division: "APPLIANCES", description: "Other Appliances", type: "Other", uom: "EA", cost: 0, scope: "Specialty or custom appliances including built-in or integrated units" },
  { code: "03-21-01-M", phase: "PHASE 3 (BUILD)", division: "SPECIALTY ELEMENTS", description: "Interior Railings - Materials", type: "Material", uom: "LF", cost: 45, scope: "Interior railing systems including posts, rails, balusters, and hardware" },
  { code: "03-21-01-L", phase: "PHASE 3 (BUILD)", division: "SPECIALTY ELEMENTS", description: "Interior Railings - Labor", type: "Labor", uom: "LF", cost: 30, scope: "Professional installation including anchoring, alignment, and finish work" },
  { code: "03-21-02-M", phase: "PHASE 3 (BUILD)", division: "SPECIALTY ELEMENTS", description: "Exterior Railings - Materials", type: "Material", uom: "LF", cost: 60, scope: "Exterior railing systems including weather-resistant materials and mounting hardware" },
  { code: "03-21-02-L", phase: "PHASE 3 (BUILD)", division: "SPECIALTY ELEMENTS", description: "Exterior Railings - Labor", type: "Labor", uom: "LF", cost: 40, scope: "Installation including proper anchoring, weatherproofing, and safety compliance" },
  { code: "03-21-03-M", phase: "PHASE 3 (BUILD)", division: "SPECIALTY ELEMENTS", description: "Custom Staircase - Materials", type: "Material", uom: "EA", cost: 5000, scope: "Complete stair system including treads, risers, stringers, and specialty finishes" },
  { code: "03-21-03-L", phase: "PHASE 3 (BUILD)", division: "SPECIALTY ELEMENTS", description: "Custom Staircase - Labor", type: "Labor", uom: "EA", cost: 3000, scope: "Professional stair installation including structural support and finish details" },
  { code: "03-21-04-M", phase: "PHASE 3 (BUILD)", division: "SPECIALTY ELEMENTS", description: "Mantle + Floating Shelves - Materials", type: "Material", uom: "LF", cost: 75, scope: "Custom mantles and shelving including brackets and mounting systems" },
  { code: "03-21-04-L", phase: "PHASE 3 (BUILD)", division: "SPECIALTY ELEMENTS", description: "Mantle + Floating Shelves - Labor", type: "Labor", uom: "LF", cost: 50, scope: "Installation including proper support, leveling, and finish work" },
  { code: "03-21-05-M", phase: "PHASE 3 (BUILD)", division: "SPECIALTY ELEMENTS", description: "Fireplace Insert - Materials", type: "Material", uom: "EA", cost: 3500, scope: "Fireplace units including venting, surrounds, and safety features" },
  { code: "03-21-05-L", phase: "PHASE 3 (BUILD)", division: "SPECIALTY ELEMENTS", description: "Fireplace Insert - Labor", type: "Labor", uom: "EA", cost: 1500, scope: "Professional installation including venting, gas lines, and safety testing" },
  { code: "03-21-06-M", phase: "PHASE 3 (BUILD)", division: "SPECIALTY ELEMENTS", description: "Custom Vent Hoods - Materials", type: "Material", uom: "EA", cost: 2000, scope: "Decorative vent hoods including internal components and mounting hardware" },
  { code: "03-21-06-L", phase: "PHASE 3 (BUILD)", division: "SPECIALTY ELEMENTS", description: "Custom Vent Hoods - Labor", type: "Labor", uom: "EA", cost: 800, scope: "Installation including ductwork, electrical, and ventilation testing" },
  { code: "03-21-07-M", phase: "PHASE 3 (BUILD)", division: "SPECIALTY ELEMENTS", description: "Custom Metals - Materials", type: "Material", uom: "SF", cost: 25, scope: "Specialty metal elements including architectural details and custom fabrications" },
  { code: "03-21-07-L", phase: "PHASE 3 (BUILD)", division: "SPECIALTY ELEMENTS", description: "Custom Metals - Labor", type: "Labor", uom: "SF", cost: 20, scope: "Professional installation of custom metal elements including welding and finishing" },
  { code: "03-21-99", phase: "PHASE 3 (BUILD)", division: "SPECIALTY ELEMENTS", description: "Other Specialty Elements (Custom)", type: "Other", uom: "EA", cost: 0, scope: "Additional custom features and architectural elements" },
  { code: "03-22-01-M", phase: "PHASE 3 (BUILD)", division: "LANDSCAPE", description: "Flatwork - Materials", type: "Material", uom: "SF", cost: 7, scope: "Concrete and paver materials for patios, walkways, and outdoor living spaces" },
  { code: "03-22-01-L", phase: "PHASE 3 (BUILD)", division: "LANDSCAPE", description: "Flatwork - Labor", type: "Labor", uom: "SF", cost: 5, scope: "Professional installation including proper base preparation and drainage" },
  { code: "03-22-02-M", phase: "PHASE 3 (BUILD)", division: "LANDSCAPE", description: "Pergolas, Trellis, etc. - Materials", type: "Material", uom: "SF", cost: 15, scope: "Outdoor structure materials including posts, beams, shade elements, and hardware" },
  { code: "03-22-02-L", phase: "PHASE 3 (BUILD)", division: "LANDSCAPE", description: "Pergolas, Trellis, etc. - Labor", type: "Labor", uom: "SF", cost: 12, scope: "Professional construction of outdoor structures including foundations and finishing" },
  { code: "03-22-03-M", phase: "PHASE 3 (BUILD)", division: "LANDSCAPE", description: "Irrigation/Sprinklers - Materials", type: "Material", uom: "EA", cost: 2000, scope: "Complete irrigation system including controllers, valves, heads, and drip lines" },
  { code: "03-22-03-L", phase: "PHASE 3 (BUILD)", division: "LANDSCAPE", description: "Irrigation/Sprinklers - Labor", type: "Labor", uom: "EA", cost: 1000, scope: "Professional installation including zoning, programming, and coverage testing" },
  { code: "03-22-04-M", phase: "PHASE 3 (BUILD)", division: "LANDSCAPE", description: "Topsoil + Fine Grading - Materials", type: "Material", uom: "SF", cost: 2, scope: "Soil amendments, topsoil, and materials for final grade preparation" },
  { code: "03-22-04-L", phase: "PHASE 3 (BUILD)", division: "LANDSCAPE", description: "Topsoil + Fine Grading - Labor", type: "Labor", uom: "SF", cost: 1.5, scope: "Site preparation including final grading and soil conditioning" },
  { code: "03-22-05-M", phase: "PHASE 3 (BUILD)", division: "LANDSCAPE", description: "Fencing + Gates - Materials", type: "Material", uom: "LF", cost: 18, scope: "Complete fencing system including posts, panels, gates, and hardware" },
  { code: "03-22-05-L", phase: "PHASE 3 (BUILD)", division: "LANDSCAPE", description: "Fencing + Gates - Labor", type: "Labor", uom: "LF", cost: 12, scope: "Professional installation including post setting, alignment, and gate operation" },
  { code: "03-22-06-M", phase: "PHASE 3 (BUILD)", division: "LANDSCAPE", description: "Retaining/Garden Walls - Materials", type: "Material", uom: "SF", cost: 8, scope: "Wall materials including block, stone, caps, and drainage components" },
  { code: "03-22-06-L", phase: "PHASE 3 (BUILD)", division: "LANDSCAPE", description: "Retaining/Garden Walls - Labor", type: "Labor", uom: "SF", cost: 4, scope: "Professional wall construction including proper base and drainage systems" },
  { code: "03-22-07-M", phase: "PHASE 3 (BUILD)", division: "LANDSCAPE", description: "Pavers, Brick, Gravel, etc. - Materials", type: "Material", uom: "SF", cost: 6, scope: "Hardscape materials including base materials and edge restraints" },
  { code: "03-22-07-L", phase: "PHASE 3 (BUILD)", division: "LANDSCAPE", description: "Pavers, Brick, Gravel, etc. - Labor", type: "Labor", uom: "SF", cost: 4, scope: "Professional installation including proper base preparation and compaction" },
  { code: "03-22-08-M", phase: "PHASE 3 (BUILD)", division: "LANDSCAPE", description: "Sod - Materials", type: "Material", uom: "SF", cost: 1, scope: "Grass sod including delivery and soil amendments" },
  { code: "03-22-08-L", phase: "PHASE 3 (BUILD)", division: "LANDSCAPE", description: "Sod - Labor", type: "Labor", uom: "SF", cost: 0.5, scope: "Professional sod installation including soil preparation and initial maintenance" },
  { code: "03-22-09-M", phase: "PHASE 3 (BUILD)", division: "LANDSCAPE", description: "Plantings - Materials", type: "Material", uom: "EA", cost: 1200, scope: "Trees, shrubs, and plants including soil amendments and mulch" },
  { code: "03-22-09-L", phase: "PHASE 3 (BUILD)", division: "LANDSCAPE", description: "Plantings - Labor", type: "Labor", uom: "EA", cost: 400, scope: "Professional plant installation including proper spacing and initial care" },
  { code: "03-22-10-M", phase: "PHASE 3 (BUILD)", division: "LANDSCAPE", description: "Deck - Materials", type: "Material", uom: "SF", cost: 15, scope: "Complete deck system including framing, decking, railings, and hardware" },
  { code: "03-22-10-L", phase: "PHASE 3 (BUILD)", division: "LANDSCAPE", description: "Deck - Labor", type: "Labor", uom: "SF", cost: 12, scope: "Professional deck construction including proper footings and structural details" },
  { code: "03-22-99", phase: "PHASE 3 (BUILD)", division: "LANDSCAPE", description: "Other Landscape", type: "Other", uom: "EA" /* source UOM cell was blank; defaulted to EA */, cost: 0, scope: "14" },
  { code: "03-23-01-M", phase: "PHASE 3 (BUILD)", division: "PRE-OCCUPANCY", description: "Fit + Finish - Materials", type: "Material", uom: "SF", cost: 0.5, scope: "Touch-up materials including paint, caulk, and specialty repair products" },
  { code: "03-23-01-L", phase: "PHASE 3 (BUILD)", division: "PRE-OCCUPANCY", description: "Fit + Finish - Labor", type: "Labor", uom: "SF", cost: 0.7, scope: "Final detail work including touch-ups, adjustments, and finish perfection" },
  { code: "03-23-02", phase: "PHASE 3 (BUILD)", division: "PRE-OCCUPANCY", description: "Final Clean", type: "Labor", uom: "SF", cost: 1, scope: "Comprehensive cleaning of all surfaces, windows, fixtures, and exterior areas" },
  { code: "03-23-03", phase: "PHASE 3 (BUILD)", division: "PRE-OCCUPANCY", description: "Warranty", type: "Other", uom: "EA", cost: 0, scope: "Project warranty documentation including systems manuals and maintenance guides" },
  { code: "03-23-04", phase: "PHASE 3 (BUILD)", division: "PRE-OCCUPANCY", description: "Contingency (10% of project)", type: "Other", uom: "%", cost: 10, scope: "Reserved funds (10% of project) for unforeseen conditions and changes" },
  { code: "03-23-99", phase: "PHASE 3 (BUILD)", division: "PRE-OCCUPANCY", description: "Other Pre-Occupancy", type: "Other", uom: "EA", cost: 0, scope: "Additional pre-occupancy requirements and final detail items" },
  { code: "03-24-01", phase: "PHASE 3 (BUILD)", division: "FURNISHINGS", description: "Blinds/Window Coverings", type: "Subcontractor", uom: "EA", cost: 3000, scope: "Window treatment systems including motorized options and controls" },
  { code: "03-24-02", phase: "PHASE 3 (BUILD)", division: "FURNISHINGS", description: "Furnishings", type: "Labor", uom: "HR", cost: 250, scope: "Furniture packages including delivery and placement" },
  { code: "03-24-03", phase: "PHASE 3 (BUILD)", division: "FURNISHINGS", description: "Staging", type: "Subcontractor", uom: "EA", cost: 1500, scope: "Temporary furnishings and decor for marketing or showing" },
  { code: "03-24-99", phase: "PHASE 3 (BUILD)", division: "FURNISHINGS", description: "Other Furnishings", type: "Other", uom: "EA", cost: 0, scope: "Additional decorative elements and specialty furnishings" },
  { code: "L-01-02", phase: "PHASE 2 (DESIGN)", division: "DESIGN + BUILD LABOR", description: "Phase 1 + 2 Design-Build Team Labor", type: "Labor", uom: "HR", cost: 135, scope: "Professional management services during planning and design phases" },
  { code: "L-03-00", phase: "PHASE 3 (BUILD)", division: "DESIGN + BUILD LABOR", description: "Phase 3 Design-Build Team Labor", type: "Labor", uom: "HR", cost: 135, scope: "Professional management services during construction phase" },
];

const BY_CODE = new Map(LINE_ITEMS.map((i) => [i.code, i]));

/** Look up a line item by its source cost code. Throws if the code is unknown, so a typo in a scope rule fails loudly rather than silently pricing zero. */
export function item(code: string): LineItem {
  const found = BY_CODE.get(code);
  if (!found) throw new Error(`Unknown cost code "${code}" - not present in the source workbooks`);
  return found;
}

/** Installed cost for a base code that is split into -M (materials) and -L (labor). */
export function installedCost(baseCode: string): number {
  const m = BY_CODE.get(`${baseCode}-M`);
  const l = BY_CODE.get(`${baseCode}-L`);
  if (!m && !l) return item(baseCode).cost;
  return (m?.cost ?? 0) + (l?.cost ?? 0);
}

export function itemsInDivision(division: string): LineItem[] {
  return LINE_ITEMS.filter((i) => i.division === division);
}

/** Placeholder rows carry no rate and must never be auto-selected. */
export function isPlaceholder(i: LineItem): boolean {
  return i.cost === 0;
}
