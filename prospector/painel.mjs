#!/usr/bin/env node
// Gera dados/painel.html: a fila de leads com botão para abrir o WhatsApp
// com a mensagem pronta. O andamento (enviado, respondeu, fechado…) fica salvo no navegador.
//
//   node prospector/painel.mjs
import { writeFileSync, mkdirSync } from "node:fs"
import { fileURLToPath } from "node:url"
import { mensagensDoLead } from "./lib.mjs"
import { ARQ_PAINEL, PASTA_DADOS, carregarConfig, carregarLeads } from "./comum.mjs"

export function gerarPainel() {
  const config = carregarConfig()
  const leads = carregarLeads().map((l) => ({ ...l, mensagens: mensagensDoLead(l, config) }))
  const dados = {
    leads,
    limiteDiario: config.limiteDiario ?? 30,
    diasParaFollowUp: config.diasParaFollowUp ?? 3,
    geradoEm: new Date().toISOString(),
  }
  mkdirSync(PASTA_DADOS, { recursive: true })
  writeFileSync(ARQ_PAINEL, html(JSON.stringify(dados).replace(/</g, "\\u003c")))
  return ARQ_PAINEL
}

function html(json) {
  return `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Prospector de Clientes</title>
<style>
:root{--bg:#f6f6f4;--card:#fff;--tx:#1b1b1b;--mut:#6b6b6b;--bd:#e3e3df;--ac:#128c4a;--ac2:#0d6b38;--warn:#b85c00;--chip:#efefeb}
@media (prefers-color-scheme:dark){:root{--bg:#141414;--card:#1e1e1e;--tx:#ececec;--mut:#9a9a9a;--bd:#2e2e2e;--ac:#25d366;--ac2:#1fb457;--warn:#ffad5c;--chip:#2a2a2a}}
*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--tx);font:15px/1.45 system-ui,-apple-system,Segoe UI,Roboto,sans-serif}
header{position:sticky;top:0;z-index:2;background:var(--bg);border-bottom:1px solid var(--bd);padding:12px 16px}
h1{font-size:18px;margin:0 0 8px}
.stats{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:10px}
.stat{background:var(--card);border:1px solid var(--bd);border-radius:10px;padding:6px 10px;font-size:13px}
.stat b{font-size:16px;margin-right:4px}
.filtros{display:flex;gap:8px;flex-wrap:wrap}
select,input[type=search],textarea{font:inherit;color:var(--tx);background:var(--card);border:1px solid var(--bd);border-radius:8px;padding:6px 8px}
input[type=search]{flex:1;min-width:160px}
main{max-width:860px;margin:0 auto;padding:16px;display:grid;gap:12px}
.card{background:var(--card);border:1px solid var(--bd);border-radius:12px;padding:14px}
.topo{display:flex;justify-content:space-between;gap:8px;align-items:flex-start;flex-wrap:wrap}
.nome{font-weight:650;font-size:16px}
.meta{color:var(--mut);font-size:13px}
.chips{display:flex;gap:6px;flex-wrap:wrap;margin:6px 0}
.chip{background:var(--chip);border-radius:999px;padding:2px 8px;font-size:12px}
.chip.alerta{color:var(--warn)}
a.chip{color:inherit}
textarea{width:100%;min-height:120px;margin:8px 0;resize:vertical}
.acoes{display:flex;gap:8px;flex-wrap:wrap;align-items:center}
button,.btn{font:inherit;border:1px solid var(--bd);background:var(--card);color:var(--tx);border-radius:8px;padding:7px 12px;cursor:pointer;text-decoration:none}
.wa{background:var(--ac);border-color:var(--ac);color:#fff;font-weight:600}.wa:hover{background:var(--ac2)}
.aviso{background:var(--card);border:1px solid var(--warn);color:var(--warn);border-radius:10px;padding:8px 12px;font-size:13px;margin-top:8px}
.vazio{color:var(--mut);text-align:center;padding:40px 0}
footer{max-width:860px;margin:0 auto;padding:0 16px 32px;display:flex;gap:8px;flex-wrap:wrap}
</style>
</head>
<body>
<header>
  <h1>Prospector de Clientes</h1>
  <div class="stats" id="stats"></div>
  <div class="filtros">
    <select id="fStatus">
      <option value="fila">Para enviar hoje</option>
      <option value="followup">Precisa de follow-up</option>
      <option value="novo">Novos</option>
      <option value="enviado">Enviados (aguardando)</option>
      <option value="respondeu">Responderam</option>
      <option value="interessado">Interessados</option>
      <option value="fechado">Fechados</option>
      <option value="sem_interesse">Sem interesse</option>
      <option value="todos">Todos</option>
    </select>
    <select id="fNicho"><option value="">Todos os nichos</option></select>
    <input type="search" id="fBusca" placeholder="Buscar por nome ou endereço">
  </div>
  <div id="avisoLimite"></div>
</header>
<main id="lista"></main>
<footer>
  <button id="exportar">Exportar planilha (CSV)</button>
  <button id="backup">Baixar backup do andamento</button>
  <label class="btn">Restaurar backup<input type="file" id="restaurar" accept=".json" hidden></label>
</footer>
<script>
const D = ${json};
const CHAVE = "prospector-andamento";
const STATUS = {novo:"Novo",enviado:"Enviado",respondeu:"Respondeu",interessado:"Interessado",fechado:"Fechado ✅",sem_interesse:"Sem interesse"};
let andamento = {};
try { andamento = JSON.parse(localStorage.getItem(CHAVE) || "{}"); } catch {}
const salvar = () => { try { localStorage.setItem(CHAVE, JSON.stringify(andamento)); } catch {} };
const st = (id) => andamento[id] || (andamento[id] = { status: "novo" });
const hoje = () => new Date().toISOString().slice(0, 10);
const dias = (iso) => (Date.now() - new Date(iso).getTime()) / 864e5;
const precisaFollowUp = (a) => a.status === "enviado" && a.enviadoEm && !a.followupEm && dias(a.enviadoEm) >= D.diasParaFollowUp;
const enviadosHoje = () => Object.values(andamento).reduce((n, a) =>
  n + (a.enviadoEm?.slice(0,10) === hoje() ? 1 : 0) + (a.followupEm?.slice(0,10) === hoje() ? 1 : 0), 0);
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));

const nichos = [...new Set(D.leads.map((l) => l.nicho).filter(Boolean))].sort();
fNicho.innerHTML += nichos.map((n) => '<option>' + esc(n) + '</option>').join("");

function filtrados() {
  const s = fStatus.value, n = fNicho.value, q = fBusca.value.trim().toLowerCase();
  return D.leads.filter((l) => {
    const a = st(l.id);
    if (n && l.nicho !== n) return false;
    if (q && !(l.nome + " " + l.endereco).toLowerCase().includes(q)) return false;
    if (s === "todos") return true;
    if (s === "fila") return a.status === "novo" || precisaFollowUp(a);
    if (s === "followup") return precisaFollowUp(a);
    return a.status === s;
  }).sort((x, y) => (y.avaliacoes || 0) - (x.avaliacoes || 0));
}

function render() {
  const todos = D.leads.map((l) => st(l.id));
  const conta = (f) => todos.filter(f).length;
  const env = enviadosHoje();
  stats.innerHTML = [
    [D.leads.length, "leads"], [conta((a) => a.status === "novo"), "novos"],
    [conta((a) => a.status !== "novo"), "contatados"], [conta((a) => ["respondeu","interessado","fechado"].includes(a.status)), "responderam"],
    [conta((a) => a.status === "fechado"), "fechados"], [env + "/" + D.limiteDiario, "enviadas hoje"],
  ].map(([v, t]) => '<div class="stat"><b>' + v + '</b>' + t + '</div>').join("");
  avisoLimite.innerHTML = env >= D.limiteDiario
    ? '<div class="aviso">Você chegou ao limite diário de ' + D.limiteDiario + ' mensagens. Mandar muitas mensagens para quem não tem seu número salvo faz o WhatsApp bloquear sua conta. Continue amanhã.</div>' : "";

  const itens = filtrados().slice(0, 200);
  if (!itens.length) { lista.innerHTML = '<div class="vazio">Nada por aqui. Troque o filtro ou busque mais leads.</div>'; return; }
  lista.innerHTML = itens.map((l) => {
    const a = st(l.id), fu = precisaFollowUp(a);
    const texto = a.texto ?? (fu ? l.mensagens.followup : l.mensagens.inicial);
    return '<article class="card" data-id="' + esc(l.id) + '">' +
      '<div class="topo"><div><div class="nome">' + esc(l.nome) + '</div>' +
      '<div class="meta">' + esc(l.telefone) + ' · ' + esc(l.endereco) + '</div></div>' +
      '<select class="status">' + Object.entries(STATUS).map(([k, v]) => '<option value="' + k + '"' + (a.status === k ? " selected" : "") + '>' + v + '</option>').join("") + '</select></div>' +
      '<div class="chips">' +
        (l.nicho ? '<span class="chip">' + esc(l.nicho) + '</span>' : "") +
        (l.nota ? '<span class="chip">★ ' + l.nota + ' (' + l.avaliacoes + ')</span>' : "") +
        '<span class="chip">' + (l.situacaoSite === "so_rede_social" ? "Só rede social" : "Sem site") + '</span>' +
        (l.tipoTelefone !== "celular" ? '<span class="chip alerta">Telefone fixo: talvez não tenha WhatsApp</span>' : "") +
        (fu ? '<span class="chip alerta">Follow-up</span>' : "") +
        (a.enviadoEm ? '<span class="chip">Enviado em ' + new Date(a.enviadoEm).toLocaleDateString("pt-BR") + '</span>' : "") +
        (l.maps ? '<a class="chip" href="' + esc(l.maps) + '" target="_blank" rel="noopener">Ver no Maps</a>' : "") +
        (l.site ? '<a class="chip" href="' + esc(l.site) + '" target="_blank" rel="noopener">Rede social</a>' : "") +
      '</div>' +
      '<textarea class="texto">' + esc(texto) + '</textarea>' +
      '<div class="acoes"><button class="wa enviar">' + (fu ? "Enviar follow-up no WhatsApp" : "Abrir no WhatsApp") + '</button>' +
      '<input class="obs" placeholder="Anotação (ex: falar com o dono à tarde)" value="' + esc(a.obs) + '" style="flex:1;min-width:160px;font:inherit;padding:7px 8px;border:1px solid var(--bd);border-radius:8px;background:var(--card);color:var(--tx)"></div>' +
      '</article>';
  }).join("");
}

lista.addEventListener("click", (e) => {
  if (!e.target.classList.contains("enviar")) return;
  const card = e.target.closest(".card"), id = card.dataset.id;
  const lead = D.leads.find((l) => l.id === id), a = st(id);
  if (enviadosHoje() >= D.limiteDiario && !confirm("Você já passou do limite diário. Enviar mesmo assim aumenta o risco de bloqueio do seu WhatsApp. Continuar?")) return;
  const texto = card.querySelector(".texto").value;
  window.open("https://wa.me/" + lead.whatsapp + "?text=" + encodeURIComponent(texto), "_blank", "noopener");
  if (precisaFollowUp(a)) a.followupEm = new Date().toISOString();
  else { a.status = "enviado"; a.enviadoEm = new Date().toISOString(); }
  delete a.texto;
  salvar(); render();
});
lista.addEventListener("change", (e) => {
  const id = e.target.closest(".card")?.dataset.id; if (!id) return;
  const a = st(id);
  if (e.target.classList.contains("status")) { a.status = e.target.value; if (a.status === "enviado" && !a.enviadoEm) a.enviadoEm = new Date().toISOString(); salvar(); render(); }
  if (e.target.classList.contains("obs")) { a.obs = e.target.value; salvar(); }
  if (e.target.classList.contains("texto")) { a.texto = e.target.value; salvar(); }
});
[fStatus, fNicho].forEach((el) => el.addEventListener("change", render));
fBusca.addEventListener("input", render);

function baixar(nome, conteudo, tipo) {
  const url = URL.createObjectURL(new Blob([conteudo], { type: tipo }));
  Object.assign(document.createElement("a"), { href: url, download: nome }).click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
exportar.onclick = () => {
  const cols = ["nome","telefone","nicho","cidade","endereco","situacao","status","enviadoEm","followupEm","obs","maps"];
  const c = (v) => { const s = v == null ? "" : String(v); return /[",;\\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s; };
  const linhas = D.leads.map((l) => { const a = st(l.id); return [l.nome,l.telefone,l.nicho,l.cidade,l.endereco,l.situacaoSite,STATUS[a.status],a.enviadoEm,a.followupEm,a.obs,l.maps].map(c).join(","); });
  baixar("leads-" + hoje() + ".csv", "\\ufeff" + [cols.join(","), ...linhas].join("\\n"), "text/csv");
};
backup.onclick = () => baixar("andamento-" + hoje() + ".json", JSON.stringify(andamento, null, 2), "application/json");
restaurar.onchange = async (e) => {
  const f = e.target.files[0]; if (!f) return;
  try { andamento = { ...andamento, ...JSON.parse(await f.text()) }; salvar(); render(); alert("Backup restaurado."); }
  catch { alert("Arquivo inválido."); }
};
render();
</script>
</body>
</html>
`
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  console.log(`✔ Painel gerado: ${gerarPainel()}`)
}
