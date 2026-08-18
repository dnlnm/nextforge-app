import { useRouter } from "expo-router";
import { Chip, Typography } from "heroui-native";
import { Pressable, ScrollView, View } from "react-native";

const sections: { href: string; title: string; description: string }[] = [
  {
    href: "/manage/dashboard",
    title: "Dashboard",
    description: "Organization KPIs and trends.",
  },
  {
    href: "/manage/invoices",
    title: "Invoices",
    description: "Review and manage billing documents.",
  },
  {
    href: "/manage/payments",
    title: "Payments",
    description: "Track payments and verify receipts.",
  },
  {
    href: "/manage/members",
    title: "Members",
    description: "Manage teachers and staff access.",
  },
];

export default function ManageScreen() {
  const router = useRouter();

  return (
    <ScrollView className="flex-1 bg-background">
      <View className="gap-3 px-5 py-5">
        <View className="gap-1">
          <Typography.Heading type="h2">Manage</Typography.Heading>
          <Typography.Paragraph color="muted" type="body-sm">
            Administrative tools for owners and administrators.
          </Typography.Paragraph>
        </View>
        {sections.map((section) => (
          <Pressable
            key={section.href}
            onPress={() => router.push(section.href)}
          >
            <View className="rounded-lg border border-border bg-card p-4">
              <View className="flex-row items-center justify-between">
                <Typography.Paragraph type="body">
                  {section.title}
                </Typography.Paragraph>
                <Chip size="sm" variant="soft">
                  Open
                </Chip>
              </View>
              <Typography.Paragraph color="muted" type="body-sm">
                {section.description}
              </Typography.Paragraph>
            </View>
          </Pressable>
        ))}
      </View>
    </ScrollView>
  );
}