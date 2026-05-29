import {
  Building2,
  CreditCard,
  Mail,
  ShieldCheck,
  type LucideIcon,
} from "lucide-react";

export type FlowStatus = "draft" | "review" | "ready";

export type AccountStep = {
  id: string;
  label: string;
  done: boolean;
};

export type AccountFlow = {
  id: string;
  name: string;
  owner: string;
  status: FlowStatus;
  channel: string;
  due: string;
  icon: LucideIcon;
  accent: "purple" | "cyan" | "green" | "yellow";
  steps: AccountStep[];
};

export const statusLabel: Record<FlowStatus, string> = {
  draft: "Rascunho",
  review: "Revisao",
  ready: "Pronto",
};

export const accountFlows: AccountFlow[] = [
  {
    id: "pj-banco",
    name: "Conta PJ Banco",
    owner: "Financeiro",
    status: "review",
    channel: "Web",
    due: "Hoje",
    icon: Building2,
    accent: "purple",
    steps: [
      { id: "cpf", label: "CPF validado", done: true },
      { id: "cnpj", label: "CNPJ separado", done: true },
      { id: "contrato", label: "Contrato social anexado", done: false },
      { id: "senha", label: "Senha temporaria gerada", done: false },
    ],
  },
  {
    id: "email-time",
    name: "Email do time",
    owner: "Operacoes",
    status: "ready",
    channel: "Workspace",
    due: "2 dias",
    icon: Mail,
    accent: "cyan",
    steps: [
      { id: "nome", label: "Nome padrao confirmado", done: true },
      { id: "grupo", label: "Grupo aplicado", done: true },
      { id: "mfa", label: "MFA habilitado", done: true },
      { id: "recuperacao", label: "Email de recuperacao salvo", done: true },
    ],
  },
  {
    id: "cartao-virtual",
    name: "Cartao virtual",
    owner: "Compras",
    status: "draft",
    channel: "App",
    due: "5 dias",
    icon: CreditCard,
    accent: "yellow",
    steps: [
      { id: "limite", label: "Limite definido", done: false },
      { id: "centro", label: "Centro de custo informado", done: true },
      { id: "aprovacao", label: "Aprovacao pendente", done: false },
      { id: "registro", label: "Registro interno criado", done: false },
    ],
  },
  {
    id: "cofre-senhas",
    name: "Cofre de senhas",
    owner: "Seguranca",
    status: "review",
    channel: "Vault",
    due: "Amanha",
    icon: ShieldCheck,
    accent: "green",
    steps: [
      { id: "politica", label: "Politica aplicada", done: true },
      { id: "permissoes", label: "Permissoes revisadas", done: false },
      { id: "backup", label: "Backup de acesso salvo", done: true },
      { id: "auditoria", label: "Auditoria marcada", done: false },
    ],
  },
];
