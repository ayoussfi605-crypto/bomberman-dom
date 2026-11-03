let allMessages = [];

export function handleMessage(data, ws, server) {
  const text = data?.message;

  if (!text || text.length < 1 || text.length > 200) {
    return;
  }

  allMessages.push({ message: text, time: Date.now() });
  console.log("Messages list:", allMessages);

  // Broadcast the message list to ALL connected clients using native 'ws'
  const payload = JSON.stringify({
    type: "allMessages",
    data: { message: allMessages },
  });

  server.clients.forEach((client) => {
    if (client.readyState === client.OPEN) {
      client.send(payload);
    }
  });
}
