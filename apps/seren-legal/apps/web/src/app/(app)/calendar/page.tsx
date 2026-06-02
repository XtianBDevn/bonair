import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CalendarBooking } from "./calendar-booking";
import { prisma } from "@/lib/db";
import { getSessionFromCookies } from "@/lib/auth";
import { tenantWhere } from "@/lib/tenant";
import { contactName, formatDate } from "@/lib/utils";

export default async function CalendarPage() {
  const session = await getSessionFromCookies();
  if (!session) redirect("/login");

  const where = tenantWhere(session);

  const [attorneys, leads, appointments] = await Promise.all([
    prisma.attorney.findMany({
      where,
      include: { user: true },
    }),
    prisma.lead.findMany({
      where,
      include: { contact: true },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
    prisma.appointment.findMany({
      where,
      include: {
        lead: { include: { contact: true } },
        attorney: { include: { user: true } },
      },
      orderBy: { startsAt: "asc" },
      take: 10,
    }),
  ]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Calendar</h1>
        <p className="text-slate-500">
          Mock availability and booking — Google/Outlook sync deferred to production
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Book consultation</CardTitle>
        </CardHeader>
        <CardContent>
          {attorneys.length === 0 ? (
            <p className="text-sm text-slate-500">No attorneys configured for this firm.</p>
          ) : (
            <CalendarBooking
              attorneys={attorneys.map((a) => ({
                id: a.id,
                name: `${a.user.firstName} ${a.user.lastName}`,
              }))}
              leads={leads.map((l) => ({
                id: l.id,
                name: contactName(l.contact.firstName, l.contact.lastName),
              }))}
            />
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Upcoming appointments</CardTitle>
        </CardHeader>
        <CardContent>
          {appointments.length === 0 ? (
            <p className="text-sm text-slate-500">No appointments scheduled.</p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {appointments.map((a) => (
                <li key={a.id} className="flex justify-between py-3 text-sm">
                  <div>
                    <p className="font-medium text-slate-900">
                      {contactName(
                        a.lead.contact.firstName,
                        a.lead.contact.lastName
                      )}
                    </p>
                    <p className="text-slate-500">
                      {a.attorney.user.firstName} {a.attorney.user.lastName} ·{" "}
                      {a.type}
                    </p>
                  </div>
                  <div className="text-right text-slate-600">
                    <p>{formatDate(a.startsAt)}</p>
                    <p className="capitalize text-xs">{a.status}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
