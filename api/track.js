// ════════════════════════════════════════════════════════
// META CONVERSIONS API — Heloísa Hommerding Advocacia
// ════════════════════════════════════════════════════════
// Recebe eventos do client e envia server-side pro Meta.
// Dedup automática com o Pixel via event_id idêntico.
// ════════════════════════════════════════════════════════

import crypto from "node:crypto";

const PIXEL_ID = process.env.META_PIXEL_ID || "1469019564472571";
const ACCESS_TOKEN = process.env.META_CAPI_ACCESS_TOKEN;
const TEST_EVENT_CODE = process.env.META_TEST_EVENT_CODE; // opcional, p/ Test Events
const GRAPH_VERSION = "v21.0";

function sha256(v) {
  if (!v) return undefined;
  return crypto.createHash("sha256").update(String(v).trim().toLowerCase()).digest("hex");
}

// Normaliza telefone BR pra formato E.164 sem +
function normPhone(p) {
  if (!p) return undefined;
  const digits = String(p).replace(/\D/g, "");
  if (!digits) return undefined;
  // Já tem código do país (55) → mantém. Senão prefixa.
  return digits.startsWith("55") ? digits : "55" + digits;
}

function clientIp(req) {
  const xff = req.headers["x-forwarded-for"];
  if (xff) return String(xff).split(",")[0].trim();
  return req.headers["x-real-ip"] || req.socket?.remoteAddress || undefined;
}

export default async function handler(req, res) {
  // CORS — permite o domínio próprio + GitHub Pages como fallback
  const allowed = [
    "https://calculadora.heloisa.adv.br",
    "https://heloisaadv.github.io",
  ];
  const origin = req.headers.origin || "";
  if (allowed.some((o) => origin.startsWith(o))) {
    res.setHeader("Access-Control-Allow-Origin", origin);
  }
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  if (!ACCESS_TOKEN) {
    return res.status(500).json({ error: "META_CAPI_ACCESS_TOKEN não configurado" });
  }

  try {
    const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body || {};
    const {
      event_name,
      event_id,
      event_source_url,
      user_data = {},
      custom_data = {},
      action_source = "website",
    } = body;

    if (!event_name) return res.status(400).json({ error: "event_name é obrigatório" });

    // Monta user_data com hashes
    const ud = {
      em: user_data.email ? [sha256(user_data.email)] : undefined,
      ph: user_data.phone ? [sha256(normPhone(user_data.phone))] : undefined,
      fn: user_data.first_name ? [sha256(user_data.first_name)] : undefined,
      ln: user_data.last_name ? [sha256(user_data.last_name)] : undefined,
      country: user_data.country ? [sha256(user_data.country)] : [sha256("br")],
      client_ip_address: clientIp(req),
      client_user_agent: req.headers["user-agent"],
      fbc: user_data.fbc || undefined, // do cookie _fbc (click ID do Meta)
      fbp: user_data.fbp || undefined, // do cookie _fbp (browser ID do Pixel)
    };
    // Remove undefined
    Object.keys(ud).forEach((k) => ud[k] === undefined && delete ud[k]);

    const event = {
      event_name,
      event_time: Math.floor(Date.now() / 1000),
      event_id, // ⭐ mesmo ID do Pixel → dedup
      event_source_url: event_source_url || req.headers.referer || undefined,
      action_source,
      user_data: ud,
      custom_data,
    };

    const payload = {
      data: [event],
      ...(TEST_EVENT_CODE ? { test_event_code: TEST_EVENT_CODE } : {}),
    };

    const url = `https://graph.facebook.com/${GRAPH_VERSION}/${PIXEL_ID}/events?access_token=${ACCESS_TOKEN}`;
    const r = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await r.json();

    if (!r.ok) {
      console.error("CAPI error", data);
      return res.status(r.status).json({ ok: false, meta: data });
    }
    return res.status(200).json({ ok: true, meta: data });
  } catch (err) {
    console.error("CAPI handler error", err);
    return res.status(500).json({ error: String(err?.message || err) });
  }
}
