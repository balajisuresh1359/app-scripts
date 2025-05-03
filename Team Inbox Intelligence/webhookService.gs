function sendMessage(message, webhookLink) {
  const payload = JSON.stringify({
    text: message,
  });

  const options = {
    method: 'post',
    contentType: 'application/json',
    payload: payload,
  };

  UrlFetchApp.fetch(webhookLink, options);
}
