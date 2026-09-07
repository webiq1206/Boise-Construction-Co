import type {
  DeliveryChannel,
  InquiryIntakeService,
} from "@/server/services/inquiryIntake";

export interface InquiryDeliveryResult {
  channel: DeliveryChannel;
  attempted: boolean;
  delivered: boolean;
  error?: string;
}

function errorMessage(error: unknown): string {
  if (error instanceof Error) return error.message.slice(0, 2000);
  return String(error).slice(0, 2000);
}

/**
 * Runs one downstream side effect only after atomically claiming its persisted
 * channel state. Duplicate route callbacks therefore cannot send concurrently.
 */
export async function deliverInquiryChannel(
  intake: InquiryIntakeService,
  input: {
    inquiryKey: string;
    revisionKey: string | null;
    channel: DeliveryChannel;
    deliver: () => Promise<void>;
  },
): Promise<InquiryDeliveryResult> {
  const claimKey = await intake.claimDelivery(
    input.inquiryKey,
    input.revisionKey,
    input.channel,
  );
  if (!claimKey) {
    return {
      channel: input.channel,
      attempted: false,
      delivered: false,
    };
  }

  try {
    await input.deliver();
    const completed = await intake.completeDelivery(
      input.inquiryKey,
      input.revisionKey,
      input.channel,
      claimKey,
    );
    if (!completed) {
      throw new Error("Delivery state could not be completed");
    }
    return {
      channel: input.channel,
      attempted: true,
      delivered: true,
    };
  } catch (error) {
    const message = errorMessage(error);
    await intake.failDelivery(
      input.inquiryKey,
      input.revisionKey,
      input.channel,
      claimKey,
      message,
    );
    return {
      channel: input.channel,
      attempted: true,
      delivered: false,
      error: message,
    };
  }
}