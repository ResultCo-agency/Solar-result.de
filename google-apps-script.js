/**
 * SOLARRESULT - Google Apps Script für Lead-Capture
 *
 * Google Sheet: https://docs.google.com/spreadsheets/d/1zd9RDBeiKXXXTd36Wzf_cfaCXf-Xrth2W-ue87Ami3M/
 *
 * SETUP-ANLEITUNG:
 * 1. Öffne das Sheet oben und trage in Zeile 1 diese Header ein:
 *    Timestamp | Vorname | Nachname | E-Mail | Telefon | Firma | Quelle | Status | Termin | Meeting-Dauer | Meeting-Art
 * 2. Gehe zu Erweiterungen > Apps Script
 * 3. Lösche den Standardcode und füge diesen gesamten Code ein
 * 4. Klicke auf "Bereitstellen" > "Neue Bereitstellung"
 * 5. Typ: "Web-App"
 * 6. Ausführen als: "Ich" (dein Google-Konto)
 * 7. Zugriff: "Jeder" (damit die Website darauf zugreifen kann)
 * 8. Klicke "Bereitstellen" und kopiere die URL
 * 9. Füge die URL in booking.js bei SHEET_WEBHOOK ein
 */

var SHEET_ID = '1zd9RDBeiKXXXTd36Wzf_cfaCXf-Xrth2W-ue87Ami3M';

function doPost(e) {
  try {
    var ss = SpreadsheetApp.openById(SHEET_ID);
    var sheet = ss.getSheetByName('Leads') || ss.getActiveSheet();
    var data = JSON.parse(e.postData.contents);

    if (data.status === 'booked') {
      updateLeadStatus(sheet, data.email, data.appointment, data.meeting_duration, data.meeting_type);
    } else {
      sheet.appendRow([
        data.timestamp || new Date().toISOString(),
        data.name || '',
        data.lastname || '',
        data.email || '',
        data.phone || '',
        data.company || '',
        data.source || 'solarresult.de',
        'Neuer Lead',
        '',                                     // Termin
        data.meeting_duration || '30 Minuten',  // Meeting-Dauer
        data.meeting_type || 'Google Meet'      // Meeting-Art
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

function updateLeadStatus(sheet, email, appointment, duration, type) {
  var data = sheet.getDataRange().getValues();

  for (var i = data.length - 1; i >= 1; i--) {
    if (data[i][3] === email) {
      sheet.getRange(i + 1, 8).setValue('Termin gebucht');
      sheet.getRange(i + 1, 9).setValue(appointment);
      if (duration) sheet.getRange(i + 1, 10).setValue(duration);
      if (type) sheet.getRange(i + 1, 11).setValue(type);
      return;
    }
  }
}

function doGet(e) {
  // Also handle GET requests with URL params (fallback for CORS)
  if (e && e.parameter && e.parameter.email) {
    try {
      var ss = SpreadsheetApp.openById(SHEET_ID);
      var sheet = ss.getSheetByName('Leads') || ss.getActiveSheet();
      var data = e.parameter;

      if (data.status === 'booked') {
        updateLeadStatus(sheet, data.email, data.appointment, data.meeting_duration, data.meeting_type);
      } else {
        sheet.appendRow([
          data.timestamp || new Date().toISOString(),
          data.name || '',
          data.lastname || '',
          data.email || '',
          data.phone || '',
          data.company || '',
          data.source || 'solarresult.de',
          'Neuer Lead',
          '',
          data.meeting_duration || '30 Minuten',
          data.meeting_type || 'Google Meet'
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

  return ContentService
    .createTextOutput(JSON.stringify({ status: 'ok', message: 'SolarResult Lead Webhook is active' }))
    .setMimeType(ContentService.MimeType.JSON);
}
