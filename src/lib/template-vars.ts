import { createContext, useContext } from "react";

export type TemplateVars = Record<string, string>;

const TemplateVarsCtx = createContext<TemplateVars>({});

export const TemplateVarsProvider = TemplateVarsCtx.Provider;

export function useTemplateVars(): TemplateVars {
  return useContext(TemplateVarsCtx);
}

/** Replace {{key}} tokens with values from `vars`. Unknown tokens are left in place. */
export function substituteVars(input: string, vars: TemplateVars | undefined): string {
  if (!input || !vars) return input;
  return input.replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (_m, k: string) => {
    const v = vars[k];
    return v == null ? _m : v;
  });
}
