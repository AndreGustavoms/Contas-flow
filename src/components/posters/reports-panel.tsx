import { useEffect, useState } from "react";
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Clock,
  FileVideo2,
  Megaphone,
  Zap,
} from "lucide-react";
import { cn } from "../../lib/utils";

// Horários fixos por tipo de dia
// quinta-feira: postagem às 9h e 17h
// seg/ter/qua/sex: apoio 9h-9h30 e 17h-17h30
type SlotType = "post" | "support";

type Slot = {
  time: string;
  endTime?: string;
  type: SlotType;
};

const WEEK_SCHEDULE: Record<number, Slot[]> = {
  1: [
    // segunda
    { time: "09:00", endTime: "09:30", type: "support" },
    { time: "17:00", endTime: "17:30", type: "support" },
  ],
  2: [
    // terça
    { time: "09:00", endTime: "09:30", type: "support" },
    { time: "17:00", endTime: "17:30", type: "support" },
  ],
  3: [
    // quarta
    { time: "09:00", endTime: "09:30", type: "support" },
    { time: "17:00", endTime: "17:30", type: "support" },
  ],
  4: [
    // quinta
    { time: "09:00", type: "post" },
    { time: "17:00", type: "post" },
  ],
  5: [
    // sexta
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

function getWeekStart(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay(); // 0=Sun
  d.setDate(d.getDate() - day + (day === 0 ? -6 : 1)); // Monday
  d.setHours(0, 0, 0, 0);
  return d;
}

function addDays(date: Date, n: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d;
}

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function slotMatchesVideo(slot: Slot, day: Date, item: HistoryItem): boolean {
  // Usa publishAt se agendado, senão uploadedAt
  const ts = item.publishAt ?? item.uploadedAt;
  const d = new Date(ts);
  if (!isSameDay(d, day)) return false;
  const h = d.getHours();
  const slotH = parseInt(slot.time.split(":")[0], 10);
  const endH = slot.endTime
    ? parseInt(slot.endTime.split(":")[0], 10)
    : slotH + 1;
  return h >= slotH && h < endH;
}

function fmtWeekRange(start: Date): string {
  const end = addDays(start, 4); // seg a sex
  const opts: Intl.DateTimeFormatOptions = { day: "2-digit", month: "short" };
  return `${start.toLocaleDateString("pt-BR", opts)} – ${end.toLocaleDateString("pt-BR", opts)}`;
}

export function ReportsPanel() {
  const [weekStart, setWeekStart] = useState(() => getWeekStart(new Date()));
  const [history, setHistory] = useState<HistoryItem[]>([]);

  useEffect(() => {
    fetch("/api/youtube/history")
      .then((r) => (r.ok ? r.json() : { items: [] }))
      .then((d: { items?: HistoryItem[] }) => setHistory(d.items ?? []))
      .catch(() => setHistory([]));
  }, []);

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const currentWeek = getWeekStart(new Date());
  const isCurrentWeek = weekStart.getTime() === currentWeek.getTime();

  // Dias úteis desta semana: seg(0)..sex(4)
  const workDays = Array.from({ length: 5 }, (_, i) => addDays(weekStart, i));

  // Estatísticas da semana
  const weekVideos = history.filter((item) => {
    const ts = item.publishAt ?? item.uploadedAt;
    const d = new Date(ts);
    d.setHours(0, 0, 0, 0);
    return d >= weekStart && d <= addDays(weekStart, 6);
  });

  const totalSlots = workDays.reduce((acc, day) => {
    const dow = day.getDay();
    return acc + (WEEK_SCHEDULE[dow]?.length ?? 0);
  }, 0);

  const filledSlots = workDays.reduce((acc, day) => {
    const dow = day.getDay();
    const slots = WEEK_SCHEDULE[dow] ?? [];
    return (
      acc +
      slots.filter((slot) =>
        history.some((item) => slotMatchesVideo(slot, day, item)),
      ).length
    );
  }, 0);

  return (
    <div className="flex flex-col gap-6">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-[color:var(--text)]">
            Calendário de postagens
          </h2>
          <p className="mt-0.5 text-[11px] text-[color:var(--muted)]">
            Qui: postagem 9h e 17h &nbsp;·&nbsp; Seg/Ter/Qua/Sex: apoio
            9h–9h30 e 17h–17h30
          </p>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setWeekStart((w) => addDays(w, -7))}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-[color:var(--muted)] transition hover:bg-[color:var(--field)] hover:text-[color:var(--text)]"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="min-w-[120px] text-center text-[12px] font-semibold text-[color:var(--text)]">
            {fmtWeekRange(weekStart)}
          </span>
          <button
            type="button"
            onClick={() => setWeekStart((w) => addDays(w, 7))}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-[color:var(--muted)] transition hover:bg-[color:var(--field)] hover:text-[color:var(--text)]"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Resumo da semana */}
      <div className="grid grid-cols-3 gap-2">
        {[
          {
            label: "Slots da semana",
            value: totalSlots,
            icon: Calendar,
          },
          {
            label: "Preenchidos",
            value: filledSlots,
            icon: Megaphone,
          },
          {
            label: "Pendentes",
            value: totalSlots - filledSlots,
            icon: Clock,
          },
        ].map(({ label, value, icon: Icon }) => (
          <div
            key={label}
            className="flex flex-col gap-1 rounded-xl border border-[color:var(--border)] bg-[color:var(--field)] p-3"
          >
            <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-widest text-[color:var(--muted-soft)]">
              <Icon className="h-3 w-3" />
              {label}
            </div>
            <span className="text-2xl font-bold tabular-nums text-[color:var(--text)]">
              {value}
            </span>
          </div>
        ))}
      </div>

      {/* Grade de dias */}
      <div className="grid gap-3">
        {workDays.map((day) => {
          const dow = day.getDay(); // 1=seg..5=sex
          const slots = WEEK_SCHEDULE[dow] ?? [];
          const isToday = isSameDay(day, today);
          const isPast = day < today && !isToday;
          const isThursday = dow === 4;

          return (
            <div
              key={day.toISOString()}
              className={cn(
                "rounded-xl border",
                isToday
                  ? "border-[color:var(--accent-border)] bg-[color:var(--accent-surface)]"
                  : "border-[color:var(--border)] bg-[color:var(--field)]",
              )}
            >
              {/* Header do dia */}
              <div className="flex items-center gap-3 border-b border-[color:var(--border)] px-4 py-2.5">
                <div
                  className={cn(
                    "flex h-8 w-8 shrink-0 flex-col items-center justify-center rounded-lg text-center leading-none",
                    isToday
                      ? "bg-[color:var(--accent)] text-[color:var(--accent-foreground)] shadow-[0_4px_14px_-4px_var(--accent)]"
                      : isPast
                        ? "bg-[color:var(--surface-soft)] text-[color:var(--muted)]"
                        : "border border-[color:var(--border)] text-[color:var(--text)]",
                  )}
                >
                  <span className="text-[9px] font-bold uppercase">
                    {DAY_NAMES[dow]}
                  </span>
                  <span className="text-sm font-bold tabular-nums">
                    {day.getDate()}
                  </span>
                </div>
                <div className="flex-1">
                  <span
                    className={cn(
                      "text-sm font-semibold",
                      isToday
                        ? "text-[color:var(--accent)]"
                        : "text-[color:var(--text)]",
                    )}
                  >
                    {DAY_NAMES_FULL[dow]}
                    {isToday && (
                      <span className="ml-2 text-[10px] font-bold uppercase tracking-widest text-[color:var(--accent)]">
                        hoje
                      </span>
                    )}
                  </span>
                  <p className="text-[10px] text-[color:var(--muted)]">
                    {isThursday
                      ? "Postagem principal"
                      : "Apoio e engajamento"}
                  </p>
                </div>
                {isThursday && (
                  <span className="flex items-center gap-1 rounded-lg border border-[color:var(--accent-border)] bg-[color:var(--accent-surface)] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[color:var(--accent-soft)]">
                    <Zap className="h-2.5 w-2.5" />
                    Postagem
                  </span>
                )}
              </div>

              {/* Slots */}
              <div className="divide-y divide-[color:var(--border)]">
                {slots.map((slot) => {
                  const video = history.find((item) =>
                    slotMatchesVideo(slot, day, item),
                  );
                  const timeLabel = slot.endTime
                    ? `${slot.time}–${slot.endTime}`
                    : slot.time;

                  return (
                    <div
                      key={slot.time}
                      className="flex items-center gap-3 px-4 py-2.5"
                    >
                      <span className="w-20 shrink-0 font-mono text-[11px] font-semibold text-[color:var(--muted)]">
                        {timeLabel}
                      </span>

                      {video ? (
                        <div className="flex min-w-0 flex-1 items-center gap-2.5">
                          {video.thumbnailUrl ? (
                            <img
                              alt=""
                              src={video.thumbnailUrl}
                              className="h-8 w-14 shrink-0 rounded-md object-cover"
                            />
                          ) : (
                            <div className="flex h-8 w-14 shrink-0 items-center justify-center rounded-md bg-[color:var(--surface-soft)] text-[color:var(--muted)]">
                              <FileVideo2 className="h-4 w-4" />
                            </div>
                          )}
                          <div className="min-w-0">
                            <p className="truncate text-[12px] font-medium text-[color:var(--text)]">
                              {video.title}
                            </p>
                            <p className="text-[10px] text-[color:var(--muted)]">
                              {video.publishAt
                                ? new Date(video.publishAt).toLocaleString(
                                    "pt-BR",
                                    { hour: "2-digit", minute: "2-digit" },
                                  )
                                : new Date(video.uploadedAt).toLocaleString(
                                    "pt-BR",
                                    { hour: "2-digit", minute: "2-digit" },
                                  )}
                            </p>
                          </div>
                          {video.videoId && (
                            <a
                              href={`https://studio.youtube.com/video/${video.videoId}/edit`}
                              target="_blank"
                              rel="noreferrer"
                              className="ml-auto shrink-0 text-[10px] font-semibold text-[color:var(--accent)] hover:underline"
                            >
                              Ver
                            </a>
                          )}
                        </div>
                      ) : (
                        <div className="flex min-w-0 flex-1 items-center gap-2">
                          <div
                            className={cn(
                              "h-1 w-1 rounded-full",
                              isPast || (isToday && parseInt(slot.time) < new Date().getHours())
                                ? "bg-[color:var(--border)]"
                                : "bg-[color:var(--accent)] shadow-[0_0_6px_var(--accent-glow)]",
                            )}
                          />
                          <span className="text-[11px] text-[color:var(--muted)]">
                            {isPast || (isToday && parseInt(slot.time) < new Date().getHours())
                              ? "Não postado"
                              : "Aguardando postagem"}
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Legenda */}
      <div className="flex flex-wrap items-center gap-4 rounded-xl border border-[color:var(--border)] px-4 py-3 text-[11px] text-[color:var(--muted)]">
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-[color:var(--accent)] shadow-[0_0_6px_var(--accent-glow)]" />
          Agendado / pendente
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-[color:var(--border)]" />
          Não postado (passado)
        </span>
        <span className="flex items-center gap-1.5">
          <Zap className="h-3 w-3 text-[color:var(--accent)]" />
          Postagem principal (quinta)
        </span>
      </div>
    </div>
  );
}
