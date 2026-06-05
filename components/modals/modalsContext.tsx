"use client";

import { createContext, useContext } from "react";

export type ModalType = "consult" | "estimate" | null;

export interface ModalsContextValue {
  openConsult: () => void;
  openEstimate: () => void;
  close: () => void;
}

export const ModalsContext = createContext<ModalsContextValue>({
  openConsult: () => {},
  openEstimate: () => {},
  close: () => {},
});

export function useModals() {
  return useContext(ModalsContext);
}
