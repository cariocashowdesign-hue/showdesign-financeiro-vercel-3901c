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

  const entradasHoje = campoJSON(dados, "diario_resumo.entradas_hoje", []);
  const entradasHojeTotal = campo(dados, "diario_resumo.entradas_hoje_total");
  const saidasHoje = campoJSON(dados, "diario_resumo.saidas_hoje", []);
  const saidasHojeTotal = campo(dados, "diario_resumo.saidas_hoje_total");
  const resumoAtualizadoEm = campo(dados, "diario_resumo.atualizado_em");
  const temResumoManha = entradasHoje.length > 0 || saidasHoje.length > 0 || resumoAtualizadoEm;

  const semDados = !totalHoje && !conciliadosHoje && !naoConciliadosHoje;

  return (
    <div>
      <div className="page-eyebrow">
        <span className="dot" /> Financeiro Showdesign <span className="sep">·</span> Diário
      </div>
      <div className="page-head">
        <h1 className="page-title">Resumo do dia</h1>
        <p className="page-sub">O que entrou e o que saiu hoje, e a conciliação bancária do dia.</p>
      </div>

      <div className="section-title good">
        <h2>Resumo de hoje</h2>
      </div>

      {!temResumoManha ? (
        <div className="callout">
          Ainda sem o resumo da manha. A rotina "Resumo Diario" roda todos os
          dias as 08:30 e ainda nao gravou valores na planilha-ponte.
        </div>
      ) : (
        <>
          <div className="kpi-grid">
            <div className="kpi">
              <span className="label">Entradas previstas hoje</span>
              <span className="value mono">{formatBRL(entradasHojeTotal)}</span>
            </div>
            <div className="kpi">
              <span className="label">Saidas previstas hoje</span>
              <span className="value mono">{formatBRL(saidasHojeTotal)}</span>
            </div>
          </div>

          <div className="panel" style={{ marginTop: "12px" }}>
            <div className="table-scroll">
              <table>
                <thead>
                  <tr>
                    <th>Entrada</th>
                    <th>Cliente</th>
                    <th className="num">Valor</th>
                  </tr>
                </thead>
                <tbody>
                  {entradasHoje.length === 0 ? (
                    <tr>
                      <td colSpan={3}>Nenhuma entrada prevista para hoje.</td>
                    </tr>
                  ) : (
                    entradasHoje.map((e, i) => (
                      <tr key={i}>
                        <td>{e.evento || "—"}</td>
                        <td>{e.cliente || "—"}</td>
                        <td className="num mono">{formatBRL(e.valor)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="panel" style={{ marginTop: "12px" }}>
            <div className="table-scroll">
              <table>
                <thead>
                  <tr>
                    <th>Saida</th>
                    <th>Evento/categoria</th>
                    <th className="num">Valor</th>
                  </tr>
                </thead>
                <tbody>
                  {saidasHoje.length === 0 ? (
                    <tr>
                      <td colSpan={3}>Nenhuma saida prevista para hoje.</td>
                    </tr>
                  ) : (
                    saidasHoje.map((s, i) => (
                      <tr key={i}>
                        <td>
                          {s.nome || "—"}
                          {s.data_estimada ? (
                            <span className="badge warn" style={{ marginLeft: "6px" }}>
                              data estimada
                            </span>
                          ) : null}
                        </td>
                        <td>
                          {[s.evento, s.categoria].filter(Boolean).join(" — ") || "—"}
                        </td>
                        <td className="num mono">{formatBRL(s.valor)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="callout">
            <strong>Atualizado em:</strong> {resumoAtualizadoEm || "—"}
          </div>
        </>
      )}

      <div className="section-title neutral">
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

      <div className="section-title good">
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

      <div className="section-title bad">
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
            {a.dias_atraso !== undefined && a.dias_atraso !== null ? (
              <div>
                <strong>
                  {Number(a.dias_atraso) === 0
                    ? "Vence hoje"
                    : `${a.dias_atraso} dia(s) em atraso`}
                </strong>
              </div>
            ) : null}
          </div>
        ))
      )}
    </div>
  );
}
