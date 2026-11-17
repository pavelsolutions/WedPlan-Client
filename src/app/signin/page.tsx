import { Suspense } from "react";
import type { Metadata } from "next";
import AuthPage, { AuthQueryToast } from "@/components/auth/auth-page";

type SignInPageProps = {
  searchParams: Promise<{ authError?: string | string[] }>;
};

export const metadata: Metadata = {
  title: "Log in | WedPlan",
  description: "Log in to continue planning your wedding with WedPlan.",
};

export default function SignInPage({ searchParams }: SignInPageProps) {
  return (
    <>
      <AuthPage mode="signin" />
      <Suspense fallback={null}>
        <SignInGoogleErrorToast searchParams={searchParams} />
      </Suspense>
    </>
  );
}

async function SignInGoogleErrorToast({ searchParams }: SignInPageProps) {
  const { authError } = await searchParams;
  return authError === "google" ? <AuthQueryToast mode="signin" /> : null;
}
