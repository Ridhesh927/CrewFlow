const env = require('./src/env');
const app = require('./src/app');
require('./src/jobs/cleanupProofs');
require('./src/jobs/weeklyReports');

const start = async () => {
  try {
    const port = parseInt(env.PORT, 10);
    await app.listen({ port, host: '0.0.0.0' })
    app.log.info(`Backend listening on http://localhost:${port}`)
  } catch (err) {
    app.log.error(err)
    process.exit(1)
  }
}

start()
