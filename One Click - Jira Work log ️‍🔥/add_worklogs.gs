// Except for the dates, if you’re not sure about the other fields, please don’t change the default values.
const USER_CONFIG = {
  defaultStartDate: '2025-04-28',
  defaultEndDate: '2025-05-04',
  workingDays: [1, 2, 3, 4, 5],
  defaultComment: `Work performed on ticket: ${new Date().toISOString().slice(0, 10)}`,
  
  // Maximum hours per day - EXACTLY this amount will be logged across all tickets each day
  maxHoursPerDay: 8,

  // Minimum number of tickets to log per day (will use random selection if more tickets available)
  // Setting this to 0 will use all available tickets for each day
  minTicketsPerDay: 0,
  
  // Maximum number of tickets to log per day (0 = no limit, will use all available tickets)
  maxTicketsPerDay: 2
};

function generateAndLogTimesheet() {
  loadProperties();
  const startDate = USER_CONFIG.defaultStartDate;
  const endDate = USER_CONFIG.defaultEndDate;
  if(isGivenDatesMoreThan32Days()) {
    console.log(`The given date range from ${startDate} to ${endDate} exceeds 32 days. Please review it`);
    return;
  }

  console.log(`Generating timesheets from ${startDate} to ${endDate}`);
  
  // 1. Get all working days in the date range
  const workingDays = getWorkingDaysInRange(startDate, endDate);
  console.log(`Found ${workingDays.length} working days in range`);
  
  if (workingDays.length === 0) {
    console.log('No working days in the specified range. Exiting.');
    return;
  }
  
  // 2. Get all assigned tickets in the date range
  const assignedTickets = getAssignedTickets(startDate, endDate);
  console.log(`Found ${assignedTickets.length} assigned tickets`);
  
  if (assignedTickets.length === 0) {
    console.log('No assigned tickets found. Exiting.');
    return;
  }
  
  // 3. For each day, select tickets and generate timesheets
  const timesheets = [];
  workingDays.forEach(day => {
    // Select tickets for this specific day (allows randomization)
    const ticketsForDay = selectTicketsForDay(assignedTickets);
    if (ticketsForDay.length === 0) {
      console.log(`No tickets selected for ${day}. Skipping.`);
      return;
    }
    
    // Generate timesheet entries for this day
    const dayEntries = generateTimesheetsForDay(day, ticketsForDay);
    timesheets.push(...dayEntries);
  });
  
  // 4. Verify total hours per day
  const hoursByDay = {};
  timesheets.forEach(entry => {
    const hours = parseFloat(entry.timeSpent.replace('h', ''));
    if (!hoursByDay[entry.date]) hoursByDay[entry.date] = 0;
    hoursByDay[entry.date] += hours;
  });
  
  // Log total hours per day to verify we have exactly maxHoursPerDay
  for (const [date, totalHours] of Object.entries(hoursByDay)) {
    console.log(`Total hours for ${date}: ${Math.floor(totalHours)} hours`);
    if (Math.abs(totalHours - USER_CONFIG.maxHoursPerDay) > 0.01) {
      console.warn(`⚠️ Warning: Total hours for ${date} is not exactly ${USER_CONFIG.maxHoursPerDay} hours`);
    }
  }
  
  // 5. Log time to Jira
  logTimeToJira(timesheets);

  console.log(`Work hours logged successfully for the date range from ${startDate} to ${endDate}`);
}

function isGivenDatesMoreThan32Days() {
  const date1 = new Date(USER_CONFIG.defaultStartDate);
  const date2 = new Date(USER_CONFIG.defaultEndDate);
  const diffInMs = Math.abs(date2 - date1);
  const diffInDays = diffInMs / (1000 * 60 * 60 * 24);
  const isMoreThan32Days = diffInDays > 32;
  return isMoreThan32Days;
}

function loadProperties() {
  const property = PropertiesService.getScriptProperties();
  USER_CONFIG.jiraUrl = property.getProperty('jiraUrl');
  USER_CONFIG.username = property.getProperty('username');
  USER_CONFIG.apiToken = property.getProperty('apiToken');
  USER_CONFIG.accountId = property.getProperty('accountId');
  const requiredProps = ['jiraUrl', 'username', 'apiToken', 'accountId'];
  for (const prop of requiredProps) {
    if (!USER_CONFIG[prop]) {
      throw new Error(`Missing required property: ${prop}`);
    }
  }

}

function getWorkingDaysInRange(startDateStr, endDateStr) {
  function formatDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
  const startDate = new Date(startDateStr);
  const endDate = new Date(endDateStr);
  const workingDays = [];
  
  const currentDate = new Date(startDate);
  while (currentDate <= endDate) {
    const dayOfWeek = currentDate.getDay();
    if (USER_CONFIG.workingDays.includes(dayOfWeek)) {
      workingDays.push(formatDate(currentDate));
    }    
    currentDate.setDate(currentDate.getDate() + 1);
  }
  return workingDays;
}


function getAssignedTickets(startDate, endDate) {
  let jql = `assignee = currentUser() AND updated >= "${startDate}" AND updated <= "${endDate}" and status NOT IN ("To-Do", "To Do")`;

  const url = `${USER_CONFIG.jiraUrl}/rest/api/3/search`;
  const options = {
    method: 'post',
    contentType: 'application/json',
    headers: {
      'Authorization': 'Basic ' + Utilities.base64Encode(`${USER_CONFIG.username}:${USER_CONFIG.apiToken}`)
    },
    payload: JSON.stringify({
      jql: jql,
      maxResults: 100,
      fields: ['key', 'summary', 'status']
    }),
    muteHttpExceptions: true
  };
  
  try {
    const response = UrlFetchApp.fetch(url, options);
    const responseCode = response.getResponseCode();
    
    if (responseCode >= 200 && responseCode < 300) {
      const data = JSON.parse(response.getContentText());
      return data.issues.map(issue => ({
        key: issue.key,
        summary: issue.fields.summary,
        status: issue.fields.status.name
      }));
    } else {
      console.error(`Error fetching tickets: HTTP ${responseCode}`);
      console.error(response.getContentText());
      throw 'Unable to fetch all assigned tickets';
    }
  } catch (error) {
    console.error('Error fetching tickets:', error);
    throw 'Unable to fetch all assigned tickets';
  }
}

function selectTicketsForDay(allTickets) {
  if (!allTickets || allTickets.length === 0) return [];
  
  if (USER_CONFIG.minTicketsPerDay <= 0 && USER_CONFIG.maxTicketsPerDay <= 0) {
    return allTickets;
  }
  
  let ticketCount = allTickets.length;
  
  if (USER_CONFIG.minTicketsPerDay > 0) {
    ticketCount = Math.max(USER_CONFIG.minTicketsPerDay, ticketCount);
  }
  
  if (USER_CONFIG.maxTicketsPerDay > 0) {
    ticketCount = Math.min(USER_CONFIG.maxTicketsPerDay, ticketCount);
  }
  
  if (ticketCount >= allTickets.length) {
    return allTickets;
  }
  
  const shuffled = [...allTickets];
  
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  
  return shuffled.slice(0, ticketCount);
}

function generateTimesheetsForDay(date, tickets) {
  const dayEntries = [];
  
  const totalHoursPerDay = USER_CONFIG.maxHoursPerDay;
  
  if (!tickets || tickets.length === 0) return [];
  
  const hoursPerTicket = Math.floor((totalHoursPerDay / tickets.length) * 100) / 100;
  let remainingHours = totalHoursPerDay;
  
  tickets.forEach((ticket, index) => {
    let ticketHours;
    
    if (index === tickets.length - 1) {
      ticketHours = Math.round(remainingHours * 100) / 100;
    } else {
      ticketHours = hoursPerTicket;
    }
    
    remainingHours -= ticketHours;
    
    if (ticketHours > 0) {
      const timeSpent = `${ticketHours}h`;
      
      dayEntries.push({
        date: date,
        ticketKey: ticket.key,
        ticketSummary: ticket.summary,
        timeSpent: timeSpent,
        comment: {
          "content": [
            {
              "content": [
                {
                  "text": USER_CONFIG.defaultComment,
                  "type": "text"
                }
              ],
              "type": "paragraph"
            }
          ],
          "type": "doc",
          "version": 1
        }
      });
    }
  });
  return dayEntries;
}

function logTimeToJira(timesheets) {
  let successCount = 0;
  let failedCount = 0;
  const worklog_data = [];
  const created_ids = [];
  timesheets.forEach(entry => {    
    const startTime = new Date(entry.date);
    startTime.setHours(10, 0, 0, 0); // Start at 10 AM
    const startedStr = startTime.toISOString().replace('Z', '+0000');
    
    // Prepare worklog payload
    const payload = {
      comment: entry.comment,
      started: startedStr,
      timeSpent: entry.timeSpent
    };
    
    console.log(payload, entry.ticketSummary)
    // Prepare API request
    const url = `${USER_CONFIG.jiraUrl}/rest/api/3/issue/${entry.ticketKey}/worklog`;
    const options = {
      method: 'post',
      contentType: 'application/json',
      headers: {
        'Authorization': 'Basic ' + Utilities.base64Encode(`${USER_CONFIG.username}:${USER_CONFIG.apiToken}`)
      },
      payload: JSON.stringify(payload),
      muteHttpExceptions: true
    };
    try {
      const response = UrlFetchApp.fetch(url, options);
      const responseCode = response.getResponseCode();
      
      if (responseCode >= 200 && responseCode < 300) {
        console.log(`✅ Logged ${entry.timeSpent} on ${entry.date} for ${entry.ticketKey}: ${entry.ticketSummary}`);
        successCount++;
        worklog_data.push({
          comment: USER_CONFIG.defaultComment,
          started: startedStr,
          timeSpent: entry.timeSpent,
          name: entry.ticketSummary,
        });
        const res = JSON.parse(response.getContentText());
        created_ids.push({id: res.id, issue_id: res.issueId});
      } else {
        console.error(`❌ Failed to log time for ${entry.ticketKey} on ${entry.date}: HTTP ${responseCode}`);
        console.error(response.getContentText());
        failedCount++;
      }
    } catch (error) {
      console.error(`❌ Error logging time for ${entry.ticketKey} on ${entry.date}:`, error);
      failedCount++;
    }
  });  
  sendMail(worklog_data, created_ids)
  console.log(`Time logging complete. Success: ${successCount}, Failed: ${failedCount}`);
}


function formatDate(dateString) {
  const date = new Date(dateString);
  const options = { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric', 
    hour: '2-digit', 
    minute: '2-digit'
  };
  return date.toLocaleDateString('en-US', options);
}

function generateWorklogTable(worklogData) {
  let tableRows = '';
  
  worklogData.forEach((entry, index) => {
    const formattedDate = formatDate(entry.started);
    
    tableRows += `
      <tr ${index % 2 === 0 ? 'class="even-row"' : ''}>
        <td>${entry.name || 'N/A'}</td>
        <td>${formattedDate}</td>
        <td>${entry.timeSpent}</td>
        <td>${entry.comment}</td>
      </tr>
    `;
  });
  
  const table = `
    <table border="0" cellpadding="0" cellspacing="0" width="100%" class="worklog-table">
      <thead>
        <tr>
          <th>Task Name</th>
          <th>Started</th>
          <th>Time Spent</th>
          <th>Comment</th>
        </tr>
      </thead>
      <tbody>
        ${tableRows}
      </tbody>
    </table>
  `;
  
  return table;
}

function sendMail(worklog_data, created_ids) {
  const recipient = USER_CONFIG.username;
  const subject = `Work log report : ${new Date().toISOString().slice(0, 10)}`;
  
  const bodyText = "Please find the worklog report below.";
  
  const worklogTable = generateWorklogTable(worklog_data);
  const worklogText = JSON.stringify(created_ids, null, 2); 
  const bodyHtml = `
  <html>
    <head>
      <style>
        body { 
          font-family: Arial, sans-serif; 
          color: #333333;
        }
        .header { 
          color: #2c3e50; 
          font-size: 20px;
          padding: 20px 0 10px 0;
          border-bottom: 1px solid #e0e0e0;
        }
        .content { 
          margin: 20px 0; 
          line-height: 1.5; 
        }
        .worklog-table {
          width: 100%;
          border-collapse: collapse;
          margin: 15px 0;
        }
        .worklog-table th { 
          background-color: #4472C4;
          color: white;
          text-align: left;
          padding: 10px;
          font-weight: normal;
        }
        .worklog-table td {
          padding: 8px 10px;
          border-bottom: 1px solid #e0e0e0;
        }
        .even-row {
          background-color: #f2f6fc;
        }
        .summary {
          margin-top: 20px;
          padding: 10px;
          background-color: #f2f6fc;
          border-left: 4px solid #4472C4;
        }
        .footer { 
          color: #7f8c8d; 
          font-size: 12px;
          margin-top: 30px;
          padding-top: 10px;
          border-top: 1px solid #e0e0e0;
        }
      </style>
    </head>
    <body>
      <div class="header">Work Log Report</div>
      <div class="content">
        <p>Hello,</p>
        <p>Here is your worklog report for the period from ${USER_CONFIG.defaultStartDate} to ${USER_CONFIG.defaultEndDate}:</p>
        
        ${worklogTable}
        
        <div class="summary">
          <strong>Summary:</strong> Logged ${calculateTotalTime(worklog_data)} of work across ${worklog_data.length} task${worklog_data.length !== 1 ? 's' : ''}.
        </div>
        <div class="summary">
          <strong>Created worklog IDs:</strong>
          <pre style="background-color:#f4f4f4; padding:10px; border-radius:4px;">
      ${worklogText}
          </pre>
        </div>
      </div>
      <div class="footer">
        This is an automated report.<br>
        Generated on ${new Date().toLocaleString()}
      </div>
    </body>
  </html>
  `;
  
  try {
    GmailApp.sendEmail(recipient, subject, bodyText, {
      htmlBody: bodyHtml
    });
    Logger.log("Worklog report sent successfully to " + recipient);
  } catch (error) {
    Logger.log("Error sending worklog report: " + error.toString());
  }
}

function calculateTotalTime(worklogData) {
  let totalHours = 0;
  let totalMinutes = 0;
  
  worklogData.forEach(entry => {
    const timeSpent = entry.timeSpent;
    
    const hoursMatch = timeSpent.match(/(\d+)h/);
    if (hoursMatch) {
      totalHours += parseInt(hoursMatch[1]);
    }
    
    const minutesMatch = timeSpent.match(/(\d+)m/);
    if (minutesMatch) {
      totalMinutes += parseInt(minutesMatch[1]);
    }
  });
  
  totalHours += Math.floor(totalMinutes / 60);
  totalMinutes = totalMinutes % 60;
  
  if (totalMinutes > 0) {
    return `${totalHours}h ${totalMinutes}m`;
  } else {
    return `${totalHours}h`;
  }
}
