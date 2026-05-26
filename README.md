# Calculadora de Indenização — Heloísa Hommerding Advocacia

Landing page com calculadora interativa de indenização por acidente de trabalho.

- **Site:** https://calculadora.heloisa.adv.br
- **Stack:** HTML/CSS/JS estático + Vercel Serverless Functions (Node.js)
- **Tracking:** Meta Pixel (browser) + Conversions API (server-side, dedupado)

## Tracking implementado

Eventos disparados em paralelo no Pixel (client) e CAPI (server), com mesmo `event_id` → o Meta deduplica automaticamente:

| Evento | Quando | Observação |
|---|---|---|
| `PageView` | Carregamento | automático |
| `InitiateCheckout` | Passo 1 → 2 | inclui salário, grau de incapacidade, trajeto |
| `Lead` | Cálculo finalizado | **evento de conversão**, com `value` em BRL |
| `ViewContent` | Resultado exibido | retargeting "viu valor" |
| `Contact` | Clique em qualquer WhatsApp | identifica origem do clique |

## Setup do Conversions API

A serverless function `api/track.js` precisa do **Access Token** do Meta. Sem ele, a função retorna 500.

### 1. Gerar token no Meta
1. Acesse [Gerenciador de Eventos](https://business.facebook.com/events_manager2/)
2. Selecione o Pixel `1469019564472571`
3. Vá em **Configurações** → **Conversions API** → **Generate access token**
4. Copie o token (ele é mostrado uma única vez)

### 2. Configurar na Vercel
No painel da Vercel → projeto → **Settings** → **Environment Variables**:

| Nome | Valor | Obrigatório |
|---|---|---|
| `META_PIXEL_ID` | `1469019564472571` | não (fallback no código) |
| `META_CAPI_ACCESS_TOKEN` | (token gerado acima) | **sim** |
| `META_TEST_EVENT_CODE` | `TESTxxxxx` | opcional, só para testar |

Marcar para **Production**, **Preview** e **Development**. Depois fazer um redeploy.

### 3. Validar
1. No Gerenciador de Eventos → **Test Events**
2. Copiar o `test_event_code` (formato `TEST12345`)
3. Setar `META_TEST_EVENT_CODE` na Vercel com esse valor
4. Acessar `https://calculadora.heloisa.adv.br` e fazer o fluxo completo
5. No painel **Test Events** vai aparecer cada evento com a label "Server" (CAPI) e "Browser" (Pixel)
6. Quando confirmar que estão deduplicando, **remover** a env var `META_TEST_EVENT_CODE`

### 4. Checar match quality
Após algumas horas de eventos rodando: Gerenciador de Eventos → Pixel → **Visão geral** → Event Match Quality. Meta de 6.0+ para eventos com email/telefone.
