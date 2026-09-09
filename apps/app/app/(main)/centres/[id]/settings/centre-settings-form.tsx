"use client";

import { buildWorkspaceUrl } from "@repo/auth/domain";
import { FluidPanel } from "@repo/design-system/components/fluid-panel";
import { Button } from "@repo/design-system/components/ui/fluid-button";
import { InputCopy } from "@repo/design-system/components/ui/fluid-input-copy";
import {
  InputField,
  InputGroup,
} from "@repo/design-system/components/ui/fluid-input-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@repo/design-system/components/ui/fluid-select";
import { Label } from "@repo/design-system/components/ui/label";
import { toastManager } from "@repo/design-system/components/ui/toast";
import {
  AlertTriangleIcon,
  ExternalLinkIcon,
  ImageUpIcon,
  LinkIcon,
  Loader2Icon,
  MapPinIcon,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { updateCentreProfile } from "./actions";
import { CentreArchiveDialog } from "./centre-archive-dialog";
import { CentreLogoUploader } from "./centre-logo-uploader";

const MALAYSIAN_STATES = [
  "Selangor",
  "WP Kuala Lumpur",
  "Johor",
  "Pulau Pinang",
  "Perak",
  "Kedah",
  "Melaka",
  "Negeri Sembilan",
  "Pahang",
  "Kelantan",
  "Terengganu",
  "Perlis",
  "Sabah",
  "Sarawak",
  "WP Putrajaya",
  "WP Labuan",
] as const;

const POSTCODE_PATTERN = /^\d{5}$/;

interface CentreSettingsFormProps {
  organization: {
    id: string;
    imageUrl: string | null;
    name: string;
    settings: {
      addressLine1: string | null;
      addressLine2: string | null;
      city: string | null;
      email: string | null;
      phone: string | null;
      postcode: string | null;
      state: string | null;
    } | null;
    slug: string;
  };
}

const FieldLabel = ({
  children,
  htmlFor,
  required,
}: {
  readonly children: React.ReactNode;
  readonly htmlFor?: string;
  readonly required?: boolean;
}) => (
  <Label htmlFor={htmlFor}>
    {children}
    {required ? <span className="text-destructive text-xs"> *</span> : null}
  </Label>
);

const PanelHeader = ({
  icon: Icon,
  title,
  tone,
}: {
  readonly icon: typeof ImageUpIcon;
  readonly title: string;
  readonly tone?: "danger";
}) => (
  <span className="flex items-center gap-2.5">
    <span
      className={
        tone === "danger"
          ? "flex size-8 shrink-0 items-center justify-center rounded-lg bg-destructive/10"
          : "flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10"
      }
    >
      <Icon
        className={
          tone === "danger" ? "size-4 text-destructive" : "size-4 text-primary"
        }
      />
    </span>
    <span className="font-medium text-foreground text-sm">{title}</span>
  </span>
);

export const CentreSettingsForm = ({
  organization,
}: CentreSettingsFormProps) => {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [archiveOpen, setArchiveOpen] = useState(false);
  const [name, setName] = useState(organization.name);
  const [imageUrl, setImageUrl] = useState<string | null>(
    organization.imageUrl
  );
  const [email, setEmail] = useState(organization.settings?.email ?? "");
  const [phone, setPhone] = useState(organization.settings?.phone ?? "");
  const [addressLine1, setAddressLine1] = useState(
    organization.settings?.addressLine1 ?? ""
  );
  const [addressLine2, setAddressLine2] = useState(
    organization.settings?.addressLine2 ?? ""
  );
  const [city, setCity] = useState(organization.settings?.city ?? "");
  const [state, setState] = useState(organization.settings?.state ?? "");
  const [postcode, setPostcode] = useState(
    organization.settings?.postcode ?? ""
  );

  const workspaceUrl = buildWorkspaceUrl(organization.slug);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (postcode.trim() && !POSTCODE_PATTERN.test(postcode.trim())) {
      toastManager.add({
        title: "Postcode must be 5 digits",
        type: "error",
      });
      return;
    }

    setSaving(true);

    try {
      await updateCentreProfile(organization.id, {
        name,
        imageUrl,
        email: email || null,
        phone: phone || null,
        addressLine1: addressLine1 || null,
        addressLine2: addressLine2 || null,
        city: city || null,
        state: state || null,
        postcode: postcode || null,
      });
      toastManager.add({ title: "Centre settings saved", type: "success" });
      router.refresh();
    } catch (error) {
      toastManager.add({
        title:
          error instanceof Error ? error.message : "Failed to save settings",
        type: "error",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <h1 className="font-semibold text-3xl tracking-tight">
            {organization.name} — Settings
          </h1>
          <p className="text-muted-foreground">
            Configure your centre branding, branch details, and workspace URL
          </p>
        </div>
        <Button disabled={saving} type="submit">
          {saving ? (
            <>
              <Loader2Icon className="size-4 animate-spin" />
              Saving...
            </>
          ) : (
            "Save Changes"
          )}
        </Button>
      </div>

      <div className="grid content-start gap-5">
        <FluidPanel
          header={
            <PanelHeader icon={ImageUpIcon} title="Centre Identity & Logo" />
          }
          stageClassName="min-h-0 flex-1 flex-col justify-start gap-4 p-4 sm:p-5"
        >
          <p className="text-muted-foreground text-xs">
            Official centre name shown on receipts, invoices, and portal
          </p>
          <CentreLogoUploader
            centreName={name || organization.name}
            currentImageUrl={imageUrl}
            disabled={saving}
            onImageChange={setImageUrl}
          />
          <div className="grid content-start gap-1.5">
            <FieldLabel htmlFor="centre-name" required>
              Centre Name
            </FieldLabel>
            <InputGroup className="contents">
              <InputField
                id="centre-name"
                index={0}
                label="Centre Name"
                labelHidden
                onChange={setName}
                placeholder="Bright Mind Academy"
                value={name}
              />
            </InputGroup>
          </div>
        </FluidPanel>

        <FluidPanel
          header={
            <PanelHeader
              icon={MapPinIcon}
              title="Contact & Physical Location"
            />
          }
          stageClassName="min-h-0 flex-1 flex-col justify-start gap-4 p-4 sm:p-5"
        >
          <p className="text-muted-foreground text-xs">
            Where parents reach you, and the address printed on invoices
          </p>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="grid content-start gap-1.5">
              <FieldLabel htmlFor="centre-email">Official Email</FieldLabel>
              <InputGroup className="contents">
                <InputField
                  id="centre-email"
                  index={0}
                  label="Official Email"
                  labelHidden
                  onChange={setEmail}
                  placeholder="contact@brightmind.edu.my"
                  type="email"
                  value={email}
                />
              </InputGroup>
            </div>
            <div className="grid content-start gap-1.5">
              <FieldLabel htmlFor="centre-phone">Contact Phone</FieldLabel>
              <InputGroup className="contents">
                <InputField
                  id="centre-phone"
                  index={0}
                  label="Contact Phone"
                  labelHidden
                  onChange={setPhone}
                  placeholder="+60 12-345 6789"
                  type="tel"
                  value={phone}
                />
              </InputGroup>
            </div>
          </div>
          <div className="grid content-start gap-1.5">
            <FieldLabel htmlFor="centre-address1">Street Address 1</FieldLabel>
            <InputGroup className="contents">
              <InputField
                id="centre-address1"
                index={0}
                label="Street Address 1"
                labelHidden
                onChange={setAddressLine1}
                placeholder="42, Jalan SS 2/67"
                value={addressLine1}
              />
            </InputGroup>
          </div>
          <div className="grid content-start gap-1.5">
            <FieldLabel htmlFor="centre-address2">
              Street Address 2 (optional)
            </FieldLabel>
            <InputGroup className="contents">
              <InputField
                id="centre-address2"
                index={0}
                label="Street Address 2 (optional)"
                labelHidden
                onChange={setAddressLine2}
                placeholder="Level 2, Commercial Block"
                value={addressLine2}
              />
            </InputGroup>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="grid content-start gap-1.5">
              <FieldLabel htmlFor="centre-city">City</FieldLabel>
              <InputGroup className="contents">
                <InputField
                  id="centre-city"
                  index={0}
                  label="City"
                  labelHidden
                  onChange={setCity}
                  placeholder="Petaling Jaya"
                  value={city}
                />
              </InputGroup>
            </div>
            <div className="grid content-start gap-1.5">
              <FieldLabel htmlFor="centre-postcode">Postcode</FieldLabel>
              <InputGroup className="contents">
                <InputField
                  id="centre-postcode"
                  index={0}
                  inputMode="numeric"
                  label="Postcode"
                  labelHidden
                  maxLength={5}
                  onChange={setPostcode}
                  placeholder="47300"
                  value={postcode}
                />
              </InputGroup>
            </div>
          </div>
          <div className="grid content-start gap-1.5">
            <FieldLabel>State</FieldLabel>
            <Select onValueChange={setState} value={state}>
              <SelectTrigger placeholder="Select state..." />
              <SelectContent>
                {MALAYSIAN_STATES.map((malaysianState, itemIndex) => (
                  <SelectItem
                    index={itemIndex}
                    key={malaysianState}
                    value={malaysianState}
                  >
                    {malaysianState}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </FluidPanel>

        <FluidPanel
          header={
            <PanelHeader icon={LinkIcon} title="Workspace Subdomain & Access" />
          }
          stageClassName="min-h-0 flex-1 flex-col justify-start gap-4 p-4 sm:p-5"
        >
          <p className="text-muted-foreground text-xs">
            Staff and teachers sign in directly through your subdomain
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <div className="min-w-0 flex-1">
              <InputCopy aria-label="Workspace URL" value={workspaceUrl} />
            </div>
            <Button asChild variant="tertiary">
              <a
                aria-label="Visit workspace"
                href={workspaceUrl}
                rel="noopener noreferrer"
                target="_blank"
              >
                Visit
                <ExternalLinkIcon className="size-4" />
              </a>
            </Button>
          </div>
        </FluidPanel>

        <FluidPanel
          header={
            <PanelHeader
              icon={AlertTriangleIcon}
              title="Danger Zone"
              tone="danger"
            />
          }
          stageClassName="min-h-0 flex-1 flex-col justify-start gap-4 p-4 sm:p-5"
        >
          <p className="text-muted-foreground text-xs">
            Archiving locks the centre for all staff. Financial audit logs are
            preserved. Requires cancelling any active subscription and typing
            the centre name to confirm.
          </p>
          <div>
            <Button
              onClick={() => setArchiveOpen(true)}
              type="button"
              variant="ghost"
            >
              <span className="text-destructive">Archive Centre...</span>
            </Button>
          </div>
        </FluidPanel>
      </div>

      <CentreArchiveDialog
        centreName={organization.name}
        onOpenChange={setArchiveOpen}
        open={archiveOpen}
        organizationId={organization.id}
      />
    </form>
  );
};
