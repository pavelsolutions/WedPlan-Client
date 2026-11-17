"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ImagePlus, LoaderCircle, UploadCloud } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/toast";
import {
  saveVendorService,
  uploadVendorServiceImage,
  type VendorService,
} from "@/lib/vendor-dashboard-api";
import { weddingCategories, type WeddingCategory } from "@/lib/homepage-data";

const maxImageSize = 10 * 1024 * 1024;
const allowedImageTypes = new Set(["image/jpeg", "image/png", "image/webp"]);

export default function VendorServiceForm({
  service,
}: {
  service?: VendorService;
}) {
  const router = useRouter();
  const [serviceName, setServiceName] = useState(service?.serviceName ?? "");
  const [category, setCategory] = useState<WeddingCategory | "">(
    service?.category ?? "",
  );
  const [description, setDescription] = useState(service?.description ?? "");
  const [price, setPrice] = useState(service ? String(service.price) : "");
  const [location, setLocation] = useState(service?.location ?? "");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(
    service?.images[0] ?? null,
  );
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isEditing = Boolean(service);

  useEffect(() => {
    if (!imageFile) return;
    const preview = URL.createObjectURL(imageFile);
    setImagePreview(preview);
    return () => URL.revokeObjectURL(preview);
  }, [imageFile]);

  function chooseImage(file: File | undefined) {
    setError(null);
    if (!file) {
      setImageFile(null);
      setImagePreview(service?.images[0] ?? null);
      return;
    }
    if (!allowedImageTypes.has(file.type)) {
      setError("Choose a JPG, PNG, or WebP image.");
      return;
    }
    if (file.size > maxImageSize) {
      setError("Choose an image smaller than 10 MB.");
      return;
    }
    setImageFile(file);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    if (!category) {
      setError("Choose a service category.");
      return;
    }
    if (!imageFile && !service?.images[0]) {
      setError("Upload a service image before saving.");
      return;
    }

    setIsSaving(true);
    try {
      let imageUrl = service?.images[0] ?? null;
      if (imageFile) {
        imageUrl = await uploadVendorServiceImage(imageFile);
      }
      if (!imageUrl) {
        throw new Error("Upload a service image before saving.");
      }
      const saved = await saveVendorService(
        {
          serviceName: serviceName.trim(),
          category,
          description: description.trim(),
          price: Number(price),
          location: location.trim(),
          images: [imageUrl],
        },
        service?.id,
      );
      toast.add({
        type: "success",
        title: isEditing ? "Service updated" : "Service submitted",
        description: isEditing
          ? "Your listing changes are saved and awaiting approval."
          : "Your new service is pending admin approval.",
      });
      router.push("/dashboard/vendor/services");
      router.refresh();
      return saved;
    } catch (requestError) {
      const message =
        requestError instanceof Error
          ? requestError.message
          : "The service could not be saved. Please try again.";
      setError(message);
      toast.add({
        type: "error",
        title: "Service could not be saved",
        description: message,
      });
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <section className="vendor-service-form-page">
      <div className="vendor-page-intro">
        <div>
          <p className="eyebrow">YOUR WEDPLAN BUSINESS</p>
          <h2>{isEditing ? "Edit service" : "Add a service"}</h2>
          <p>
            {isEditing
              ? "Keep your listing details current. Changes return to admin review."
              : "Tell couples what you offer. Every new service is reviewed before publishing."}
          </p>
        </div>
        <Link className="vendor-back-link" href="/dashboard/vendor/services">
          <ArrowLeft size={15} aria-hidden="true" /> My services
        </Link>
      </div>

      <form className="vendor-service-form" onSubmit={handleSubmit} noValidate>
        <div className="vendor-service-form__heading">
          <span><BriefcaseBusinessIcon /></span>
          <div>
            <h3>Service details</h3>
            <p>Share the details that help couples find the right fit.</p>
          </div>
        </div>

        <div className="vendor-service-form__grid">
          <div className="vendor-form-field vendor-form-field--wide">
            <Label htmlFor="vendor-service-name">Service name</Label>
            <Input
              id="vendor-service-name"
              name="serviceName"
              value={serviceName}
              onChange={(event) => setServiceName(event.target.value)}
              placeholder="e.g. Golden Hour Wedding Photography"
              minLength={2}
              maxLength={120}
              required
            />
          </div>

          <div className="vendor-form-field">
            <Label htmlFor="vendor-service-category">Category</Label>
            <select
              id="vendor-service-category"
              name="category"
              value={category}
              onChange={(event) =>
                setCategory(event.target.value as WeddingCategory | "")
              }
              required
            >
              <option value="" disabled>Select a category</option>
              {weddingCategories.map((item) => (
                <option key={item} value={item}>{item}</option>
              ))}
            </select>
          </div>

          <div className="vendor-form-field">
            <Label htmlFor="vendor-service-price">Price (USD)</Label>
            <div className="vendor-price-input">
              <span aria-hidden="true">$</span>
              <Input
                id="vendor-service-price"
                name="price"
                type="number"
                min="0"
                max="1000000000"
                step="0.01"
                value={price}
                onChange={(event) => setPrice(event.target.value)}
                placeholder="1,800"
                required
              />
            </div>
          </div>

          <div className="vendor-form-field vendor-form-field--wide">
            <Label htmlFor="vendor-service-location">Location</Label>
            <Input
              id="vendor-service-location"
              name="location"
              value={location}
              onChange={(event) => setLocation(event.target.value)}
              placeholder="City, State or service area"
              minLength={2}
              maxLength={160}
              required
            />
          </div>

          <div className="vendor-form-field vendor-form-field--wide">
            <Label htmlFor="vendor-service-description">Description</Label>
            <Textarea
              id="vendor-service-description"
              name="description"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Describe your style, what's included, and what makes your service special."
              minLength={10}
              maxLength={5000}
              rows={6}
              required
            />
            <small>{description.length}/5000 characters</small>
          </div>

          <div className="vendor-form-field vendor-form-field--wide">
            <Label htmlFor="vendor-service-image">Service image</Label>
            <label
              className={`vendor-image-upload${imagePreview ? " vendor-image-upload--preview" : ""}`}
              htmlFor="vendor-service-image"
            >
              {imagePreview ? (
                <span
                  className="vendor-image-upload__preview"
                  role="img"
                  aria-label="Selected service image preview"
                  style={{ backgroundImage: `url("${imagePreview}")` }}
                />
              ) : (
                <span className="vendor-image-upload__icon">
                  <ImagePlus size={23} aria-hidden="true" />
                </span>
              )}
              <span className="vendor-image-upload__copy">
                <strong>{imageFile ? imageFile.name : imagePreview ? "Replace service image" : "Choose a service image"}</strong>
                <small>JPG, PNG, or WebP · up to 10 MB · uploaded securely to ImgBB</small>
              </span>
              <span className="vendor-image-upload__button">
                <UploadCloud size={15} aria-hidden="true" />
                Browse files
              </span>
              <input
                id="vendor-service-image"
                name="image"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={(event) => chooseImage(event.currentTarget.files?.[0])}
                aria-describedby="vendor-service-image-help"
              />
            </label>
            <small id="vendor-service-image-help">
              The selected image file is uploaded to ImgBB when you save.
            </small>
          </div>
        </div>

        {error ? <p className="vendor-form-error" role="alert">{error}</p> : null}
        <div className="vendor-service-form__footer">
          <p>New services and listing edits need admin approval before they appear publicly.</p>
          <Button type="submit" disabled={isSaving}>
            {isSaving ? (
              <><LoaderCircle size={15} className="vendor-spin" aria-hidden="true" /> Saving…</>
            ) : isEditing ? "Save changes" : "Submit for approval"}
          </Button>
        </div>
      </form>
    </section>
  );
}

function BriefcaseBusinessIcon() {
  return <ImagePlus size={20} aria-hidden="true" />;
}
