"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import dynamic from "next/dynamic";
import { requestHideMobileNavBar } from "@/lib/mobileNavBar";
import { ModalsContext, type ModalType } from "./modalsContext";

// Both bodies render only after a visitor opens a modal, so their code (the
// quote wizard with its form and validation libraries, the estimator shell)
// loads on open instead of shipping with the root layout on every page.
// Pages that render the wizard inline (/, /contact, /estimate) still import
// it statically, so nothing changes there.
const ConsultationForm = dynamic(
  () => import("@/components/ConsultationForm").then((m) => m.ConsultationForm),
  { loading: () => <p role="status" className="py-8 text-sm text-muted-foreground">Loading the form...</p> },
);
const EstimateCalculator = dynamic(() =>
  import("@/components/EstimateCalculator").then((m) => m.EstimateCalculator),
);

export function ModalProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState<ModalType>(null);

  const openConsult = useCallback(() => setOpen("consult"), []);
  const openEstimate = useCallback(() => setOpen("estimate"), []);
  const close = useCallback(() => setOpen(null), []);

  // The global mobile Call/Text bar sits above the dialog overlay; hide it
  // while a conversion modal is open so it never covers the dialog. Ref-counted
  // so it can't fight the inline estimate bar over the same flag.
  useEffect(() => {
    if (open === null) return;
    return requestHideMobileNavBar();
  }, [open]);

  return (
    <ModalsContext.Provider value={{ openConsult, openEstimate, close }}>
      {children}

      <Dialog open={open === "consult"} onOpenChange={(v) => !v && close()}>
        <DialogContent className="max-w-lg w-[95vw] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-sans font-light text-xl text-foreground">
              Schedule your free in-home visit
            </DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">
              No obligation - we&apos;ll walk your space and give you an honest planning range.
            </DialogDescription>
          </DialogHeader>
          <ConsultationForm onRevise={() => setOpen("estimate")} showTrust />
        </DialogContent>
      </Dialog>

      {/* The estimator is its own full-screen experience beneath the site
          header (not a dialog inside a dialog): it owns the screen with its
          own scroll area and bottom-anchored input, and Exit returns here. */}
      {open === "estimate" && (
        <EstimateCalculator inModal sectionId="estimate-modal" onExit={close} onBookVisit={() => setOpen("consult")} />
      )}
    </ModalsContext.Provider>
  );
}
