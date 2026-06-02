"use client";

import { useEffect, useState } from "react";
import { format, parseISO } from "date-fns";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { api } from "@/lib/api-client";
import { cn } from "@/lib/utils";

type Slot = { start: string; end: string; available: boolean };

type Props = {
  attorneys: { id: string; name: string }[];
  leads: { id: string; name: string }[];
};

export function CalendarBooking({ attorneys, leads }: Props) {
  const [attorneyId, setAttorneyId] = useState(attorneys[0]?.id ?? "");
  const [leadId, setLeadId] = useState(leads[0]?.id ?? "");
  const [date, setDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [slots, setSlots] = useState<Slot[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [booking, setBooking] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!attorneyId || !date) return;
    setLoading(true);
    setMessage(null);
    api<{ slots: Slot[] }>(
      `/api/calendar/availability?attorneyId=${attorneyId}&date=${date}`
    )
      .then((data) => {
        setSlots(data.slots);
        setSelected(null);
      })
      .catch((e) => setMessage(e instanceof Error ? e.message : "Failed to load slots"))
      .finally(() => setLoading(false));
  }, [attorneyId, date]);

  async function book() {
    if (!selected || !leadId) return;
    setBooking(true);
    setMessage(null);
    try {
      await api("/api/calendar/book", {
        method: "POST",
        body: JSON.stringify({ leadId, attorneyId, slotStart: selected }),
      });
      setMessage("Consultation booked (stub — no external calendar sync).");
      setSelected(null);
      const data = await api<{ slots: Slot[] }>(
        `/api/calendar/availability?attorneyId=${attorneyId}&date=${date}`
      );
      setSlots(data.slots);
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Booking failed");
    } finally {
      setBooking(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <Label htmlFor="attorney">Attorney</Label>
          <select
            id="attorney"
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            value={attorneyId}
            onChange={(e) => setAttorneyId(e.target.value)}
          >
            {attorneys.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <Label htmlFor="lead">Lead</Label>
          <select
            id="lead"
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            value={leadId}
            onChange={(e) => setLeadId(e.target.value)}
          >
            {leads.map((l) => (
              <option key={l.id} value={l.id}>
                {l.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <Label htmlFor="date">Date</Label>
          <input
            id="date"
            type="date"
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </div>
      </div>

      <div>
        <p className="mb-3 text-sm font-medium text-slate-700">Available slots (mock)</p>
        {loading ? (
          <p className="text-sm text-slate-500">Loading availability…</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {slots.map((slot) => (
              <button
                key={slot.start}
                type="button"
                disabled={!slot.available}
                onClick={() => slot.available && setSelected(slot.start)}
                className={cn(
                  "rounded-lg border px-4 py-2 text-sm font-medium transition-colors",
                  !slot.available && "cursor-not-allowed border-slate-100 bg-slate-50 text-slate-300",
                  slot.available &&
                    selected === slot.start &&
                    "border-indigo-600 bg-indigo-600 text-white",
                  slot.available &&
                    selected !== slot.start &&
                    "border-slate-200 bg-white text-slate-700 hover:border-indigo-300"
                )}
              >
                {format(parseISO(slot.start), "h:mm a")}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="flex items-center gap-3">
        <Button onClick={book} disabled={!selected || booking}>
          {booking ? "Booking…" : "Book consultation"}
        </Button>
        {message && <p className="text-sm text-slate-600">{message}</p>}
      </div>
    </div>
  );
}
