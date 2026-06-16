import { useEffect, useState } from "react";
import { LogOut, MapPin, Monitor } from "lucide-react";
import { useTranslation } from "react-i18next";
import { adminRequest, type AdminUser, type ManagedSession } from "../api";

// Aba "Sessões": TODAS as sessões ativas, de todos os usuários, num só lugar.
// Dispositivo, localização aproximada, IP (admin-only) e datas. Encerrar avulso.
// A gestão de pessoas em si fica na aba "Usuários".

export function SessionsTab() {
  const { t } = useTranslation();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [sessions, setSessions] = useState<ManagedSession[]>([]);
  const [error, setError] = useState("");

  async function reload() {
    try {
      const [u, s] = await Promise.all([
        adminRequest<{ users: AdminUser[] }>("/api/users"),
        adminRequest<{ sessions: ManagedSession[] }>("/api/sessions"),
      ]);
      setUsers(u.users);
      setSessions(s.sessions);
    } catch {
      setError(t("admin.sessions.load_error"));
    }
  }

  useEffect(() => {
    void reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function revoke(sid: string) {
    try {
      await adminRequest(`/api/sessions/${encodeURIComponent(sid)}`, {
        method: "DELETE",
      });
      await reload();
    } catch {
      setError(t("admin.sessions.revoke_error"));
    }
  }

  const nameById = new Map(users.map((u) => [u.id, u.username]));
  const ordered = [...sessions].sort((a, b) => b.lastSeenAt - a.lastSeenAt);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-xl font-semibold text-[color:var(--text)]">
          {t("admin.sessions.title")}
        </h1>
        <p className="text-sm text-[color:var(--muted)]">
          {t("admin.sessions.subtitle", { count: sessions.length })}
        </p>
      </header>

      {error ? (
        <p className="text-sm text-red-400" role="alert">
          {error}
        </p>
      ) : null}

      {ordered.length === 0 ? (
        <p className="text-sm text-[color:var(--muted)]">
          {t("admin.sessions.no_sessions")}
        </p>
      ) : (
        <div className="space-y-2">
          {ordered.map((s) => (
            <div
              key={s.sessionId}
              className="admin-card flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0 space-y-1">
                <p className="flex flex-wrap items-center gap-2 text-sm font-semibold text-[color:var(--text)]">
                  <span className="truncate">
                    {nameById.get(s.userId) ?? t("admin.sessions.unknown_user")}
                  </span>
                  {s.current ? (
                    <span className="rounded-[4px] bg-[color:var(--accent-surface)] px-1.5 py-0.5 text-[10px] font-medium uppercase text-[color:var(--accent)]">
                      {t("admin.users.this_device")}
                    </span>
                  ) : null}
                </p>
                <p className="flex items-center gap-1.5 text-xs text-[color:var(--muted)]">
                  <Monitor className="h-3.5 w-3.5 shrink-0" />
                  {shortUa(
                    s.userAgent,
                    t("admin.users.generic_browser"),
                    t("admin.users.unknown_device"),
                  )}
                </p>
                <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[color:var(--muted)]">
                  <span className="flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5 shrink-0" />
                    {s.location ?? t("admin.sessions.location_unknown")}
                  </span>
                  {s.ip ? <span className="font-mono">{s.ip}</span> : null}
                </p>
                <p className="text-[11px] text-[color:var(--muted)]">
                  {t("admin.sessions.started", {
                    date: new Date(s.createdAt).toLocaleString(),
                  })}
                  {" · "}
                  {t("admin.sessions.last_active", {
                    date: new Date(s.lastSeenAt).toLocaleString(),
                  })}
                </p>
              </div>
              <button
                type="button"
                onClick={() => revoke(s.sessionId)}
                className="admin-chip-btn shrink-0 justify-center hover:text-red-400"
              >
                <LogOut className="h-3.5 w-3.5" />
                {t("admin.sessions.end")}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Resumo legível do user-agent (navegador · SO).
function shortUa(
  ua: string,
  fallbackBrowser: string,
  unknownDevice: string,
): string {
  if (!ua) return unknownDevice;
  const browser = /Edg/.test(ua)
    ? "Edge"
    : /Chrome/.test(ua)
      ? "Chrome"
      : /Firefox/.test(ua)
        ? "Firefox"
        : /Safari/.test(ua)
          ? "Safari"
          : fallbackBrowser;
  const os = /Windows/.test(ua)
    ? "Windows"
    : /Android/.test(ua)
      ? "Android"
      : /iPhone|iPad/.test(ua)
        ? "iOS"
        : /Mac/.test(ua)
          ? "macOS"
          : /Linux/.test(ua)
            ? "Linux"
            : "";
  return os ? `${browser} · ${os}` : browser;
}
