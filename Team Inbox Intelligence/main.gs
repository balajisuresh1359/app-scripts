function initializeTrigger() {
  const triggers = ScriptApp.getProjectTriggers();
  const triggerName = 'generateAndSendRBReport';
  let found = false;

  triggers.forEach(trigger => {
    if (trigger.getHandlerFunction() === triggerName) {
      found = true;
    }
  });

  if (!found) {
    ScriptApp.newTrigger(triggerName)
      .timeBased()
      .everyHours(triggerFreq)
      .create();
  }
}

function generateAndSendRBReport() {
  try {
    const [jiraAPIToken, webhookLink, sheetId, lastMessageId] = fetchAndvalidateInputs();
    const messageId = getMessageId();
    
    let [unrepliedSubjects, percentageChange] = getUnrepliedMails();
    
    
    if (addReportToSheets) {
      const prevSheetData = fetchSheetData(sheetId, lastMessageId);
      saveResultsToSheet(unrepliedSubjects, percentageChange, sheetId, messageId, prevSheetData);
      unrepliedSubjects = filterUnrepliedMails(prevSheetData, unrepliedSubjects);
    }
    
    
    let jiraOpenRBs = null;
    if (includeJiraOpenRB) jiraOpenRBs = fetchJiraOpenRbDetails(jiraAPIToken);
    
    sendMessage(buildReportMessage(unrepliedSubjects, percentageChange, messageId, jiraOpenRBs, sheetId), webhookLink);
    
    PropertiesService.getScriptProperties().setProperty('latestMessageId', messageId);
    
  } catch (error) {
    tryToSendFailureMessage(error);
    Logger.log(`Error: ${error}`);
    throw error;
  }
}

function tryToSendFailureMessage(error) {
  const properties = PropertiesService.getScriptProperties();
  const webhookLink = properties.getProperty('WEBHOOK-LINK');
  const message = `Hi team,\nThe RB report generation script failed. Please check the message below for debugging.\n\n${error}`;
  sendMessage(message, webhookLink);
}
