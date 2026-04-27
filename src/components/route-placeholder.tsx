import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function RoutePlaceholder({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="space-y-6">
      <Card className="border-border bg-panel shadow-xl shadow-black/10">
        <CardHeader>
          <CardTitle className="text-foreground">{title}</CardTitle>
          <CardDescription className="text-muted-foreground">
            {description}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-2xl border border-dashed border-border bg-background/40 p-6">
            <p className="text-sm leading-6 text-muted-foreground">
              Esta área já está preparada dentro do AppShell e pronta para receber
              os módulos específicos desta seção.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}