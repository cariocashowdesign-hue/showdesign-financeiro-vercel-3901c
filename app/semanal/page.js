import { getDados, campo } from "../../lib/sheets";

function formatBRL(valor) {
  const n = Number(String(valor).replace(",", "."));
  if (!valor || Number.isNaN(n)) return valor || "—";
  return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function sinal(valor) {
  const n = Number(String(valor).replace(",", "."));
  if (Number.isNaN(n)) return "";
  return n < 0 ? "bad" : "good";
}

export const revalidate = 60;

export default async function SemanalPage() {
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
          <h2>Semanal</h2>
        </div>
        <div className="callout warn">
          <strong>Erro ao ler a planilha-ponte:</strong> {erro}
        </div>
      </div>
    );
  }

  const periodo = campo(dados, "semana.periodo");
  const entradas = campo(dados, "semana.entradas_projetadas");
  const saidas = campo(dados, "semana.saidas_projetadas");
  const resultado = campo(dados, "semana.resultado_liquido_projetado");
  const atualizadoEm = campo(dados, "semana.atualizado_em");

  const semDados = !periodo && !entradas && !saidas && !resultado;

  return (
    <div>
      <div className="page-eyebrow">
        <span className="dot" /> Financeiro Showdesign <span className="sep">·</span> Semanal
      </div>
      <div className="page-head">
        <h1 className="page-title">Projeção da semana</h1>
        <p className="page-sub">
          {periodo ? `Semana de ${periodo}.` : "Entradas, saídas e resultado projetados para a semana, a partir dos contratos e custos lançados."}
        </p>
      </div>
      {semDados ? (
        <div className="callout">
          Ainda sem dados semanais. A rotina de relatorio semanal ainda nao
          rodou ou nao gravou valores na planilha-ponte.
        </div>
      ) : (
        <>
          <div className="section-title">
            <h2>Projeção por contrato</h2>
            <span className="section-hint">valores projetados, planilha-ponte</span>
          </div>

          <div className="kpi-grid">
            <div className="kpi plain">
              <span className="label">Entradas projetadas</span>
              <span className="value good mono">{formatBRL(entradas)}</span>
            </div>
            <div className="kpi plain">
              <span className="label">Saidas projetadas</span>
              <span className="value bad mono">{formatBRL(saidas)}</span>
            </div>
            <div className="kpi plain">
              <span className="label">Resultado liquido projetado</span>
              <span className={`value ${sinal(resultado)} mono`}>{formatBRL(resultado)}</span>
            </div>
          </div>

          <div className="callout" style={{ marginTop: "16px" }}>
            <strong>Nota:</strong> por enquanto a planilha-ponte só grava os valores projetados por contrato (entradas, saídas e
            resultado). Não há ainda uma rotina que confirme, separadamente, o que já entrou/saiu de fato no banco durante a semana —
            isso pode ser adicionado depois, se você quiser essa automação.
          </div>

          <div className="callout" style={{ marginTop: "12px" }}>
            <strong>Atualizado em:</strong> {atualizadoEm || "—"}
          </div>
        </>
      )}
    </div>
  );
}
