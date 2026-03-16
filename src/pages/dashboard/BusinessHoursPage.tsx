import { useState } from "react";
import { useOutletContext } from "react-router-dom";
import { Business, BusinessHours } from "@/lib/types";
import { getBusinessHours, saveBusinessHours } from "@/lib/store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export default function BusinessHoursPage() {
  const { business } = useOutletContext<{ business: Business }>();
  const { toast } = useToast();
  const [hours, setHours] = useState<BusinessHours[]>(() => getBusinessHours(business.id));

  const update = (dayOfWeek: number, field: keyof BusinessHours, value: string | boolean) => {
    setHours(prev => prev.map(h => h.dayOfWeek === dayOfWeek ? { ...h, [field]: value } : h));
  };

  const handleSave = () => {
    saveBusinessHours(hours);
    toast({ title: "Business hours saved" });
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-foreground mb-6">Business Hours</h1>
      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle className="text-lg">Weekly Schedule</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {hours.map(h => (
              <div key={h.dayOfWeek} className="flex items-center gap-4 py-2 border-b last:border-0">
                <span className="w-24 text-sm font-medium text-foreground">{dayNames[h.dayOfWeek]}</span>
                <Switch checked={h.isOpen} onCheckedChange={v => update(h.dayOfWeek, 'isOpen', v)} />
                {h.isOpen ? (
                  <div className="flex items-center gap-2">
                    <Input type="time" value={h.openTime} onChange={e => update(h.dayOfWeek, 'openTime', e.target.value)} className="w-32" />
                    <span className="text-muted-foreground text-sm">to</span>
                    <Input type="time" value={h.closeTime} onChange={e => update(h.dayOfWeek, 'closeTime', e.target.value)} className="w-32" />
                  </div>
                ) : (
                  <span className="text-sm text-muted-foreground">Closed</span>
                )}
              </div>
            ))}
          </div>
          <Button className="mt-6" onClick={handleSave}>Save Hours</Button>
        </CardContent>
      </Card>
    </div>
  );
}
