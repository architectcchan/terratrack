"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface FormErrors {
  organizationName?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
}

export default function RegisterPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    organizationName: "",
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [serverError, setServerError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  function updateField(field: string, value: string) {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
    setServerError("");
  }

  function validate(): boolean {
    const newErrors: FormErrors = {};

    if (!formData.organizationName.trim()) {
      newErrors.organizationName = "Organization name is required";
    }
    if (!formData.firstName.trim()) {
      newErrors.firstName = "First name is required";
    }
    if (!formData.lastName.trim()) {
      newErrors.lastName = "Last name is required";
    }
    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Please enter a valid email address";
    }
    if (!formData.password) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 8) {
      newErrors.password = "Password must be at least 8 characters";
    }
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = "Please confirm your password";
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    setIsLoading(true);
    setServerError("");

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        setServerError(data.error || "Registration failed");
        return;
      }

      const result = await signIn("credentials", {
        email: formData.email.toLowerCase().trim(),
        password: formData.password,
        redirect: false,
      });

      if (result?.error) {
        router.push("/login");
        return;
      }

      router.push("/dashboard");
      router.refresh();
    } catch {
      setServerError("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Card className="border-0 shadow-2xl">
      <CardHeader className="space-y-3 pb-6 text-center">
        <div className="mx-auto mb-2">
          <h1 className="text-2xl font-bold tracking-tight text-[#1B4332]">
            Terra<span className="text-[#D4A843]">Track</span>
          </h1>
        </div>
        <CardTitle className="text-xl">Create your account</CardTitle>
        <CardDescription>
          Get started with TerraTrack for your sales team
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          {serverError && (
            <div className="rounded-md bg-red-50 px-3 py-2.5 text-sm text-red-600">
              {serverError}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="organizationName">Organization Name</Label>
            <Input
              id="organizationName"
              placeholder="Your company name"
              value={formData.organizationName}
              onChange={(e) => updateField("organizationName", e.target.value)}
              disabled={isLoading}
              autoFocus
            />
            {errors.organizationName && (
              <p className="text-xs text-red-500">{errors.organizationName}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name</Label>
              <Input
                id="firstName"
                placeholder="Jane"
                value={formData.firstName}
                onChange={(e) => updateField("firstName", e.target.value)}
                disabled={isLoading}
              />
              {errors.firstName && (
                <p className="text-xs text-red-500">{errors.firstName}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name</Label>
              <Input
                id="lastName"
                placeholder="Doe"
                value={formData.lastName}
                onChange={(e) => updateField("lastName", e.target.value)}
                disabled={isLoading}
              />
              {errors.lastName && (
                <p className="text-xs text-red-500">{errors.lastName}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="you@company.com"
              value={formData.email}
              onChange={(e) => updateField("email", e.target.value)}
              disabled={isLoading}
              autoComplete="email"
            />
            {errors.email && (
              <p className="text-xs text-red-500">{errors.email}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="Min. 8 characters"
              value={formData.password}
              onChange={(e) => updateField("password", e.target.value)}
              disabled={isLoading}
              autoComplete="new-password"
            />
            {errors.password && (
              <p className="text-xs text-red-500">{errors.password}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm Password</Label>
            <Input
              id="confirmPassword"
              type="password"
              placeholder="Re-enter your password"
              value={formData.confirmPassword}
              onChange={(e) => updateField("confirmPassword", e.target.value)}
              disabled={isLoading}
              autoComplete="new-password"
            />
            {errors.confirmPassword && (
              <p className="text-xs text-red-500">{errors.confirmPassword}</p>
            )}
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-4">
          <Button
            type="submit"
            className="w-full bg-[#1B4332] hover:bg-[#1B4332]/90"
            disabled={isLoading}
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Create Account
          </Button>
          <p className="text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link
              href="/login"
              className="font-medium text-[#1B4332] underline-offset-4 hover:underline"
            >
              Sign in
            </Link>
          </p>
        </CardFooter>
      </form>
    </Card>
  );
}
