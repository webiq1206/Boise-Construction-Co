/**
 * Public boundary, including historical saved estimates. Numeric selling prices
 * are carried only in explicit public fields; prose is never a rate authority.
 * This is a copy: retained internal records and provenance must not be rewritten.
 */
export function customerText(value:string):string{
  return value
    // Generated source evidence expresses both bounds before a shared currency.
    // Consume the entire range before single-amount redaction can leave its low.
    .replace(/\b\d[\d,]*(?:\.\d+)?\s*(?:to|[-–])\s*\d[\d,]*(?:\.\d+)?\s*(?:USD|dollars?)\s*(?:(?:\/|per\s+)\s*[a-z²0-9]+)?/gi,'[pricing detail withheld]')
    .replace(/\b(?:operating\s+profit|profit|margin|markup|overhead(?:\s+allocation)?|allocation)\s*(?:(?:target|rate|ratio|allocation)\s*)?(?:(?:is|of|at|equals)\s*|[:=]\s*)?\d+(?:\.\d+)?\s*(?:%|percent\b)?/gi,'[pricing detail withheld]')
    // A measured quantity followed by a scalar rate and extended amount is
    // pricing arithmetic, not a dimension such as "2 x 4" or "10 x 12 feet".
    .replace(/\b(\d[\d,]*(?:\.\d+)?\s*(?:LF|SF|SQFT|SY|CY|EA|linear feet|linear foot|square feet|square foot|gallons?|pounds?))\s*(?:x|×|\*)\s*\d[\d,]*(?:\.\d+)?\s*=\s*\d[\d,]*(?:\.\d+)?/gi,'$1 ([pricing detail withheld])')
    .replace(/\bUSD\s*[\d,]+(?:\.\d+)?\s*(?:(?:\/|per\s+)\s*[a-z²0-9]+)?/gi,'[pricing detail withheld]')
    .replace(/(?:[$€£]\s*[\d,]+(?:\.\d+)?|[\d,]+(?:\.\d+)?\s*(?:USD|dollars?))\s*(?:(?:\/|per\s+)\s*[a-z²0-9]+)?/gi,'[pricing detail withheld]')
    // Bare scalar prices per construction pricing unit are private, including
    // integer rates. Require the number immediately before "per" or "/" so
    // quantities such as "5 nails per linear foot" remain scope, not prices.
    // Room/wall/building are intentionally not pricing units.
    .replace(/\b\d[\d,]*(?:\.\d+)?\s*(?:USD\s*)?(?:\/|per\s+)\s*(?:LF|SF|SQFT|SY|CY|EA|each|hours?|HR|days?|units?|packages?|lin(?:ear|eal)\s+(?:foot|feet)|square\s+(?:foot|feet|yards?)|cubic\s+(?:foot|feet|yards?)|gallons?|gal|pounds?|lbs?|tons?)\b/gi,'[pricing detail withheld]')
    .replace(/\b(?:margin|markup|profit|overhead|allocation|contingency(?: rate)?)\s*(?::|=|of|is|at)?\s*\d+(?:\.\d+)?\s*(?:%|percent\b)/gi,'[pricing detail withheld]')
    .replace(/\b\d+(?:\.\d+)?\s*(?:%|percent)\s*(?:margin|markup|profit|overhead|allocation|contingency)\b/gi,'[pricing detail withheld]')
    .replace(/\b(?:direct[- ]cost|unit[- ]cost|cost basis|pricing divisor)\s*(?::|=|of|is|at)?\s*\d[\d,]*(?:\.\d+)?/gi,'[pricing detail withheld]')
    .replace(/\b\d[\d,]*(?:\.\d+)?\s*(?:direct[- ]cost|unit[- ]cost)\b/gi,'[pricing detail withheld]');
}
const fields:Record<string,string[]>={
  root:['status','range','summary','includedCategories','categoryRanges','lineItems','allowances','assumptions','exclusions','factors','nextStep','message','disclaimer','scopeTasks','instructions','documentCoverage','verificationItems'],
  range:['low','high'],
  categoryRanges:['category','low','high'],
  lineItems:['id','category','description','quantity','unit','low','high','unitLow','unitHigh','building','floor','quantityRange','pricingStatus','verification'],
  allowances:['description','amount','includes','taxIncluded','freightIncluded','deliveryIncluded','installationIncluded','wasteIncluded','selectionDeadline','adjustment'],
  scopeTasks:['id','description','category','building','floor','quantity','unit','quantityRange','status'],
  instructions:['inclusions','exclusions','responsibilities','floors','buildings','questions','laborOnly','materialsOnly'],
  documentCoverage:['expectedPages','complete','pages'],
  pages:['source','page','sheet','status','notes'],
  quantityRange:['low','high'],
};
/** Deliberately deny unknown structured fields rather than blacklist costs. */
export function projectCustomerEstimate<T>(input:T):T{
  function copy(value:any,context:string):any{
    if(typeof value==='string')return customerText(value);
    if(value===null||typeof value!=='object')return value;
    if(Array.isArray(value))return value.map(item=>copy(item,context));
    const allowed=fields[context]||[];
    return Object.fromEntries(allowed.filter(key=>Object.prototype.hasOwnProperty.call(value,key)).map(key=>[key,copy(value[key],key)]));
  }
  return copy(input,'root');
}