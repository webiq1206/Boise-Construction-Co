"use client";

import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { PortalShell } from "@/components/portal/PortalShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";
import {
  AlertTriangle,
  FileWarning,
  ShieldCheck,
  FileSignature,
  FolderKanban,
  Users,
} from "lucide-react";

export default function AdminDashboardPage() {
  const { isAdmin, isLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [reminderDays, setReminderDays] = useState("30,14,7");

  const { data, isLoading: loadingDashboard } = useQuery({
    queryKey: ["/api/admin/compliance/dashboard"],
    queryFn: async () => {
      const res = await fetch("/api/admin/compliance/dashboard");
      if (!res.ok) throw new Error("Failed to load dashboard");
      return res.json();
    },
    enabled: isAdmin,
  });

  const { data: settings } = useQuery({
    queryKey: ["/api/admin/settings"],
    queryFn: async () => {
      const res = await fetch("/api/admin/settings");
      if (!res.ok) return {};
      return res.json();
    },
    enabled: isAdmin,
  });

  useEffect(() => {
    if (settings?.compliance_reminder_days) {
      try {
        const parsed = JSON.parse(settings.compliance_reminder_days);
        if (Array.isArray(parsed)) setReminderDays(parsed.join(","));
      } catch {
        setReminderDays(settings.compliance_reminder_days);
      }
    }
  }, [settings]);

  const saveSettingsMutation = useMutation({
    mutationFn: async () => {
      const days = reminderDays
        .split(",")
        .map((d) => parseInt(d.trim(), 10))
        .filter((d) => !isNaN(d));
      const res = await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          key: "compliance_reminder_days",
          value: JSON.stringify(days),
        }),
      });
      if (!res.ok) throw new Error("Failed to save settings");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/settings"] });
      toast({ title: "Reminder settings saved" });
    },
    onError: (e: Error) => {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    },
  });

  useEffect(() => {
    if (!isLoading && !isAdmin) router.push("/admin");
  }, [isAdmin, isLoading, router]);

  if (isLoading || !isAdmin) return null;

  const compliance = data?.compliance;
  const contracts = data?.contracts;
  const projects = data?.projects;

  return (
    <PortalShell variant="admin" title="Compliance Dashboard">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <p className="text-muted-foreground">
            Monitor contractor compliance, contracts, and project assignments.
          </p>
          <Button variant="outline" size="sm" asChild>
            <a href="/api/admin/compliance/export">Export CSV</a>
          </Button>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <FileWarning className="h-4 w-4 text-destructive" />
                Missing COI
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{compliance?.missingCoi ?? "-"}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <FileWarning className="h-4 w-4 text-destructive" />
                Missing W-9
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{compliance?.missingW9 ?? "-"}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-500" />
                Expiring COI
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{compliance?.expiring30 ?? "-"}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {compliance?.expiring7 ?? 0} within 7 days
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-green-600" />
                Compliant
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{compliance?.compliant ?? "-"}</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <FileSignature className="h-4 w-4" />
                Unsigned Contracts
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{contracts?.unsigned ?? "-"}</p>
              <Button size="sm" variant="link" className="px-0" asChild>
                <Link href="/admin/contracts">Manage contracts</Link>
              </Button>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <FolderKanban className="h-4 w-4" />
                Active Projects
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{projects?.active ?? "-"}</p>
              <p className="text-xs text-muted-foreground">
                {projects?.totalAssignments ?? 0} assignments
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Users className="h-4 w-4" />
                Pending Review
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{compliance?.pendingReview ?? "-"}</p>
              <Button size="sm" variant="link" className="px-0" asChild>
                <Link href="/admin/contractors">Review documents</Link>
              </Button>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Contractor Compliance</CardTitle>
          </CardHeader>
          <CardContent>
            {loadingDashboard ? (
              <p className="text-muted-foreground text-sm">Loading...</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left">
                      <th className="pb-2 pr-4">Contractor</th>
                      <th className="pb-2 pr-4">Company</th>
                      <th className="pb-2 pr-4">Status</th>
                      <th className="pb-2 pr-4">Issues</th>
                      <th className="pb-2">COI Expires</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(compliance?.contractors ?? []).map(
                      ({ user, summary }: { user: { id: string; firstName?: string | null; lastName?: string | null; email?: string | null; company?: string | null }; summary: { status: string; issues: string[]; coiExpiresAt?: string | null } }) => (
                        <tr key={user.id} className="border-b last:border-0">
                          <td className="py-2 pr-4">
                            {[user.firstName, user.lastName].filter(Boolean).join(" ") ||
                              user.email}
                          </td>
                          <td className="py-2 pr-4">{user.company ?? "-"}</td>
                          <td className="py-2 pr-4">
                            <Badge
                              variant={
                                summary.status === "compliant"
                                  ? "default"
                                  : summary.status === "expiring_soon"
                                    ? "secondary"
                                    : "destructive"
                              }
                            >
                              {summary.status.replace("_", " ")}
                            </Badge>
                          </td>
                          <td className="py-2 pr-4 text-muted-foreground">
                            {summary.issues.length > 0
                              ? summary.issues.join(", ")
                              : "None"}
                          </td>
                          <td className="py-2">
                            {summary.coiExpiresAt
                              ? new Date(summary.coiExpiresAt).toLocaleDateString()
                              : "-"}
                          </td>
                        </tr>
                      )
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Compliance Reminder Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 max-w-md">
            <div className="space-y-2">
              <Label htmlFor="reminder-days">Days before COI expiry to notify (comma-separated)</Label>
              <Input
                id="reminder-days"
                value={reminderDays}
                onChange={(e) => setReminderDays(e.target.value)}
                placeholder="30,14,7"
              />
              <p className="text-xs text-muted-foreground">
                Missing, expired, and rejected documents trigger weekly reminders until resolved.
              </p>
            </div>
            <Button
              size="sm"
              onClick={() => saveSettingsMutation.mutate()}
              disabled={saveSettingsMutation.isPending}
            >
              Save Settings
            </Button>
          </CardContent>
        </Card>
      </div>
    </PortalShell>
  );
}
