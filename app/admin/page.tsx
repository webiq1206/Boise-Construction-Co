"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Shield, Lock, ArrowRight, AlertCircle } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

interface UserData {
  id: string;
  email: string;
  role: string;
  firstName?: string;
  lastName?: string;
}

export default function AdminLoginPage() {
  const router = useRouter();
  const [checkingAuth, setCheckingAuth] = useState(true);

  const { data: user, isLoading } = useQuery<UserData>({
    queryKey: ["/api/auth/user"],
    queryFn: async () => {
      const res = await fetch("/api/auth/user");
      if (!res.ok) throw new Error("Not authenticated");
      return res.json();
    },
    retry: false,
    staleTime: 0,
  });

  useEffect(() => {
    if (!isLoading) {
      // If user is already logged in as admin, redirect to dashboard
      if (user && user.role === "admin") {
        router.push("/admin/dashboard");
      }
      setCheckingAuth(false);
    }
  }, [user, isLoading, router]);

  const handleLogin = () => {
    // Pass returnTo parameter so server knows user came from admin login
    window.location.href = "/api/login?returnTo=/admin";
  };

  if (checkingAuth || isLoading) {
    return (
      <div className="min-h-[70vh] bg-background flex items-start md:items-center justify-center pt-12 md:pt-0">
        <div className="flex flex-col items-center gap-4">
          <Shield className="w-12 h-12 text-primary animate-pulse" />
          <p className="text-muted-foreground">Checking authentication...</p>
        </div>
      </div>
    );
  }

  // User is logged in but doesn't have admin role
  const isLoggedInButNotAdmin = user && user.role !== "admin";

  return (
    <div className="min-h-[70vh] bg-background flex items-start md:items-center justify-center pt-12 md:pt-0 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center pb-2">
          <div className="mx-auto w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
            <Shield className="w-8 h-8 text-primary" />
          </div>
          <CardTitle className="text-2xl">Admin Access</CardTitle>
          <CardDescription>
            Boise Construction Co administrative portal
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoggedInButNotAdmin ? (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Your account does not have admin access. Please contact the site administrator if you believe this is an error.
              </AlertDescription>
            </Alert>
          ) : null}

          <div className="bg-muted/50 rounded-lg p-4 space-y-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Lock className="w-4 h-4" />
              <span>Secure login via Google</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Only authorized administrators can access this portal. Login with your approved Google account to continue.
            </p>
          </div>

          <Button 
            onClick={handleLogin} 
            className="w-full" 
            size="lg"
          >
            Login with Google
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>

          <p className="text-xs text-center text-muted-foreground">
            Need access? Contact the site administrator.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
