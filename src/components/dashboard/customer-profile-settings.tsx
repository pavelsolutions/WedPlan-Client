"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { motion, useReducedMotion } from "motion/react";
import { Check, RefreshCw, UserRound } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/toast";
import ProfileImagePicker from "@/components/dashboard/profile-image-picker";
import {
  fetchCustomerProfile,
  updateCustomerProfile,
  type CustomerProfile,
} from "@/lib/customer-dashboard-api";

type ProfileState = {
  key: number;
  profile: CustomerProfile | null;
  error?: string;
};

export default function CustomerProfileSettings({
  accountLabel = "Customer",
}: {
  accountLabel?: string;
}) {
  const router = useRouter();
  const shouldReduceMotion = useReducedMotion();
  const [retryCount, setRetryCount] = useState(0);
  const [state, setState] = useState<ProfileState>({
    key: -1,
    profile: null,
  });
  const [name, setName] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isImageUploading, setIsImageUploading] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isSaved, setIsSaved] = useState(false);
  const isLoading = state.key !== retryCount;
  const profile = isLoading ? null : state.profile;
  const loadError = isLoading ? null : state.error;
  const hasChanges = profile !== null &&
    (name.trim() !== profile.name || imageUrl !== (profile.image ?? ""));

  useEffect(() => {
    const controller = new AbortController();
    void fetchCustomerProfile(controller.signal)
      .then((loadedProfile) => {
        if (controller.signal.aborted) return;
        setName(loadedProfile.name);
        setImageUrl(loadedProfile.image ?? "");
        setState({ key: retryCount, profile: loadedProfile });
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;
        setState({
          key: retryCount,
          profile: null,
          error:
            error instanceof Error
              ? error.message
              : "Your profile could not be loaded.",
        });
      });

    return () => controller.abort();
  }, [retryCount]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaveError(null);
    setIsSaved(false);

    const trimmedName = name.trim();
    if (!trimmedName || trimmedName.length > 100) {
      setSaveError("Your name must be between 1 and 100 characters.");
      return;
    }

    setIsSaving(true);
    try {
      const updatedProfile = await updateCustomerProfile({
        name: trimmedName,
        image: imageUrl.trim() || null,
      });
      setState({ key: retryCount, profile: updatedProfile });
      setName(updatedProfile.name);
      setImageUrl(updatedProfile.image ?? "");
      setIsSaved(true);
      router.refresh();
      toast.add({
        type: "success",
        title: "Profile updated",
        description: `Your ${accountLabel.toLowerCase()} profile has been saved.`,
      });
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Your profile could not be saved. Please try again.";
      setSaveError(message);
      toast.add({
        type: "error",
        title: "Profile could not be saved",
        description: message,
      });
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <section className="customer-profile-page">
      <div className="customer-profile-page__intro">
        <p className="eyebrow">YOUR ACCOUNT</p>
        <h2>Profile settings</h2>
        <p>Keep your account details current for a smoother planning experience.</p>
      </div>

      {isLoading ? (
        <div className="customer-profile-skeleton" aria-busy="true" aria-label="Loading profile settings">
          <span />
          <span />
          <span />
          <span />
        </div>
      ) : loadError || !profile ? (
        <div className="customer-dashboard-message customer-dashboard-message--error" role="alert">
          <div>
            <strong>We couldn’t load your profile.</strong>
            <p>{loadError ?? "Profile data is unavailable."}</p>
          </div>
          <Button
            type="button"
            variant="outline"
            onClick={() => setRetryCount((count) => count + 1)}
          >
            <RefreshCw size={15} aria-hidden="true" />
            Try again
          </Button>
        </div>
      ) : (
        <motion.div
          className="customer-profile-card"
          initial={shouldReduceMotion ? false : { opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: shouldReduceMotion ? 0 : 0.22 }}
        >
          <div className="customer-profile-card__identity">
            <Avatar className="customer-profile-card__avatar">
              {imageUrl ? <AvatarImage src={imageUrl} alt="" /> : null}
              <AvatarFallback>
                {name.trim().slice(0, 1).toUpperCase() || <UserRound size={25} />}
              </AvatarFallback>
            </Avatar>
            <div>
              <span>{accountLabel} account</span>
              <strong>{name || profile.name}</strong>
              <small>{profile.email}</small>
            </div>
          </div>

          <form
            className="customer-profile-form"
            onSubmit={handleSubmit}
            noValidate
          >
            <div className="customer-profile-form__field">
              <Label htmlFor="customer-profile-name">Full name</Label>
              <Input
                id="customer-profile-name"
                name="name"
                autoComplete="name"
                maxLength={100}
                value={name}
                onChange={(event) => {
                  setName(event.target.value);
                  setIsSaved(false);
                  setSaveError(null);
                }}
                required
              />
            </div>

            <div className="customer-profile-form__field">
              <Label htmlFor="customer-profile-email">Email address</Label>
              <Input
                id="customer-profile-email"
                name="email"
                type="email"
                value={profile.email}
                readOnly
                aria-describedby="customer-profile-email-help"
              />
              <small id="customer-profile-email-help">
                Email changes are not available from profile settings.
              </small>
            </div>

            <div className="customer-profile-form__field">
              <Label htmlFor="customer-profile-image-picker">Profile photo</Label>
              <ProfileImagePicker
                id="customer-profile-image-picker"
                name={name}
                imageUrl={imageUrl || null}
                disabled={isSaving}
                onImageChange={(nextImage) => {
                  setImageUrl(nextImage ?? "");
                  setIsSaved(false);
                  setSaveError(null);
                }}
                onUploadingChange={setIsImageUploading}
              />
            </div>

            {saveError ? (
              <p className="customer-profile-form__error" role="alert">
                {saveError}
              </p>
            ) : null}
            {isSaved ? (
              <p className="customer-profile-form__success" role="status">
                <Check size={15} aria-hidden="true" />
                Your profile changes are saved.
              </p>
            ) : null}

            <div className="customer-profile-form__footer">
              <p>Your profile is only updated after you save these changes.</p>
              <Button type="submit" disabled={isSaving || isImageUploading || !hasChanges}>
                {isSaving ? "Saving changes…" : "Save changes"}
              </Button>
            </div>
          </form>
        </motion.div>
      )}
    </section>
  );
}
