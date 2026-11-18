"use client";

import { useRef, useState, type ChangeEvent } from "react";
import { Camera, LoaderCircle, Trash2, UserRound } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";
import { uploadImageToImgBB } from "@/lib/image-upload-api";

const maxImageSize = 10 * 1024 * 1024;
const allowedImageTypes = new Set(["image/jpeg", "image/png", "image/webp"]);

type ProfileImagePickerProps = {
  id: string;
  name: string;
  imageUrl: string | null;
  disabled?: boolean;
  onImageChange: (imageUrl: string | null) => void;
  onUploadingChange: (isUploading: boolean) => void;
};

export default function ProfileImagePicker({
  id,
  name,
  imageUrl,
  disabled = false,
  onImageChange,
  onUploadingChange,
}: ProfileImagePickerProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  async function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const input = event.currentTarget;
    const file = input.files?.[0];
    if (!file) return;

    setUploadError(null);
    if (!allowedImageTypes.has(file.type)) {
      const message = "Choose a JPG, PNG, or WebP image.";
      setUploadError(message);
      toast.add({ type: "error", title: "Unsupported image", description: message });
      input.value = "";
      return;
    }
    if (file.size > maxImageSize) {
      const message = "Choose an image smaller than 10 MB.";
      setUploadError(message);
      toast.add({ type: "error", title: "Image is too large", description: message });
      input.value = "";
      return;
    }

    setIsUploading(true);
    onUploadingChange(true);
    try {
      const uploadedUrl = await uploadImageToImgBB(file);
      onImageChange(uploadedUrl);
      toast.add({
        type: "success",
        title: "Photo uploaded",
        description: "Save your profile to apply this photo.",
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "The image could not be uploaded.";
      setUploadError(message);
      toast.add({
        type: "error",
        title: "Photo could not be uploaded",
        description: message,
      });
    } finally {
      setIsUploading(false);
      onUploadingChange(false);
      input.value = "";
    }
  }

  return (
    <div className="profile-image-picker">
      <Avatar className="profile-image-picker__avatar">
        {imageUrl ? <AvatarImage src={imageUrl} alt="" /> : null}
        <AvatarFallback>
          {name.trim().slice(0, 1).toUpperCase() || <UserRound size={23} />}
        </AvatarFallback>
      </Avatar>
      <div className="profile-image-picker__content">
        <div className="profile-image-picker__actions">
          <input
            ref={inputRef}
            id={id}
            className="sr-only"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            aria-label="Select profile photo"
            tabIndex={-1}
            onChange={(event) => void handleFileChange(event)}
          />
          <Button
            type="button"
            variant="outline"
            aria-describedby={`${id}-help`}
            disabled={disabled || isUploading}
            onClick={() => inputRef.current?.click()}
          >
            {isUploading ? (
              <LoaderCircle className="profile-image-picker__spinner" size={15} aria-hidden="true" />
            ) : (
              <Camera size={15} aria-hidden="true" />
            )}
            {isUploading ? "Uploading…" : imageUrl ? "Change photo" : "Upload photo"}
          </Button>
          {imageUrl ? (
            <Button
              type="button"
              variant="ghost"
              disabled={disabled || isUploading}
              onClick={() => {
                setUploadError(null);
                onImageChange(null);
              }}
            >
              <Trash2 size={14} aria-hidden="true" />
              Remove
            </Button>
          ) : null}
        </div>
        <small id={`${id}-help`}>JPG, PNG, or WebP, up to 10 MB.</small>
        {isUploading ? (
          <span className="profile-image-picker__status" role="status" aria-live="polite">
            Uploading your photo securely…
          </span>
        ) : null}
        {uploadError ? (
          <span className="profile-image-picker__error" role="alert">
            {uploadError}
          </span>
        ) : null}
      </div>
    </div>
  );
}
