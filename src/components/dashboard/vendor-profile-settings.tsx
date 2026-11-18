"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { motion, useReducedMotion } from "motion/react";
import { BriefcaseBusiness, Check, RefreshCw, UserRound } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/toast";
import ProfileImagePicker from "@/components/dashboard/profile-image-picker";
import {
  fetchVendorProfile,
  updateVendorProfile,
  type VendorProfile,
} from "@/lib/vendor-dashboard-api";
import { VendorErrorState } from "@/components/dashboard/vendor-dashboard-ui";

type ProfileState = {
  key: number;
  profile: VendorProfile | null;
  error?: string;
};

export default function VendorProfileSettings() {
  const router = useRouter();
  const shouldReduceMotion = useReducedMotion();
  const [retryCount, setRetryCount] = useState(0);
  const [state, setState] = useState<ProfileState>({
    key: -1,
    profile: null,
  });
  const [name, setName] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [image, setImage] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isImageUploading, setIsImageUploading] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isSaved, setIsSaved] = useState(false);
  const isLoading = state.key !== retryCount;
  const profile = isLoading ? null : state.profile;
  const loadError = isLoading ? null : state.error;
  const hasChanges = profile !== null &&
    (name.trim() !== profile.name ||
      businessName.trim() !== (profile.businessName ?? "") ||
      image !== (profile.image ?? ""));

  useEffect(() => {
    const controller = new AbortController();
    void fetchVendorProfile(controller.signal)
      .then((loadedProfile) => {
        if (controller.signal.aborted) return;
        setName(loadedProfile.name);
        setBusinessName(loadedProfile.businessName ?? "");
        setImage(loadedProfile.image ?? "");
        setState({ key: retryCount, profile: loadedProfile });
      })
      .catch((requestError: unknown) => {
        if (controller.signal.aborted) return;
        setState({
          key: retryCount,
          profile: null,
          error:
            requestError instanceof Error
              ? requestError.message
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
    const trimmedBusinessName = businessName.trim();
    if (!trimmedName || trimmedName.length > 100) {
      setSaveError("Your name must be between 1 and 100 characters.");
      return;
    }
    if (trimmedBusinessName.length > 120) {
      setSaveError("Your business name must be 120 characters or fewer.");
      return;
    }

    setIsSaving(true);
    try {
      const updatedProfile = await updateVendorProfile({
        name: trimmedName,
        businessName: trimmedBusinessName || null,
        image: image.trim() || null,
      });
      setState({ key: retryCount, profile: updatedProfile });
      setName(updatedProfile.name);
      setBusinessName(updatedProfile.businessName ?? "");
      setImage(updatedProfile.image ?? "");
      setIsSaved(true);
      router.refresh();
      toast.add({
        type: "success",
        title: "Profile updated",
        description: "Your vendor profile has been saved.",
      });
    } catch (requestError) {
      const message =
        requestError instanceof Error
          ? requestError.message
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
    <section className="vendor-profile-page">
      <div className="vendor-page-intro">
        <div>
          <p className="eyebrow">YOUR ACCOUNT</p>
          <h2>Profile settings</h2>
          <p>Keep your account and business details current for couples and the WedPlan team.</p>
        </div>
      </div>

      {isLoading ? (
        <div className="vendor-profile-skeleton" aria-busy="true" aria-label="Loading profile settings">
          <span /><span /><span /><span />
        </div>
      ) : loadError || !profile ? (
        <VendorErrorState
          title="We couldn’t load your profile."
          message={loadError ?? "Profile data is unavailable."}
          onRetry={() => setRetryCount((count) => count + 1)}
        />
      ) : (
        <motion.div
          className="vendor-profile-card"
          initial={shouldReduceMotion ? false : { opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: shouldReduceMotion ? 0 : 0.22 }}
        >
          <div className="vendor-profile-card__identity">
            <Avatar className="vendor-profile-card__avatar">
              {image ? <AvatarImage src={image} alt="" /> : null}
              <AvatarFallback>
                {name.trim().slice(0, 1).toUpperCase() || <UserRound size={24} />}
              </AvatarFallback>
            </Avatar>
            <div>
              <span>Vendor account</span>
              <strong>{businessName || name || profile.name}</strong>
              <small>{profile.email}</small>
            </div>
          </div>
          <form className="vendor-profile-form" onSubmit={handleSubmit} noValidate>
            <div className="vendor-form-field">
              <Label htmlFor="vendor-profile-name">Full name</Label>
              <Input
                id="vendor-profile-name"
                name="name"
                autoComplete="name"
                maxLength={100}
                value={name}
                onChange={(event) => {
                  setName(event.target.value);
                  setIsSaved(false);
                  setSaveError(null);
                }}
              />
            </div>
            <div className="vendor-form-field">
              <Label htmlFor="vendor-profile-business">Business name</Label>
              <div className="vendor-profile-input-icon">
                <BriefcaseBusiness size={15} aria-hidden="true" />
                <Input
                  id="vendor-profile-business"
                  name="businessName"
                  autoComplete="organization"
                  maxLength={120}
                  value={businessName}
                  onChange={(event) => {
                    setBusinessName(event.target.value);
                    setIsSaved(false);
                    setSaveError(null);
                  }}
                  placeholder="Your studio or business"
                />
              </div>
            </div>
            <div className="vendor-form-field">
              <Label htmlFor="vendor-profile-email">Email address</Label>
              <Input id="vendor-profile-email" type="email" value={profile.email} readOnly />
              <small>Email changes aren’t available in profile settings.</small>
            </div>
            <div className="vendor-form-field">
              <Label htmlFor="vendor-profile-image-picker">Profile photo</Label>
              <ProfileImagePicker
                id="vendor-profile-image-picker"
                name={name}
                imageUrl={image || null}
                disabled={isSaving}
                onImageChange={(nextImage) => {
                  setImage(nextImage ?? "");
                  setIsSaved(false);
                  setSaveError(null);
                }}
                onUploadingChange={setIsImageUploading}
              />
            </div>

            {saveError ? <p className="vendor-form-error" role="alert">{saveError}</p> : null}
            {isSaved ? (
              <p className="vendor-form-success" role="status">
                <Check size={15} aria-hidden="true" /> Your profile changes are saved.
              </p>
            ) : null}
            <div className="vendor-profile-form__footer">
              <p>Your profile is only updated after you save these changes.</p>
              <Button type="submit" disabled={isSaving || isImageUploading || !hasChanges}>
                {isSaving ? <><RefreshCw size={14} className="vendor-spin" aria-hidden="true" /> Saving…</> : "Save profile"}
              </Button>
            </div>
          </form>
        </motion.div>
      )}
    </section>
  );
}
