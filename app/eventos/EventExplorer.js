"use client";
import { useState } from "react";

const CATEGORIA_LABEL = {
  mao_de_obra_cache: "Mão de obra / Cachê",
  fornecedores: "Fornecedores",
  compra_material: "Compra de material",
  reembolso: "Reembolso",
};

const CATEGORIA_COLOR = {
  mao_de_obra_cache: "var(--cat-1)",
  fornecedores: "var(--cat-2)",
  compra_material: "var(--cat-3)",
  reembolso: "var(--cat-4)",
};

// Converte um valor que pode vir como "R$ 2.700,00" (string ja formatada pela
// rotina) ou como numero em um numero puro, so para desenhar o donut na tela.
// Nunca inventa dado: se nao der pra interpretar, devolve null e o item entra
// sem fatia/percentual no grafico (mas continua listado com o valor original).
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

function buildCategorias(categorias, custoTotal) {
  const entries = Object.entries(categorias || {}).filter(([, v]) => v);
  const custoNum = parseNum(custoTotal);
  return entries.map(([chave, valor]) => {
    const num = parseNum(valor);
    const pct = custoNum && num !== null ? (num / custoNum) * 100 : null;
    return {
      chave,
      label: CATEGORIA_LABEL[chave] || chave,
      valor,
      pct,
      color: CATEGORIA_COLOR[chave] || "var(--ink-faint)",
    };
  });
}

function Donut({ items, centerValue, centerLabel }) {
  const r = 40;
  const circumference = 2 * Math.PI * r;
  const validItems = items.filter((it) => it.pct !== null && it.pct > 0);
  let cumulative = 0;

  return (
    <div className="donut-wrap">
      <svg viewBox="0 0 100 100">
        <circle cx="50" cy="50" r={r} fill="none" stroke="var(--rule)" strokeWidth="14" />
        {validItems.map((it, i) => {
          const dash = (it.pct / 100) * circumference;
          const gap = circumference - dash;
          const rotation = (cumulative / 100) * 360;
          cumulative += it.pct;
          return (
            <circle
              key={i}
              cx="50"
              cy="50"
              r={r}
              fill="none"
              stroke={it.color}
              strokeWidth="14"
              strokeDasharray={`${dash} ${gap}`}
              style={{ transformOrigin: "50px 50px", transform: `rotate(${rotation}deg)` }}
            />
          );
        })}
      </svg>
      <div className="donut-center">
        <span className="v mono">{centerValue || "—"}</span>
        <span className="l">{centerLabel}</span>
      </div>
    </div>
  );
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
    <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginTop: "8px" }}>
      {badges.map((b, i) => (
        <span className="chip warn" key={i}>
          {b}
        </span>
      ))}
    </div>
  );
}

export default function EventExplorer({ andamento, realizados }) {
  const [open, setOpen] = useState([]);

  function toggle(key) {
    setOpen((prev) => (prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]));
  }

  const all = [
    ...andamento.map((e, i) => ({ ...e, _key: `andamento:${i}` })),
    ...realizados.map((e, i) => ({ ...e, _key: `realizado:${i}` })),
  ];
  const openEvents = all.filter((e) => open.includes(e._key));

  if (all.length === 0) {
    return <div className="callout">Nenhum evento com dados de custo disponível no momento.</div>;
  }

  return (
    <div>
      {andamento.length > 0 ? (
        <div className="event-pill-group">
          <span className="glabel">Em produção</span>
          <div className="event-pills">
            {andamento.map((e, i) => {
              const key = `andamento:${i}`;
              return (
                <button
                  key={key}
                  type="button"
                  className={`event-pill${open.includes(key) ? " active" : ""}`}
                  onClick={() => toggle(key)}
                >
                  {e.nome || "—"}
                </button>
              );
            })}
          </div>
        </div>
      ) : null}

      {openEvents.length === 0 ? (
        <p style={{ color: "var(--ink-faint)", fontSize: "13px", marginTop: "6px" }}>
          Clique num evento acima para abrir a composição de custo e a margem dele. Dá pra abrir vários ao mesmo tempo.
        </p>
      ) : (
        <div className="event-panels">
          {openEvents.map((e) => {
            const items = buildCategorias(e.categorias, e.custo_total);
            return         (
              <div className="event-panel" key={e._key}>
                <div className="event-panel-head">
                  <h3>{e.nome || "—"}</h3>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    {saudeChip(e.saude)}
                    <button type="button" className="event-panel-close" onClick={() => toggle(e._key)} aria-label="Fechar">
                      ×
                    </button>
                  </div>
                </div>
                {badgeList(e.badges)}

                <div className="donut-block">
                  <Donut items={items} centerValue={e.margem_percentual} centerLabel="Margem" />
                  <div className="cat-legend">
                    {items.length === 0 ? (
                      <span style={{ color: "var(--ink-faint)", fontSize: "13px" }}>Sem detalhamento de custos por categoria.</span>
                    ) : (
                      items.map((it, i) => (
                        <div className="cat-legend-item" key={i}>
                          <span className="name">
                            <span className="cat-dot" style={{ background: it.color }} />
                            {it.label}
                          </span>
                          <span className="vals">
                            {it.valor}
                            {it.pct !== null ? ` · ${it.pct.toFixed(1)}%` : ""}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <div className="event-panel-kpis">
                  <div className="mini-stat">
                    <span className="n mono">{e.faturamento_bruto || "—"}</span>
                    <span className="l">Fat. bruto</span>
                  </div>
                  <div className="mini-stat">
                    <span className="n mono">{e.custo_total || "—"}</span>
                    <span className="l">Custo total</span>
                  </div>
                  <div className="mini-stat">
                    <span className="n mono">{e.margem_valor || "—"}</span>
                    <span className="l">Margem</span>
                  </div>
                  <div className="mini-stat">
                    <span className="n mono">{e.margem_percentual || "—"}</span>
                    <span className="l">Margem %</span>
                  </div>
                        </div>
              </div>
            );
          })}
        </div>
      )}

      {realizados.length > 0 ? (
        <details className="event-realizados">
          <summary>Eventos já realizados ({realizados.length})</summary>
          <div className="event-pills">
            {realizados.map((e, i) => {
              const key = `realizado:${i}`;
              return (
                <button
                  key={key}
                  type="button"
                  className={`event-pill${open.includes(key) ? " active" : ""}`}
                  onClick={() => toggle(key)}
                >
                  {e.nome || "—"}
                </button>
              );
            })}
          </div>
        </details>
      ) : null}
    </div>
  );
}
