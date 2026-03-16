import { useOutletContext } from "react-router-dom";
import { Business } from "@/lib/types";
import { getBookings, getServices } from "@/lib/store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function BookingsPage() {
  const { business } = useOutletContext<{ business: Business }>();
  const bookings = getBookings(business.id);
  const services = getServices(business.id);

  const getServiceName = (serviceId: string) => services.find(s => s.id === serviceId)?.name || 'Unknown';

  const statusStyles: Record<string, string> = {
    confirmed: "bg-success/10 text-success",
    pending: "bg-warning/10 text-warning",
    cancelled: "bg-destructive/10 text-destructive",
    completed: "bg-primary/10 text-primary",
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-foreground mb-6">Bookings</h1>
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">All Bookings</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left">
                  <th className="pb-3 font-medium text-muted-foreground">Customer</th>
                  <th className="pb-3 font-medium text-muted-foreground">Service</th>
                  <th className="pb-3 font-medium text-muted-foreground">Date & Time</th>
                  <th className="pb-3 font-medium text-muted-foreground">Status</th>
                </tr>
              </thead>
              <tbody>
                {bookings.map(b => {
                  const dt = new Date(b.appointmentAt);
                  return (
                    <tr key={b.id} className="border-b last:border-0">
                      <td className="py-3">
                        <p className="font-medium text-foreground">{b.customerName}</p>
                        <p className="text-xs text-muted-foreground">{b.customerPhone}</p>
                      </td>
                      <td className="py-3 text-foreground">{getServiceName(b.serviceId)}</td>
                      <td className="py-3 text-foreground">{dt.toLocaleDateString()} at {dt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
                      <td className="py-3">
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${statusStyles[b.status]}`}>
                          {b.status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
