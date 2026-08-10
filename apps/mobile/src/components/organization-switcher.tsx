import { Button, Chip, Dialog, Spinner, Typography } from "heroui-native";
import { useState } from "react";
import { Alert, View } from "react-native";
import { useOrganization } from "@/lib/organization-provider";

export function OrganizationSwitcher() {
  const [isOpen, setIsOpen] = useState(false);
  const {
    activeMembership,
    isLoading,
    isSwitching,
    memberships,
    switchOrganization,
  } = useOrganization();

  const handleSwitch = async (organizationId: string) => {
    try {
      await switchOrganization(organizationId);
      setIsOpen(false);
    } catch (error) {
      Alert.alert(
        "Could not switch centre",
        error instanceof Error ? error.message : "Please try again."
      );
    }
  };

  if (isLoading) {
    return <Spinner size="sm" />;
  }

  return (
    <Dialog isOpen={isOpen} onOpenChange={setIsOpen}>
      <Dialog.Trigger asChild>
        <Button size="sm" variant="ghost">
          {activeMembership?.organization.name ?? "Choose centre"}
        </Button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay />
        <Dialog.Content>
          <Dialog.Close />
          <View className="mb-5 gap-1">
            <Dialog.Title>Choose a centre</Dialog.Title>
            <Dialog.Description>
              Your role and workspace change with the selected centre.
            </Dialog.Description>
          </View>
          <View className="gap-3">
            {memberships.map((membership) => (
              <Button
                isDisabled={isSwitching}
                key={membership.id}
                onPress={() => handleSwitch(membership.organization.id)}
                variant={
                  membership.organization.id ===
                  activeMembership?.organization.id
                    ? "primary"
                    : "outline"
                }
              >
                <View className="flex-1 flex-row items-center justify-between gap-3">
                  <Typography.Paragraph type="body-sm">
                    {membership.organization.name}
                  </Typography.Paragraph>
                  <Chip size="sm" variant="soft">
                    {membership.role}
                  </Chip>
                </View>
              </Button>
            ))}
          </View>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog>
  );
}
