import { getDados, campo, campoObs, campoJSON } from "../../lib/sheets";
import EventExplorer from "./EventExplorer";

export const revalidate = 60;

export default async function EventosPage() {
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
          <h2>Margem por evento</h2>
        </div>
        <div className="callout warn">
          <strong>Erro ao ler a planilha-ponte:</strong> {erro}
        </div>
      </div>
    );
  }

  const proximos = campoJSON(dados, "eventos.proximos", []);
  const margemMediaValor = campo(dados, "eventos.margem_media_mes_valor");
  const margemMediaNota = campo(dados, "eventos.margem_media_mes_nota");
  const ranking = campoJSON(dados, "eventos.ranking", []);
  const destaques = campoJSON(dados, "eventos.destaques", {});
  const semFaturamento = campoJSON(dados, "eventos.sem_faturamento", []);
  const criticos = campoJSON(dados, "eventos.criticos", []);
  const escopoNota = campoObs(dados, "eventos.escopo_nota") || campo(dados, "eventos.escopo_nota");
  const atualizadoEm = campo(dados, "eventos.atualizado_em");

  const andamento = ranking.filter((e) => e.momento === "andamento");
  const realizados = ranking.filter((e) => e.momento === "realizado");

  const destaqueCards = [];
  if (destaques?.maior_margem_valor) {
    destaqueCards.push({
      label: "Maior margem (R$)",
      valor: `${destaques.maior_margem_valor.nome || "—"} — ${destaques.maior_margem_valor.valor || "—"}`,
    });
  }
  if (destaques?.maior_margem_percentual) {
    destaqueCards.push({
      label: "Maior margem (%)",
      valor: `${destaques.maior_margem_percentual.nome || "—"} — ${destaques.maior_margem_percentual.valor || "—"}`,
    });
  }
  if (destaques?.menor_margem) {
    destaqueCards.push({
      label: "Menor margem",
      valor: `${destaques.menor_margem.nome || "—"} — ${destaques.menor_margem.valor || "—"} (${destaques.menor_margem.percentual || "—"})`,
    });
  }

  return (
    <div>
      <div className="page-eyebrow">
        <span className="dot" /> Financeiro Showdesign <span className="sep">·</span> Eventos
      </div>
      <div className="page-head">        <h1 className="page-title">Relatório por evento — margem</h1>
        <p className="page-sub">Detalhamento de custo por categoria e margem, evento por evento.</p>
      </div>

      <div className="section-title">
        <h2>Evento em foco</h2>
        <span className="section-hint">clique num evento para ver o borderô com métricas</span>
      </div>
      <p style={{ color: "var(--ink-muted)", fontSize: "13px", marginTop: "-8px", marginBottom: "6px" }}>
        Composição de custo por categoria (mão de obra/cachê, fornecedores, compra de material, reembolso) e margem de cada evento.
        Dá pra abrir vários eventos ao mesmo tempo, pra comparar.
      </p>
      <EventExplorer andamento={andamento} realizados={realizados} />

      <div className="section-title" style={{ marginTop: "24px" }}>
        <h2>Proximos eventos</h2>
      </div>
      {proximos.length === 0 ? (
        <div className="callout">Nenhum evento contratado com execucao futura identificado nesta janela.</div>
      ) : (
        <div className="panel">
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Evento</th>
                  <th>Cliente</th>
                  <th>Data</th>
                  <th className="num">Valor fechado</th>
                </tr>
              </thead>
              <tbody>
                {proximos.map((e, i) => (
                  <tr key={i}>
                    <td>
                      {e.nome || "—"}
                      {e.sem_planilha_bordero ? (
                        <div style={{ fontSize: "0.75rem", color: "var(--ink-muted)" }}>planilha de Borderô ainda não criada</div>
                      ) : null}
                    </td>
                    <td>{e.cliente || "—"}</td>
                    <td className="mono">{e.data_evento || e.data_evento_nota || "—"}</td>
                    <td className="num mono">{e.valor_fechado || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="section-title">
        <h2>Margem media do mes</h2>
      </div>
      <div className="kpi-grid">
        <div className="kpi">
          <span className="label">Margem media (%)</span>
          <span className="value mono">{margemMediaValor ? `${margemMediaValor}%` : "—"}</span>
        </div>
        <div className="kpi">
          <span className="label">Contexto</span>
          <span className="value" style={{ fontSize: "0.95rem" }}>{margemMediaNota || "—"}</span>
        </div>
      </div>
      {semFaturamento.length > 0 ? (
        <div className="callout" style={{ marginTop: "16px" }}>
          <strong>Sem faturamento informado:</strong>
          <table style={{ marginTop: "8px" }}>
            <thead>
              <tr>
                <th>Evento</th>
                <th>Motivo</th>
              </tr>
            </thead>
            <tbody>
              {semFaturamento.map((e, i) => (
                <tr key={i}>
                  <td>{e.nome || "—"}</td>
                  <td>{e.motivo || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}

      <div className="section-title bad">
        <h2>Eventos criticos</h2>
      </div>
      {criticos.length === 0 ? (
        <div className="callout">Nenhum evento critico no momento.</div>
      ) : (
        criticos.map((e, i) => (
          <div className="callout warn" key={i} style={{ marginBottom: "10px" }}>
            <strong>{e.nome || "Evento"}</strong> — situação crítica identificada (custo acima do limite saudável em relação ao faturamento).
          </div>
        ))
      )}

      <div className="section-title">
        <h2>Destaques do mes</h2>
      </div>
      {destaqueCards.length === 0 ? (
        <div className="callout">Sem destaques no momento.</div>
      ) : (
        <div className="kpi-grid">
          {destaqueCards.map((d, i) => (
            <div className="kpi" key={i}>
              <span className="label">{d.label}</span>
              <span className="value" style={{ fontSize: "1.1rem" }}>{d.valor}</span>
            </div>
          ))}
        </div>
      )}

      {escopoNota ? (
        <div className="callout" style={{ marginTop: "16px" }}>
          <strong>Escopo:</strong> {escopoNota}
        </div>
      ) : null}

      <div className="callout" style={{ marginTop: "16px" }}>
        <strong>Atualizado em:</strong> {atualizadoEm || "—"}
      </div>
    </div>
  );
}
