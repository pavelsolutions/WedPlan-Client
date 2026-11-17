import { Suspense } from "react";
import type { Metadata } from "next";
import AuthPage, { AuthQueryToast } from "@/components/auth/auth-page";

type SignUpPageProps = {
  searchParams: Promise<{ authError?: string | string[] }>;
};

export const metadata: Metadata = {
  title: "Create an account | WedPlan",
  description: "Create a WedPlan account and find your wedding professionals.",
};

export default function SignUpPage({ searchParams }: SignUpPageProps) {
  return (
    <>
      <AuthPage mode="signup" />
      <Suspense fallback={null}>
        <SignUpGoogleErrorToast searchParams={searchParams} />
      </Suspense>
    </>
  );
}

async function SignUpGoogleErrorToast({ searchParams }: SignUpPageProps) {
  const { authError } = await searchParams;
  return authError === "google" ? <AuthQueryToast mode="signup" /> : null;
}
