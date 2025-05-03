function fetchAndvalidateInputs() {
  const properties = PropertiesService.getScriptProperties();
  const jiraAPIToken = properties.getProperty('JIRA-API-TOKEN');
  const webhookLink = properties.getProperty('WEBHOOK-LINK');
  const sheetId = properties.getProperty('SHEET-ID');
  const lastMessageId = properties.getProperty('latestMessageId');

  if(keyWords.length === 0)
    throw new Error(`Please provide the key words to check the mails`);

  if(jiraAPIToken === null && includeJiraOpenRB) 
    throw new Error(`Please provide the JIRA API Token. Save the token with the name 'JIRA-API-TOKEN' in the Script Properties under the Project Settings.`);
  
  if(webhookLink === null)
    throw new Error(`Please provide the Webhook token. Save the token with the name 'WEBHOOK-LINK' in the Script Properties under the Project Settings.`);
  
  if(sheetId === null && addReportToSheets)
    throw new Error(`Please provide the G-Sheet id. Save the value with the name 'SHEET-ID' in the Script Properties under the Project Settings.`);
  
  if (addReportToSheets) {
    const spreadsheet = SpreadsheetApp.openById(sheetId);
    const sheetCount = spreadsheet.getSheets().length;
    if (sheetCount >= sheetPageLimit) 
      throw new Error(`The spreadsheet has reached its limit of ${sheetPageLimit} sheets. Please provide new sheet to add reports.`);
  }

  if(jiraBugOriginList.length === 0) 
    throw new Error(`Please provide the Bug origin list in the Common configs.`);
  

  if(jiraUserName === null) 
    throw new Error(`Please provide the jiraUserName in the Common configs.`);

  return [jiraAPIToken, webhookLink, sheetId, lastMessageId]
}

