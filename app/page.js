import { getDados, campo, campoJSON, campoContagem } from "../lib/sheets";
import { IconWallet, IconStack, IconChart, IconCalendar, IconClock, IconInfo, IconTrend } from "./icons";

function formatBRL(valor) {
  const n = Number(String(valor).replace(",", "."));
  if (valor === "" || valor === undefined || valor === null || Number.isNaN(n)) return valor || "—";
  return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function isNum(valor) {
  return valor !== "" && valor !== undefined && valor !== null && !Number.isNaN(Number(String(valor).replace(",", ".")));
}

function toNum(valor) {
  return isNum(valor) ? Number(String(valor).replace(",", ".")) : null;
}

function formatBRLSigned(n) {
  if (n === null) return "—";
  const abs = Math.abs(n).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  if (n > 0) return `+ ${abs}`;
  if (n < 0) return `− ${abs}`;
  return abs;
}

export const revalidate = 60;

export default async function HomePage() {
  let dados = null;
  let erro = null;
  try {
    dados = await getDados();
  } catch (e) {
    erro = e?.message || String(e);
  }

  if (erro) {
    return (
      <div>
        <div className="section-title">
          <h2>Painel geral</h2>
        </div>
        <div className="callout warn">
          <strong>Erro ao ler a planilha-ponte:</strong> {erro}
        </div>
      </div>
    );
  }

  // --- Saldo em caixa ---
  const saldoItau = campo(dados, "home.saldo_itau");
  const saldoInter = campo(dados, "home.saldo_inter");
  const saldoItauAt = campo(dados, "home.saldo_itau_atualizado_em");
  const saldoInterAt = campo(dados, "home.saldo_inter_atualizado_em");
  const saldoCora = campo(dados, "home.saldo_cora");
  const saldoContaSimples = campo(dados, "home.saldo_conta_simples");
  const num = (v) => (isNum(v) ? Number(String(v).replace(",", ".")) : 0);
  const semSaldo = !isNum(saldoItau) && !isNum(saldoInter);
  const saldoTotal = num(saldoItau) + num(saldoInter) + num(saldoCora) + num(saldoContaSimples);

  // --- Intercompany ATOM x Showdesign ---
  // + = ATOM deve a Showdesign | − = Showdesign deve a ATOM. Sem dado na planilha-ponte, mostra "—".
  const icAtomDeve = toNum(campo(dados, "home.intercompany_atom_deve"));
  const icSdnDeve = toNum(campo(dados, "home.intercompany_sdn_deve"));
  const icSaldo = toNum(campo(dados, "home.intercompany_saldo"));
  const icAtualizadoEm = campo(dados, "home.intercompany_atualizado_em");
  const icSemDados = icAtomDeve === null && icSdnDeve === null && icSaldo === null;
  const icSaldoClasse = icSaldo === null || icSaldo === 0 ? "" : icSaldo > 0 ? "good" : "bad";

  // --- Diario ---
  const diarioTotalHoje = campo(dados, "diario.total_hoje");
  const diarioConciliados = campoContagem(dados, "diario.conciliados_hoje");
  const diarioNaoConciliados = campoContagem(dados, "diario.nao_conciliados_hoje");
  const diarioAtualizadoEm = campo(dados, "diario.atualizado_em");
  const diarioAlertas = campoJSON(dados, "diario.alerta_critico", []);

  // --- Eventos ---
  const margemValor = campo(dados, "eventos.margem_media_mes_valor"); // percentual (ex "69.2"), nao moeda
  const margemNota = campo(dados, "eventos.margem_media_mes_nota");
  const ranking = campoJSON(dados, "eventos.ranking", []);
  const andamentoCount = ranking.filter((e) => e.momento === "andamento").length;
  const eventosCriticos = campoJSON(dados, "eventos.criticos", []);
  const eventosSemFaturamento = campoJSON(dados, "eventos.sem_faturamento", []);
  const eventosAtualizadoEm = campo(dados, "eventos.atualizado_em");

  // --- Semanal ---
  const semanaPeriodo = campo(dados, "semana.periodo");
  const entradas = campo(dados, "semana.entradas_projetadas");
  const saidas = campo(dados, "semana.saidas_projetadas");
  const resultado = campo(dados, "semana.resultado_liquido_projetado");
  const semanaAtualizadoEm = campo(dados, "semana.atualizado_em");
  const semSemana = !semanaPeriodo && !entradas && !saidas && !resultado;

  // --- Alertas consolidados de todas as areas ---
  const alertasHome = campoJSON(dados, "home.alertas_eventos", [])
    .filter((a) => a.nivel !== "neutral")
    .map((a) => ({
      origem: "Eventos",
      titulo: a.titulo || "Evento",
      detalhe: a.texto || "",
      valor: null,
    }));
  const alertasDiario = diarioAlertas.map((a) => ({
    origem: "Diário",
    titulo: a.evento || "Recebimento",
    detalhe: [a.cliente, a.data_prevista ? `previsto para ${a.data_prevista}` : null].filter(Boolean).join(" — "),
    valor: a.valor,
  }));
  const alertasCriticos = eventosCriticos.map((a) => ({
    origem: "Eventos",
    titulo: a.nome || "Evento",
    detalhe: "Situação crítica (custo acima do limite saudável em relação ao faturamento) — ver Eventos para detalhes.",
    valor: null,
  }));
  const alertas = [...alertasHome, ...alertasDiario, ...alertasCriticos];

  return (
    <div>
      <div className="page-eyebrow">
        <span className="dot" /> Financeiro Showdesign <span className="sep">·</span> Painel geral
      </div>
      <div className="page-head">
        <h1 className="page-title">Painel geral</h1>
        <p className="page-sub">
          Caixa, alertas do dia e o resumo de cada área — Diário, Eventos e Semanal — tudo numa tela só.
        </p>
      </div>

      <div className="section-title">
        <h2>Posição de caixa</h2>
        {!semSaldo ? <span className="section-hint">4 contas</span> : null}
      </div>

      {semSaldo ? (
        <div className="callout">Ainda sem dados de saldo. A rotina de saldo em caixa ainda nao rodou.</div>
      ) : (
        <div className="hero-grid">
          <div className="hero-card primary accent">
            <div className="hero-top">
              <span className="hero-label">Total em caixa</span>
              <span className="hero-icon">
                <IconStack />
              </span>
            </div>
            <span className="hero-value mono">{formatBRL(saldoTotal)}</span>
            <span className="hero-sub">Itaú + Inter + Cora + Conta Simples</span>
          </div>

          <div className="hero-card">
            <div className="hero-top">
              <span className="hero-label">Saldo Itaú</span>
              <span className="hero-icon">
                <IconWallet />
              </span>
            </div>
            <span className="hero-value mono">{formatBRL(saldoItau)}</span>
            <span className="hero-sub">Atualizado {saldoItauAt || "—"}</span>
          </div>

          <div className="hero-card">
            <div className="hero-top">
              <span className="hero-label">Saldo Inter</span>
              <span className="hero-icon">
                <IconWallet />
              </span>
            </div>
            <span className="hero-value mono">{formatBRL(saldoInter)}</span>
            <span className="hero-sub">Atualizado {saldoInterAt || "—"}</span>
          </div>

          <div className="hero-card">
            <div className="hero-top">
              <span className="hero-label">Saldo Cora</span>
              <span className="hero-icon">
                <IconWallet />
              </span>
            </div>
            <span className="hero-value mono">{formatBRL(saldoCora)}</span>
            <span className="hero-sub">Manual (extrato)</span>
          </div>

          <div className="hero-card">
            <div className="hero-top">
              <span className="hero-label">Saldo Conta Simples</span>
              <span className="hero-icon">
                <IconWallet />
              </span>
            </div>
            <span className="hero-value mono">{formatBRL(saldoContaSimples)}</span>
            <span className="hero-sub">Manual (informado)</span>
          </div>

          <div className="hero-card">
            <div className="hero-top">
              <span className="hero-label">Margem média do mês</span>
              <span className="hero-icon">
                <IconChart />
              </span>
            </div>
            <span className="hero-value mono">{margemValor ? `${margemValor}%` : "—"}</span>
            <span className="hero-sub">{margemNota || "Sem nota registrada"}</span>
          </div>
        </div>
      )}

      <div className="section-title">
        <h2>Intercompany ATOM × Showdesign</h2>
        <span className="section-hint">extrato do Log Intercompany · atualizado todo dia às 22h</span>
      </div>

      <div className="hero-grid">
        <div className="hero-card">
          <div className="hero-top">
            <span className="hero-label">ATOM deve à Showdesign</span>
            <span className="hero-icon">
              <IconTrend />
            </span>
          </div>
          <span className="hero-value mono">{icAtomDeve === null ? "—" : formatBRL(icAtomDeve)}</span>
          <span className="hero-sub">soma dos lançamentos positivos (+)</span>
        </div>

        <div className="hero-card">
          <div className="hero-top">
            <span className="hero-label">Showdesign deve à ATOM</span>
            <span className="hero-icon">
              <IconWallet />
            </span>
          </div>
          <span className="hero-value mono">{icSdnDeve === null ? "—" : formatBRLSigned(icSdnDeve === 0 ? 0 : -Math.abs(icSdnDeve))}</span>
          <span className="hero-sub">soma dos lançamentos negativos (−)</span>
        </div>

        <div className="hero-card accent">
          <div className="hero-top">
            <span className="hero-label">Saldo líquido</span>
            <span className="hero-icon">
              <IconStack />
            </span>
          </div>
          <span className={`hero-value mono ${icSaldoClasse}`} style={icSaldoClasse ? { color: `var(--${icSaldoClasse})` } : undefined}>
            {icSaldo === null ? "—" : formatBRLSigned(icSaldo)}
          </span>
          <span className="hero-sub">
            {icSemDados
              ? "Ainda sem execução da tarefa Intercompany com este painel."
              : `Atualizado ${icAtualizadoEm || "—"}`}
          </span>
        </div>
      </div>

      <div className="callout" style={{ marginBottom: "28px" }}>
        <strong>+</strong> a ATOM passa a dever à Showdesign (entrou na conta da ATOM dinheiro que é dela, ou a
        Showdesign pagou algo da ATOM). <strong>−</strong> a Showdesign passa a dever à ATOM (a ATOM pagou algo dela,
        ou entrou na conta da Showdesign dinheiro que é da ATOM).
      </div>

      <div className="section-title">
        <h2>Alertas</h2>
        <span className="section-hint">conciliação e saúde dos eventos</span>
      </div>

      {alertas.length === 0 ? (
        <div className="info-feed">
          <div className="info-row">
            <span className="ico">
              <IconInfo />
            </span>
            <div className="body">Nenhuma pendência crítica sinalizada na última execução.</div>
          </div>
        </div>
      ) : (
        <div className="info-feed">
          {alertas.map((a, i) => (
            <div className="info-row" key={i}>
              <span className="ico">
                <IconInfo />
              </span>
              <div className="body">
                <strong>{a.titulo}</strong>
                {a.detalhe ? ` — ${a.detalhe}` : ""}
                {a.valor ? <span className="mono" style={{ marginLeft: "8px" }}>{formatBRL(a.valor)}</span> : null}
                <span
                  className="mono"
                  style={{ marginLeft: "8px", fontSize: "10.5px", color: "var(--ink-faint)", textTransform: "uppercase" }}
                >
                  {a.origem}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="section-title">
        <h2>Resumo rápido</h2>
        <span className="section-hint">detalhe completo em Diário, Eventos e Semanal</span>
      </div>

      <div className="area-grid">
        <div className="area-card">
          <div className="area-card-head">
            <h3>
              <span className="hero-icon">
                <IconClock />
              </span>
              Diário
            </h3>
            <a href="/diario">ver detalhes →</a>
          </div>
          <div className="area-stats">
            <div className="mini-stat">
              <span className="n mono">{diarioTotalHoje || "—"}</span>
              <span className="l">Total hoje</span>
            </div>
            <div className="mini-stat">
              <span className="n mono">{diarioConciliados ?? "—"}</span>
              <span className="l">Conciliados</span>
            </div>
            <div className="mini-stat">
              <span className="n mono">{diarioNaoConciliados ?? "—"}</span>
              <span className="l">Não conciliados</span>
            </div>
          </div>
          <span className="area-foot">Atualizado {diarioAtualizadoEm || "—"}</span>
        </div>

        <div className="area-card">
          <div
