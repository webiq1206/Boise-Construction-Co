"use client";

import { createContext, useCallback, useContext, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ConsultationForm } from "@/components/ConsultationForm";
import { EstimateCalculator } from "@/components/EstimateCalculator";

type ModalType = "consult" | "estimate" | null;

interface ModalsContextValue {
  openConsult: () => void;
  openEstimate: () => void;
  close: () => void;
}

const ModalsContext = createContext<ModalsContextValue>({
  openConsult: () => {},
  openEstimate: () => {},
  close: () => {},
});

export function useModals() {
  return useContext(ModalsContext);
}

export function ModalProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState<ModalType>(null);

  const openConsult = useCallback(() => setOpen("consult"), []);
  const openEstimate = useCallback(() => setOpen("estimate"), []);
  const close = useCallback(() => setOpen(null), []);

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
          <ConsultationForm onRevise={() => setOpen("estimate")} />
        </DialogContent>
      </Dialog>

      <Dialog open={open === "estimate"} onOpenChange={(v) => !v && close()}>
        <DialogContent className="max-w-4xl w-[95vw] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-sans font-light text-xl text-foreground">
              Get your planning range
            </DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">
              Select your project type, finish level, and size for an instant estimate.
            </DialogDescription>
          </DialogHeader>
          <EstimateCalculator inModal onBookVisit={() => setOpen("consult")} />
        </DialogContent>
      </Dialog>
    </ModalsContext.Provider>
  );
}
