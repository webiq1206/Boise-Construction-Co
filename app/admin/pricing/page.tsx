"use client";

/**
 * Admin pricing panel.
 *
 * Shows every component the estimator prices, what it currently costs per
 * unit, and crucially WHERE that number came from. Each line is either
 * "derived" (an allocation of a validated category total, i.e. an educated
 * split rather than a measured price) or "measured" (a real installed cost
 * someone entered here).
 *
 * The point of the panel is to turn derived lines into measured ones as real
 * numbers arrive, without a deploy. Category totals are not editable here on
 * purpose: those are the validated figures the model rests on and they move
 * through the calibration procedure against a real closed job, not a text box.
 */

import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { PortalShell } from "@/components/portal/PortalShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

interface PricingComponent {
  id: string;
  label: string;
  group: "direct" | "soft";
  unit: string;
  share: number;
  quantity: number;
  unitCost: number;
  cost: number;
  provenance: "derived" | "measured";
  overridden: boolean;
}

interface PricingProject {
  project: string;
  label: string;
  baselineSqft: number;
  entryFinish: string;
  entryRange: { low: number; high: number };
  components: PricingComponent[];
  total: number;
}

interface PricingResponse {
  catalogVersion: string;
  overrides: Record<string, number>;
  projects: PricingProject[];
  note: string;
}

const usd = (n: number) => `$${Math.round(n).toLocaleString("en-US")}`;
const usdPrecise = (n: number) =>
  `$${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export default function AdminPricingPage() {
  const { isAdmin, isLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [drafts, setDrafts] = useState<Record<string, string>>({});

  const { data, isLoading: loadingPricing } = useQuery<PricingResponse>({
    queryKey: ["/api/admin/pricing"],
    enabled: isAdmin,
  });

  const save = useMutation({
    mutationFn: async (input: { componentId: string; unitCost: number | null }) => {
      const res = await fetch("/api/admin/pricing", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "Could not save");
      }
      return res.json();
    },
    onSuccess: (_result, input) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/pricing"] });
      setDrafts((prev) => {
        const next = { ...prev };
        delete next[input.componentId];
        return next;
      });
      toast({
        title: input.unitCost === null ? "Reset to derived" : "Unit cost saved",
        description:
          input.unitCost === null
            ? "That line is allocated from the category total again."
            : "The estimator, emails, and CRM all use this number now.",
      });
    },
    onError: (err: Error) =>
      toast({ title: "Save failed", description: err.message, variant: "destructive" }),
  });

  const measuredCount = useMemo(() => {
    if (!data) return { measured: 0, total: 0 };
    const ids = new Set<string>();
    const measured = new Set<string>();
    for (const p of data.projects) {
      for (const c of p.components) {
        ids.add(c.id);
        if (c.provenance === "measured") measured.add(c.id);
      }
    }
    return { measured: measured.size, total: ids.size };
  }, [data]);

  if (isLoading || loadingPricing) {
    return (
      <PortalShell variant="admin">
        <p className="text-sm text-muted-foreground">Loading pricing...</p>
      </PortalShell>
    );
  }

  if (!isAdmin) {
    return (
      <PortalShell variant="admin">
        <p className="text-sm text-muted-foreground">Admin access required.</p>
      </PortalShell>
    );
  }

  return (
    <PortalShell variant="admin">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-medium">Pricing</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Catalog {data?.catalogVersion} &middot; {measuredCount.measured} of{" "}
            {measuredCount.total} components have a real measured unit cost
          </p>
        </div>

        <Card>
          <CardContent className="pt-6">
            <p className="text-sm leading-relaxed text-muted-foreground">{data?.note}</p>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              Category totals are not editable here. Those come from the 2025 cost guide
              and, for ADU, a real closed job. Change them through the calibration
              procedure in ESTIMATOR-CALIBRATION.md so a real project is always behind
              the number.
            </p>
          </CardContent>
        </Card>

        {data?.projects.map((project) => (
          <Card key={project.project}>
            <CardHeader>
              <CardTitle className="flex flex-wrap items-baseline justify-between gap-2">
                <span>{project.label}</span>
                <span className="text-sm font-normal text-muted-foreground">
                  {project.baselineSqft.toLocaleString("en-US")} sq ft baseline &middot;{" "}
                  {usd(project.entryRange.low)} to {usd(project.entryRange.high)}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-xs uppercase tracking-wide text-muted-foreground">
                      <th className="py-2 pr-3 font-normal">Component</th>
                      <th className="py-2 pr-3 font-normal">Quantity</th>
                      <th className="py-2 pr-3 font-normal">Unit cost</th>
                      <th className="py-2 pr-3 font-normal">Line total</th>
                      <th className="py-2 pr-3 font-normal">Source</th>
                      <th className="py-2 font-normal">Set a real unit cost</th>
                    </tr>
                  </thead>
                  <tbody>
                    {project.components.map((component) => {
                      const draftKey = component.id;
                      const draft = drafts[draftKey];
                      const pending = save.isPending && save.variables?.componentId === component.id;
                      return (
                        <tr key={component.id} className="border-b last:border-0">
                          <td className="py-2.5 pr-3">
                            <div>{component.label}</div>
                            <div className="text-xs text-muted-foreground">
                              {component.group === "soft" ? "Running the job" : "The work"} &middot;{" "}
                              {(component.share * 100).toFixed(1)}% of project
                            </div>
                          </td>
                          <td className="py-2.5 pr-3 tabular-nums text-muted-foreground">
                            {component.quantity.toLocaleString("en-US")}{" "}
                            <span className="text-xs">{component.unit}</span>
                          </td>
                          <td className="py-2.5 pr-3 tabular-nums">
                            {usdPrecise(component.unitCost)}
                          </td>
                          <td className="py-2.5 pr-3 tabular-nums">{usd(component.cost)}</td>
                          <td className="py-2.5 pr-3">
                            <Badge
                              variant={component.provenance === "measured" ? "default" : "outline"}
                            >
                              {component.provenance}
                            </Badge>
                          </td>
                          <td className="py-2.5">
                            <div className="flex items-center gap-2">
                              <Input
                                type="number"
                                min={0}
                                step="0.01"
                                placeholder={component.unitCost.toFixed(2)}
                                value={draft ?? ""}
                                onChange={(e) =>
                                  setDrafts((prev) => ({ ...prev, [draftKey]: e.target.value }))
                                }
                                className="h-8 w-28"
                                data-testid={`pricing-input-${component.id}`}
                              />
                              <Button
                                size="sm"
                                variant="secondary"
                                disabled={pending || draft === undefined || draft === ""}
                                onClick={() =>
                                  save.mutate({
                                    componentId: component.id,
                                    unitCost: Number(draft),
                                  })
                                }
                                data-testid={`pricing-save-${component.id}`}
                              >
                                Save
                              </Button>
                              {component.overridden && (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  disabled={pending}
                                  onClick={() =>
                                    save.mutate({ componentId: component.id, unitCost: null })
                                  }
                                  data-testid={`pricing-reset-${component.id}`}
                                >
                                  Reset
                                </Button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <p className="mt-3 text-xs text-muted-foreground">
                Components are shared across project types, so a unit cost entered here
                applies everywhere that component appears.
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </PortalShell>
  );
}
