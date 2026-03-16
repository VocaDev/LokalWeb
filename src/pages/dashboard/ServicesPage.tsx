import { useState } from "react";
import { useOutletContext } from "react-router-dom";
import { Business, Service } from "@/lib/types";
import { updateService, deleteService, getServices } from "@/lib/store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Pencil, Trash2 } from "lucide-react";

export default function ServicesPage() {
  const { business } = useOutletContext<{ business: Business }>();
  const [services, setServices] = useState(() => getServices(business.id));
  const [editing, setEditing] = useState<Service | null>(null);
  const [open, setOpen] = useState(false);

  const emptyService: Service = { id: "", businessId: business.id, name: "", description: "", price: 0, durationMinutes: 30 };

  const handleSave = (s: Service) => {
    const svc = s.id ? s : { ...s, id: crypto.randomUUID() };
    updateService(business.id, svc);
    setServices(getServices(business.id));
    setOpen(false);
    setEditing(null);
  };

  const handleDelete = (id: string) => {
    deleteService(business.id, id);
    setServices(getServices(business.id));
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-foreground">Services</h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setEditing(emptyService)} size="sm">
              <Plus className="h-4 w-4 mr-1" /> Add Service
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>{editing?.id ? "Edit" : "Add"} Service</DialogTitle></DialogHeader>
            <ServiceForm service={editing || emptyService} onSave={handleSave} />
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {services.map(s => (
          <Card key={s.id}>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center justify-between">
                {s.name}
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setEditing(s); setOpen(true); }}>
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => handleDelete(s.id)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-primary">€{s.price}</p>
              <p className="text-sm text-muted-foreground">{s.durationMinutes} min</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

function ServiceForm({ service, onSave }: { service: Service; onSave: (s: Service) => void }) {
  const [form, setForm] = useState(service);
  return (
    <div className="space-y-4">
      <div>
        <Label>Name</Label>
        <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
      </div>
      <div>
        <Label>Description</Label>
        <Input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
      </div>
      <div>
        <Label>Price (€)</Label>
        <Input type="number" value={form.price} onChange={e => setForm(f => ({ ...f, price: Number(e.target.value) }))} />
      </div>
      <div>
        <Label>Duration (min)</Label>
        <Input type="number" value={form.durationMinutes} onChange={e => setForm(f => ({ ...f, durationMinutes: Number(e.target.value) }))} />
      </div>
      <Button className="w-full" onClick={() => onSave(form)}>Save</Button>
    </div>
  );
}
