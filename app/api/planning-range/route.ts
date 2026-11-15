import "server-only";
import {publicPlanningRangePost} from "../../../server/services/publicPlanningRange.ts";

export const runtime = "nodejs";
export const POST = publicPlanningRangePost;
