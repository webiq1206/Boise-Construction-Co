import {
  PREFER_TO_TEXT_LINE,
  TEXT_REPLY_PHONE,
  TEXT_REPLY_SMS_HREF,
} from "@/shared/textReply";

/** Renders copy unchanged, with the text-reply phone as an sms: link. */
export function CopyWithTextReply({ text }: { text: string }) {
  const marker = `Text ${TEXT_REPLY_PHONE}`;
  const at = text.indexOf(marker);
  if (at < 0) return <>{text}</>;
  const phoneAt = at + "Text ".length;
  return (
    <>
      {text.slice(0, phoneAt)}
      <a href={TEXT_REPLY_SMS_HREF} className="underline underline-offset-2">
        {TEXT_REPLY_PHONE}
      </a>
      {text.slice(phoneAt + TEXT_REPLY_PHONE.length)}
    </>
  );
}

export function PreferToTextLine({ className }: { className?: string }) {
  return (
    <span className={className}>
      <CopyWithTextReply text={PREFER_TO_TEXT_LINE} />
    </span>
  );
}
