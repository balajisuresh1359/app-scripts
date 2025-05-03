function saveResultsToSheet(unrepliedSubjects, percentageChange, sheetId, messageId, prevSheetData) {
  const currentTime = new Date();
  const sheetName = `${teamName} - ${messageId} - ${Utilities.formatDate(currentTime, Session.getScriptTimeZone(), 'yyyy-MM-dd HH:mm')}`;
  const spreadsheet = SpreadsheetApp.openById(sheetId);
  
  let sheet = spreadsheet.getSheetByName(sheetName);
  
  if (!sheet) {
    sheet = spreadsheet.insertSheet(sheetName);
    sheet.getRange('A1').setValue('Subject').setFontWeight('bold');
    sheet.getRange('B1').setValue('Percentage Change').setFontWeight('bold');
    sheet.getRange('C1').setValue('Report').setFontWeight('bold');
    sheet.getRange('D1').setValue('Comments').setFontWeight('bold');
  }
  
  unrepliedSubjects.forEach((subject, index) => {
    const prevRow = prevSheetData.find(row => row[0] === subject); 
    const comment = prevRow && prevRow.length > 3 ? prevRow[3] : ''; 
    
    sheet.getRange(index + 2, 1).setValue(subject); 
    sheet.getRange(index + 2, 4).setValue(comment);
  });
  
  sheet.getRange(2, 2).setValue(percentageChange.percentageChange + '%');
  sheet.getRange(2, 3).setValue(percentageChange.report);
  
  const range = sheet.getRange(2, 1, unrepliedSubjects.length, 4);
  range.setBorder(true, true, true, true, true, true);
  sheet.autoResizeColumns(1, 4);
}

function fetchSheetData(sheetId, messageId) {
  const spreadsheet = SpreadsheetApp.openById(sheetId);
  const sheets = spreadsheet.getSheets();
  const relevantSheets = sheets.filter(sheet => sheet.getName().startsWith(`${teamName} - ${messageId}`));
  
  if (relevantSheets.length > 0) {
    const sheet = relevantSheets[0];
    const data = sheet.getDataRange().getValues();
    return data;
  }
  
  return [];
}

function filterUnrepliedMails(prevSheetData, unrepliedSubjects) {
  const filteredSubjects = unrepliedSubjects.filter(subject => {
    return !prevSheetData.some(row => 
      row[0] === subject && (row[3] === 'addressed' || row[3] === 'invalid')
    );
  });
  
  return filteredSubjects;
}

