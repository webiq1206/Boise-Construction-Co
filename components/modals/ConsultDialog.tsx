"use client";

import dynamic from "next/dynamic";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

// The quote wizard with its form and validation libraries loads with the
// dialog body, as it did when the dialog lived in ModalProvider.
const ConsultationForm = dynamic(
  () => import("@/components/ConsultationForm").then((m) => m.ConsultationForm),
  { loading: () => <p role="status" className="py-8 text-sm text-muted-foreground">Loading the form...</p> },
);

/** The consultation dialog, loaded by ModalProvider the first time it opens. */
export function ConsultDialog({ open, onClose, onRevise }: { open: boolean; onClose: () => void; onRevise: () => void }) {
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg w-[95vw] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-sans font-light text-xl text-foreground">
            Schedule your free in-home visit
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            No obligation - we&apos;ll walk your space and give you an honest planning range.
          </DialogDescription>
        </DialogHeader>
        <ConsultationForm onRevise={onRevise} showTrust />
      </DialogContent>
    </Dialog>
  );
}
