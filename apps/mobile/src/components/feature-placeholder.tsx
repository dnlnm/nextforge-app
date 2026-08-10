import { Typography } from "heroui-native";
import { ScrollView, View } from "react-native";

export function FeaturePlaceholder({
  description,
  title,
}: {
  description: string;
  title: string;
}) {
  return (
    <ScrollView className="flex-1 bg-background">
      <View className="gap-4 px-6 py-8">
        <Typography.Heading type="h2">{title}</Typography.Heading>
        <View className="rounded-xl border border-border bg-surface p-5">
          <Typography.Paragraph color="muted" type="body-sm">
            {description}
          </Typography.Paragraph>
        </View>
      </View>
    </ScrollView>
  );
}
