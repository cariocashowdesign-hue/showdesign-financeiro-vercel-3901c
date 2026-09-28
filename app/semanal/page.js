import { getDados, campo, campoJSON } from "../../lib/sheets";
import { ContasPagarTable, ForaProgramacaoTable } from "./SemanalTables";

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

function plural(n, singular, plural_) {
  return n === 1 ? singular : plural_;
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
  const atualizadoEm = campo(dados, "semana.atualizado_em");
  const avisoCobertura = campo(dados, "semana.aviso_cobertura");
  const avisoDatas = campo(dados, "semana.aviso_datas_estimadas");

  // Resultado real (Open Finance, so os dias ja decorridos)
  const entradasReaisTotal = campo(dados, "semana.entradas_reais_total");
  const saidasReaisTotal = campo(dados, "semana.saidas_reais_total");
  const resultadoReal = campo(dados, "semana.resultado_real");
  const entradasReaisLista = campoJSON(dados, "semana.entradas_reais_lista", []);

  // Projecao da semana inteira (referencia, nao e o resultado real)
  const entradasProjetadas = campo(dados, "semana.entradas_projetadas");
  const saidasProjetadas = campo(dados, "semana.saidas_projetadas");
  const resultadoLiquidoProjetado = campo(dados, "semana.resultado_liquido_projetado");

  // Recebimentos Contratuais
  const aReceberLista = campoJSON(dados, "semana.a_receber_lista", []);

  // Contas a Pagar - Semana
  const contasPagarTotal = campo(dados, "semana.contas_pagar_total");
  const contasPagarJaPago = campo(dados, "semana.contas_pagar_ja_pago");
  const contasPagarFaltaPagar = campo(dados, "semana.contas_pagar_falta_pagar");
  const contasPagarLista = campoJSON(dados, "semana.contas_pagar_lista", []);

  // Fora da Programacao - Semana
  const foraPago = campo(dados, "semana.fora_programacao_pago_total");
  const foraRecebido = campo(dados, "semana.fora_programacao_recebido_total");
  const foraSaldo = campo(dados, "semana.fora_programacao_saldo");
  const foraLista = campoJSON(dados, "semana.fora_programacao_lista", []);

  const semDados = !periodo && !resultadoReal && !resultadoLiquidoProjetado;

  return (
    <div>
      <div className="page-eyebrow">
        <span className="dot" /> Financeiro Showdesign <span className="sep">·</span> Semanal
      </div>
      <div className="page-head">
        <h1 className="page-title">A receber e a pagar — semana</h1>
        <p className="page-sub">
          {periodo
            ? `Semana de ${periodo}, segunda a sexta-feira.`
            : "Recebimentos, contas a pagar e resultado real da semana, direto do Drive e do Open Finance."}
        </p>
      </div>

      {semDados ? (
        <div className="callout">
          Ainda sem dados semanais. A rotina de relatório semanal ainda não rodou ou não gravou valores na
          planilha-ponte.
        </div>
      ) : (
        <>
          {avisoCobertura ? (
            <div className="callout" style={{ marginBottom: "8px" }}>
              <strong>Cobertura desta execução:</strong> {avisoCobertura}
            </div>
          ) : null}

          {/* Resultado real da semana (Open Finance) */}
          <div className="section-title">
            <h2>Resultado real da semana</h2>
            <span className="section-hint">Open Finance · só os dias já decorridos</span>
          </div>
          <div className="kpi-grid">
            <div className="kpi plain">
              <span className="label">Entradas reais</span>
              <span className="value good mono">{formatBRL(entradasReaisTotal)}</span>
            </div>
            <div className="kpi plain">
              <span className="label">Saídas reais</span>
              <span className="value bad mono">{formatBRL(saidasReaisTotal)}</span>
            </div>
            <div className="kpi plain">
              <span className="label">Resultado real</span>
              <span className={`value ${sinal(resultadoReal)} mono`}>{formatBRL(resultadoReal)}</span>
            </div>
          </div>
          <div className="callout" style={{ marginTop: "-4px", marginBottom: "8px" }}>
            Cobre só os dias já decorridos da semana (Itaú + Inter via Open Finance) — não é a projeção da semana
            inteira, que aparece logo abaixo.
          </div>

          {/* Entradas confirmadas pelo banco */}
          <div className="section-title">
            <h2>Entradas confirmadas pelo banco</h2>
            <span className="section-hint">
              {entradasReaisLista.length} {plural(entradasReaisLista.length, "lançamento", "lançamentos")}
            </span>
          </div>
          {entradasReaisLista.length === 0 ? (
            <div className="callout">Nenhuma entrada confirmada pelo banco até agora nesta semana.</div>
          ) : (
            <div className="table-scroll">
              <table>
                <thead>
                  <tr>
                    <th>Data</th>
                    <th>Descrição</th>
                    <th className="num">Valor</th>
                  </tr>
                </thead>
                <tbody>
                  {entradasReaisLista.map((it, i) => (
                    <tr key={i}>
                      <td>{it.data || "—"}</td>
                      <td>{it.descricao || "—"}</td>
                      <td className="num mono">{it.valor || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Projecao da semana inteira (referencia) */}
          <div className="section-title">
            <h2>Projeção da semana inteira</h2>
            <span className="section-hint">referência — não é o resultado real</span>
          </div>
          <div className="kpi-grid">
            <div className="kpi plain">
              <span className="label">Entradas projetadas</span>
              <span className="value good mono">{formatBRL(entradasProjetadas)}</span>
            </div>
            <div className="kpi plain">
              <span className="label">Contas a pagar (total)</span>
              <span className="value bad mono">{formatBRL(saidasProjetadas)}</span>
            </div>
            <div className="kpi plain">
              <span className="label">Resultado líquido projetado</span>
              <span className={`value ${sinal(resultadoLiquidoProjetado)} mono`}>
                {formatBRL(resultadoLiquidoProjetado)}
              </span>
            </div>
          </div>

          {/* Recebimentos Contratuais */}
          <div className="section-title">
            <h2>Recebimentos contratuais</h2>
            <span className="section-hint">
              {aReceberLista.length} {plural(aReceberLista.length, "item", "itens")}
            </span>
          </div>
          {aReceberLista.length === 0 ? (
            <div className="callout">Nenhum recebimento contratual previsto para esta semana.</div>
          ) : (
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
                  {aReceberLista.map((it, i) => (
                    <tr key={i}>
                      <td>{it.evento || "—"}</td>
                      <td>{it.cliente || "—"}</td>
                      <td className="num mono">{it.valor || "—"}</td>
                      <td>{it.data || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Contas a Pagar - Semana */}
          <div className="section-title">
            <h2>Contas a pagar — semana</h2>
            <span className="section-hint">
              {contasPagarLista.length} {plural(contasPagarLista.length, "item", "itens")}
            </span>
          </div>
          <div className="kpi-grid">
            <div className="kpi plain">
              <span className="label">Total</span>
              <span className="value mono">{formatBRL(contasPagarTotal)}</span>
            </div>
            <div className="kpi plain">
              <span className="label">Já pago</span>
              <span className="value good mono">{formatBRL(contasPagarJaPago)}</span>
            </div>
            <div className="kpi plain">
              <span className="label">Falta pagar</span>
              <span className="value bad mono">{formatBRL(contasPagarFaltaPagar)}</span>
            </div>
          </div>
          <ContasPagarTable itens={contasPagarLista} />

          {/* Fora da Programacao - Semana */}
          <div className="section-title" style={{ marginTop: "36px" }}>
            <h2>Fora da programação — semana</h2>
            <span className="section-hint">
              {foraLista.length} {plural(foraLista.length, "lançamento", "lançamentos")}
            </span>
          </div>
          <div className="kpi-grid">
            <div className="kpi plain">
              <span className="label">Pago</span>
              <span className="value bad mono">{formatBRL(foraPago)}</span>
            </div>
            <div className="kpi plain">
              <span className="label">Recebido</span>
              <span className="value good mono">{formatBRL(foraRecebido)}</span>
            </div>
            <div className="kpi plain">
              <span className="label">Saldo</span>
              <span className={`value ${sinal(foraSaldo)} mono`}>{formatBRL(foraSaldo)}</span>
            </div>
          </div>
          <ForaProgramacaoTable itens={foraLista} />

          {avisoDatas ? (
            <div className="callout" style={{ marginTop: "20px" }}>
              <strong>Avisos:</strong> {avisoDatas}
            </div>
          ) : null}

          <div className="callout" style={{ marginTop: "12px" }}>
            <strong>Atualizado em:</strong> {atualizadoEm || "—"}
          </div>
        </>
      )}
    </div>
  );
}
