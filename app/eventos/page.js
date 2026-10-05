import { getDados, campo, campoObs, campoJSON } from "../../lib/sheets";
import EventExplorer from "./EventExplorer";

export const revalidate = 60;

function parseNum(v) {
  if (v === null || v === undefined || v === "") return null;
  if (typeof v === "number") return Number.isNaN(v) ? null : v;
  const cleaned = String(v)
    .replace(/[^\d,.-]/g, "")
    .replace(/\.(?=\d{3}(?:\D|$))/g, "")
    .replace(",", ".");
  const n = Number(cleaned);
  return Number.isNaN(n) ? null : n;
}

// "08/11/2026 a 13/11/2026 (contrato)" -> Date da primeira data encontrada (ou null).
function primeiraData(texto) {
  const m = /(\d{1,2})\/(\d{1,2})\/(\d{4})/.exec(String(texto || ""));
  if (!m) return null;
  return new Date(Date.UTC(Number(m[3]), Number(m[2]) - 1, Number(m[1])));
}

// Dias entre hoje (horario de Sao Paulo) e a data do evento. Nao inventa: sem data valida, devolve null.
function diasAte(data) {
  if (!data) return null;
  const hoje = new Date(new Date().toLocaleString("en-US", { timeZone: "America/Sao_Paulo" }));
  const base = Date.UTC(hoje.getFullYear(), hoje.getMonth(), hoje.getDate());
  return Math.round((data.getTime() - base) / 86400000);
}

function textoComecaEm(dias) {
  if (dias === null) return null;
  if (dias < 0) return null;
  if (dias === 0) return "começa hoje";
  if (dias === 1) return "começa em 1 dia";
  return `começa em ${dias} dias`;
}

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

  const proximosRaw = campoJSON(dados, "eventos.proximos", []);
  const ranking = campoJSON(dados, "eventos.ranking", []);
  const destaques = campoJSON(dados, "eventos.destaques", {});
  const semFaturamento = campoJSON(dados, "eventos.sem_faturamento", []);
  const criticos = campoJSON(dados, "eventos.criticos", []);
  const escopoNota = campoObs(dados, "eventos.escopo_nota") || campo(dados, "eventos.escopo_nota");
  const atualizadoEm = campo(dados, "eventos.atualizado_em");

  const andamento = ranking.filter((e) => e.momento === "andamento");
  const realizados = ranking.filter((e) => e.momento === "realizado");

  const proximos = proximosRaw.map((e) => ({
    ...e,
    _sub: textoComecaEm(diasAte(primeiraData(e.data_evento))),
  }));

  // Ranking: so os realizados (em producao e proximos ja aparecem no "Evento em foco"), por margem em R$.
  const rankingTabela = [...realizados].sort((a, b) => {
    const ma = parseNum(a.margem_valor);
    const mb = parseNum(b.margem_valor);
    if (ma === null && mb === null) return 0;
    if (ma === null) return 1;
    if (mb === null) return -1;
    return mb - ma;
  });

  const saudeChip = (s) =>
    s === "critico" ? (
      <span className="chip bad">crítico</span>
    ) : s === "atencao" ? (
      <span className="chip warn">atenção</span>
    ) : s === "saudavel" ? (
      <span className="chip good">saudável</span>
    ) : (
      "—"
    );

  const destaqueCards = [];
  if (destaques?.maior_margem_valor) {
    destaqueCards.push({
      label: "Maior margem em R$",
      valor: destaques.maior_margem_valor.valor || "—",
      sub: destaques.maior_margem_valor.nome || "—",
    });
  }
  if (destaques?.maior_margem_percentual) {
    destaqueCards.push({
      label: "Maior margem em %",
      valor: destaques.maior_margem_percentual.valor || "—",
      sub: destaques.maior_margem_percentual.nome || "—",
    });
  }
  if (destaques?.menor_margem) {
    destaqueCards.push({
      label: "Menor margem",
      valor: destaques.menor_margem.valor || "—",
      sub: `${destaques.menor_margem.nome || "—"}${destaques.menor_margem.percentual ? ` (${destaques.menor_margem.percentual})` : ""}`,
    });
  }

  return (
    <div>
      <div className="page-eyebrow">
        <span className="dot" /> Financeiro Showdesign <span className="sep">·</span> Eventos
      </div>
      <div className="page-head">
        <h1 className="page-title">Relatório por evento — margem</h1>
        <p className="page-sub">Ranking evento por evento (só Showdesign), ordenado por margem em R$.</p>
      </div>

      <div className="section-title">
        <h2>Evento em foco</h2>
      </div>
      <p style={{ color: "var(--ink-muted)", fontSize: "13px", marginTop: "-8px", marginBottom: "10px" }}>
        Clique num evento para abrir o painel dele — clique de novo (ou no ×) para fechar. Dá pra abrir vários ao mesmo tempo.
      </p>
      <EventExplorer andamento={andamento} proximos={proximos} realizados={realizados} />

      <div className="section-title">
        <h2>Destaques</h2>
      </div>
      {destaqueCards.length === 0 ? (
        <div className="callout">Sem destaques no momento.</div>
      ) : (
        <div className="kpi-grid">
          {destaqueCards.map((d, i) => (
            <div className="kpi" key={i}>
              <span className="label">{d.label}</span>
              <span className="value" style={{ fontSize: "30px" }}>{d.valor}</span>
              <span className="kpi-sub">{d.sub}</span>
            </div>
          ))}
        </div>
      )}

      <div className="section-title bad">
        <h2>Eventos em situação crítica hoje</h2>
      </div>
      {criticos.length === 0 ? (
        <div className="callout ok">✓ Nenhum evento crítico na última execução.</div>
      ) : (
        criticos.map((e, i) => (
          <div className="callout warn" key={i} style={{ marginBottom: "10px" }}>
            <strong>{e.nome || "Evento"}</strong> — situação crítica identificada (custo acima do limite saudável em relação ao faturamento).
          </div>
        ))
      )}

      <div className="section-title">
        <h2>Ranking de eventos</h2>
      </div>
      <p style={{ color: "var(--ink-faint)", fontSize: "12.5px", marginTop: "-6px", marginBottom: "10px" }}>
        Os eventos em produção e os próximos aparecem no painel "Evento em foco" acima e não se repetem aqui.
      </p>
      {rankingTabela.length === 0 ? (
        <div className="callout">Nenhum evento realizado no ranking.</div>
      ) : (
        <div className="panel" style={{ padding: 0 }}>
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Evento</th>
                  <th>Faturamento bruto</th>
                  <th>Custo total</th>
                  <th>Margem (R$)</th>
                  <th>Margem (%)</th>
                  <th>Saúde</th>
                </tr>
              </thead>
              <tbody>
                {rankingTabela.map((e, i) => (
                  <tr key={i}>
                    <td>{e.nome || "—"}</td>
                    <td className="mono">{e.faturamento_bruto || "—"}</td>
                    <td className="mono">{e.custo_total || "—"}</td>
                    <td className="mono">{e.margem_valor || "—"}</td>
                    <td className="mono">{e.margem_percentual || "—"}</td>
                    <td>{saudeChip(e.saude)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="section-title">
        <h2>Sem faturamento informado — fora do ranking</h2>
      </div>
      {semFaturamento.length === 0 ? (
        <div className="callout" style={{ textAlign: "center" }}>Nenhum evento sem faturamento informado nesta execução.</div>
      ) : (
        <div className="panel" style={{ padding: 0 }}>
          <div className="table-scroll">
            <table>
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
        </div>
      )}

      {escopoNota ? (
        <>
          <div className="section-title">
            <h2>Escopo</h2>
          </div>
          <div className="callout" style={{ textAlign: "center", lineHeight: 1.6 }}>
            {escopoNota}
          </div>
        </>
      ) : null}

      <p style={{ color: "var(--ink-faint)", fontSize: "12px", marginTop: "28px", paddingTop: "14px", borderTop: "1px solid var(--rule)" }}>
        Atualizado pela tarefa "Relatório por Evento — Margem" em {atualizadoEm || "—"}. Esta página busca a planilha de novo a cada carregamento.
      </p>
    </div>
  );
}
