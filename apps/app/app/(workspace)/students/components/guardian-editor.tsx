"use client";

import { Checkbox } from "@repo/design-system/components/ui/checkbox";
import { Input } from "@repo/design-system/components/ui/input";
import { Label } from "@repo/design-system/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/design-system/components/ui/select";
import { cn } from "@repo/design-system/lib/utils";
import { AlertCircleIcon, InfoIcon, StarIcon, XIcon } from "lucide-react";

export interface GuardianDraft {
  readonly email: string;
  readonly fullName: string;
  readonly icNumber: string;
  readonly id: string;
  readonly phone: string;
  readonly relationship: string;
  readonly sameAsPhone: boolean;
  readonly whatsapp: string;
}

interface GuardianEditorProperties {
  readonly errors: Record<string, string>;
  readonly guardian: GuardianDraft;
  readonly index: number;
  readonly onRemove: (id: string) => void;
  readonly onUpdate: (id: string, patch: Partial<GuardianDraft>) => void;
  readonly total: number;
}

const RELATIONSHIPS = [
  { label: "Father", value: "FATHER" },
  { label: "Mother", value: "MOTHER" },
  { label: "Legal Guardian", value: "GUARDIAN" },
  { label: "Other", value: "OTHER" },
];

export const GuardianEditor = ({
  errors,
  guardian,
  index,
  onRemove,
  onUpdate,
  total,
}: GuardianEditorProperties) => {
  const isPrimary = index === 0;
  const fieldError = (key: string) =>
    errors[`guardian${index}${key}`] ?? errors[key];

  return (
    <div className="relative grid gap-4 rounded-xl border border-border p-4">
      {!isPrimary && total > 1 ? (
        <button
          aria-label="Remove guardian"
          className="absolute top-3 right-3 flex size-6 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-destructive/5 hover:text-destructive"
          onClick={() => onRemove(guardian.id)}
          type="button"
        >
          <XIcon className="size-3.5" />
        </button>
      ) : null}

      {isPrimary ? (
        <div className="flex items-center gap-1.5">
          <StarIcon className="size-3 fill-current text-primary" />
          <span className="font-semibold text-primary text-xs">
            Primary contact
          </span>
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="grid content-start gap-1.5">
          <Label htmlFor={`guardian-name-${guardian.id}`}>
            Full name{" "}
            <span className="text-destructive text-xs">{isPrimary && "*"}</span>
          </Label>
          <Input
            aria-invalid={Boolean(fieldError("name"))}
            className={cn(
              fieldError("name") &&
                "border-destructive focus-visible:ring-destructive/50"
            )}
            id={`guardian-name-${guardian.id}`}
            onChange={(event) =>
              onUpdate(guardian.id, { fullName: event.target.value })
            }
            placeholder="As per IC"
            value={guardian.fullName}
          />
          <FieldMessage error={fieldError("name")} />
        </div>
        <div className="grid content-start gap-1.5">
          <Label>Relationship</Label>
          <Select
            items={Object.fromEntries(
              RELATIONSHIPS.map((item) => [item.value, item.label])
            )}
            onValueChange={(value) =>
              onUpdate(guardian.id, { relationship: value ?? "" })
            }
            value={guardian.relationship}
          >
            <SelectTrigger id={`guardian-relationship-${guardian.id}`}>
              <SelectValue placeholder="Select..." />
            </SelectTrigger>
            <SelectContent>
              {RELATIONSHIPS.map((item) => (
                <SelectItem key={item.value} value={item.value}>
                  {item.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="grid content-start gap-1.5">
          <Label htmlFor={`guardian-phone-${guardian.id}`}>
            Phone number <span className="text-destructive text-xs">*</span>
          </Label>
          <div className="flex gap-2">
            <span className="flex items-center whitespace-nowrap rounded-lg border border-border bg-muted px-3 font-medium text-muted-foreground text-sm">
              +60
            </span>
            <Input
              aria-invalid={Boolean(fieldError("phone"))}
              className={cn(
                fieldError("phone") &&
                  "border-destructive focus-visible:ring-destructive/50"
              )}
              id={`guardian-phone-${guardian.id}`}
              onChange={(event) => {
                const nextPhone = event.target.value;
                onUpdate(guardian.id, {
                  phone: nextPhone,
                  ...(guardian.sameAsPhone ? { whatsapp: nextPhone } : {}),
                });
              }}
              placeholder="012-345 6789"
              value={guardian.phone}
            />
          </div>
          <FieldMessage error={fieldError("phone")} />
        </div>
        <div className="grid content-start gap-1.5">
          <Label htmlFor={`guardian-whatsapp-${guardian.id}`}>
            WhatsApp number
          </Label>
          <Input
            className="border-input bg-transparent dark:bg-input/32"
            disabled={guardian.sameAsPhone}
            id={`guardian-whatsapp-${guardian.id}`}
            onChange={(event) =>
              onUpdate(guardian.id, { whatsapp: event.target.value })
            }
            placeholder="012-345 6789"
            value={guardian.sameAsPhone ? guardian.phone : guardian.whatsapp}
          />
          <label
            className="flex cursor-pointer items-center gap-2 text-muted-foreground text-xs"
            htmlFor={`guardian-same-phone-${guardian.id}`}
          >
            <Checkbox
              checked={guardian.sameAsPhone}
              id={`guardian-same-phone-${guardian.id}`}
              onCheckedChange={(checked) => {
                const sameAsPhone = checked === true;
                onUpdate(guardian.id, {
                  sameAsPhone,
                  whatsapp: sameAsPhone ? guardian.phone : "",
                });
              }}
            />
            Same as phone number
          </label>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="grid content-start gap-1.5">
          <Label htmlFor={`guardian-email-${guardian.id}`}>
            Email address
            {isPrimary ? (
              <span className="text-destructive text-xs"> *</span>
            ) : null}
          </Label>
          <Input
            aria-invalid={Boolean(fieldError("email"))}
            className={cn(
              fieldError("email") &&
                "border-destructive focus-visible:ring-destructive/50"
            )}
            id={`guardian-email-${guardian.id}`}
            onChange={(event) =>
              onUpdate(guardian.id, { email: event.target.value })
            }
            placeholder="example@gmail.com"
            type="email"
            value={guardian.email}
          />
          <FieldMessage error={fieldError("email")} />
        </div>
        <div className="grid content-start gap-1.5">
          <Label htmlFor={`guardian-ic-${guardian.id}`}>IC number</Label>
          <Input
            id={`guardian-ic-${guardian.id}`}
            maxLength={14}
            onChange={(event) =>
              onUpdate(guardian.id, { icNumber: event.target.value })
            }
            placeholder="901231-14-5678"
            value={guardian.icNumber}
          />
          <p className="flex items-center gap-1 text-muted-foreground text-xs">
            <InfoIcon className="size-3" />
            12 digits, no dashes
          </p>
        </div>
      </div>
    </div>
  );
};

const FieldMessage = ({ error }: { readonly error?: string }) =>
  error ? (
    <p className="flex items-center gap-1 text-destructive text-xs">
      <AlertCircleIcon className="size-3" />
      {error}
    </p>
  ) : null;
