/* STREAMING_CHUNK:Initializing server... */
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const { WebcastPushConnection } = require('tiktok-live-connector');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

/* STREAMING_CHUNK:Handling connections... */
io.on('connection', (socket) => {
  let tiktokConnection = null;

  socket.on('connect-tiktok', ({ username, sessionId }) => {
    if (tiktokConnection) tiktokConnection.disconnect();

    const options = {
      sessionId: sessionId || null, // Используем сессию для стабильности
      processInitialData: false
    };

    tiktokConnection = new WebcastPushConnection(username, options);
    
    tiktokConnection.connect().then(() => {
      socket.emit('status', 'connected');
    }).catch(err => {
      socket.emit('status', 'error');
    });

    tiktokConnection.on('chat', data => {
      socket.emit('chat', {
        id: data.msgId,
        username: data.uniqueId,
        nickname: data.nickname,
        avatar: data.profilePictureUrl,
        text: data.comment,
        level: data.userDetails?.badge?.level || 0,
        isMod: data.isModerator,
        isSub: data.isSubscriber
      });
    });
  });
});

server.listen(process.env.PORT || 3000, () => console.log('Server running'));
