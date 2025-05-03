function initialize() {
  const triggers = ScriptApp.getProjectTriggers();
  let found = false;

  for (var i = 0; i < triggers.length; i++) {
    if (triggers[i].getHandlerFunction() === 'jiraWorklogDefaulterListGenerater') {
      found = true;
      break;
    }
  }

  if (!found) {
    ScriptApp.newTrigger('jiraWorklogDefaulterListGenerater')
      .timeBased().onWeekDay(ScriptApp.WeekDay.MONDAY).atHour(12)
      .create();
  }
}

function jiraWorklogDefaulterListGenerater() {
  try {
    fetchUserWorklogs();    
  } catch (error) {
    Logger.log(`Error: ${error}`);
    throw error;
  }
}


function fetchUserWorklogs() {
  const JIRA_DOMAIN = PropertiesService.getScriptProperties().getProperty('JIRA-DOMAIN');
  const API_TOKEN = PropertiesService.getScriptProperties().getProperty('JIRA-API-TOKEN');
  const USER_NAME = PropertiesService.getScriptProperties().getProperty('USER-NAME');
  const headers = {
    "Accept": "application/json",
    "Authorization": "Basic " + Utilities.base64Encode(USER_NAME + ":" + API_TOKEN)
  };
  let {last_monday, last_friday} = getLastWeekDateRange();
  const defaulters = [];
  TARGET_USERS.forEach(target_user => {
    const JQL = encodeURIComponent(`worklogAuthor = "${target_user}" AND worklogDate >= "${last_monday}" AND worklogDate <= "${last_friday}"`);
    const search_url = `https://${JIRA_DOMAIN}/rest/api/3/search?jql=${JQL}`;
    const search_response = UrlFetchApp.fetch(search_url, { method: "GET", headers: headers });
    const issues = JSON.parse(search_response.getContentText()).issues;
    let total_time_seconds = 0;
    issues.forEach(function (issue) {
      const worklog_url = `https://${JIRA_DOMAIN}/rest/api/3/issue/${issue.key}/worklog`;
      const worklog_response = UrlFetchApp.fetch(worklog_url, { method: "GET", headers: headers });
      const worklogs = JSON.parse(worklog_response.getContentText()).worklogs;

      worklogs.forEach(function (worklog) {
        if (worklog.author.emailAddress === target_user) {
          const worklog_date = worklog.started.substring(0, 10);
          if (worklog_date >= last_monday && worklog_date <= last_friday) {
            total_time_seconds += worklog.timeSpentSeconds;
          }
        }
      });
    });
    if((total_time_seconds / 3600).toFixed(2) < MIN_WORKLOG) {
      const total_worklog = (total_time_seconds / 3600).toFixed(2);
      defaulters.push({
        message: `${formatUsername(target_user.split('@')[0])}:  ${total_worklog} hours`,
        total_worklog: total_worklog,
      })
    }
  });

  defaulters.sort((a, b) => parseFloat(a.total_worklog) - parseFloat(b.total_worklog));
  sendTeamSummaryEmail(defaulters, last_monday, last_friday);

}


function formatUsername(rawUsername) {
  const cleaned = rawUsername.replace(/\./g, ' ');
  
  const parts = cleaned.split(' ');

  const formatted = parts.map(part => 
    part.charAt(0).toUpperCase() + part.slice(1).toLowerCase()
  );

  return formatted.join(' ');
}


function getLastWeekDateRange() {
  const today = new Date();
  const day = today.getDay(); 

  const lastMonday = new Date(today);
  lastMonday.setDate(today.getDate() - day - 6);

  // Get to last Friday
  const lastFriday = new Date(lastMonday);
  lastFriday.setDate(lastMonday.getDate() + 4);

  const formatDate = (date) => date.toISOString().split("T")[0];

  return {
    last_monday: formatDate(lastMonday),
    last_friday: formatDate(lastFriday)
  };
}



function sendTeamSummaryEmail(defaulters, start_date, end_date) {
  const sorted_defaulters = defaulters.map(defaulter => defaulter.message);  
  const htmlBody = createTeamSummaryEmailHTML(sorted_defaulters, start_date, end_date);
  
  
  GmailApp.sendEmail(
    TARGET_USERS.join(','),
    `Jira Worklog Defaulters Report (${start_date} to ${end_date})`,
    `This email requires HTML to display properly.`,
    { 
      htmlBody: htmlBody,
      cc: MANAGER_ID.join(','),
      name: 'Jira Worklog Monitor'
    }
  );
}

function sendTeamSummaryEmail(defaulters, start_date, end_date) {
  const sorted_defaulters = defaulters.map(defaulter => defaulter.message);  
  const htmlBody = createTeamSummaryEmailHTML(sorted_defaulters, start_date, end_date);
  
  
  GmailApp.sendEmail(
    TARGET_USERS.join(','),
    `Jira Worklog Defaulters Report (${start_date} to ${end_date})`,
    `This email requires HTML to display properly.`,
    { 
      htmlBody: htmlBody,
      cc: MANAGER_ID,
      name: 'Jira Worklog Monitor'
    }
  );
}

function createTeamSummaryEmailHTML(defaulters, start_date, end_date) {  
  return `
  <!DOCTYPE html>
  <html>
  <head>
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
      body {
        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        margin: 0;
        padding: 0;
        background-color: #f9f9f9;
        color: #333;
      }
      .container {
        max-width: 600px;
        margin: 0 auto;
        padding: 20px;
        background-color: #ffffff;
        border-radius: 8px;
        box-shadow: 0 2px 10px rgba(0,0,0,0.1);
      }
      .header {
        background-color: #0052cc;
        color: white;
        padding: 15px 20px;
        border-radius: 8px 8px 0 0;
        margin: -20px -20px 20px;
      }
      .header h1 {
        margin: 0;
        font-size: 24px;
      }
      .header p {
        margin: 5px 0 0;
        font-size: 14px;
        opacity: 0.8;
      }
      .content {
        padding: 0 10px;
      }
      .defaulters-list {
        background-color: #f4f5f7;
        border-left: 4px solid #e74c3c;
        padding: 15px;
        border-radius: 4px;
        margin: 20px 0;
      }
      .defaulters-list h3 {
        margin-top: 0;
        color: #e74c3c;
        font-size: 16px;
      }
      .defaulter-table {
        width: 100%;
        border-collapse: collapse;
        margin: 15px 0;
        box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        border-radius: 5px;
        overflow: hidden;
        table-layout: fixed;
      }
      .defaulter-table th {
        background-color: #f0f0f0;
        text-align: left;
        padding: 8px;
        font-weight: 600;
        color: #333;
        border-bottom: 2px solid #ddd;
        font-size: 14px;
      }
      .defaulter-table td {
        padding: 8px;
        border-bottom: 1px solid #eee;
        vertical-align: middle;
        word-wrap: break-word;
        font-size: 14px;
      }
      .defaulter-table tr:last-child td {
        border-bottom: none;
      }
      .defaulter-table tr:nth-child(even) {
        background-color: #f9f9f9;
      }
      .defaulter-table tr:hover {
        background-color: #f0f4f9;
      }
      .hours-cell {
        text-align: center;
        font-weight: 600;
        color: #e74c3c;
      }
      .user-cell {
        display: flex;
        align-items: center;
      }
      .avatar {
        width: 30px;
        height: 30px;
        min-width: 30px;
        background-color: #f2f3f5;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        margin-right: 8px;
        font-weight: bold;
        color: #5e6c84;
        text-transform: uppercase;
        font-size: 14px;
        letter-spacing: 0.5px;
        box-shadow: 0 1px 3px rgba(0,0,0,0.08);
      }
      .progress-container {
        width: 100%;
        background-color: #e0e0e0;
        border-radius: 4px;
        height: 8px;
        margin-top: 5px;
      }
      .progress-bar {
        height: 100%;
        background-color: #e74c3c;
        border-radius: 4px;
      }
      .button-link {
        display: inline-block;
        padding: 12px 24px;
        background-color: #0052cc;
        color: white !important;
        text-decoration: none;
        border-radius: 5px;
        font-weight: 600;
        font-family: sans-serif;
        transition: background-color 0.3s ease;
        text-align: center;
        margin: 20px 0;
      }
      .button-link:hover {
        background-color: #0047b3;
      }
      .action-box {
        background-color: #e6f7ff;
        border-left: 4px solid #0052cc;
        padding: 15px;
        border-radius: 4px;
        margin: 25px 0 15px;
      }
      .action-box h3 {
        margin-top: 0;
        color: #0052cc;
      }
      .footer {
        margin-top: 30px;
        font-size: 12px;
        color: #777;
        text-align: center;
        border-top: 1px solid #eee;
        padding-top: 15px;
      }
      
      /* Mobile Responsive Adjustments */
      @media screen and (max-width: 480px) {
        .container {
          padding: 15px;
        }
        .header {
          padding: 12px 15px;
          margin: -15px -15px 15px;
        }
        .header h1 {
          font-size: 20px;
        }
        .defaulter-table th, 
        .defaulter-table td {
          padding: 6px;
          font-size: 12px;
        }
        .defaulters-list h3 {
          font-size: 14px;
        }
        .avatar {
          width: 24px;
          height: 24px;
          min-width: 24px;
          font-size: 12px;
          margin-right: 6px;
        }
        .content {
          padding: 0 5px;
        }
        
        /* Table layout for very small screens */
        .user-column {
          width: 33%;
        }
        .hours-column {
          width: 27%;
        }
        .completion-column {
          width: 40%;
        }
      }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <h1>Jira Worklog - Defaulter Report</h1>
        <p>Reporting period: ${start_date} to ${end_date}</p>
      </div>
      
      <div class="content">
        <p>Hi Team,</p>
        <p>Here's the weekly summary of users who have logged fewer than ${MIN_WORKLOG} hours in Jira during the last week.</p>
        
        ${defaulters.length > 0 ? `
        <div class="defaulters-list">
          <h3>Users who have logged fewer than 40 hours between last Monday and Friday:</h3>
          
          <table class="defaulter-table">
            <thead>
              <tr>
                <th class="user-column">User</th>
                <th class="hours-column">Hours</th>
                <th class="completion-column">Completion</th>
              </tr>
            </thead>
            <tbody>
              ${defaulters.map(defaulter => {
                const userName = defaulter.split(':')[0].trim();
                const hours = parseFloat(defaulter.split(':')[1].trim().replace('h', ''));
                const percentComplete = Math.min(100, Math.round((hours / MIN_WORKLOG) * 100));
                const initials = userName.split(' ').map(name => name[0]).join('').substring(0, 2);
                
                return `
                <tr>
                  <td>
                    <div class="user-cell">
                      <div class="avatar">${initials}</div>
                      ${userName}
                    </div>
                  </td>
                  <td class="hours-cell">${hours}h</td>
                  <td>
                    <div>${percentComplete}%</div>
                    <div class="progress-container">
                      <div class="progress-bar" style="width: ${percentComplete}%"></div>
                    </div>
                  </td>
                </tr>`;
              }).join('')}
            </tbody>
          </table>
        </div>
        <p>Please ensure team members update their worklog entries as soon as possible.</p>
        ` : `
        <p style="color: #27ae60; font-weight: bold;">Great news! All team members have logged the required minimum worklog hours.</p>
        `}
        
      </div>

      <div class="action-box">
        <h3>Log Your Work With One Click</h3>
        <p>Set up our easy-to-use project and stay on top of your worklog requirements:</p>
        <div style="text-align: center;">
          <a href="https://github.com/balajisuresh1359/app-scripts/tree/377db96b54e0a4b8aa1a8fa9a095a0840fdc030c/One%20Click%20-%20Jira%20Work%20log%20%EF%B8%8F%E2%80%8D%F0%9F%94%A5" class="button-link">Set Up Worklog Project</a>
        </div>
      </div>
      
      <div class="footer">
        <p>This is an automated message from the Jira Worklog Monitor system.</p>
        <p>Tech Team</p>
      </div>
    </div>
  </body>
  </html>
  `;
}
