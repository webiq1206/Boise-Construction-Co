import {projectRequestHold} from './p5LeadIntake.ts';
import type {IntakeDeliveryEnvelope} from './intakeDeliveryPayload.ts';
import type {IntakeDeliveryReason} from './intakeDeliveryPolicy.ts';

/** This specialty site has no local lead receiver: unpriced project requests are posted to P5 Home
 * Co's lead intake (intakeDeliveryRuntime.ts, owner decision 18 November 2026). So the contract check
 * is the one that transport runs before any post: `projectRequestHold()` in p5LeadIntake.ts. It reads
 * the frozen envelope only and holds a synthetic request, one nobody can be reached about, and an
 * envelope that is not a request this site can stand behind. */
export function validateIntakeLocalCrm(envelope:IntakeDeliveryEnvelope):IntakeDeliveryReason|null{
 return projectRequestHold(envelope);
}
