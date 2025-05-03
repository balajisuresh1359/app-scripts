function fetchJiraOpenRbDetails(jiraAPIToken) {
  const bugOrigins = jiraBugOriginList.map(item => `"${item}"`).join(",");
  const jqlQuery = `project in ("Report Bugs") AND created >= ${jiraOpenRBStartingDate} and "Bug Origin[Dropdown]" in (${bugOrigins}) and status not in ('Invalid bug','Done','Duplicate Bug')`;

  const encodedJql = encodeURIComponent(jqlQuery);
  const fields = 'created,key,summary';
  const url = `${jiraURL}?jql=${encodedJql}&fields=${fields}`;

  const options = {
    method: 'get',
    headers: {
      'Authorization': 'Basic ' + Utilities.base64Encode(`${jiraUserName}:${jiraAPIToken}`),
      'Accept': 'application/json'
    },
    muteHttpExceptions: true
  };

  const response = UrlFetchApp.fetch(url, options);
  const jsonResponse = JSON.parse(response.getContentText());
  const issues = jsonResponse.issues;

  let rblist = '';
  issues.forEach(issue => {
    rblist += `*🔹 Summary:* ${truncateText(issue.fields.summary, 50)}\n*📝 Jira ID:* ${issue.key}\n*📅 Created Date:* ${formatDate(issue.fields.created)}\n\n`;
  });

  let rb_report;
  if (rblist.length === 0) {
    rb_report = '*🎉 No open RB tickets today! 🎉🎉🎉*';
  } else {
    rb_report = `Here is the list of open RB tickets:\n\n${rblist}`;
  }

  let message = `━━━━━━━━━━━━━━━━━━━━\n📌 *JIRA OPEN RB LIST:*
      ${rb_report}To View the Jira Tickets.
        `;

  return message;
}
