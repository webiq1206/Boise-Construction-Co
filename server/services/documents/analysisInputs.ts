import {classifyUpload} from "../../../shared/re10/uploads";

/** Preserve attachment-only evidence when a readable source can start analysis.
 * Coverage records skipped sources rather than silently dropping their scope.
 * Keep helpers outside Next route modules, whose exports are framework-limited.
 */
export function filesForPlanAnalysis<T extends {filename:string;mimeType:string}>(files:T[]):T[]{
  return files.some(file=>classifyUpload(file.filename,file.mimeType)==="readable")?files:[];
}
export const filesForRe10Analysis=filesForPlanAnalysis;