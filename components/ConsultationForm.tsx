"use client";

import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { CheckCircle2, ArrowRight } from "lucide-react";
import type { StoredEstimate } from "@/shared/estimateEngine";
import { FINISH_LABELS, PROJECT_LABELS } from "@/shared/estimateEngine";
import { DisplayNum } from "@/components/marketing";
import { AddressAutocomplete } from "@/components/AddressAutocomplete";
import type { PropertyProfile } from "@/shared/propertyProfile";
import {
  HOUSE_NUMBER_REGEX,
  HOUSE_NUMBER_ERROR_MESSAGE,
  buildCleanAddress,
  extractZip,
} from "@/shared/addressValidation";

const formSchema = z.object({
  name: z.string().min(2, "Please enter your full name"),
  phone: z.string().min(10, "Please enter a valid phone number"),
  email: z.string().email("Please enter a valid email"),
  address: z
    .string()
    .min(5, "Please enter your property address")
    .refine((v) => HOUSE_NUMBER_REGEX.test(v.trim()), HOUSE_NUMBER_ERROR_MESSAGE),
  projectType: z.string().min(1, "Please select a project type"),
  message: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

const PROJECT_OPTIONS = [
  { value: "kitchen", label: "Kitchen Remodel" },
  { value: "bathroom", label: "Bathroom Remodel" },
  { value: "whole-home", label: "Whole-Home Remodel" },
  { value: "addition", label: "Room Addition" },
  { value: "other", label: "Other / Not sure yet" },
];

const labelClass = "text-xs tracking-wide font-medium uppercase text-muted-foreground";

function formatCurrency(n: number) {
  if (n >= 1000000) return `$${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `$${Math.round(n / 1000)}k`;
  return `$${n.toLocaleString()}`;
}

type EstimateDecision = "pending" | "confirmed" | "deciding" | "dropped";

interface ConsultationFormProps {
  onRevise?: () => void;
}

export function ConsultationForm({ onRevise }: ConsultationFormProps = {}) {
  const [estimate, setEstimate] = useState<StoredEstimate | null>(null);
  const [decision, setDecision] = useState<EstimateDecision>("pending");
  const [success, setSuccess] = useState(false);
  const [pendingData, setPendingData] = useState<FormData | null>(null);
  const [propertyProfile, setPropertyProfile] = useState<PropertyProfile | null>(null);
  const [addressInput, setAddressInput] = useState("");
  const lastKeyRef = useRef<string | null>(null);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      phone: "",
      email: "",
      address: "",
      projectType: "",
      message: "",
    },
  });

  function handleProfileResolved(profile: PropertyProfile | null) {
    setPropertyProfile(profile);
    if (profile) {
      const clean = buildCleanAddress(profile);
      if (clean) {
        setAddressInput(clean);
        form.setValue("address", clean, { shouldValidate: true });
      }
    }
  }

  // ZIP is no longer a manual field; derive it from the resolved property
  // profile, falling back to a 5-digit ZIP parsed from the address text.
  const deriveZip = (addr: string) =>
    propertyProfile?.zip?.slice(0, 5) || extractZip(addr) || "";

  useEffect(() => {
    function loadEstimate() {
      try {
        const raw = sessionStorage.getItem("brc_estimate");
        if (!raw) return;
        const parsed: StoredEstimate = JSON.parse(raw);
        const key = `${parsed.project}|${parsed.finish}|${parsed.sqft}|${parsed.priceLow}|${parsed.priceHigh}|${parsed.confidenceLabel}`;
        if (key === lastKeyRef.current) return;
        lastKeyRef.current = key;
        setEstimate(parsed);
        setDecision("pending");
        if (parsed.project) {
          form.setValue("projectType", parsed.project, { shouldValidate: false });
        }
      } catch {}
    }
    loadEstimate();
    window.addEventListener("brc_estimate_updated", loadEstimate);
    return () => window.removeEventListener("brc_estimate_updated", loadEstimate);
  }, [form]);

  function handleRevise() {
    setDecision("deciding");
    if (onRevise) {
      onRevise();
    } else {
      document.getElementById("calculator")?.scrollIntoView({ behavior: "smooth" });
    }
  }

  const mutation = useMutation({
    mutationFn: async (data: FormData) => {
      const payload = {
        ...data,
        zip: deriveZip(data.address),
        propertyProfile,
        estimate: estimate && decision === "confirmed"
          ? {
              project: estimate.project,
              finish: estimate.finish,
              priceLow: estimate.priceLow,
              priceHigh: estimate.priceHigh,
              roi: estimate.roi,
              confidence: estimate.confidenceLabel,
              sqft: estimate.sqft,
            }
          : null,
      };
      const res = await fetch("/api/consultation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || "Something went wrong");
      }
      return res.json();
    },
    onSuccess: () => {
      setSuccess(true);
      sessionStorage.removeItem("brc_estimate");
    },
  });

  if (success) {
    return (
      <div className="flex flex-col items-start py-8 space-y-4">
        <div className="w-10 h-10 rounded-sm flex items-center justify-center bg-accent/10">
          <CheckCircle2 className="h-5 w-5 text-accent" />
        </div>
        <h3 className="font-sans font-light text-2xl text-foreground">
          We&apos;ll be in touch shortly.
        </h3>
        <p className="text-sm leading-relaxed text-muted-foreground">
          Thank you for reaching out. We typically respond within one business day to
          schedule your free in-home visit.
        </p>
      </div>
    );
  }

  const projectLabel = estimate?.project
    ? PROJECT_LABELS[estimate.project]?.label
    : null;
  const finishLabel = estimate?.finish
    ? FINISH_LABELS[estimate.finish]?.label
    : null;

  const canSubmit =
    !estimate || decision === "confirmed" || decision === "dropped";

  if (pendingData) {
    const pendingProjectLabel = estimate?.project
      ? PROJECT_LABELS[estimate.project]?.label
      : PROJECT_OPTIONS.find((o) => o.value === pendingData.projectType)?.label ??
        pendingData.projectType;

    const rows: [string, string][] = [
      ["Name", pendingData.name],
      ["Phone", pendingData.phone],
      ["Email", pendingData.email],
      ["Address", pendingData.address],
      ["Project", pendingProjectLabel],
    ];
    if (pendingData.message) rows.push(["Notes", pendingData.message]);

    return (
      <div className="space-y-5" data-testid="confirm-consultation">
        <div>
          <h3 className="font-sans font-light text-2xl text-foreground">
            Does everything look right?
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            Take a quick look before we send your request.
          </p>
        </div>

        {estimate && (
          <div className="rounded-sm p-4 text-sm bg-accent/5 border border-accent/20">
            <p className="font-medium mb-1 text-foreground">Planning range from estimator:</p>
            <p className="text-muted-foreground">
              {projectLabel}
              {finishLabel ? ` · ${finishLabel}` : ""}
              {estimate.sqft ? (
                <>
                  {" · "}
                  <DisplayNum>{estimate.sqft.toLocaleString()}</DisplayNum> sqft
                </>
              ) : null}
            </p>
            <p className="mt-1 text-foreground">
              <DisplayNum className="font-medium">
                {formatCurrency(estimate.priceLow)} to {formatCurrency(estimate.priceHigh)}
              </DisplayNum>
            </p>
            {estimate.confidenceLabel && (
              <p className="text-xs mt-1 text-muted-foreground">{estimate.confidenceLabel}</p>
            )}
          </div>
        )}

        <dl className="rounded-sm border border-border divide-y divide-border text-sm">
          {rows.map(([label, value]) => (
            <div key={label} className="flex gap-4 p-3">
              <dt className="w-24 shrink-0 text-muted-foreground">{label}</dt>
              <dd className="text-foreground break-words" data-testid={`confirm-${label.toLowerCase().replace(/\s+/g, "-")}`}>
                {value}
              </dd>
            </div>
          ))}
        </dl>

        {mutation.isError && (
          <div role="alert" className="rounded-sm p-4 text-sm bg-destructive/5 border border-destructive/20 text-destructive">
            {(mutation.error as Error).message || "Something went wrong. Please try again."}
          </div>
        )}

        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <Button
            type="button"
            variant="brand"
            disabled={mutation.isPending}
            onClick={() => mutation.mutate(pendingData)}
            data-testid="button-confirm-consultation"
          >
            {mutation.isPending ? "Sending…" : "Confirm and send"}
            {!mutation.isPending && <ArrowRight className="h-4 w-4" />}
          </Button>
          <Button
            type="button"
            variant="ghost"
            disabled={mutation.isPending}
            onClick={() => setPendingData(null)}
            data-testid="button-edit-consultation"
          >
            Edit details
          </Button>
        </div>
      </div>
    );
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit((data) => setPendingData(data))}
        className="space-y-5"
      >
        {estimate && decision !== "dropped" && (
          <div className="rounded-sm p-4 text-sm bg-accent/5 border border-accent/20 space-y-3">
            <div>
              <p className="font-medium mb-1 text-foreground">
                Planning range from estimator
              </p>
              <p className="text-muted-foreground" data-testid="text-estimate-summary">
                {projectLabel}
                {finishLabel ? ` · ${finishLabel}` : ""}
                {estimate.sqft ? (
                  <>
                    {" · "}
                    <DisplayNum>{estimate.sqft.toLocaleString()}</DisplayNum> sqft
                  </>
                ) : null}
              </p>
              <p className="mt-1 text-foreground" data-testid="text-estimate-range">
                <DisplayNum className="font-medium">
                  {formatCurrency(estimate.priceLow)} to {formatCurrency(estimate.priceHigh)}
                </DisplayNum>
              </p>
              {estimate.confidenceLabel && (
                <p className="text-xs mt-1 text-muted-foreground">
                  {estimate.confidenceLabel}
                </p>
              )}
            </div>

            {decision === "pending" && (
              <div className="space-y-2 border-t border-accent/20 pt-3">
                <p className="text-foreground">
                  Is this the planning range you&apos;d like to submit with?
                </p>
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="brand"
                    onClick={() => setDecision("confirmed")}
                    data-testid="button-confirm-estimate"
                  >
                    Yes, use this range
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => setDecision("deciding")}
                    data-testid="button-reject-estimate"
                  >
                    No, not quite
                  </Button>
                </div>
              </div>
            )}

            {decision === "deciding" && (
              <div className="space-y-2 border-t border-accent/20 pt-3">
                <p className="text-foreground">No problem. What would you like to do?</p>
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={handleRevise}
                    data-testid="button-revise-estimate"
                  >
                    Revise it
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => setDecision("dropped")}
                    data-testid="button-drop-estimate"
                  >
                    Submit without it
                  </Button>
                </div>
              </div>
            )}

            {decision === "confirmed" && (
              <div className="flex flex-wrap items-center gap-2 border-t border-accent/20 pt-3">
                <CheckCircle2 className="h-4 w-4 text-accent" />
                <span className="font-medium text-foreground" data-testid="status-estimate-attached">
                  This range will be attached to your request.
                </span>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() => setDecision("pending")}
                  data-testid="button-change-estimate"
                >
                  Change
                </Button>
              </div>
            )}
          </div>
        )}

        {estimate && decision === "dropped" && (
          <div className="rounded-sm p-3 text-sm bg-muted/40 border border-border flex flex-wrap items-center gap-2">
            <span className="text-muted-foreground" data-testid="status-estimate-dropped">
              Submitting without a planning range attached.
            </span>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => setDecision("pending")}
              data-testid="button-reattach-estimate"
            >
              Use my estimate instead
            </Button>
          </div>
        )}

        {mutation.isError && (
          <div role="alert" className="rounded-sm p-4 text-sm bg-destructive/5 border border-destructive/20 text-destructive">
            {(mutation.error as Error).message || "Something went wrong. Please try again."}
          </div>
        )}

        <div className="grid sm:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel className={labelClass}>Full name</FormLabel>
                <FormControl>
                  <Input placeholder="Jane Smith" data-testid="input-name" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel className={labelClass}>Phone</FormLabel>
                <FormControl>
                  <Input
                    type="tel"
                    placeholder="(208) 555-0000"
                    data-testid="input-phone"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="address"
          render={({ field }) => (
            <FormItem>
              <FormLabel className={labelClass}>Property address</FormLabel>
              <FormControl>
                <AddressAutocomplete
                  value={addressInput || field.value}
                  onChange={(v) => {
                    setAddressInput(v);
                    field.onChange(v);
                  }}
                  onProfileResolved={handleProfileResolved}
                  data-testid="input-address"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel className={labelClass}>Email</FormLabel>
              <FormControl>
                <Input
                  type="email"
                  placeholder="jane@example.com"
                  data-testid="input-email"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {(!estimate || decision === "dropped") && (
          <FormField
            control={form.control}
            name="projectType"
            render={({ field }) => (
              <FormItem>
                <FormLabel className={labelClass}>
                  What are you planning to remodel?
                </FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger data-testid="select-project-type">
                      <SelectValue placeholder="Select a project type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {PROJECT_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        <FormField
          control={form.control}
          name="message"
          render={({ field }) => (
            <FormItem>
              <FormLabel className={labelClass}>
                Anything else we should know?{" "}
                <span className="normal-case text-muted-foreground/70">(optional)</span>
              </FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Tell us a little about your home, your vision, or your timeline..."
                  rows={4}
                  data-testid="textarea-message"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <Button
            type="submit"
            variant="brand"
            disabled={mutation.isPending || !canSubmit}
            data-testid="button-submit-consultation"
          >
            {mutation.isPending ? "Sending…" : "Send my request"}
            {!mutation.isPending && <ArrowRight className="h-4 w-4" />}
          </Button>
          <p className="text-xs text-muted-foreground">
            {canSubmit
              ? "No spam. Response within one business day."
              : "Please confirm your planning range above before sending."}
          </p>
        </div>
      </form>
    </Form>
  );
}
