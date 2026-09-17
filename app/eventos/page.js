import { getDados, campo, campoObs, campoJSON } from "../../lib/sheets";

const CATEGORIA_LABEL = {
  mao_de_obra_cache: "Mão de obra / Cachê",
  fornecedores: "Fornecedores",
  compra_material: "Compra de material",
  reembolso: "Reembolso",
};

function formatBRL(valor) {
  const n = Number(String(valor).replace(",", "."));
  if (!valor || Number.isNaN(n)) return valor || "—";
  return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function saudeChip(saude) {
  if (saude === "critico") return <span className="chip bad">Critico</span>;
  if (saude === "atencao") return <span className="chip warn">Atencao</span>;
  if (saude === "saudavel") return <span className="chip good">Saudavel</span>;
  return null;
}

function badgeList(badges) {
  if (!badges || badges.length === 0) return null;
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginTop: "4px" }}>
      {badges.map((b, i) => (
        <span className="chip warn" key={i}>
          {b}
        </span>
      ))}
    </div>
  );
}

function categoriasList(categorias) {
  const entries = Object.entries(categorias || {}).filter(([, v]) => v);
  if (entries.length === 0) {
    return (
      <tr>
        <td colSpan={2} style={{ color: "var(--ink-muted)" }}>
          Sem detalhamento de custos por categoria.
        </td>
      </tr>
    );
  }
  return entries.map(([chave, valor]) => (
    <tr key={chave}>
      <td>{CATEGORIA_LABEL[chave] || chave}</td>
      <td className="num mono">{valor}</td>
    </tr>
  ));
}

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
      <div className="section-title">
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

      <div className="section-title">
        <h2>Em andamento</h2>
      </div>
      {andamento.length === 0 ? (
        <div className="callout">Nenhum evento em andamento no momento.</div>
      ) : (
        <div className="panel">
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Evento</th>
                  <th className="num">Fat. bruto</th>
                  <th className="num">Custo total</th>
                  <th className="num">Margem</th>
                  <th className="num">Margem %</th>
                  <th>Saude</th>
                </tr>
              </thead>
              <tbody>
                {andamento.map((e, i) => (
                  <tr key={i}>
                    <td>
                      {e.nome || "—"}
                      {badgeList(e.badges)}
                    </td>
                    <td className="num mono">{e.faturamento_bruto || "—"}</td>
                    <td className="num mono">{e.custo_total || "—"}</td>
                    <td className="num mono">{e.margem_valor || "—"}</td>
                    <td className="num mono">{e.margem_percentual || "—"}</td>
                    <td>{saudeChip(e.saude)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {semFaturamento.length > 0 ? (
        <div className="callout" style={{ marginTop: "12px" }}>
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

      <div className="section-title">
        <h2>Ja realizados</h2>
      </div>
      {realizados.length === 0 ? (
        <div className="callout">Nenhum evento realizado listado.</div>
      ) : (
        <div className="panel">
          {realizados.map((e, i) => (
            <details key={i} style={{ borderBottom: i < realizados.length - 1 ? "1px solid var(--rule)" : "none", paddingBlock: "10px" }}>
              <summary style={{ cursor: "pointer", display: "flex", justifyContent: "space-between", gap: "12px", flexWrap: "wrap" }}>
                <span>{e.nome || "—"}</span>
                <span style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                  <span className="mono">{e.margem_valor || "—"} ({e.margem_percentual || "—"})</span>
                  {saudeChip(e.saude)}
                </span>
              </summary>
              <div style={{ paddingTop: "12px" }}>
                {badgeList(e.badges)}
                <table>
                  <thead>
                    <tr>
                      <th>Categoria</th>
                      <th className="num">Custo</th>
                    </tr>
                  </thead>
                  <tbody>{categoriasList(e.categorias)}</tbody>
                </table>
              </div>
            </details>
          ))}
        </div>
      )}

      <div className="section-title">
        <h2>Eventos criticos</h2>
      </div>
      {criticos.length === 0 ? (
        <div className="callout">Nenhum evento critico no momento.</div>
      ) : (
        criticos.map((e, i) => (
          <div className="callout warn" key={i} style={{ marginBottom: "10px" }}>
            <strong>{e.nome || "Evento"}</strong> — situação critica identificada (custo acima do limite saudável em relação ao faturamento).
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
