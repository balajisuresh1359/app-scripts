
function getUnrepliedMails() {
  const today = new Date();
  const daysLimit = new Date(today);
  daysLimit.setDate(today.getDate() - dayLimitToProcess);
  
  const formattedDate = Utilities.formatDate(daysLimit, Session.getScriptTimeZone(), 'yyyy/MM/dd');
  const subjectQuery = keyWords.map(keyword => `subject:${keyword}`).join(' OR ');
  const emailQuery = expectedMailIds.map(email => `(cc:${email} OR to:${email})`).join(' OR ');
  const query = `(${subjectQuery}) after:${formattedDate} OR (${emailQuery}) after:${formattedDate}`;
  
  const threads = GmailApp.search(query);
  const unrepliedSubjects = extractUnrepliedSubjects(threads);

  const properties = PropertiesService.getScriptProperties();
  const prevRbCount = parseInt(properties.getProperty('prevRbCount'), 10) || 0;
  const percentageChange = calculatePercentageChange(prevRbCount, unrepliedSubjects.length);
  properties.setProperty('prevRbCount', unrepliedSubjects.length.toString());
  return [unrepliedSubjects, percentageChange];
}

function extractUnrepliedSubjects(threads) {
  const unrepliedSubjects = [];
  const now = new Date();

  threads.forEach(thread => {
    const messages = thread.getMessages();
    const hasReplyFromTeamMails = messages.some(message => 
      teamMembers.some(email => message.getFrom().includes(email))
    );

    if (!hasReplyFromTeamMails) {
      const closedThread = messages.some(message => 
        closingParse.some(keyword => message.getPlainBody().toLowerCase().includes(keyword))
      );

      if (!closedThread) {
        const firstMessage = messages[0];
        const subject = firstMessage.getSubject().trim().toLowerCase();

        const isExcluded = excludedKeywords.some(keyword => subject.includes(keyword));
        const isRelevant = keyWords.some(keyword => 
          subject.includes(keyword) || firstMessage.getPlainBody().toLowerCase().includes(keyword)
        );
        const isPriority = priorityKeywords.some(keyword => 
          subject.includes(keyword) || firstMessage.getPlainBody().toLowerCase().includes(keyword)
        );

        if (!isExcluded && isRelevant) {
          const messageTime = firstMessage.getDate();
          const timeDiffMinutes = Math.round((now - messageTime) / (1000 * 60) / 60);

          const taggedSubject = `${isPriority ? ' *[Priority]* ' : ''}${firstMessage.getSubject().trim()} (Received ${timeDiffMinutes} hr ago)`;
          unrepliedSubjects.push(taggedSubject);
        }
      }
    }
  });

  return unrepliedSubjects;
}



function buildReportMessage(unrepliedSubjects, percentageChange, messageId, jiraOpenRBs, sheetId) {
  let message = `[ New Report - ${messageId} ]\n\n`;
  message += `Hello team,\n\nIt appears that some *${teamName}* Rb emails are still pending review. Here's a summary of the current status.\n\n`;

  message += `━━━━━━━━━━━━━━━━━━━━\n`;
  message += `📝 *Unreplied Subjects* \n\n`;
  
  if (unrepliedSubjects.length === 0) {
    unrepliedSubjects.push(`No pending subjects for *${teamName}* Rb - all caught up! 🎉`);
  } else {
    unrepliedSubjects.sort((a, b) => b.includes('[Priority]') - a.includes('[Priority]'));
  }

  message += `${unrepliedSubjects.map(subject => `- ${subject}`).join('\n')}\n\n`;

  message += `━━━━━━━━━━━━━━━━━━━━\n`;
  message += `📊 *Report Summary* \n\n`;
  message += `- *Percentage Change:* ${percentageChange.report}\n\n`;

  if (addReportToSheets) {
    message += `━━━━━━━━━━━━━━━━━━━━\n`;
    message += `📄 *Full Report Available in Google Sheets* \n\n`;
    message += `- Open Google Sheets: https://docs.google.com/spreadsheets/d/${sheetId} \n\n`;
  }

  if (jiraOpenRBs) {
    message += jiraOpenRBs;
  }
  
  return message;
}
