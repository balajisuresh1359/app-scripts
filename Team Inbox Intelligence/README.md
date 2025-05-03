# TeamRB Monitor

> Automated Request & Bug Tracking System for Teams

## Project Overview

TeamRB Monitor is designed to automatically generate team request and bug reports by integrating Gmail and JIRA services. It analyzes emails from a specified time period, identifying team-related requests based on keyword matching, and can also track open requests/bugs in JIRA. The final reports are delivered through Google Hangouts webhooks and can be stored in Google Sheets for record-keeping.

## Key Features

- **Email Analysis**: Processes emails from the past X days, analyzing subjects and first thread
- **Keyword Detection**: Identifies team-related requests based on configurable keywords
- **JIRA Integration**: Option to check and report on open requests/bugs in JIRA
- **Google Sheets Storage**: Option to store reports in Google Sheets for tracking and follow-up
- **Automated Notifications**: Sends reports to Google Hangouts at user-defined intervals
- **Priority-Based Sorting**: Sorts mail subjects by priority using configurable keywords
- **Failure Handling**: Provides detailed error messages if script execution fails

## Configuration

The `commonConfig` file is the central configuration file that allows any team to customize settings:

```javascript
// All configuration values should be in lowercase
{
  // Core Search Settings
  keyWords: ["keyword1", "keyword2"],              // Keywords to search in emails
  expectedMailIds: ["email1@domain.com"],          // Primary request sender emails (optional)
  teamMembers: ["member1@domain.com"],             // Team member emails (optional)
  excludedKeywords: ["ignore", "exclude"],         // Keywords to exclude from matches (optional)
  closingParse: ["closed", "done"],                // Skip emails with these closing words (optional)
  
  // Team & Processing Settings
  teamName: "your-team",                           // Your team name (optional)
  dayLimitToProcess: 2,                            // Days to check back from current date
  triggerFreq: 6,                                  // How often to run script (hours)
  
  // Output Settings
  addReportToSheets: true,                         // Add reports to Google Sheets
  sheetPageLimit: 100,                             // Page count limit in sheets
  
  // JIRA Integration
  includeJiraOpenRB: true,                         // Include JIRA open RBs in report
  jiraOpenRBStartingDate: "2024-08-01",            // Starting date for JIRA processing
  jiraBugOriginList: ["origin1", "origin2"],       // Bug origins of interest
  jiraUserName: "username",                        // JIRA username of a team member
  jiraFilterId: "filter-id",                       // Bug origin filter ID
  priorityKeywords: ["urgent", "critical"]         // Keywords for priority sorting
}
```

## Required Tokens

Add these values in the Script Properties under Project Settings:

1. **Webhook URL**:
   - Navigate to 'Space App and Integration' to create a webhook
   - Click "Add Webhooks" and enter webhook name
   - Copy the URL using the "Copy Link" option

2. **Google Sheets ID**:
   - Found in the spreadsheet URL: `https://docs.google.com/spreadsheets/d/SHEET-ID/`
   - You can add 'invalid' or 'addressed' in sheet comments to skip subjects in future reports

3. **JIRA API Token**:
   - Generate from: Manage Account > Security > Create and Manage API Tokens
   - URL: `https://id.atlassian.com/manage-profile/security`

## Setup Instructions

1. Configure all settings in the `commonConfig` file
2. Add required tokens to Script Properties
3. Run the `initializeTrigger` method from `main.js` to set up automatic execution

## Notes

- The script can only fetch data accessible to the executing user
- For optimal results, have a user with access to most relevant groups run the script
- Subject to Google Apps Script and JIRA API rate limits:
  - [Google Apps Script Quotas](https://developers.google.com/apps-script/guides/services/quotas)
  - [Atlassian API Rate Limits](https://developer.atlassian.com/server/hipchat/hipchat-rest-api-rate-limits/)

## Recent Updates (Sep 21, 2024)

- **Enhanced Sheets Integration**: Creates new pages for reports; supports 'invalid'/'addressed' comment filtering
- **JIRA Bug Origin Status**: Added reporting of open bug origins through webhooks
- **Priority-Based Sorting**: Implemented sorting of mail subjects using priority keywords
- **Improved Error Handling**: Users now receive detailed failure messages when script errors occur

---

✅ Automate your team's request and bug tracking with TeamRB Monitor!
