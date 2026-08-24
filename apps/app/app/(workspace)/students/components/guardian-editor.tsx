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
import { Textarea } from "@repo/design-system/components/ui/textarea";
import { cn } from "@repo/design-system/lib/utils";
import { AlertCircleIcon } from "lucide-react";

export interface GuardianDraft {
  readonly address: string;
  readonly email: string;
  readonly firstName: string;
  readonly icNumber: string;
  readonly id: string;
  readonly lastName: string;
  readonly phone: string;
  readonly relationship: string;
  readonly sameAsStudent: boolean;
}

interface GuardianEditorProperties {
  readonly errors: Record<string, string>;
  readonly guardian: GuardianDraft;
  readonly onUpdate: (id: string, patch: Partial<GuardianDraft>) => void;
  readonly studentAddress: string;
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
  onUpdate,
  studentAddress,
}: GuardianEditorProperties) => {
  const fieldError = (key: string) =>
    errors[`guardian0${key}`] ?? errors[key];

  return (
    <div className="grid gap-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="grid content-start gap-1.5">
          <Label htmlFor={`guardian-first-name-${guardian.id}`}>
            First name <span className="text-destructive text-xs">*</span>
          </Label>
          <Input
            aria-invalid={Boolean(fieldError("firstName"))}
            className={cn(
              fieldError("firstName") &&
                "border-destructive focus-visible:ring-destructive/50"
            )}
            id={`guardian-first-name-${guardian.id}`}
            onChange={(event) =>
              onUpdate(guardian.id, { firstName: event.target.value })
            }
            placeholder="e.g. Nurul Aisyah / Wei Jie"
            value={guardian.firstName}
          />
          <FieldMessage error={fieldError("firstName")} />
        </div>
        <div className="grid content-start gap-1.5">
          <Label htmlFor={`guardian-last-name-${guardian.id}`}>
            Last name / Family name <span className="text-destructive text-xs">*</span>
          </Label>
          <Input
            aria-invalid={Boolean(fieldError("lastName"))}
            className={cn(
              fieldError("lastName") &&
                "border-destructive focus-visible:ring-destructive/50"
            )}
            id={`guardian-last-name-${guardian.id}`}
            onChange={(event) =>
              onUpdate(guardian.id, { lastName: event.target.value })
            }
            placeholder="e.g. binti Ahmad / Tan"
            value={guardian.lastName}
          />
          <FieldMessage error={fieldError("lastName")} />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="grid content-start gap-1.5">
          <Label>Relationship <span className="text-destructive text-xs">*</span></Label>
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
          <FieldMessage error={fieldError("relationship")} />
        </div>
        <div className="grid content-start gap-1.5">
          <Label htmlFor={`guardian-ic-${guardian.id}`}>
            IC number <span className="text-destructive text-xs">*</span>
          </Label>
          <Input
            aria-invalid={Boolean(fieldError("ic"))}
            className={cn(
              fieldError("ic") &&
                "border-destructive focus-visible:ring-destructive/50"
            )}
            id={`guardian-ic-${guardian.id}`}
            maxLength={12}
            onChange={(event) =>
              onUpdate(guardian.id, { icNumber: event.target.value })
            }
            placeholder="901231145678"
            value={guardian.icNumber}
          />
          <FieldMessage error={fieldError("ic")} />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="grid content-start gap-1.5">
          <Label htmlFor={`guardian-email-${guardian.id}`}>
            Email address
            <span className="text-destructive text-xs"> *</span>
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
          <Label htmlFor={`guardian-phone-${guardian.id}`}>
            Phone number <span className="text-destructive text-xs">*</span>
          </Label>
          <Input
            aria-invalid={Boolean(fieldError("phone"))}
            className={cn(
              fieldError("phone") &&
                "border-destructive focus-visible:ring-destructive/50"
            )}
            id={`guardian-phone-${guardian.id}`}
            onChange={(event) =>
              onUpdate(guardian.id, { phone: event.target.value })
            }
            placeholder="0123456789"
            value={guardian.phone}
          />
          <FieldMessage error={fieldError("phone")} />
        </div>
      </div>

      <div className="grid content-start gap-1.5">
        <Label htmlFor={`guardian-address-${guardian.id}`}>Address</Label>
        <Textarea
          disabled={guardian.sameAsStudent}
          id={`guardian-address-${guardian.id}`}
          onChange={(event) =>
            onUpdate(guardian.id, { address: event.target.value })
          }
          placeholder="House number, street, city, state, postcode"
          rows={2}
          value={guardian.sameAsStudent ? studentAddress : guardian.address}
        />
        <label
          className="flex cursor-pointer items-center gap-2 text-muted-foreground text-xs"
          htmlFor={`guardian-same-student-${guardian.id}`}
        >
          <Checkbox
            checked={guardian.sameAsStudent}
            id={`guardian-same-student-${guardian.id}`}
            onCheckedChange={(checked) =>
              onUpdate(guardian.id, { sameAsStudent: checked === true })
            }
          />
          Same as student
        </label>
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
