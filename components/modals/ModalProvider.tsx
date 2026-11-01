"use client";

import { useCallback, useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { requestHideMobileNavBar } from "@/lib/mobileNavBar";
import { ModalsContext, type ModalType } from "./modalsContext";

// Both bodies render only after a visitor opens a modal, so their code (the
// quote wizard with its form and validation libraries, the estimator shell)
// loads on open instead of shipping with the root layout on every page.
// Pages that render the wizard inline (/, /contact, /estimate) still import
// it statically, so nothing changes there. The dialog itself loads on first
// open too: every page mounts this provider, and the Radix dialog code was
// evaluated in the startup task of pages that never open it.
const ConsultDialog = dynamic(() => import("./ConsultDialog").then((m) => m.ConsultDialog), { ssr: false });
const EstimateCalculator = dynamic(() =>
  import("@/components/EstimateCalculator").then((m) => m.EstimateCalculator),
);

export function ModalProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState<ModalType>(null);
  // Stays mounted after the first open so the dialog keeps its close animation.
  const [consultMounted, setConsultMounted] = useState(false);

  const openConsult = useCallback(() => {
    setConsultMounted(true);
    setOpen("consult");
  }, []);
  const openEstimate = useCallback(() => setOpen("estimate"), []);
  const close = useCallback(() => setOpen(null), []);
  const revise = useCallback(() => setOpen("estimate"), []);

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

      {consultMounted && <ConsultDialog open={open === "consult"} onClose={close} onRevise={revise} />}

      {/* The estimator is its own full-screen experience beneath the site
          header (not a dialog inside a dialog): it owns the screen with its
          own scroll area and bottom-anchored input, and Exit returns here. */}
      {open === "estimate" && (
        <EstimateCalculator inModal sectionId="estimate-modal" onExit={close} onBookVisit={openConsult} />
      )}
    </ModalsContext.Provider>
  );
}
