# IA — Contexto Operacional

Resumo rápido para quem (humano ou IA) for trabalhar no projeto.
Para detalhes completos, ver `README.md`, `docs/ARQUITETURA.md` e `docs/DEPLOY.md`.

---

## Projeto

**Contas_exe** — cofre de credenciais de redes sociais para uma **equipe**,
organizado em **grupos**. Era um organizador local pessoal; evoluiu para um app
multiusuário com login por pessoa, criptografia em repouso e deploy no Railway.

---

## O que mudou em relação à versão antiga

- **Multiusuário:** cada pessoa tem login próprio (`users.json`, hashes scrypt),
  com papéis admin/member. Não existe mais o login único "Vitissouls".
- **Ownership:** cada grupo tem dono; membro vê só os seus, admin vê todos.
- **Criptografia em repouso (AES-256-GCM):** senha, recovery, telefone e notas
  das contas (e os refresh tokens do YouTube) são cifrados no disco com
  `CONTAS_FLOW_ENC_KEY`. O backup manual JSON ainda existe, em texto plano.
- **Persistência:** `storage/groups.json` (não mais `accounts.json` plano) +
  `storage/users.json` + `storage/sessions.json` + `storage/audit.json`.
  O `localStorage` guarda só preferência de tema e id do grupo ativo (por usuário).
- **Endurecimento:** sessão server-side revogável, rate limit, reauth para ações
  críticas, headers de segurança, CORS fechado, trilha de auditoria.
- **2FA (TOTP):** opcional por usuário, implementado com `crypto` nativo (RFC 6238).
- **i18n:** todas as telas em pt · en · es · fr · zh via react-i18next.
- **Deploy:** Dockerfile multi-stage no Railway (era Nixpacks, migrado para mais
  controle e builds mais rápidos ~2 min vs ~17 min).
- **Identidade visual:** verde (#22c55e dark / #16a34a light) como cor de acento
  — sem vermelho como cor de marca, sem cyan/azul.

---

## Decisões técnicas

- Frontend React 18 + TypeScript (Vite 6, Tailwind CSS 3, Lucide).
- API Node HTTP nativa (sem framework); serve `/api/*` e o build estático.
- 2 temas: Dark (verde neon) e White (verde escuro). Sem tema "Andre".
- Estado inicial vazio (nunca credenciais reais no código).
- YouTube (OAuth/upload) está **em pausa**; o endpoint de upload está desativado.
- Senhas não vêm na listagem — buscadas sob demanda em `/secret` (atrás de reauth).

---

## Regras de segurança

- Nunca commitar `storage/`, `.env`, prints ou backups com dados reais.
- `CONTAS_FLOW_ENC_KEY` é a única forma de decifrar — guardar em cofre separado
  do volume. Perdê-la = dados cifrados irrecuperáveis.
- O backup JSON exportado contém senhas em texto plano: tratar como segredo.
- Repositório público: tudo que for commitado é visível para qualquer pessoa.

---

## Verificações

```bash
npm run build    # type-check + build de produção
git check-ignore .env storage/groups.json   # deve retornar as regras do .gitignore
```
