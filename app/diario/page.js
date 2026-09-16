import { getDados, campo, campoJSON, campoContagem } from "../../lib/sheets";

function formatBRL(valor) {
  const n = Number(String(valor).replace(",", "."));
  if (!valor || Number.isNaN(n)) return valor || "—";
  return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export const revalidate = 60;

export default async function DiarioPage() {
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
          <h2>Conciliacao diaria</h2>
        </div>
        <div className="callout warn">
          <strong>Erro ao ler a planilha-ponte:</strong> {erro}
        </div>
      </div>
    );
  }

  const totalHoje = campo(dados, "diario.total_hoje");
  const conciliadosHoje = campoContagem(dados, "diario.conciliados_hoje");
  const naoConciliadosHoje = campoContagem(dados, "diario.nao_conciliados_hoje");
  const recebimentosConciliados = campoJSON(dados, "diario.recebimentos_conciliados", []);
  const alertaCritico = campoJSON(dados, "diario.alerta_critico", []);
  const atualizadoEm = campo(dados, "diario.atualizado_em");

  const semDados = !totalHoje && !conciliadosHoje && !naoConciliadosHoje;

  return (
    <div>
      <div className="section-title">
        <h2>Conciliacao diaria</h2>
      </div>

      {semDados ? (
        <div className="callout">
          Ainda sem dados de conciliacao diaria. A rotina ainda nao rodou ou
          nao gravou valores na planilha-ponte.
        </div>
      ) : (
        <>
          <div className="kpi-grid">
            <div className="kpi">
              <span className="label">Total hoje</span>
              <span className="value mono">{totalHoje}</span>
            </div>
            <div className="kpi">
              <span className="label">Conciliados hoje</span>
              <span className="value mono">{conciliadosHoje ?? "—"}</span>
            </div>
            <div className="kpi">
              <span className="label">Nao conciliados hoje</span>
              <span className="value mono">{naoConciliadosHoje ?? "—"}</span>
            </div>
          </div>
          <div className="callout">
            <strong>Atualizado em:</strong> {atualizadoEm || "—"}
          </div>
        </>
      )}

      <div className="section-title">
        <h2>Recebimentos conciliados</h2>
      </div>
      {recebimentosConciliados.length === 0 ? (
        <div className="callout">Nenhum recebimento conciliado listado.</div>
      ) : (
        <div className="panel">
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Evento</th>
                  <th>Cliente</th>
                  <th className="num">Valor</th>
                  <th>Data</th>
                </tr>
              </thead>
              <tbody>
                {recebimentosConciliados.map((r, i) => (
                  <tr key={i}>
                    <td>{r.evento || "—"}</td>
                    <td>{r.cliente || "—"}</td>
                    <td className="num mono">{formatBRL(r.valor)}</td>
                    <td className="mono">{r.data || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="section-title">
        <h2>Alertas criticos</h2>
      </div>
      {alertaCritico.length === 0 ? (
        <div className="callout">Nenhum alerta critico no momento.</div>
      ) : (
        alertaCritico.map((a, i) => (
          <div className="callout warn" key={i} style={{ marginBottom: "10px" }}>
            <strong>{a.evento || "Evento"}</strong>
            {a.cliente ? <> — {a.cliente}</> : null}
            {a.valor ? <div className="mono">{formatBRL(a.valor)}</div> : null}
            {a.data_prevista ? <div>Previsto para: {a.data_prevista}</div> : null}
          </div>
        ))
      )}
    </div>
  );
}
