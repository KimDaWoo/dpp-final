import { ChecklistForm } from "@/components/checklist/checklist-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function ChecklistPage() {
  return (
    <div className="flex justify-center items-center flex-1">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Pre-trade Checklist</CardTitle>
        </CardHeader>
        <CardContent>
          <ChecklistForm />
        </CardContent>
      </Card>
    </div>
  );
}
