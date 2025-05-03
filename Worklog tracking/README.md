# Jira Worklog Monitor

> Automatically track and notify users with insufficient work logs

## Project Overview

This project monitors JIRA users' worklog activities and identifies users who haven't logged sufficient work hours. It uses the JIRA REST API to fetch worklog data, analyze it, and send notifications to users with insufficient logs.

## How It Works

The script performs the following operations:

1. **Fetch Target Users**: Retrieves user names from the `TARGET_USERS` array defined in `constant.gs`

2. **Analyze Work Logs**: For each user:
   - Checks worklog entries for the previous week (Monday - Friday)
   - Compares total logged hours against the `MIN_WORKLOG` threshold (defined in `constant.gs`)

3. **Identify Defaulters**: Users with total worklog time below the minimum threshold are flagged

4. **Send Notifications**: Sends email notifications to all identified users with insufficient work logs

## Process Details ⚙️

The workflow consists of these key steps:

1. **Fetch Issues**: Retrieves all issues where the user has logged work within the specified timeframe
2. **Calculate Worklog**: For each issue, calculates the total worklog hours
3. **Identify Defaulters**: Uses JIRA API data (email address, worklog timestamps, time spent) to identify users below the threshold
4. **Send Mail Notification**: Automatically sends email notifications to the list of defaulting users

## Configuration

Adjust the following settings in `constant.gs`:

- `TARGET_USERS`: Array of usernames to monitor
- `MIN_WORKLOG`: Minimum required worklog hours per week

## References 📝

- [JIRA Worklog API Documentation](https://developer.atlassian.com/cloud/jira/platform/rest/v3/api-group-issue-worklogs/#api-rest-api-3-issue-issueidorkey-worklog-get)
- [Google AppSheet Documentation](https://support.google.com/appsheet/answer/12007046?hl=en)

---

✅ Monitor your team's worklog compliance with ease!
