"use client";
import { useMemo, useState } from "react";

function norm(s) {
  return (s || "").toString().toLowerCase();
}

export function ContasPagarTable({ itens }) {
  const [tab, setTab] = useState("todas");

  const filtrados = useMemo(() => {
    if (!itens) return [];
    if (tab === "a_pagar") return itens.filter((i) => i.situacao !== "paga");
    if (tab === "pagas") return itens.filter((i) => i.situacao === "paga");
    return itens;
  }, [itens, tab]);

  if (!itens || itens.length === 0) {
    return <div className="callout">Nenhuma conta a pagar prevista para esta semana.</div>;
  }

  return (
    <div>
      <div className="event-pills" style={{ marginBottom: "12px" }}>
        {[
          ["todas", "Todas"],
          ["a_pagar", "A pagar"],
          ["pagas", "Pagas"],
        ].map(([key, label]) => (
          <button
            key={key}
            type="button"
            className={`event-pill${tab === key ? " active" : ""}`}
            onClick={() => setTab(key)}
          >
            {label}
          </button>
        ))}
      </div>
      <div className="table-scroll">
        <table>
          <thead>
            <tr>
              <th>Vencimento</th>
              <th>Nome / Fornecedor</th>
              <th>Evento</th>
              <th className="num">Valor</th>
              <th>Situação</th>
            </tr>
          </thead>
          <tbody>
            {filtrados.map((it, i) => (
              <tr key={i}>
                <td>{it.vencimento || "—"}</td>
                <td>{it.nome || "—"}</td>
                <td>{it.evento || "—"}</td>
                <td className="num mono">{it.valor || "—"}</td>
                <td>
                  {it.situacao === "paga" ? (
                    <span className="chip good">Paga</span>
                  ) : (
                    <span className="chip warn">A pagar</span>
                  )}
                </td>
              </tr>
            ))}
            {filtrados.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ color: "var(--ink-faint)" }}>
                  Nenhum item nesta aba.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function ForaProgramacaoTable({ itens }) {
  const [tab, setTab] = useState("todas");
  const [busca, setBusca] = useState("");

  const filtrados = useMemo(() => {
    if (!itens) return [];
    let list = itens;
    if (tab === "pagos") list = list.filter((i) => i.tipo === "saida");
    if (tab === "recebidos") list = list.filter((i) => i.tipo === "entrada");
    if (busca.trim()) {
      const q = norm(busca);
      list = list.filter((i) => norm(i.descricao).includes(q));
    }
    return list;
  }, [itens, tab, busca]);

  if (!itens || itens.length === 0) {
    return <div className="callout">Nenhuma movimentação fora da programação nesta semana até agora.</div>;
  }

  return (
    <div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "10px",
          marginBottom: "12px",
        }}
      >
        <div className="event-pills">
          {[
            ["todas", "Todas"],
            ["pagos", "Pagos"],
            ["recebidos", "Recebidos"],
          ].map(([key, label]) => (
            <button
              key={key}
              type="button"
              className={`event-pill${tab === key ? " active" : ""}`}
              onClick={() => setTab(key)}
            >
              {label}
            </button>
          ))}
        </div>
        <input
          type="text"
          placeholder="Buscar fornecedor…"
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          className="search-input"
        />
      </div>
      <div className="table-scroll">
        <table>
          <thead>
            <tr>
              <th>Data</th>
              <th>Descrição</th>
              <th className="num">Valor</th>
              <th>Tipo</th>
            </tr>
          </thead>
          <tbody>
            {filtrados.map((it, i) => (
              <tr key={i}>
                <td>{it.data || "—"}</td>
                <td>{it.descricao || "—"}</td>
                <td className="num mono">{it.valor || "—"}</td>
                <td>
                  {it.tipo === "entrada" ? (
                    <span className="chip good">Recebido</span>
                  ) : (
                    <span className="chip bad">Pago</span>
                  )}
                </td>
              </tr>
            ))}
            {filtrados.length === 0 ? (
              <tr>
                <td colSpan={4} style={{ color: "var(--ink-faint)" }}>
                  Nenhum item nesta busca/aba.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
