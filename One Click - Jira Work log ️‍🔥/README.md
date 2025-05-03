# Jira Work Logger

> One-click solution to log your work hours automatically

## Overview

This script allows you to log your work hours in Jira with a single click. It automatically distributes work hours across your assigned tickets within a specified date range.

## Quick Start

1. Open the `add_worklogs.js` file
2. Configure the date range in the `USER_CONFIG` object
3. Run the `generateAndLogTimesheet` method

## Configuration

Edit the `USER_CONFIG` object with your preferences:

```javascript
const USER_CONFIG = {
  defaultStartDate: "YYYY-MM-DD", // Start date
  defaultEndDate: "YYYY-MM-DD",   // End date (⚠️ range must be < 32 days)
  workingDays: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"], // Default working days
  minTicketsPerDay: 0, // Minimum random tickets per day
  maxTicketsPerDay: 0  // Maximum random tickets per day
}
```

**Note:** If both `minTicketsPerDay` and `maxTicketsPerDay` are set to 0, the script will use all tickets updated within the date range and assigned to you, distributing work hours evenly.

## How It Works

The script:

1. Fetches your credentials (Jira username, token, account ID) from the Properties Service
2. Retrieves all Jira tickets that:
   - Were updated between your specified dates
   - Are assigned to you
   - Are not in the "To Do" state
3. Calculates worklog hours based on your configuration
4. Creates time logs on each ticket
5. Sends you an email summary of all created worklog entries

## Maximum Hours

The script can log up to **8 hours per day**.

## Made a Mistake?

If you logged the wrong dates by mistake, don't worry! The confirmation email includes all worklog IDs. You can use the `delete_worklog` script to remove them by copying the IDs into the `WORKLOG_IDS` variable.

## Prerequisites

Ensure that all your Jira credentials are provided in the Properties Service before running the script.

---

✅ Copy this project and start logging your work with ease!
