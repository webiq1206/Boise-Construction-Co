import { clarityFormMaskScript } from './clarityFormMask';

/** Compatibility entry point: use the newer canonical masker and one observer. */
export function clarityFieldMaskBootstrap(): string {
  return clarityFormMaskScript;
}
