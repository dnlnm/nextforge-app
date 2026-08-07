import { Checkbox } from "@repo/design-system/components/ui/checkbox";
import { Input } from "@repo/design-system/components/ui/input";
import { Label } from "@repo/design-system/components/ui/label";

interface Guardian {
  readonly addressLine1: string | null;
  readonly addressLine2: string | null;
  readonly city: string | null;
  readonly email: string | null;
  readonly fullName: string;
  readonly phone: string | null;
  readonly postcode: string | null;
  readonly state: string | null;
}

interface GuardianFieldsProperties {
  readonly guardian: Guardian;
  readonly guardianId: string;
}

export const GuardianFields = ({
  guardian,
  guardianId,
}: GuardianFieldsProperties) => (
  <>
    <input name="guardianId" type="hidden" value={guardianId} />
    <div className="grid gap-3">
      <div className="grid gap-2">
        <Label htmlFor="guardianName">Guardian name</Label>
        <Input
          defaultValue={guardian.fullName}
          id="guardianName"
          name="guardianName"
          required
        />
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="grid gap-2">
          <Label htmlFor="guardianPhone">Phone</Label>
          <Input
            defaultValue={guardian.phone ?? ""}
            id="guardianPhone"
            name="guardianPhone"
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="guardianEmail">Email</Label>
          <Input
            defaultValue={guardian.email ?? ""}
            id="guardianEmail"
            name="guardianEmail"
            type="email"
          />
        </div>
      </div>
      <div className="grid gap-2">
        <Label htmlFor="guardianAddressLine1">Address Line 1</Label>
        <Input
          defaultValue={guardian.addressLine1 ?? ""}
          id="guardianAddressLine1"
          name="guardianAddressLine1"
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="guardianAddressLine2">Address Line 2</Label>
        <Input
          defaultValue={guardian.addressLine2 ?? ""}
          id="guardianAddressLine2"
          name="guardianAddressLine2"
        />
      </div>
      <div className="flex items-center gap-2 text-sm">
        <Checkbox
          defaultChecked={
            !(
              guardian.addressLine1 ||
              guardian.addressLine2 ||
              guardian.city ||
              guardian.state ||
              guardian.postcode
            )
          }
          name="sameAsStudentAddress"
        />
        <span>Same as student address</span>
      </div>
    </div>
  </>
);
