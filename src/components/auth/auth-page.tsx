"use client";

import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
} from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  Eye,
  EyeOff,
  Heart,
  LockKeyhole,
  Mail,
  Sparkles,
  UserRound,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { signIn, signUp } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/toast";

type AuthPageProps = {
  mode: "signin" | "signup";
};

const passwordRule =
  "Use at least 6 characters, including one uppercase and one lowercase letter.";
const maxProfileImageSize = 10 * 1024 * 1024;
const profileImageUploadTimeout = 30_000;
type AuthNotice = {
  type: "info" | "error" | "success";
  message: string;
};

function showAuthToast(
  type: "info" | "error" | "success",
  message: string,
) {
  const title =
    type === "error"
      ? "Couldn’t complete that"
      : type === "success"
        ? "All set"
        : "A quick note";

  toast.add({ type, title, description: message });
}

export function AuthQueryToast({ mode }: AuthPageProps) {
  const hasShownToast = useRef(false);

  useEffect(() => {
    if (hasShownToast.current) return;
    hasShownToast.current = true;
    showAuthToast(
      "error",
      `Google ${mode === "signup" ? "sign-up" : "sign-in"} could not be completed. Please try again.`,
    );
  }, [mode]);

  return null;
}

function getDashboardPath(role: "customer" | "vendor") {
  return `/dashboard/${role}`;
}

function getSafeCallbackUrl() {
  const callbackUrl = new URLSearchParams(window.location.search).get(
    "callbackURL",
  );
  if (!callbackUrl) return null;

  try {
    const target = new URL(callbackUrl, window.location.origin);
    if (target.origin !== window.location.origin) return null;
    return `${target.pathname}${target.search}${target.hash}`;
  } catch {
    return null;
  }
}

export default function AuthPage({ mode }: AuthPageProps) {
  const isSignup = mode === "signup";
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState<"customer" | "vendor">("customer");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [profileImage, setProfileImage] = useState<File | null>(null);
  const [profilePreview, setProfilePreview] = useState<string | null>(null);
  const [profileImageUrl, setProfileImageUrl] = useState<string | null>(null);
  const [profileImageUploadError, setProfileImageUploadError] = useState<
    string | null
  >(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const uploadController = useRef<AbortController | null>(null);
  const submitLabel = isSignup
    ? isUploadingImage
      ? "Uploading profile photo…"
      : isSubmitting
        ? "Creating your account…"
        : "Create my account"
    : isSubmitting
      ? "Signing you in…"
      : "Log in to WedPlan";
  const [notice, setNotice] = useState<AuthNotice | null>(null);
  const lastNotifiedNotice = useRef<AuthNotice | null>(null);

  useEffect(() => {
    if (!notice) {
      lastNotifiedNotice.current = null;
      return;
    }

    if (lastNotifiedNotice.current === notice) return;
    lastNotifiedNotice.current = notice;
    showAuthToast(notice.type, notice.message);
  }, [notice]);

  useEffect(() => {
    if (!profilePreview) return;
    return () => URL.revokeObjectURL(profilePreview);
  }, [profilePreview]);

  useEffect(() => {
    return () => {
      uploadController.current?.abort();
      uploadController.current = null;
    };
  }, []);

  async function uploadProfileImage(file: File, controller: AbortController) {
    const formData = new FormData();
    formData.append("image", file);
    const timeout = setTimeout(
      () => controller.abort(),
      profileImageUploadTimeout,
    );

    try {
      const response = await fetch("/api/upload/profile-image", {
        method: "POST",
        body: formData,
        signal: controller.signal,
      });
      const result: unknown = await response.json();
      const imageUrl =
        typeof result === "object" &&
        result !== null &&
        "url" in result &&
        typeof result.url === "string"
          ? result.url
          : null;

      if (!response.ok || !imageUrl) {
        const message =
          typeof result === "object" &&
          result !== null &&
          "error" in result &&
          typeof result.error === "string"
            ? result.error
            : "The profile image could not be uploaded.";
        throw new Error(message);
      }

      setProfileImageUrl(imageUrl);
      setProfileImageUploadError(null);
      setNotice({
        type: "success",
        message: "Your profile photo was uploaded to ImgBB.",
      });
    } catch (error) {
      if (uploadController.current !== controller) return;

      const message =
        error instanceof Error && error.name === "AbortError"
          ? "The photo upload took too long. Try again or continue without a photo."
          : error instanceof Error
            ? error.message
            : "The profile image could not be uploaded. Please try again.";
      setProfileImageUploadError(message);
      setNotice({
        type: "error",
        message,
      });
    } finally {
      clearTimeout(timeout);
      if (uploadController.current === controller) {
        uploadController.current = null;
        setIsUploadingImage(false);
      }
    }
  }

  function beginProfileImageUpload(file: File) {
    const supportedTypes = ["image/jpeg", "image/png", "image/webp"];
    if (
      !supportedTypes.includes(file.type) ||
      file.size > maxProfileImageSize
    ) {
      uploadController.current?.abort();
      uploadController.current = null;
      setProfileImage(null);
      setProfilePreview(null);
      setProfileImageUrl(null);
      setProfileImageUploadError(null);
      setIsUploadingImage(false);
      setNotice({
        type: "error",
        message:
          file.size > maxProfileImageSize
            ? "Choose an image smaller than 10 MB."
            : "Choose a JPG, PNG, or WebP image for your profile.",
      });
      return;
    }

    uploadController.current?.abort();
    const controller = new AbortController();
    uploadController.current = controller;
    setProfileImage(file);
    setProfileImageUrl(null);
    setProfileImageUploadError(null);
    setProfilePreview(URL.createObjectURL(file));
    setIsUploadingImage(true);
    setNotice({ type: "info", message: "Uploading your profile photo to ImgBB…" });
    void uploadProfileImage(file, controller);
  }

  function handleProfileImageChange(event: ChangeEvent<HTMLInputElement>) {
    const input = event.currentTarget;
    const file = input.files?.[0];
    input.value = "";
    if (file) beginProfileImageUpload(file);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (isSignup && password !== confirmPassword) {
      setNotice({ type: "error", message: "Your passwords don’t match yet." });
      return;
    }

    if (isUploadingImage) {
      setNotice({
        type: "error",
        message: "Your profile photo is still uploading. Please wait a moment.",
      });
      return;
    }

    if (isSignup && profileImage && !profileImageUrl) {
      showAuthToast(
        "info",
        "Your account will be created without a profile photo. You can try uploading it again or continue without it.",
      );
    }

    const formData = new FormData(event.currentTarget);
    const email = formData.get("email");
    const name = formData.get("name");
    if (typeof email !== "string") {
      setNotice({
        type: "error",
        message: "Please check your details and try again.",
      });
      return;
    }

    setIsSubmitting(true);
    setNotice(null);

    try {
      if (isSignup) {
        if (typeof name !== "string") {
          setNotice({
            type: "error",
            message: "Please enter your full name.",
          });
          return;
        }

        const result = await signUp.email({
          name,
          email,
          password,
          image: profileImageUrl ?? undefined,
          role,
        });

        if (result.error) {
          setNotice({
            type: "error",
            message: result.error.message || "We couldn’t create your account.",
          });
          return;
        }

        showAuthToast("success", "Your WedPlan account has been created.");
        router.replace(getDashboardPath(role));
        router.refresh();
        return;
      }

      const result = await signIn.email({ email, password });
      if (result.error) {
        setNotice({
          type: "error",
          message: result.error.message || "We couldn’t sign you in.",
        });
        return;
      }

      showAuthToast("success", "You’re signed in to WedPlan.");
      const callbackUrl = getSafeCallbackUrl();
      if (callbackUrl) {
        router.replace(callbackUrl);
        router.refresh();
        return;
      }

      const signedInRole = result.data.user.role;
      if (signedInRole === "customer" || signedInRole === "vendor") {
        router.replace(getDashboardPath(signedInRole));
        router.refresh();
        return;
      }

      router.replace("/auth/redirect");
      router.refresh();
    } catch (error) {
      setNotice({
        type: "error",
        message:
          error instanceof Error
            ? error.message
            : "Something went wrong. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleGoogleSignIn() {
    setIsSubmitting(true);
    setNotice(null);

    try {
      const result = await signIn.social({
        provider: "google",
        callbackURL: "/auth/redirect",
        newUserCallbackURL: "/auth/redirect",
        errorCallbackURL: `${window.location.origin}${isSignup ? "/signup" : "/signin"}?authError=google`,
        disableRedirect: true,
        ...(isSignup ? { additionalData: { role } } : {}),
      });

      if (result.error) {
        setNotice({
          type: "error",
          message: result.error.message || "Google sign-in is unavailable right now.",
        });
        return;
      }

      if (result.data.url) {
        window.location.assign(result.data.url);
        return;
      }

      setNotice({
        type: "error",
        message: "Google sign-in did not return a redirect. Please try again.",
      });
    } catch (error) {
      setNotice({
        type: "error",
        message:
          error instanceof Error
            ? error.message
            : "Google sign-in is unavailable right now.",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="auth-page">
      <header className="auth-header">
        <Link className="brand" href="/" aria-label="WedPlan home">
          <span className="brand__mark">
            <Heart size={19} strokeWidth={1.8} aria-hidden="true" />
          </span>
          <span>wedplan<span className="brand__period">.</span></span>
        </Link>
        <Link className="auth-header__home" href="/">
          <ArrowLeft size={15} aria-hidden="true" />
          Back to home
        </Link>
      </header>

      <div className="auth-layout">
        <section className="auth-story" aria-label="Welcome to WedPlan">
          <div className="auth-story__photo" aria-hidden="true" />
          <div className="auth-story__overlay" />
          <div className="auth-story__content">
            <span className="auth-story__badge">
              <Sparkles size={14} aria-hidden="true" />
              A little more heart, a lot less overwhelm
            </span>
            <p className="auth-story__eyebrow">YOUR DAY, YOUR WAY</p>
            <h1>
              The beginning
              <br />
              of something <em>beautiful.</em>
            </h1>
            <p className="auth-story__description">
              Find the people who make every detail feel like yours. Your
              wedding-planning story starts here.
            </p>
            <div className="auth-story__quote">
              <span aria-hidden="true">“</span>
              <p>Here’s to a day that feels like the two of you.</p>
            </div>
          </div>
          <div className="auth-story__caption">
            <Heart size={14} fill="currentColor" aria-hidden="true" />
            Made for your kind of love
          </div>
        </section>

        <section className="auth-form-panel">
          <div className="auth-form-wrap">
            <div className="auth-form-heading">
              <span className="auth-form-heading__icon">
                <Heart size={18} aria-hidden="true" />
              </span>
              <p className="eyebrow">
                {isSignup ? "Let’s make it yours" : "Welcome back"}
              </p>
              <h2>{isSignup ? "Start your story." : "Your plans are waiting."}</h2>
              <p className="auth-form-heading__description">
                {isSignup
                  ? "Create your WedPlan account and start finding your people."
                  : "Sign in to pick up right where your wedding plans left off."}
              </p>
            </div>

            <form
              className="auth-form"
              onSubmit={handleSubmit}
              aria-busy={isSubmitting || isUploadingImage}
            >
              {isSignup ? (
                <>
                  <div className="auth-field">
                    <Label htmlFor="full-name">Your name</Label>
                    <div className="auth-input-wrap">
                      <UserRound size={17} aria-hidden="true" />
                      <Input
                        id="full-name"
                        name="name"
                        type="text"
                        placeholder="e.g. Jamie Parker"
                        autoComplete="name"
                        minLength={2}
                        required
                      />
                    </div>
                  </div>
                  <fieldset className="auth-role-field">
                    <legend>I’m here as a…</legend>
                    <div className="auth-role-options">
                      <button
                        className={`auth-role-option${role === "customer" ? " auth-role-option--selected" : ""}`}
                        type="button"
                        aria-pressed={role === "customer"}
                        onClick={() => setRole("customer")}
                      >
                        <Heart size={16} aria-hidden="true" />
                        <span>
                          <strong>Customer</strong>
                          <small>Planning my wedding</small>
                        </span>
                      </button>
                      <button
                        className={`auth-role-option${role === "vendor" ? " auth-role-option--selected" : ""}`}
                        type="button"
                        aria-pressed={role === "vendor"}
                        onClick={() => setRole("vendor")}
                      >
                        <Sparkles size={16} aria-hidden="true" />
                        <span>
                          <strong>Vendor</strong>
                          <small>Sharing my services</small>
                        </span>
                      </button>
                    </div>
                    <input type="hidden" name="role" value={role} />
                  </fieldset>
                  <div className="auth-field">
                    <Label htmlFor="profile-image">
                      Profile image <span className="auth-optional">Optional</span>
                    </Label>
                    <div
                      className={`auth-upload${isUploadingImage ? " auth-upload--disabled" : ""}`}
                    >
                      {profilePreview ? (
                        <div
                          className="auth-upload__preview"
                          role="img"
                          aria-label={`Preview of ${profileImage?.name ?? "selected profile image"}`}
                          style={{ backgroundImage: `url("${profilePreview}")` }}
                        />
                      ) : (
                        <span className="auth-upload__placeholder" aria-hidden="true">
                          <UserRound size={20} />
                        </span>
                      )}
                      <div className="auth-upload__details">
                        <strong>
                          {profileImage ? profileImage.name : "Add a profile photo"}
                        </strong>
                        <small>
                          {isUploadingImage
                            ? "Uploading securely to ImgBB…"
                            : profileImageUrl
                              ? "Uploaded securely to ImgBB"
                              : profileImageUploadError
                                ? "Upload failed"
                              : "JPG, PNG, or WebP · up to 10 MB"}
                        </small>
                      </div>
                      <label className="auth-upload__button" htmlFor="profile-image">
                        {profileImage ? "Change" : "Choose file"}
                      </label>
                      <input
                        id="profile-image"
                        name="profileImage"
                        className="auth-upload__input"
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        aria-describedby="profile-image-help"
                        disabled={isUploadingImage}
                        onChange={handleProfileImageChange}
                      />
                    </div>
                    {profileImageUploadError ? (
                      <span
                        id="profile-image-help"
                        className="auth-field__hint auth-field__hint--error"
                        role="status"
                      >
                        {profileImageUploadError} Your photo is optional; submit
                        to continue without it.{" "}
                        <button
                          className="auth-upload__retry"
                          type="button"
                          disabled={isUploadingImage}
                          onClick={() => {
                            if (profileImage) {
                              beginProfileImageUpload(profileImage);
                            }
                          }}
                        >
                          Try again
                        </button>
                      </span>
                    ) : (
                      <span id="profile-image-help" className="auth-field__hint">
                        Your image uploads through WedPlan’s server; the ImgBB API key stays private.
                      </span>
                    )}
                    <input
                      type="hidden"
                      name="profileImageUrl"
                      value={profileImageUrl ?? ""}
                    />
                  </div>
                </>
              ) : null}

              <div className="auth-field">
                <Label htmlFor="email">Email address</Label>
                <div className="auth-input-wrap">
                  <Mail size={17} aria-hidden="true" />
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="you@example.com"
                    autoComplete="email"
                    required
                  />
                </div>
              </div>

              <div className="auth-field">
                <div className="auth-field__label-row">
                  <Label htmlFor="password">Password</Label>
                  {!isSignup ? (
                    <button
                      className="auth-inline-link"
                      type="button"
                      onClick={() =>
                        setNotice({
                          type: "info",
                          message:
                            "Password reset isn’t available yet. Please contact the WedPlan team for help.",
                        })
                      }
                    >
                      Forgot password?
                    </button>
                  ) : null}
                </div>
                <div className="auth-input-wrap">
                  <LockKeyhole size={17} aria-hidden="true" />
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    placeholder={isSignup ? "Create a password" : "Enter your password"}
                    autoComplete={isSignup ? "new-password" : "current-password"}
                    minLength={6}
                    pattern={isSignup ? "(?=.*[a-z])(?=.*[A-Z]).{6,}" : undefined}
                    title={isSignup ? passwordRule : undefined}
                    required
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                  />
                  <button
                    className="auth-password-toggle"
                    type="button"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    onClick={() => setShowPassword((visible) => !visible)}
                  >
                    {showPassword ? (
                      <EyeOff size={17} aria-hidden="true" />
                    ) : (
                      <Eye size={17} aria-hidden="true" />
                    )}
                  </button>
                </div>
                {isSignup ? (
                  <p className="auth-field__hint">{passwordRule}</p>
                ) : null}
              </div>

              {isSignup ? (
                <div className="auth-field">
                  <Label htmlFor="confirm-password">Confirm password</Label>
                  <div className="auth-input-wrap">
                    <LockKeyhole size={17} aria-hidden="true" />
                    <Input
                      id="confirm-password"
                      name="confirmPassword"
                      type={showPassword ? "text" : "password"}
                      placeholder="Type your password again"
                      autoComplete="new-password"
                      minLength={6}
                      required
                      value={confirmPassword}
                      onChange={(event) => setConfirmPassword(event.target.value)}
                    />
                  </div>
                </div>
              ) : null}

              <Button
                className="auth-submit"
                type="submit"
                disabled={isSubmitting || (isSignup && isUploadingImage)}
              >
                {submitLabel}
                {isSubmitting || (isSignup && isUploadingImage) ? null : (
                  <ArrowRight size={16} aria-hidden="true" />
                )}
              </Button>

              <div className="auth-divider"><span>or</span></div>
              <Button
                className="auth-google"
                type="button"
                variant="outline"
                disabled={isSubmitting}
                onClick={handleGoogleSignIn}
              >
                <span className="auth-google__mark" aria-hidden="true">G</span>
                {isSignup ? "Continue with Google" : "Log in with Google"}
              </Button>

              <p className="auth-switch">
                {isSignup ? "Already have an account?" : "New to WedPlan?"}{" "}
                <Link href={isSignup ? "/signin" : "/signup"}>
                  {isSignup ? "Log in" : "Create an account"}
                </Link>
              </p>
            </form>

            <p className="auth-privacy">
              <LockKeyhole size={13} aria-hidden="true" />
              Your details are used to create and secure your WedPlan account.
            </p>
          </div>
        </section>
      </div>

      <footer className="auth-footer">
        <span>© WedPlan. Made with love.</span>
        <Link href="/#categories">
          Explore wedding services <ArrowRight size={13} aria-hidden="true" />
        </Link>
      </footer>
    </main>
  );
}
