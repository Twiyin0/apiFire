const express = require('express');
const http = require('http');
const { WebSocketServer } = require('ws');
const net = require('net');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' }));

// ─── HTTP Proxy ───────────────────────────────────────────
app.post('/api/proxy', async (req, res) => {
  const { method, url, headers, body } = req.body;
  const startTime = Date.now();
  try {
    const opts = { method, headers: headers || {} };
    if (body && !['GET', 'HEAD'].includes(method.toUpperCase())) {
      opts.body = typeof body === 'string' ? body : JSON.stringify(body);
    }
    const resp = await fetch(url, opts);
    const respHeaders = Object.fromEntries(resp.headers.entries());
    const respBody = await resp.text();
    const size = new Blob([respBody]).size;
    res.json({
      status: resp.status,
      statusText: resp.statusText,
      headers: respHeaders,
      body: respBody,
      time: Date.now() - startTime,
      size,
    });
  } catch (err) {
    res.json({ error: err.message, time: Date.now() - startTime });
  }
});

// ─── WebSocket + TCP relay server ─────────────────────────
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

// State maps
const wsClients = new Map();    // requestId -> WebSocket
const wsServers = new Map();    // serverId -> { server, wss, clients }
const tcpClients = new Map();   // requestId -> net.Socket
const tcpServers = new Map();   // serverId -> { server, clients }

function sendToClient(ws, data) {
  if (ws.readyState === 1) ws.send(JSON.stringify(data));
}

wss.on('connection', (ws) => {
  // ─── WS Client commands ──────────────────────────
  ws.on('message', (raw) => {
    let msg;
    try { msg = JSON.parse(raw); } catch { return; }

    switch (msg.type) {
      // WS Client: connect
      case 'ws:connect': {
        try {
          const client = new (require('ws'))(msg.url);
          client.on('open', () => sendToClient(ws, { type: 'ws:connected', requestId: msg.requestId }));
          client.on('message', (data) => sendToClient(ws, {
            type: 'ws:message', requestId: msg.requestId,
            data: data.toString(), timestamp: Date.now(),
          }));
          client.on('close', (code, reason) => sendToClient(ws, {
            type: 'ws:disconnected', requestId: msg.requestId,
            code, reason: reason.toString(),
          }));
          client.on('error', (err) => sendToClient(ws, {
            type: 'ws:error', requestId: msg.requestId, error: err.message,
          }));
          wsClients.set(msg.requestId, client);
        } catch (err) {
          sendToClient(ws, { type: 'ws:error', requestId: msg.requestId, error: err.message });
        }
        break;
      }
      // WS Client: send
      case 'ws:send': {
        const client = wsClients.get(msg.requestId);
        if (client && client.readyState === 1) client.send(msg.data);
        break;
      }
      // WS Client: disconnect
      case 'ws:disconnect': {
        const client = wsClients.get(msg.requestId);
        if (client) { client.close(); wsClients.delete(msg.requestId); }
        break;
      }

      // WS Server: start
      case 'ws-server:start': {
        try {
          const wssInst = new WebSocketServer({ port: msg.port });
          const state = { server: wssInst, clients: new Map() };
          wssInst.on('connection', (clientWs, req) => {
            const clientId = `${req.socket.remoteAddress}:${req.socket.remotePort}`;
            state.clients.set(clientId, clientWs);
            sendToClient(ws, { type: 'ws-server:connection', serverId: msg.serverId, clientId });
            clientWs.on('message', (data) => sendToClient(ws, {
              type: 'ws-server:message', serverId: msg.serverId, clientId,
              data: data.toString(), timestamp: Date.now(),
            }));
            clientWs.on('close', () => {
              state.clients.delete(clientId);
              sendToClient(ws, { type: 'ws-server:disconnection', serverId: msg.serverId, clientId });
            });
          });
          wsServers.set(msg.serverId, state);
          sendToClient(ws, { type: 'ws-server:started', serverId: msg.serverId, port: msg.port });
        } catch (err) {
          sendToClient(ws, { type: 'ws-server:error', serverId: msg.serverId, error: err.message });
        }
        break;
      }
      // WS Server: stop
      case 'ws-server:stop': {
        const state = wsServers.get(msg.serverId);
        if (state) {
          state.clients.forEach((c) => c.close());
          state.server.close();
          wsServers.delete(msg.serverId);
        }
        break;
      }
      // WS Server: send to client
      case 'ws-server:send': {
        const state = wsServers.get(msg.serverId);
        if (state) {
          const client = state.clients.get(msg.clientId);
          if (client && client.readyState === 1) client.send(msg.data);
        }
        break;
      }
      // WS Server: broadcast
      case 'ws-server:broadcast': {
        const state = wsServers.get(msg.serverId);
        if (state) state.clients.forEach((c) => { if (c.readyState === 1) c.send(msg.data); });
        break;
      }

      // TCP Client: connect
      case 'tcp:connect': {
        try {
          const socket = net.createConnection({ host: msg.host, port: msg.port }, () => {
            sendToClient(ws, { type: 'tcp:connected', requestId: msg.requestId });
          });
          socket.on('data', (data) => sendToClient(ws, {
            type: 'tcp:data', requestId: msg.requestId,
            data: data.toString(), timestamp: Date.now(),
          }));
          socket.on('close', () => sendToClient(ws, { type: 'tcp:disconnected', requestId: msg.requestId }));
          socket.on('error', (err) => sendToClient(ws, { type: 'tcp:error', requestId: msg.requestId, error: err.message }));
          tcpClients.set(msg.requestId, socket);
        } catch (err) {
          sendToClient(ws, { type: 'tcp:error', requestId: msg.requestId, error: err.message });
        }
        break;
      }
      // TCP Client: send
      case 'tcp:send': {
        const socket = tcpClients.get(msg.requestId);
        if (socket && !socket.destroyed) socket.write(msg.data);
        break;
      }
      // TCP Client: disconnect
      case 'tcp:disconnect': {
        const socket = tcpClients.get(msg.requestId);
        if (socket) { socket.destroy(); tcpClients.delete(msg.requestId); }
        break;
      }

      // TCP Server: start
      case 'tcp-server:start': {
        try {
          const tcpServer = net.createServer();
          const state = { server: tcpServer, clients: new Map() };
          tcpServer.on('connection', (socket) => {
            const clientId = `${socket.remoteAddress}:${socket.remotePort}`;
            state.clients.set(clientId, socket);
            sendToClient(ws, { type: 'tcp-server:connection', serverId: msg.serverId, clientId });
            socket.on('data', (data) => sendToClient(ws, {
              type: 'tcp-server:data', serverId: msg.serverId, clientId,
              data: data.toString(), timestamp: Date.now(),
            }));
            socket.on('close', () => {
              state.clients.delete(clientId);
              sendToClient(ws, { type: 'tcp-server:disconnection', serverId: msg.serverId, clientId });
            });
            socket.on('error', () => {});
          });
          tcpServer.listen(msg.port, () => {
            sendToClient(ws, { type: 'tcp-server:started', serverId: msg.serverId, port: msg.port });
          });
          tcpServers.set(msg.serverId, state);
        } catch (err) {
          sendToClient(ws, { type: 'tcp-server:error', serverId: msg.serverId, error: err.message });
        }
        break;
      }
      // TCP Server: stop
      case 'tcp-server:stop': {
        const state = tcpServers.get(msg.serverId);
        if (state) {
          state.clients.forEach((s) => s.destroy());
          state.server.close();
          tcpServers.delete(msg.serverId);
        }
        break;
      }
      // TCP Server: send to client
      case 'tcp-server:send': {
        const state = tcpServers.get(msg.serverId);
        if (state) {
          const socket = state.clients.get(msg.clientId);
          if (socket && !socket.destroyed) socket.write(msg.data);
        }
        break;
      }
      // TCP Server: broadcast
      case 'tcp-server:broadcast': {
        const state = tcpServers.get(msg.serverId);
        if (state) state.clients.forEach((s) => { if (!s.destroyed) s.write(msg.data); });
        break;
      }
    }
  });

  ws.on('close', () => {
    // Clean up all connections associated with this client
    wsClients.forEach((c, id) => { try { c.close(); } catch {} });
    wsClients.clear();
    tcpClients.forEach((s) => { try { s.destroy(); } catch {} });
    tcpClients.clear();
  });
});

const PORT = 3001;
server.listen(PORT, () => {
  console.log(`Apifire server running on http://localhost:${PORT}`);
});
