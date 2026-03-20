/**
 * SOLARRESULT - Google Apps Script für Lead-Capture
 *
 * SETUP-ANLEITUNG:
 * 1. Öffne Google Sheets und erstelle ein neues Sheet namens "SolarResult Leads"
 * 2. In Zeile 1 diese Header eintragen:
 *    Timestamp | Vorname | Nachname | E-Mail | Telefon | Firma | Quelle | Status | Termin
 * 3. Gehe zu Erweiterungen > Apps Script
 * 4. Lösche den Standardcode und füge diesen gesamten Code ein
 * 5. Klicke auf "Bereitstellen" > "Neue Bereitstellung"
 * 6. Typ: "Web-App"
 * 7. Ausführen als: "Ich" (dein Google-Konto)
 * 8. Zugriff: "Jeder" (damit die Website darauf zugreifen kann)
 * 9. Klicke "Bereitstellen" und kopiere die URL
 * 10. Füge die URL in booking.js bei SHEET_WEBHOOK ein
 */

function doPost(e) {
  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    var data = JSON.parse(e.postData.contents);

    if (data.status === 'booked') {
      // Update existing lead with booking info
      updateLeadStatus(sheet, data.email, data.appointment);
    } else {
      // New lead - add row
      sheet.appendRow([
        data.timestamp || new Date().toISOString(),
        data.name || '',
        data.lastname || '',
        data.email || '',
        data.phone || '',
        data.company || '',
        data.source || 'solarresult.de',
        'Neuer Lead',
        ''  // Termin (noch leer)
      ]);
    }

    return ContentService
      .createTextOutput(JSON.stringify({ status: 'ok' }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({ status: 'error', message: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function updateLeadStatus(sheet, email, appointment) {
  var data = sheet.getDataRange().getValues();

  // Find row by email (column D = index 3)
  for (var i = data.length - 1; i >= 1; i--) {
    if (data[i][3] === email) {
      // Update Status (column H = index 8, 1-based = column 8)
      sheet.getRange(i + 1, 8).setValue('Termin gebucht');
      // Update Termin (column I = index 9, 1-based = column 9)
      sheet.getRange(i + 1, 9).setValue(appointment);
      return;
    }
  }
}

// Allow GET requests for testing
function doGet(e) {
  return ContentService
    .createTextOutput(JSON.stringify({ status: 'ok', message: 'SolarResult Lead Webhook is active' }))
    .setMimeType(ContentService.MimeType.JSON);
}
