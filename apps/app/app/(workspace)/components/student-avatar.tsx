import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@repo/design-system/components/ui/avatar";
import { cn } from "@repo/design-system/lib/utils";
import { UserRoundIcon } from "lucide-react";

const genderFallbackStyles: Record<string, string> = {
  MALE: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300",
  FEMALE: "bg-pink-100 text-pink-700 dark:bg-pink-950 dark:text-pink-300",
};

export const StudentAvatar = ({
  className,
  gender,
  name,
  photoUrl,
}: {
  className?: string;
  gender?: string | null;
  name: string;
  photoUrl?: string | null;
}) => (
  <Avatar className={cn("size-10", className)}>
    {photoUrl ? (
      <AvatarImage alt={name} src={photoUrl} />
    ) : (
      <AvatarFallback
        className={cn(
          "border bg-muted text-muted-foreground",
          gender ? genderFallbackStyles[gender] : undefined
        )}
      >
        <UserRoundIcon className="size-5" />
      </AvatarFallback>
    )}
  </Avatar>
);
