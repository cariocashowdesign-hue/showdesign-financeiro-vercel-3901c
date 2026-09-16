import { GoogleAuth } from "google-auth-library";

const SHEET_ID = process.env.SHOWDESIGN_SHEET_ID || "1ixmnftUoYgY-omo3-9VyyAddk9dlN9HJ8rEmjayUk8A";
const RANGE = "Dados!A2:E500";

let cachedAuth = null;

function getAuth() {
  if (cachedAuth) return cachedAuth;
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const rawKey = process.env.GOOGLE_PRIVATE_KEY;
  if (!email || !rawKey) {
    throw new Error(
      "Faltam as variaveis de ambiente GOOGLE_SERVICE_ACCOUNT_EMAIL / GOOGLE_PRIVATE_KEY (veja o README para configurar a conta de servico do Google e compartilhar a planilha-ponte com ela)."
    );
  }
  const key = rawKey.replace(/\\n/g, "\n");
  cachedAuth = new GoogleAuth({
    credentials: { client_email: email, private_key: key },
    scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
  });
  return cachedAuth;
}

// Le a aba "Dados" da planilha-ponte e devolve um mapa { chave: {valor, tipo, atualizadoEm, observacao} }.
// Nunca inventa dado: uma chave ausente na planilha simplesmente nao aparece no mapa.
export async function getDados() {
  const auth = getAuth();
  const client = await auth.getClient();
  const tokenResp = await client.getAccessToken();
  const token = typeof tokenResp === "string" ? tokenResp : tokenResp?.token;
  if (!token) {
    throw new Error("Nao foi possivel obter um token de acesso do Google com as credenciais configuradas.");
  }

  const url = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${encodeURIComponent(RANGE)}`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
    next: { revalidate: 60 },
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Erro ao ler a planilha-ponte da Showdesign (HTTP ${res.status}): ${body}`);
  }

  const json = await res.json();
  const rows = json.values || [];
  const dados = {};
  for (const row of rows) {
    const [chave, valor, tipo, atualizadoEm, observacao] = row || [];
    if (!chave) continue;
    dados[chave] = {
      valor: valor ?? "",
      tipo: tipo ?? "",
      atualizadoEm: atualizadoEm ?? "",
      observacao: observacao ?? "",
    };
  }
  return dados;
}

export function campo(dados, chave) {
  return dados?.[chave]?.valor ?? "";
}

export function campoObs(dados, chave) {
  return dados?.[chave]?.observacao ?? "";
}

// Le uma chave cujo Valor e uma string JSON (listas/objetos escritos pelas rotinas).
// Se a chave nao existir, vier vazia, ou o JSON for invalido, devolve o fallback em vez de quebrar a pagina.
export function campoJSON(dados, chave, fallback) {
  const raw = campo(dados, chave);
  if (!raw) return fallback;
  try {
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

// Le uma chave que pode ter sido gravada como lista JSON (usa o tamanho da lista)
// ou como numero simples (usa o proprio numero). Nunca inventa contagem: sem dado, devolve null.
export function campoContagem(dados, chave) {
  const raw = campo(dados, chave);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed.length;
  } catch {
    // nao era JSON, segue para tentar como numero
  }
  const n = Number(String(raw).replace(",", "."));
  return Number.isNaN(n) ? null : n;
}
