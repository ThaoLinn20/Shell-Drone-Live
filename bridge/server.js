// TikTok Live Bridge Service
// Decoupled local daemon providing WebSocket broadcast and normalized live events

import http from 'http';
import readline from 'readline';
import fs from 'fs';
import path from 'path';
import { WebSocketServer, WebSocket } from 'ws';
import { TIKTOK_GIFT_TIERS, MOCK_USERS, MOCK_CHAT_MESSAGES } from './mockData.js';

let localConfig = {};
try {
  const cfgPath = path.resolve(process.cwd(), 'bridge/config.json');
  if (fs.existsSync(cfgPath)) {
    localConfig = JSON.parse(fs.readFileSync(cfgPath, 'utf8') || '{}');
  }
} catch (_) {}

const PORT = parseInt(process.env.BRIDGE_PORT || '21213', 10);
let targetUsername = process.env.TIKTOK_USERNAME || (process.argv[2] ? process.argv[2].replace(/^@/, '') : (localConfig.username || 'thaolinn20'));
let sessionId = process.env.TIKTOK_SESSION_ID || (localConfig.sessionId || '');
let ttTargetIdc = process.env.TIKTOK_TARGET_IDC || (localConfig.ttTargetIdc || 'useast1a');

let activeClients = new Set();
let mockInterval = null;
let liveConnector = null;
let roomState = {
  status: 'disconnected', // 'connected' | 'connecting' | 'disconnected' | 'error'
  roomId: null,
  error: null
};

// Create HTTP Server for status and manual test webhooks
const httpServer = http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  if (req.url === '/status' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      status: 'online',
      clientsConnected: activeClients.size,
      targetUsername: targetUsername || null,
      roomState,
      mockRunning: mockInterval !== null
    }));
    return;
  }

  if (req.url === '/api/connect' && req.method === 'POST') {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk;
    });
    req.on('end', () => {
      try {
        const payload = JSON.parse(body || '{}');
        const user = (payload.username || '').replace(/^@/, '').trim();
        if (!user) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Username required' }));
          return;
        }
        targetUsername = user;
        if (liveConnector) {
          try {
            liveConnector.disconnect();
          } catch (_) {}
          liveConnector = null;
        }
        tryConnectTikTokLive(targetUsername);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, targetUsername }));
      } catch (err) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: err.message }));
      }
    });
    return;
  }

  if ((req.url === '/api/webhook' || req.url === '/webhook') && req.method === 'POST') {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk;
    });
    req.on('end', () => {
      try {
        const payload = JSON.parse(body || '{}');
        const eventType = (payload.event || payload.type || '').toLowerCase();
        const data = payload.data || payload;

        let normalized = null;
        if (eventType === 'gift' || data.giftName) {
          normalized = createNormalizedGiftEvent({
            giftName: data.giftName || 'Gift',
            giftId: data.giftId || 5655,
            diamondCount: data.diamonds || data.diamondCount || 1,
            repeatCount: data.repeatCount || 1,
            nickname: data.nickname || data.user?.nickname || 'TikFinity Viewer',
            user: {
              id: data.userId || data.uniqueId || 'viewer',
              name: data.uniqueId || 'viewer',
              nickname: data.nickname || data.user?.nickname || 'TikFinity Viewer',
              avatar: data.profilePictureUrl || ''
            }
          });
        } else if (eventType === 'chat' || data.comment || data.message) {
          normalized = createNormalizedChatEvent({
            comment: data.comment || data.message || '!phaohoa',
            nickname: data.nickname || data.user?.nickname || 'Chat Viewer',
            user: {
              id: data.userId || data.uniqueId || 'viewer',
              name: data.uniqueId || 'viewer',
              nickname: data.nickname || data.user?.nickname || 'Chat Viewer',
              avatar: data.profilePictureUrl || ''
            }
          });
        }

        if (normalized) {
          broadcastEvent(normalized);
          console.log('[TikFinity Webhook] Received and broadcasted: ' + normalized.type);
        }

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, event: normalized }));
      } catch (err) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: err.message }));
      }
    });
    return;
  }

  if (req.url === '/api/gift' && req.method === 'POST') {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk;
    });
    req.on('end', () => {
      try {
        const payload = JSON.parse(body || '{}');
        const giftKey = payload.giftKey || 'rose';
        const giftMeta = TIKTOK_GIFT_TIERS[giftKey] || TIKTOK_GIFT_TIERS.rose;
        const normalized = createNormalizedGiftEvent({
          giftName: giftMeta.name,
          giftId: giftMeta.id,
          diamondCount: giftMeta.diamonds,
          repeatCount: payload.repeatCount || 1,
          nickname: payload.nickname || 'Web Tester'
        });
        broadcastEvent(normalized);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, event: normalized }));
      } catch (err) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: err.message }));
      }
    });
    return;
  }

  if (req.url === '/api/chat' && req.method === 'POST') {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk;
    });
    req.on('end', () => {
      try {
        const payload = JSON.parse(body || '{}');
        const normalized = createNormalizedChatEvent({
          comment: payload.comment || '!phaohoa',
          nickname: payload.nickname || 'Chat Tester'
        });
        broadcastEvent(normalized);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, event: normalized }));
      } catch (err) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: err.message }));
      }
    });
    return;
  }

  res.writeHead(404, { 'Content-Type': 'text/plain' });
  res.end('TikTok Live Bridge Service Endpoint');
});

// Create WebSocket Server
const wss = new WebSocketServer({ server: httpServer });

wss.on('connection', (ws) => {
  activeClients.add(ws);
  console.log('[Bridge WS] New client connected. Active clients: ' + activeClients.size);

  // Send greeting / handshake
  ws.send(JSON.stringify({
    type: 'system',
    message: 'TikTok Live Bridge Connected',
    connectedClients: activeClients.size,
    targetUsername: targetUsername || 'Mock Mode',
    roomState,
    timestamp: Date.now()
  }));

  ws.on('message', (rawData) => {
    try {
      const msg = JSON.parse(rawData.toString());
      if (msg.action === 'connect' && msg.username) {
        targetUsername = msg.username.replace(/^@/, '').trim();
        if (liveConnector) {
          try {
            liveConnector.disconnect();
          } catch (_) {}
          liveConnector = null;
        }
        tryConnectTikTokLive(targetUsername);
      }
    } catch (_) {}
  });

  ws.on('close', () => {
    activeClients.delete(ws);
    console.log('[Bridge WS] Client disconnected. Active clients: ' + activeClients.size);
  });

  ws.on('error', (err) => {
    console.error('[Bridge WS] Socket error: ' + err.message);
  });
});

export function broadcastEvent(eventObject) {
  const serialized = JSON.stringify(eventObject);
  for (const client of activeClients) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(serialized);
    }
  }
}

export function createNormalizedGiftEvent(params = {}) {
  const user = params.user || getRandomUser(params.nickname);
  return {
    type: 'gift',
    user: {
      id: user.id,
      name: user.name,
      nickname: params.nickname || user.nickname,
      avatar: user.avatar || ''
    },
    data: {
      giftId: params.giftId || 5655,
      giftName: params.giftName || 'Rose',
      diamondCount: params.diamondCount || 1,
      repeatCount: params.repeatCount || 1,
      tier: params.tier || resolveTier(params.diamondCount || 1)
    },
    timestamp: Date.now()
  };
}

export function createNormalizedChatEvent(params = {}) {
  const user = params.user || getRandomUser(params.nickname);
  return {
    type: 'chat',
    user: {
      id: user.id,
      name: user.name,
      nickname: params.nickname || user.nickname,
      avatar: user.avatar || ''
    },
    data: {
      comment: params.comment || '!phaohoa'
    },
    timestamp: Date.now()
  };
}

function resolveTier(diamonds) {
  if (diamonds >= 10000) return 'super';
  if (diamonds >= 500) return 'grand';
  if (diamonds >= 50) return 'medium';
  return 'mini';
}

function getRandomUser(customNickname) {
  const base = MOCK_USERS[Math.floor(Math.random() * MOCK_USERS.length)];
  return {
    id: base.id,
    name: base.name,
    nickname: customNickname || base.nickname,
    avatar: base.avatar
  };
}

function triggerRandomMockEvent() {
  const rand = Math.random();
  if (rand < 0.60) {
    // Rose combo or mini gift
    const count = Math.floor(Math.random() * 5) + 1;
    const evt = createNormalizedGiftEvent({
      giftName: 'Rose',
      giftId: 5655,
      diamondCount: 1,
      repeatCount: count
    });
    broadcastEvent(evt);
    console.log('[Mock Gift] ' + evt.user.nickname + ' sent Rose x' + count);
  } else if (rand < 0.85) {
    // Chat message
    const comment = MOCK_CHAT_MESSAGES[Math.floor(Math.random() * MOCK_CHAT_MESSAGES.length)];
    const evt = createNormalizedChatEvent({ comment });
    broadcastEvent(evt);
    console.log('[Mock Chat] ' + evt.user.nickname + ': ' + comment);
  } else if (rand < 0.96) {
    // Fireworks box
    const evt = createNormalizedGiftEvent({
      giftName: 'Fireworks',
      giftId: 6104,
      diamondCount: 1088,
      repeatCount: 1
    });
    broadcastEvent(evt);
    console.log('[Mock Gift] ' + evt.user.nickname + ' sent Fireworks!');
  } else {
    // Super gift
    const evt = createNormalizedGiftEvent({
      giftName: 'TikTok Universe',
      giftId: 6268,
      diamondCount: 34999,
      repeatCount: 1
    });
    broadcastEvent(evt);
    console.log('[Mock Super Gift] ' + evt.user.nickname + ' sent TikTok Universe!');
  }
}

// Helper to load TikTokLiveConnection from modern tiktok-live-connector
async function loadTikTokLiveConnector() {
  try {
    const mod = await import('tiktok-live-connector');
    if (mod && mod.TikTokLiveConnection) {
      return {
        ClientClass: mod.TikTokLiveConnection,
        WebcastEvent: mod.WebcastEvent || {}
      };
    }
  } catch (_) {}

  try {
    const legacy = await import('tiktok-live-connector/legacy');
    if (legacy && legacy.WebcastPushConnection) {
      return {
        ClientClass: legacy.WebcastPushConnection,
        WebcastEvent: {}
      };
    }
  } catch (_) {}

  return null;
}

// Optional TikTok Live connector loader
async function tryConnectTikTokLive(username) {
  if (!username) return;
  console.log('[Bridge] Attempting connection to TikTok Live room: @' + username);
  roomState = {
    status: 'connecting',
    roomId: null,
    error: null,
    username
  };
  broadcastEvent({
    type: 'tiktok_room_status',
    ...roomState
  });

  try {
    const loaderResult = await loadTikTokLiveConnector();
    if (!loaderResult || !loaderResult.ClientClass) {
      throw new Error('tiktok-live-connector package not found');
    }

    const { ClientClass, WebcastEvent } = loaderResult;

    const options = {
      enableExtendedGiftInfo: false
    };

    if (sessionId) {
      options.authenticateWs = true;
      options.session = {
        cookie: {
          type: 'cookie',
          value: {
            sessionId: sessionId,
            ttTargetIdc: ttTargetIdc
          }
        }
      };
      console.log('[Bridge] Authenticated session cookie detected for @' + username);
    }

    liveConnector = new ClientClass(username, options);

    liveConnector.connect().then((state) => {
      console.log('[Bridge] Successfully connected to live room ID: ' + state.roomId);
      roomState = {
        status: 'connected',
        roomId: state.roomId,
        error: null,
        username
      };
      broadcastEvent({
        type: 'tiktok_room_status',
        ...roomState
      });
    }).catch((err) => {
      console.warn('[Bridge] Failed to connect to TikTok Live: ' + err.message);
      if (err.message && err.message.includes('DEVICE_BLOCKED')) {
        console.warn('\n[TikTok WAF Notice] TikTok anti-bot blocked unauthenticated direct connection.');
        console.warn('-> Solution A (Easiest & Free): Run TikFinity (https://tikfinity.zerody.one) and connect to @' + username + '. Shell Drone Live will receive events automatically on ws://127.0.0.1:21213.');
        console.warn('-> Solution B: Paste your TikTok web sessionid in bridge/config.json to authenticate.\n');
      }
      roomState = {
        status: 'error',
        roomId: null,
        error: err.message,
        username
      };
      broadcastEvent({
        type: 'tiktok_room_status',
        ...roomState
      });
      console.warn('[Bridge] Falling back to interactive CLI test mode.');
    });

    liveConnector.on('disconnected', () => {
      console.log('[Bridge] TikTok Live disconnected.');
      roomState = {
        status: 'disconnected',
        roomId: null,
        error: null,
        username
      };
      broadcastEvent({
        type: 'tiktok_room_status',
        ...roomState
      });
    });

    liveConnector.on('streamEnd', () => {
      console.log('[Bridge] TikTok Live stream ended.');
      roomState = {
        status: 'ended',
        roomId: null,
        error: null,
        username
      };
      broadcastEvent({
        type: 'tiktok_room_status',
        ...roomState
      });
    });

    const giftEvent = WebcastEvent.GIFT || 'gift';
    const chatEvent = WebcastEvent.CHAT || 'chat';
    const likeEvent = WebcastEvent.LIKE || 'like';

    liveConnector.on(giftEvent, (data) => {
      if (data.giftType === 1 && !data.repeatEnd) {
        // Streak in progress, skip intermediate if needed or emit
        return;
      }
      const evt = createNormalizedGiftEvent({
        giftName: data.giftName,
        giftId: data.giftId,
        diamondCount: (data.diamondCount || 1) * (data.repeatCount || 1),
        repeatCount: data.repeatCount || 1,
        nickname: data.nickname || data.user?.nickname || 'Viewer',
        user: {
          id: data.userId || data.user?.userId,
          name: data.uniqueId || data.user?.uniqueId,
          nickname: data.nickname || data.user?.nickname || 'Viewer',
          avatar: data.profilePictureUrl || data.user?.profilePictureUrl
        }
      });
      broadcastEvent(evt);
      console.log('[TikTok Gift] ' + evt.user.nickname + ' sent ' + data.giftName + ' x' + (data.repeatCount || 1));
    });

    liveConnector.on(chatEvent, (data) => {
      const evt = createNormalizedChatEvent({
        comment: data.comment,
        nickname: data.nickname || data.user?.nickname,
        user: {
          id: data.userId || data.user?.userId,
          name: data.uniqueId || data.user?.uniqueId,
          nickname: data.nickname || data.user?.nickname,
          avatar: data.profilePictureUrl || data.user?.profilePictureUrl
        }
      });
      broadcastEvent(evt);
    });

    liveConnector.on(likeEvent, (data) => {
      broadcastEvent({
        type: 'like',
        user: {
          id: data.userId || data.user?.userId,
          name: data.uniqueId || data.user?.uniqueId,
          nickname: data.nickname || data.user?.nickname
        },
        data: {
          likeCount: data.likeCount,
          totalLikes: data.totalLikes
        },
        timestamp: Date.now()
      });
    });
  } catch (err) {
    console.warn('[Bridge] TikTok Live setup warning: ' + err.message);
    console.log('[Bridge] Interactive Mock CLI mode is available as fallback.');
  }
}

// Interactive CLI controls
function setupCLI() {
  readline.emitKeypressEvents(process.stdin);
  if (process.stdin.isTTY) {
    process.stdin.setRawMode(true);
  }

  process.stdin.on('keypress', (str, key) => {
    if (key.ctrl && key.name === 'c') {
      process.exit();
    }
    const char = (str || '').toLowerCase();
    if (char === '1' || char === 'r') {
      const evt = createNormalizedGiftEvent({
        giftName: 'Rose',
        giftId: 5655,
        diamondCount: 1,
        repeatCount: 1
      });
      broadcastEvent(evt);
      console.log('[Triggered] Rose (1 Diamond) sent to all clients.');
    } else if (char === '2' || char === 'h') {
      const evt = createNormalizedGiftEvent({
        giftName: 'Finger Heart',
        giftId: 5882,
        diamondCount: 5,
        repeatCount: 1
      });
      broadcastEvent(evt);
      console.log('[Triggered] Finger Heart (5 Diamonds) sent to all clients.');
    } else if (char === '3' || char === 'f') {
      const evt = createNormalizedGiftEvent({
        giftName: 'Fireworks',
        giftId: 6104,
        diamondCount: 1088,
        repeatCount: 1
      });
      broadcastEvent(evt);
      console.log('[Triggered] Fireworks (1088 Diamonds) sent to all clients.');
    } else if (char === '4' || char === 'u') {
      const evt = createNormalizedGiftEvent({
        giftName: 'TikTok Universe',
        giftId: 6268,
        diamondCount: 34999,
        repeatCount: 1
      });
      broadcastEvent(evt);
      console.log('[Triggered] TikTok Universe (34999 Diamonds) sent to all clients.');
    } else if (char === 'c') {
      const comment = MOCK_CHAT_MESSAGES[Math.floor(Math.random() * MOCK_CHAT_MESSAGES.length)];
      const evt = createNormalizedChatEvent({ comment });
      broadcastEvent(evt);
      console.log('[Triggered] Chat message: "' + comment + '" sent.');
    } else if (char === 'm') {
      if (mockInterval) {
        clearInterval(mockInterval);
        mockInterval = null;
        console.log('[Mock Mode] Auto generator STOPPED.');
      } else {
        mockInterval = setInterval(triggerRandomMockEvent, 3000);
        console.log('[Mock Mode] Auto generator STARTED (every 3s).');
      }
    } else if (char === 'q') {
      console.log('[Bridge] Exiting...');
      process.exit(0);
    }
  });

  console.log('\n--- TikTok Live Bridge Interactive Controls ---');
  console.log('Press 1 or r: Send Rose (1 diamond)');
  console.log('Press 2 or h: Send Finger Heart (5 diamonds)');
  console.log('Press 3 or f: Send Fireworks (1088 diamonds)');
  console.log('Press 4 or u: Send TikTok Universe (34999 diamonds)');
  console.log('Press c: Send random chat command');
  console.log('Press m: Toggle auto mock stream generator');
  console.log('Press q or Ctrl+C: Exit\n');
}

// Start Server
httpServer.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.log('[TikTok Bridge] Port ' + PORT + ' is already in use (by TikFinity Desktop or another bridge instance).');
    console.log('[TikTok Bridge] Shell Drone Live will connect directly to that active WebSocket service on ws://127.0.0.1:' + PORT);
    process.exit(0);
  } else {
    console.error('[TikTok Bridge] Server error:', err.message);
  }
});

httpServer.listen(PORT, '127.0.0.1', () => {
  console.log('[TikTok Bridge] Server listening on http://127.0.0.1:' + PORT);
  console.log('[TikTok Bridge] WebSocket Server active on ws://127.0.0.1:' + PORT);
  setupCLI();
  if (targetUsername) {
    tryConnectTikTokLive(targetUsername);
  }
});

