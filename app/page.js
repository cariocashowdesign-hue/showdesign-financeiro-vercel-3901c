import { getDados, campo, campoJSON, campoContagem } from "../lib/sheets";
import { IconWallet, IconStack, IconChart, IconCalendar, IconClock, IconAlert, IconTrend } from "./icons";

function formatBRL(valor) {
  const n = Number(String(valor).replace(",", "."));
  if (valor === "" || valor === undefined || valor === null || Number.isNaN(n)) return valor || "—";
  return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function isNum(valor) {
  return valor !== "" && valor !== undefined && valor !== null && !Number.isNaN(Number(String(valor).replace(",", ".")));
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
          <h2>Resumo executivo</h2>
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
  const semSaldo = !isNum(saldoItau) && !isNum(saldoInter);
  const saldoTotal = (isNum(saldoItau) ? Number(String(saldoItau).replace(",", ".")) : 0) +
    (isNum(saldoInter) ? Number(String(saldoInter).replace(",", ".")) : 0);

  // --- Diario ---
  const diarioTotalHoje = campo(dados, "diario.total_hoje");
  const diarioConciliados = campoContagem(dados, "diario.conciliados_hoje");
  const diarioNaoConciliados = campoContagem(dados, "diario.nao_conciliados_hoje");
  const diarioAtualizadoEm = campo(dados, "diario.atualizado_em");
  const diarioAlertas = campoJSON(dados, "diario.alerta_critico", []);

  // --- Eventos ---
  const margemValor = campo(dados, "eventos.margem_media_mes_valor");
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
  const alertasHome = campoJSON(dados, "home.alertas_eventos", []).map((a) => ({
    origem: "Eventos",
    titulo: a.evento || "Evento",
    detalhe: [a.cliente, a.motivo].filter(Boolean).join(" — "),
    valor: a.valor,
  }));
  const alertasDiario = diarioAlertas.map((a) => ({
    origem: "Diário",
    titulo: a.evento || "Recebimento",
    detalhe: [a.cliente, a.data_prevista ? `previsto para ${a.data_prevista}` : null].filter(Boolean).join(" — "),
    valor: a.valor,
  }));
  const alertasCriticos = eventosCriticos.map((a) => ({
    origem: "Eventos",
    titulo: a.evento || "Evento",
    detalhe: [a.cliente, a.motivo].filter(Boolean).join(" — "),
    valor: a.valor,
  }));
  const alertas = [...alertasHome, ...alertasDiario, ...alertasCriticos];

  return (
    <div>
      <div className="section-title">
        <h2>Resumo executivo</h2>
      </div>

      {semSaldo ? (
        <div className="callout">Ainda sem dados de saldo. A rotina de saldo em caixa ainda nao rodou.</div>
      ) : (
        <div className="hero-grid">
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

          <div className="hero-card accent">
            <div className="hero-top">
              <span className="hero-label">Saldo Total (Itaú + Inter)</span>
              <span className="hero-icon">
                <IconStack />
              </span>
            </div>
            <span className="hero-value mono">{formatBRL(saldoTotal)}</span>
            <span className="hero-sub">Soma dos dois bancos</span>
          </div>

          <div className="hero-card">
            <div className="hero-top">
              <span className="hero-label">Margem média do mês</span>
              <span className="hero-icon">
                <IconChart />
              </span>
            </div>
            <span className="hero-value mono">{margemValor ? formatBRL(margemValor) : "—"}</span>
            <span className="hero-sub">{margemNota || "Sem nota registrada"}</span>
          </div>
        </div>
      )}

      <div className="section-title">
        <h2>Por área</h2>
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
          <div className="area-card-head">
            <h3>
              <span className="hero-icon">
                <IconCalendar />
              </span>
              Eventos
            </h3>
            <a href="/eventos">ver detalhes →</a>
          </div>
          <div className="area-stats">
            <div className="mini-stat">
              <span className="n mono">{andamentoCount}</span>
              <span className="l">Em andamento</span>
            </div>
            <div className="mini-stat">
              <span className="n mono">{eventosCriticos.length}</span>
              <span className="l">Críticos</span>
            </div>
            <div className="mini-stat">
              <span className="n mono">{eventosSemFaturamento.length}</span>
              <span className="l">Sem faturamento</span>
            </div>
          </div>
          <span className="area-foot">Atualizado {eventosAtualizadoEm || "—"}</span>
        </div>

        <div className="area-card">
          <div className="area-card-head">
            <h3>
              <span className="hero-icon">
                <IconTrend />
              </span>
              Semanal
            </h3>
            <a href="/semanal">ver detalhes →</a>
          </div>
          {semSemana ? (
            <div className="callout" style={{ margin: 0 }}>
              Ainda sem dados semanais.
            </div>
          ) : (
            <div className="area-stats">
              <div className="mini-stat">
                <span className="n mono">{formatBRL(entradas)}</span>
                <span className="l">Entradas proj.</span>
              </div>
              <div className="mini-stat">
                <span className="n mono">{formatBRL(saidas)}</span>
                <span className="l">Saídas proj.</span>
              </div>
              <div className="mini-stat">
                <span className="n mono">{formatBRL(resultado)}</span>
                <span className="l">Resultado líq.</span>
              </div>
            </div>
          )}
          <span className="area-foot">
            {semanaPeriodo ? `Período ${semanaPeriodo}` : "Atualizado"} {semanaAtualizadoEm || ""}
          </span>
        </div>
      </div>

      <div className="section-title">
        <h2>Alertas</h2>
      </div>

      {alertas.length === 0 ? (
        <div className="callout">Nenhum alerta crítico no momento.</div>
      ) : (
        <div className="alert-feed">
          {alertas.map((a, i) => (
            <div className="alert-row" key={i}>
              <span className="hero-icon" style={{ color: "var(--warn)", background: "var(--warn-wash)" }}>
                <IconAlert />
              </span>
              <div className="alert-body">
                <span className="alert-title">
                  <strong>{a.titulo}</strong>
                  {a.detalhe ? ` — ${a.detalhe}` : ""}
                </span>
                {a.valor ? <span className="alert-meta mono">{formatBRL(a.valor)}</span> : null}
              </div>
              <span className="alert-origin">{a.origem}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
