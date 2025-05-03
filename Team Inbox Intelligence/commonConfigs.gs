//Keywords
// Everything should be in lowercase
const keyWords = []; 
const excludedKeywords = [];
const priorityKeywords = ['alert', 'urgent', 'high-priority'];
const closingParse = [
  "closing this mail thread", 
  "resolved now",
  "issue has been resolved",
];

// Team mail ids
const expectedMailIds = [];
const teamMembers = [];


// Other Configs
const teamName = 'No-Name';
const dayLimitToProcess = 2;
const triggerFreq = 6;
const addReportToSheets = true;
const sheetPageLimit = 100;

// JIRA
const includeJiraOpenRB = true;
const jiraURL = '';
const jiraOpenRBStartingDate = '2024-08-01';
const jiraBugOriginList = [];
const jiraUserName = null;
const jiraFilterId = 0;


