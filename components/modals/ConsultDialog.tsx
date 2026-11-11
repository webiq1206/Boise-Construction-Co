"use client";

import dynamic from "next/dynamic";
import {
  Dialog,
  DialogContent,
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
      {/* One heading: the dialog's title. The form inside adds no second heading
          (showTrust marks the dialog instance), and there is no helper line above it. */}
      <DialogContent className="max-w-lg w-[95vw] max-h-[90vh] overflow-y-auto" aria-describedby={undefined}>
        <DialogHeader>
          <DialogTitle className="font-serif text-[1.75rem] font-normal leading-tight text-foreground">
            Request a quote
          </DialogTitle>
        </DialogHeader>
        <ConsultationForm onRevise={onRevise} showTrust />
      </DialogContent>
    </Dialog>
  );
}
