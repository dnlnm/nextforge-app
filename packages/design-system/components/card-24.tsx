import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@repo/design-system/components/ui/card";

const Placeholder = {
  title: <div className="h-6 w-full max-w-20 rounded-md bg-secondary" />,
  content: <div className="h-20 w-full rounded-md bg-secondary" />,
};

export const Card_24 = () => {
  return (
    <div className="rounded-xl border border-border/70 p-1">
      <Card className="rounded-lg bg-muted/20">
        <CardHeader>
          <CardTitle>{Placeholder.title}</CardTitle>
        </CardHeader>
        <CardContent>{Placeholder.content}</CardContent>
      </Card>
    </div>
  );
};
