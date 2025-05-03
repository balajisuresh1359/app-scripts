const WORKLOG_IDS = [
  {
    "id": "11504037",
    "issue_id": "11236821"
  },
]

function deleteJiraWorklogs() {
  if(WORKLOG_IDS.length === 0) return;
  const property = PropertiesService.getScriptProperties();
  const JIRA_DOMAIN = property.getProperty('jiraUrl');
  const EMAIL = property.getProperty('username');
  const API_TOKEN = property.getProperty('apiToken'); 
  const AUTH_HEADER = 'Basic ' + Utilities.base64Encode(EMAIL + ':' + API_TOKEN);

  WORKLOG_IDS.forEach(item => {
    const issueIdOrKey = item.issue_id; 
    const worklogId = item.id; 

    const url = `${JIRA_DOMAIN}/rest/api/3/issue/${issueIdOrKey}/worklog/${worklogId}`;

    const options = {
      method: 'delete',
      headers: {
        'Authorization': AUTH_HEADER,
        'Accept': 'application/json'
      },
      muteHttpExceptions: true
    };

    try {
      const response = UrlFetchApp.fetch(url, options);
      Logger.log(`Deleted worklog ${worklogId} (Status: ${response.getResponseCode()})`);
    } catch (error) {
      Logger.log(`Failed to delete worklog ${worklogId}: ${error}`);
    }
  });
}
