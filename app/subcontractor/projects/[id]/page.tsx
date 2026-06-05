"use client";

import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRouter, useParams } from "next/navigation";
import { PortalShell } from "@/components/portal/PortalShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";

export default function SubcontractorProjectDetailPage() {
  const { isSubcontractor, isLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const projectId = params.id as string;

  useEffect(() => {
    if (!isLoading && !isSubcontractor) router.push("/subcontractor");
  }, [isSubcontractor, isLoading, router]);

  const { data, isLoading: loading } = useQuery({
    queryKey: ["/api/projects", projectId],
    queryFn: async () => {
      const res = await fetch(`/api/projects/${projectId}`);
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    enabled: isSubcontractor && !!projectId,
  });

  if (isLoading || !isSubcontractor) return null;

  const project = data?.project;
  const changeOrders = data?.changeOrders ?? [];
  const documents = data?.documents ?? [];
  const contracts = data?.contracts ?? [];

  return (
    <PortalShell variant="subcontractor" title={project?.title ?? "Project"}>
      {loading || !project ? (
        <p className="text-muted-foreground">Loading...</p>
      ) : (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Project Overview</CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-2">
              <p><span className="text-muted-foreground">Address:</span> {project.address}, {project.city}</p>
              <p><span className="text-muted-foreground">Amount:</span> ${project.contractAmount ? parseFloat(project.contractAmount).toLocaleString() : "TBD"}</p>
              <p><span className="text-muted-foreground">Payment:</span> {project.paymentTerms ?? "-"}</p>
              <Badge variant="outline">{project.status}</Badge>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Scope of Work</CardTitle>
            </CardHeader>
            <CardContent className="text-sm whitespace-pre-wrap">
              {project.scopeOfWork ?? "No scope defined."}
            </CardContent>
          </Card>

          {changeOrders.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Approved Change Orders</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {changeOrders.map(
                  (co: { id: string; number: number; title: string; description: string; amountDelta: string }) => (
                    <div key={co.id} className="border-b pb-2 last:border-0">
                      <p className="font-medium">#{co.number} {co.title}</p>
                      <p className="text-sm text-muted-foreground">{co.description}</p>
                      <p className="text-sm">${co.amountDelta}</p>
                    </div>
                  )
                )}
              </CardContent>
            </Card>
          )}

          {contracts.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Contracts</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {contracts.map(
                  (c: { id: string; title: string; status: string; signedPdfUrl?: string | null }) => (
                    <div key={c.id} className="flex justify-between items-center">
                      <span className="text-sm">{c.title}</span>
                      <div className="flex gap-2 items-center">
                        <Badge variant="outline">{c.status}</Badge>
                        {c.signedPdfUrl && (
                          <Button size="sm" variant="outline" asChild>
                            <a href={`/api/documents/${c.id}/download?source=contract`}>PDF</a>
                          </Button>
                        )}
                      </div>
                    </div>
                  )
                )}
              </CardContent>
            </Card>
          )}

          {documents.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Project Documents</CardTitle>
              </CardHeader>
              <CardContent>
                {documents.map((d: { id: string; fileName: string }) => (
                  <div key={d.id} className="flex justify-between py-2 border-b last:border-0">
                    <span className="text-sm">{d.fileName}</span>
                    <Button size="sm" variant="outline" asChild>
                      <a href={`/api/documents/${d.id}/download`}>Download</a>
                    </Button>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </PortalShell>
  );
}
