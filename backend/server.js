const env = require('./src/env');
const app = require('./src/app');
require('./src/jobs/cleanupProofs');
require('./src/jobs/weeklyReports');

const { Server } = require('socket.io');
const { createClient } = require('redis');
const { createAdapter } = require('@socket.io/redis-adapter');

const start = async () => {
  try {
    const port = parseInt(env.PORT, 10);
    
    // Initialize Socket.io on the Fastify server
    const io = new Server(app.server, {
      cors: {
        origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
        methods: ['GET', 'POST']
      }
    });

    app.decorate('io', io);

    // Setup Redis Adapter for scalable horizontal chat
    const pubClient = createClient({ url: process.env.REDIS_URL || 'redis://localhost:6379' });
    const subClient = pubClient.duplicate();
    
    pubClient.on('error', (err) => app.log.warn(`Redis Pub Error: ${err.message}`));
    subClient.on('error', (err) => app.log.warn(`Redis Sub Error: ${err.message}`));

    try {
      await Promise.all([pubClient.connect(), subClient.connect()]);
      io.adapter(createAdapter(pubClient, subClient));
      app.log.info('Socket.io Redis adapter connected');
    } catch (e) {
      app.log.warn('Redis not available. Socket.io falling back to memory adapter.');
    }

    // Register Chat events
    require('./src/sockets/chat.socket')(io);

    await app.listen({ port, host: '0.0.0.0' });
    app.log.info(`Backend listening on http://localhost:${port}`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}

start()
