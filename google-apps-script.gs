/**
 * ════════════════════════════════════════════════════════════════
 * CALCULADORA DE INDENIZAÇÃO — Salvar leads no Google Sheets
 * ════════════════════════════════════════════════════════════════
 *
 * COMO USAR (passo a passo):
 *
 * 1) Crie uma planilha nova no Google Sheets (sheets.new).
 *
 * 2) No menu, vá em  Extensões → Apps Script.
 *
 * 3) Apague o conteúdo padrão e cole TODO este arquivo.
 *
 * 4) Clique em  Implantar → Nova implantação.
 *      - Tipo:               App da Web
 *      - Descrição:          Calculadora (qualquer nome)
 *      - Executar como:      Eu (seu e-mail)
 *      - Quem tem acesso:    Qualquer pessoa
 *    Clique em "Implantar" e autorize o acesso quando pedir.
 *
 * 5) Copie a "URL do app da Web" (começa com https://script.google.com/macros/s/...).
 *
 * 6) No arquivo index.html, cole essa URL na linha:
 *      const SHEETS_ENDPOINT = "COLE_AQUI_A_URL_DO_APPS_SCRIPT";
 *
 * Pronto! Cada cálculo finalizado vira uma linha na planilha.
 *
 * (Opcional) Proteção por token: defina um valor em TOKEN abaixo e o mesmo
 * valor no index.html (peça pra eu ligar isso se quiser).
 * ════════════════════════════════════════════════════════════════
 */

const SHEET_NAME = "Leads"; // nome da aba onde os leads serão gravados
const TOKEN = "54dcf38514d89d661181aa4a55c69ef8"; // precisa ser igual ao SHEETS_TOKEN do index.html

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);

    // (Opcional) valida token, se configurado
    if (TOKEN && data.token !== TOKEN) {
      return _json({ ok: false, error: "token inválido" });
    }

    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = ss.getSheetByName(SHEET_NAME);
    if (!sheet) sheet = ss.insertSheet(SHEET_NAME);

    // Cria o cabeçalho na primeira execução
    if (sheet.getLastRow() === 0) {
      sheet.appendRow([
        "Data/Hora", "Nome", "E-mail", "WhatsApp",
        "Data nascimento", "Idade", "Salário (R$)",
        "Grau incapacidade (%)", "Trajeto", "Valor estimado (R$)", "Origem"
      ]);
    }

    sheet.appendRow([
      new Date(),
      data.nome || "",
      data.email || "",
      data.telefone || "",
      data.dataNascimento || "",
      data.idade || "",
      data.salario || "",
      data.percentual || "",
      data.trajeto || "",
      data.total || "",
      data.origem || ""
    ]);

    return _json({ ok: true });
  } catch (err) {
    return _json({ ok: false, error: String(err) });
  }
}

// Permite testar a URL no navegador (deve mostrar {"ok":true,"msg":"..."} )
function doGet() {
  return _json({ ok: true, msg: "Endpoint da calculadora ativo." });
}

function _json(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
