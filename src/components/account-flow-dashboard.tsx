import { useMemo, useState } from "react";
import {
  Check,
  CheckCircle2,
  ClipboardList,
  Filter,
  KeyRound,
  LayoutDashboard,
  Plus,
  Search,
  ShieldCheck,
} from "lucide-react";
import {
  type AccountFlow,
  type FlowStatus,
  accountFlows as initialFlows,
  statusLabel,
} from "../data/account-flows";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { Input } from "./ui/input";
import { ProgressBar } from "./ui/progress-bar";
import { cn } from "../lib/utils";

const filters: Array<FlowStatus | "all"> = ["all", "draft", "review", "ready"];

const accentClasses: Record<AccountFlow["accent"], string> = {
  purple: "border-brand-300/40 bg-brand-300/10 text-brand-300",
  cyan: "border-cyan-400/30 bg-cyan-400/10 text-cyan-100",
  green: "border-green-500/30 bg-green-500/10 text-green-200",
  yellow: "border-yellow-400/40 bg-yellow-400/10 text-yellow-100",
};

function progressFor(flow: AccountFlow) {
  const done = flow.steps.filter((step) => step.done).length;
  return Math.round((done / flow.steps.length) * 100);
}

export function AccountFlowDashboard() {
  const [flows, setFlows] = useState<AccountFlow[]>(initialFlows);
  const [activeId, setActiveId] = useState(initialFlows[0].id);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<FlowStatus | "all">("all");
  const [newFlowName, setNewFlowName] = useState("");

  const activeFlow = flows.find((flow) => flow.id === activeId) ?? flows[0];

  const filteredFlows = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return flows.filter((flow) => {
      const matchesStatus = status === "all" || flow.status === status;
      const matchesQuery =
        !normalizedQuery ||
        flow.name.toLowerCase().includes(normalizedQuery) ||
        flow.owner.toLowerCase().includes(normalizedQuery) ||
        flow.channel.toLowerCase().includes(normalizedQuery);

      return matchesStatus && matchesQuery;
    });
  }, [flows, query, status]);

  const readyCount = flows.filter((flow) => flow.status === "ready").length;
  const averageProgress = Math.round(
    flows.reduce((total, flow) => total + progressFor(flow), 0) / flows.length,
  );
  const pendingSteps = flows.reduce(
    (total, flow) => total + flow.steps.filter((step) => !step.done).length,
    0,
  );

  function toggleStep(flowId: string, stepId: string) {
    setFlows((current) =>
      current.map((flow) => {
        if (flow.id !== flowId) {
          return flow;
        }

        const steps = flow.steps.map((step) =>
          step.id === stepId ? { ...step, done: !step.done } : step,
        );
        const status = steps.every((step) => step.done)
          ? "ready"
          : flow.status === "ready"
            ? "review"
            : flow.status;

        return { ...flow, steps, status };
      }),
    );
  }

  function addFlow() {
    const name = newFlowName.trim();

    if (!name) {
      return;
    }

    const id = `flow-${Date.now()}`;
    const created: AccountFlow = {
      id,
      name,
      owner: "Novo fluxo",
      status: "draft",
      channel: "Manual",
      due: "Sem prazo",
      icon: KeyRound,
      accent: "purple",
      steps: [
        { id: "dados", label: "Dados base definidos", done: false },
        { id: "validacao", label: "Validacao obrigatoria", done: false },
        { id: "acesso", label: "Acesso inicial criado", done: false },
        { id: "registro", label: "Registro final salvo", done: false },
      ],
    };

    setFlows((current) => [created, ...current]);
    setActiveId(id);
    setNewFlowName("");
  }

  return (
    <main className="min-h-screen bg-black text-white">
      <div className="mx-auto grid min-h-screen max-w-7xl grid-cols-1 gap-6 px-4 py-5 sm:px-6 lg:grid-cols-[260px_1fr] lg:px-8">
        <aside className="rounded-3xl border border-white/10 bg-zinc-950/80 p-5 lg:sticky lg:top-5 lg:h-[calc(100vh-40px)]">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-brand-300/30 bg-brand-300/10 text-brand-300">
              <ClipboardList className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-white">Contas-flow</p>
              <p className="text-xs font-medium text-zinc-500">
                Sistema de contas
              </p>
            </div>
          </div>

          <nav className="mt-8 space-y-2">
            <Button className="w-full justify-start" variant="secondary">
              <LayoutDashboard className="h-4 w-4" />
              Painel
            </Button>
            <Button className="w-full justify-start" variant="ghost">
              <ShieldCheck className="h-4 w-4" />
              Seguranca
            </Button>
            <Button className="w-full justify-start" variant="ghost">
              <Filter className="h-4 w-4" />
              Modelos
            </Button>
          </nav>

          <div className="mt-8 rounded-3xl border border-white/10 bg-white/[0.03] p-4">
            <p className="text-xs font-medium uppercase text-zinc-500">
              Progresso medio
            </p>
            <div className="mt-3 flex items-end justify-between gap-3">
              <span className="text-3xl font-bold leading-none">
                {averageProgress}%
              </span>
              <Badge variant="neutral">{flows.length} fluxos</Badge>
            </div>
            <ProgressBar className="mt-4" value={averageProgress} />
          </div>
        </aside>

        <section className="space-y-6">
          <header className="rounded-3xl border border-white/10 bg-zinc-950/70 p-5 shadow-panel">
            <div className="grid gap-4 lg:grid-cols-[1fr_360px] lg:items-end">
              <div>
                <Badge variant="neutral">Padrao Felixo System Design</Badge>
                <h1 className="mt-4 text-4xl font-bold leading-tight text-white">
                  Fluxos de criacao de contas
                </h1>
                <p className="mt-3 max-w-2xl text-sm leading-relaxed text-zinc-400">
                  Organizacao de dados, validacoes, acessos e pendencias em uma
                  fila unica de trabalho.
                </p>
              </div>

              <div className="flex gap-2">
                <Input
                  aria-label="Nome do novo fluxo"
                  placeholder="Novo fluxo"
                  value={newFlowName}
                  onChange={(event) => setNewFlowName(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      addFlow();
                    }
                  }}
                />
                <Button aria-label="Criar fluxo" size="icon" onClick={addFlow}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </header>

          <div className="grid gap-4 md:grid-cols-3">
            <MetricCard
              label="Prontos"
              value={readyCount}
              detail="sem pendencia"
            />
            <MetricCard
              label="Pendencias"
              value={pendingSteps}
              detail="etapas abertas"
            />
            <MetricCard
              label="Fluxos"
              value={flows.length}
              detail="em acompanhamento"
            />
          </div>

          <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
            <Card>
              <CardHeader className="space-y-4">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div>
                    <CardTitle>Fila de contas</CardTitle>
                    <CardDescription>
                      {filteredFlows.length} registros visiveis
                    </CardDescription>
                  </div>
                  <div className="relative w-full md:w-72">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
                    <Input
                      aria-label="Buscar fluxo"
                      className="pl-9"
                      placeholder="Buscar"
                      value={query}
                      onChange={(event) => setQuery(event.target.value)}
                    />
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  {filters.map((filter) => (
                    <Button
                      key={filter}
                      size="sm"
                      variant={status === filter ? "default" : "outline"}
                      onClick={() => setStatus(filter)}
                    >
                      {filter === "all" ? "Todos" : statusLabel[filter]}
                    </Button>
                  ))}
                </div>
              </CardHeader>

              <CardContent className="grid gap-3">
                {filteredFlows.map((flow) => {
                  const Icon = flow.icon;
                  const progress = progressFor(flow);
                  const isActive = activeFlow.id === flow.id;

                  return (
                    <button
                      key={flow.id}
                      className={cn(
                        "grid gap-4 rounded-2xl border p-4 text-left transition hover:border-white/20 hover:bg-white/[0.03] md:grid-cols-[1fr_120px]",
                        isActive
                          ? "border-brand-300/50 bg-brand-300/10"
                          : "border-white/10 bg-zinc-900/50",
                      )}
                      onClick={() => setActiveId(flow.id)}
                    >
                      <div className="flex min-w-0 gap-3">
                        <span
                          className={cn(
                            "flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border",
                            accentClasses[flow.accent],
                          )}
                        >
                          <Icon className="h-5 w-5" />
                        </span>
                        <span className="min-w-0">
                          <span className="block truncate text-sm font-semibold text-white">
                            {flow.name}
                          </span>
                          <span className="mt-1 block text-xs font-medium text-zinc-400">
                            {flow.owner} / {flow.channel} / {flow.due}
                          </span>
                          <span className="mt-3 block">
                            <ProgressBar value={progress} />
                          </span>
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-3 md:flex-col md:items-end md:justify-center">
                        <Badge variant={flow.status}>
                          {statusLabel[flow.status]}
                        </Badge>
                        <span className="text-xs font-semibold text-zinc-400">
                          {progress}%
                        </span>
                      </div>
                    </button>
                  );
                })}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{activeFlow.name}</CardTitle>
                <CardDescription>
                  {activeFlow.owner} / {activeFlow.channel}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium text-zinc-300">Checklist</span>
                    <span className="font-semibold text-white">
                      {progressFor(activeFlow)}%
                    </span>
                  </div>
                  <ProgressBar
                    className="mt-3"
                    value={progressFor(activeFlow)}
                  />
                </div>

                <div className="space-y-2">
                  {activeFlow.steps.map((step) => (
                    <button
                      key={step.id}
                      className="flex w-full items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-3 text-left transition hover:border-white/20 hover:bg-white/[0.06]"
                      onClick={() => toggleStep(activeFlow.id, step.id)}
                    >
                      <span
                        className={cn(
                          "flex h-6 w-6 shrink-0 items-center justify-center rounded-full border",
                          step.done
                            ? "border-green-500/60 bg-green-500/20 text-green-200"
                            : "border-white/15 bg-zinc-900 text-zinc-500",
                        )}
                      >
                        {step.done ? <Check className="h-3.5 w-3.5" /> : null}
                      </span>
                      <span
                        className={cn(
                          "text-sm",
                          step.done ? "text-zinc-300" : "text-white",
                        )}
                      >
                        {step.label}
                      </span>
                    </button>
                  ))}
                </div>
              </CardContent>
              <CardFooter className="justify-between">
                <Badge variant={activeFlow.status}>
                  {statusLabel[activeFlow.status]}
                </Badge>
                <span className="inline-flex items-center gap-2 text-xs font-medium text-zinc-400">
                  <CheckCircle2 className="h-4 w-4 text-brand-300" />
                  {activeFlow.due}
                </span>
              </CardFooter>
            </Card>
          </div>
        </section>
      </div>
    </main>
  );
}

type MetricCardProps = {
  label: string;
  value: number;
  detail: string;
};

function MetricCard({ label, value, detail }: MetricCardProps) {
  return (
    <Card>
      <CardContent>
        <p className="text-xs font-medium uppercase text-zinc-500">{label}</p>
        <div className="mt-3 flex items-end justify-between gap-3">
          <span className="text-3xl font-bold leading-none text-white">
            {value}
          </span>
          <span className="text-xs font-medium text-zinc-400">{detail}</span>
        </div>
      </CardContent>
    </Card>
  );
}
