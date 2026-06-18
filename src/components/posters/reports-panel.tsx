import { useEffect, useState } from "react";
import {
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock3,
  RefreshCw,
} from "lucide-react";
import { cn } from "../../lib/utils";

type SlotType = "post" | "support";

type Slot = {
  time: string;
  endTime?: string;
  type: SlotType;
};

// Fixed weekly grade, keyed by weekday (0=Sun … 6=Sat).
const WEEK_SCHEDULE: Record<number, Slot[]> = {
  1: [
    { time: "09:00", endTime: "09:30", type: "support" },
    { time: "17:00", endTime: "17:30", type: "support" },
  ],
  2: [
    { time: "09:00", endTime: "09:30", type: "support" },
    { time: "17:00", endTime: "17:30", type: "support" },
  ],
  3: [
    { time: "09:00", endTime: "09:30", type: "support" },
    { time: "17:00", endTime: "17:30", type: "support" },
  ],
  4: [
    { time: "09:00", type: "post" },
    { time: "17:00", type: "post" },
  ],
  5: [
    { time: "09:00", endTime: "09:30", type: "support" },
    { time: "17:00", endTime: "17:30", type: "support" },
  ],
};

const DAY_NAMES = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
const DAY_NAMES_FULL = [
  "Domingo",
  "Segunda",
  "Terça",
  "Quarta",
  "Quinta",
  "Sexta",
  "Sábado",
];

type HistoryItem = {
  videoId: string | null;
  title: string;
  uploadedAt: string;
  publishAt?: string | null;
  privacyStatus?: string;
  thumbnailUrl?: string | null;
};

// ---------------------------------------------------------------------------
// All day/week math is pinned to Brazil time (America/Sao_Paulo). Timestamps
// are stored in UTC (TIMESTAMPTZ); doing the grouping in the viewer's local
// timezone would put posts on the wrong day for anyone not in BRT and would
// drift the "today"/week boundaries. Working with BRT calendar-day keys
// ("YYYY-MM-DD") makes everything deterministic and correct.
// ---------------------------------------------------------------------------
const SP_TZ = "America/Sao_Paulo";

const dayKeyFmt = new Intl.DateTimeFormat("en-CA", {
  timeZone: SP_TZ,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});
const timeFmt = new Intl.DateTimeFormat("pt-BR", {
  timeZone: SP_TZ,
  hour: "2-digit",
  minute: "2-digit",
});
const hourFmt = new Intl.DateTimeFormat("en-GB", {
  timeZone: SP_TZ,
  hour: "2-digit",
  hour12: false,
});
const dayShortFmt = new Intl.DateTimeFormat("pt-BR", {
  timeZone: "UTC",
  day: "2-digit",
  month: "short",
});

// BRT calendar day ("YYYY-MM-DD") of an instant.
function spDayKey(date: Date): string {
  return dayKeyFmt.format(date);
}
// BRT "HH:MM" of an instant.
function spTime(date: Date): string {
  return timeFmt.format(date);
}
// BRT hour (0–23) of an instant.
function spHour(date: Date): number {
  return parseInt(hourFmt.format(date), 10);
}

// A day-key anchored at UTC noon: a stable Date for weekday lookup and ±day
// arithmetic, immune to timezone/DST edges.
function keyToNoon(key: string): Date {
  return new Date(`${key}T12:00:00Z`);
}
function noonToKey(d: Date): string {
  return d.toISOString().slice(0, 10);
}
function weekdayOfKey(key: string): number {
  return keyToNoon(key).getUTCDay(); // 0=Sun … 6=Sat
}
function addDaysKey(key: string, n: number): string {
  const d = keyToNoon(key);
  d.setUTCDate(d.getUTCDate() + n);
  return noonToKey(d);
}
function mondayOfKey(key: string): string {
  const wd = weekdayOfKey(key);
  const back = wd === 0 ? 6 : wd - 1; // days since Monday
  return addDaysKey(key, -back);
}
function dayNumber(key: string): number {
  return parseInt(key.slice(8, 10), 10);
}
function fmtDayShort(key: string): string {
  return dayShortFmt.format(keyToNoon(key));
}

function getItemDate(item: HistoryItem): Date {
  return new Date(item.publishAt ?? item.uploadedAt);
}

function isScheduled(item: HistoryItem): boolean {
  return Boolean(item.publishAt && new Date(item.publishAt) > new Date());
}

function slotMatchesVideo(slot: Slot, item: HistoryItem): boolean {
  const h = spHour(getItemDate(item));
  const slotH = parseInt(slot.time.split(":")[0], 10);
  const endH = slot.endTime ? parseInt(slot.endTime.split(":")[0], 10) : slotH + 1;
  return h >= slotH && h < endH;
}

function getSlotLabel(slot: Slot): string {
  return slot.type === "post" ? "Postagem principal" : "Apoio";
}

export function ReportsPanel() {
  const todayKey = spDayKey(new Date());
  const [anchorKey, setAnchorKey] = useState(todayKey);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadError, setLoadError] = useState(false);

  function fetchHistory(silent: boolean) {
    if (silent) setRefreshing(true);
    else setLoading(true);
    return fetch("/api/youtube/history?reconcile=1")
      .then((r) => (r.ok ? r.json() : { items: [] }))
      .then((d: { items?: HistoryItem[] }) => {
        setHistory(d.items ?? []);
        setLoadError(false);
      })
      .catch(() => setLoadError(true))
      .finally(() => {
        setLoading(false);
        setRefreshing(false);
      });
  }

  useEffect(() => {
    let alive = true;
    function load(silent = false) {
      if (!alive) return;
      fetchHistory(silent);
    }
    load();
    const interval = window.setInterval(() => load(true), 30000);
    const onFocus = () => load(true);
    window.addEventListener("focus", onFocus);
    return () => {
      alive = false;
      window.clearInterval(interval);
      window.removeEventListener("focus", onFocus);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const weekStartKey = mondayOfKey(anchorKey);
  const weekDays = Array.from({ length: 7 }, (_, i) => addDaysKey(weekStartKey, i));
  const weekSet = new Set(weekDays);

  const weekItems = history
    .filter((item) => weekSet.has(spDayKey(getItemDate(item))))
    .sort((a, b) => getItemDate(a).getTime() - getItemDate(b).getTime());
  const scheduledCount = weekItems.filter(isScheduled).length;
  const postedCount = weekItems.length - scheduledCount;

  const weekRange = `${fmtDayShort(weekStartKey)} - ${fmtDayShort(weekDays[6])}`;

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-[color:var(--border)] bg-[color:var(--field)] text-[color:var(--accent)]">
            <CalendarDays className="h-4 w-4" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-[color:var(--text)]">
              Programação de postagens
            </h2>
            <p className="mt-0.5 text-[11px] text-[color:var(--muted)]">
              Dados reais dos uploads feitos pelo app · horário de Brasília
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <span className="mr-2 hidden min-w-[118px] text-center text-[12px] font-semibold text-[color:var(--text)] sm:inline">
            {weekRange}
          </span>
          <button
            type="button"
            aria-label="Semana anterior"
            onClick={() => setAnchorKey((k) => addDaysKey(k, -7))}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-[color:var(--muted)] transition hover:bg-[color:var(--field)] hover:text-[color:var(--text)]"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => setAnchorKey(spDayKey(new Date()))}
            className="rounded-lg px-3 py-2 text-[11px] font-semibold text-[color:var(--muted)] transition hover:bg-[color:var(--field)] hover:text-[color:var(--text)]"
          >
            Hoje
          </button>
          <button
            type="button"
            aria-label="Próxima semana"
            onClick={() => setAnchorKey((k) => addDaysKey(k, 7))}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-[color:var(--muted)] transition hover:bg-[color:var(--field)] hover:text-[color:var(--text)]"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
          <button
            type="button"
            aria-label="Atualizar programação"
            onClick={() => fetchHistory(true)}
            className="ml-1 flex h-8 w-8 items-center justify-center rounded-lg text-[color:var(--muted)] transition hover:bg-[color:var(--field)] hover:text-[color:var(--text)]"
          >
            <RefreshCw className={cn("h-4 w-4", refreshing && "animate-spin")} />
          </button>
        </div>
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        <div className="rounded-xl border border-[color:var(--border)] bg-[color:var(--field)] px-4 py-3">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-[color:var(--muted)]">
            Agendados na semana
          </p>
          <p className="mt-1 text-2xl font-semibold tabular-nums text-[color:var(--text)]">
            {scheduledCount}
          </p>
        </div>
        <div className="rounded-xl border border-[color:var(--border)] bg-[color:var(--field)] px-4 py-3">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-[color:var(--muted)]">
            Postados na semana
          </p>
          <p className="mt-1 text-2xl font-semibold tabular-nums text-[color:var(--text)]">
            {postedCount}
          </p>
        </div>
      </div>

      {loadError && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm font-medium text-red-300">
          Não foi possível carregar o histórico do YouTube agora.
        </div>
      )}

      {loading ? (
        <div className="grid gap-2">
          <div className="skeleton h-24 rounded-xl" />
          <div className="skeleton h-24 rounded-xl" />
          <div className="skeleton h-24 rounded-xl" />
        </div>
      ) : weekItems.length === 0 ? (
        <div className="rounded-xl border border-dashed border-[color:var(--border)] px-4 py-8 text-center">
          <CalendarDays className="mx-auto h-5 w-5 text-[color:var(--muted)]" />
          <p className="mt-3 text-sm font-semibold text-[color:var(--text)]">
            Nenhuma postagem registrada nesta semana
          </p>
          <p className="mt-1 text-[12px] text-[color:var(--muted)]">
            Assim que um vídeo for postado ou agendado pelo app, ele aparece aqui.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-[color:var(--border)] bg-[color:var(--field)]">
          {weekDays.map((dayKey) => {
            const dow = weekdayOfKey(dayKey);
            const slots = WEEK_SCHEDULE[dow] ?? [];
            const isToday = dayKey === todayKey;
            const dayItems = weekItems.filter(
              (item) => spDayKey(getItemDate(item)) === dayKey,
            );

            if (dayItems.length === 0) return null;

            return (
              <section
                key={dayKey}
                className="grid gap-0 border-b border-[color:var(--border)] last:border-b-0 md:grid-cols-[150px_1fr]"
              >
                <div
                  className={cn(
                    "flex items-center gap-3 px-4 py-4 md:border-r md:border-[color:var(--border)]",
                    isToday && "bg-[color:var(--accent-surface)]",
                  )}
                >
                  <div
                    className={cn(
                      "flex h-10 w-10 shrink-0 flex-col items-center justify-center rounded-lg border border-[color:var(--border)] text-center leading-none",
                      isToday
                        ? "border-[color:var(--accent-border)] text-[color:var(--accent)]"
                        : "text-[color:var(--text)]",
                    )}
                  >
                    <span className="text-[9px] font-bold uppercase">
                      {DAY_NAMES[dow]}
                    </span>
                    <span className="text-base font-bold tabular-nums">
                      {dayNumber(dayKey)}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-[color:var(--text)]">
                      {DAY_NAMES_FULL[dow]}
                    </p>
                    {isToday && (
                      <p className="text-[10px] font-semibold uppercase tracking-wide text-[color:var(--accent)]">
                        Hoje
                      </p>
                    )}
                  </div>
                </div>

                <div className="divide-y divide-[color:var(--border)]">
                  {dayItems.map((item, index) => {
                    const matchedSlot = slots.find((slot) =>
                      slotMatchesVideo(slot, item),
                    );
                    const scheduled = isScheduled(item);

                    return (
                      <div
                        key={`${item.videoId ?? item.title}-${item.uploadedAt}-${index}`}
                        className="grid gap-2 px-4 py-3 sm:grid-cols-[120px_1fr_auto] sm:items-center"
                      >
                        <div className="flex items-center gap-2 font-mono text-[12px] font-semibold text-[color:var(--text)]">
                          <Clock3 className="h-3.5 w-3.5 text-[color:var(--muted)]" />
                          {spTime(getItemDate(item))}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-[13px] font-medium text-[color:var(--text)]">
                            {item.title}
                          </p>
                          <p className="mt-0.5 truncate text-[11px] text-[color:var(--muted)]">
                            {matchedSlot
                              ? getSlotLabel(matchedSlot)
                              : "Postagem fora da grade fixa"}
                          </p>
                        </div>
                        <span
                          className={cn(
                            "inline-flex w-fit items-center gap-1.5 rounded-md px-2 py-1 text-[10px] font-semibold uppercase tracking-wide",
                            scheduled
                              ? "bg-[color:var(--accent-surface)] text-[color:var(--accent)]"
                              : "bg-[color:var(--surface-soft)] text-[color:var(--muted)]",
                          )}
                        >
                          {scheduled ? (
                            <CalendarDays className="h-3 w-3" />
                          ) : (
                            <CheckCircle2 className="h-3 w-3" />
                          )}
                          {scheduled ? "Agendado" : "Postado"}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </section>
            );
          })}
        </div>
      )}

      {!loading && weekItems.length > 0 && (
        <div className="rounded-xl border border-[color:var(--border)] bg-transparent px-4 py-3">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-[color:var(--muted)]">
            Grade fixa
          </p>
          <div className="mt-2 grid gap-1 text-[12px] text-[color:var(--muted)] sm:grid-cols-2">
            <span>Seg/Ter/Qua/Sex: apoio 09:00 e 17:00</span>
            <span>Quinta: postagem principal 09:00 e 17:00</span>
          </div>
        </div>
      )}
    </div>
  );
}
