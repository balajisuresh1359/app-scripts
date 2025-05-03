function truncateText(text, maxLength) {
  return text.length > maxLength ? text.substring(0, maxLength - 3) + '...' : text;
}

function formatDate(dateString) {
    const date = new Date(dateString);
    const options = {
        day: '2-digit',
        month: 'long',
        year: 'numeric'
    };
    const formattedDate = date.toLocaleDateString('en-GB', options);
    return formattedDate;
}

function calculatePercentageChange(prevCount, currCount) {
  const normalizedPrevCount = prevCount === 0 ? 1 : prevCount;
  const normalizedCurrCount = currCount === 0 ? 1 : currCount;

  const change = normalizedCurrCount - normalizedPrevCount;
  const percentageChange = (change / normalizedPrevCount) * 100;
  const emojiCount = Math.abs(Math.round(percentageChange / 10));

  const getEmoji = (change) => {
    if (change > 0) return "📈".repeat(emojiCount);
    if (change < 0) return "📉".repeat(emojiCount);
    return "🔄";
  };

  const generateReport = () => {
    if (prevCount === 1 && currCount === 1) {
      return 'There is no change in the number of mails compared to the previous report.';
    }
    if (percentageChange > 0) {
      return `The number of mails has increased by ${percentageChange.toFixed(2)}% ${getEmoji(percentageChange)}.`;
    }
    if (percentageChange < 0) {
      return `The number of mails has decreased by ${Math.abs(percentageChange).toFixed(2)}% ${getEmoji(percentageChange)}.`;
    }
    return 'There is no change in the number of mails compared to the previous report.';
  };

  return {
    percentageChange: prevCount === 1 && currCount === 1 ? "100.00" : percentageChange.toFixed(2),
    report: generateReport(),
  };
}

function getMessageId() {
  const messageIdLength = 10;
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';

  for (let i = 0; i < messageIdLength; i++) {
    result += characters[Math.floor(Math.random() * characters.length)];
  }

  return result;
}
