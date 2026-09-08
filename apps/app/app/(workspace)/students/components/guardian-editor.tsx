"use client";

import { VanillaCheckbox as Checkbox } from "@repo/design-system/components/ui/checkbox-vanilla";
import { InputField, InputGroup } from "@repo/design-system/components/ui/fluid-input-group";
import { Label } from "@repo/design-system/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@repo/design-system/components/ui/fluid-select";

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
          <InputGroup className="contents">
            <InputField
              error={fieldError("firstName")}
              id={`guardian-first-name-${guardian.id}`}
              index={0}
              label="First name"
              labelHidden
              onChange={(value) =>
                onUpdate(guardian.id, { firstName: value })
              }
              placeholder="e.g. Nurul Aisyah / Wei Jie"
              value={guardian.firstName}
            />
          </InputGroup>
        </div>
        <div className="grid content-start gap-1.5">
          <Label htmlFor={`guardian-last-name-${guardian.id}`}>
            Last name / Family name <span className="text-destructive text-xs">*</span>
          </Label>
          <InputGroup className="contents">
            <InputField
              error={fieldError("lastName")}
              id={`guardian-last-name-${guardian.id}`}
              index={0}
              label="Last name / Family name"
              labelHidden
              onChange={(value) =>
                onUpdate(guardian.id, { lastName: value })
              }
              placeholder="e.g. binti Ahmad / Tan"
              value={guardian.lastName}
            />
          </InputGroup>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="grid content-start gap-1.5">
          <Label>Relationship <span className="text-destructive text-xs">*</span></Label>
          <Select
            onValueChange={(value) =>
              onUpdate(guardian.id, { relationship: value ?? "" })
            }
            value={guardian.relationship}
          >
            <SelectTrigger
              aria-invalid={Boolean(fieldError("relationship"))}
              error={fieldError("relationship")}
              id={`guardian-relationship-${guardian.id}`}
              placeholder="Select..."
            />
            <SelectContent>
              {RELATIONSHIPS.map((item, itemIndex) => (
                <SelectItem index={itemIndex} key={item.value} value={item.value}>
                  {item.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="grid content-start gap-1.5">
          <Label htmlFor={`guardian-ic-${guardian.id}`}>
            IC number <span className="text-destructive text-xs">*</span>
          </Label>
          <InputGroup className="contents">
            <InputField
              error={fieldError("ic")}
              id={`guardian-ic-${guardian.id}`}
              index={0}
              label="IC number"
              labelHidden
              maxLength={12}
              onChange={(value) =>
                onUpdate(guardian.id, { icNumber: value })
              }
              placeholder="901231145678"
              value={guardian.icNumber}
            />
          </InputGroup>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="grid content-start gap-1.5">
          <Label htmlFor={`guardian-email-${guardian.id}`}>
            Email address
            <span className="text-destructive text-xs"> *</span>
          </Label>
          <InputGroup className="contents">
            <InputField
              error={fieldError("email")}
              id={`guardian-email-${guardian.id}`}
              index={0}
              label="Email address"
              labelHidden
              onChange={(value) =>
                onUpdate(guardian.id, { email: value })
              }
              placeholder="example@gmail.com"
              type="email"
              value={guardian.email}
            />
          </InputGroup>
        </div>
        <div className="grid content-start gap-1.5">
          <Label htmlFor={`guardian-phone-${guardian.id}`}>
            Phone number <span className="text-destructive text-xs">*</span>
          </Label>
          <InputGroup className="contents">
            <InputField
              error={fieldError("phone")}
              id={`guardian-phone-${guardian.id}`}
              index={0}
              label="Phone number"
              labelHidden
              onChange={(value) =>
                onUpdate(guardian.id, { phone: value })
              }
              placeholder="0123456789"
              value={guardian.phone}
            />
          </InputGroup>
        </div>
      </div>

      <div className="grid content-start gap-1.5">
        <Label htmlFor={`guardian-address-${guardian.id}`}>Address</Label>
        <textarea
          className="w-full rounded-lg px-2.5 py-2 text-[13px] text-foreground ring-1 ring-border transition-all duration-80 outline-none placeholder:text-muted-foreground focus:bg-card disabled:cursor-not-allowed disabled:opacity-50"
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
