"use client";

import { buildWorkspaceUrl } from "@repo/auth/domain";
import { Button } from "@repo/design-system/components/ui/fluid-button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@repo/design-system/components/ui/fluid-card";
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
import { toastManager } from "@repo/design-system/components/ui/toast";
import { ExternalLinkIcon, Loader2Icon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { CentreCardFrame } from "../../components/centre-card-frame";
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

      <div className="space-y-6">
        <CentreCardFrame>
          <Card>
            <CardHeader>
              <CardTitle>Centre Identity & Logo</CardTitle>
              <CardDescription>
                Official centre name shown on receipts, invoices, and portal
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <CentreLogoUploader
                centreName={name || organization.name}
                currentImageUrl={imageUrl}
                disabled={saving}
                onImageChange={setImageUrl}
              />
              <InputGroup>
                <InputField
                  index={0}
                  label="Centre Name"
                  onChange={setName}
                  placeholder="Bright Mind Academy"
                  value={name}
                />
              </InputGroup>
            </CardContent>
          </Card>
        </CentreCardFrame>

        <CentreCardFrame>
          <Card>
            <CardHeader>
              <CardTitle>Contact & Physical Location</CardTitle>
              <CardDescription>
                Where parents reach you, and the address printed on invoices
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <InputGroup>
                  <InputField
                    index={0}
                    label="Official Email"
                    onChange={setEmail}
                    placeholder="contact@brightmind.edu.my"
                    type="email"
                    value={email}
                  />
                </InputGroup>
                <InputGroup>
                  <InputField
                    index={0}
                    label="Contact Phone"
                    onChange={setPhone}
                    placeholder="+60 12-345 6789"
                    type="tel"
                    value={phone}
                  />
                </InputGroup>
              </div>
              <InputGroup>
                <InputField
                  index={0}
                  label="Street Address 1"
                  onChange={setAddressLine1}
                  placeholder="42, Jalan SS 2/67"
                  value={addressLine1}
                />
              </InputGroup>
              <InputGroup>
                <InputField
                  index={0}
                  label="Street Address 2 (optional)"
                  onChange={setAddressLine2}
                  placeholder="Level 2, Commercial Block"
                  value={addressLine2}
                />
              </InputGroup>
              <div className="grid gap-4 md:grid-cols-2">
                <InputGroup>
                  <InputField
                    index={0}
                    label="City"
                    onChange={setCity}
                    placeholder="Petaling Jaya"
                    value={city}
                  />
                </InputGroup>
                <InputGroup>
                  <InputField
                    index={0}
                    inputMode="numeric"
                    label="Postcode"
                    maxLength={5}
                    onChange={setPostcode}
                    placeholder="47300"
                    value={postcode}
                  />
                </InputGroup>
              </div>
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
            </CardContent>
          </Card>
        </CentreCardFrame>

        <CentreCardFrame>
          <Card>
            <CardHeader>
              <CardTitle>Workspace Subdomain & Access</CardTitle>
              <CardDescription>
                Staff and teachers sign in directly through your subdomain
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
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
            </CardContent>
          </Card>
        </CentreCardFrame>

        <CentreCardFrame className="border border-destructive/60">
          <Card>
            <CardHeader>
              <CardTitle className="text-destructive">Danger Zone</CardTitle>
              <CardDescription>
                Archiving locks the centre for all staff. Financial audit logs
                are preserved. Requires cancelling any active subscription and
                typing the centre name to confirm.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                onClick={() => setArchiveOpen(true)}
                type="button"
                variant="ghost"
              >
                <span className="text-destructive">Archive Centre...</span>
              </Button>
            </CardContent>
          </Card>
        </CentreCardFrame>
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
