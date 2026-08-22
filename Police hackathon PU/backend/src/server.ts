import { createApp } from './app';
import { config } from './config';
import { mcpService } from './mcp/mcpClient';
import { DatabaseService } from './data/database/prisma.service';

const startServer = async () => {
  const app = createApp();

  // Connect to Python MCP server on startup
  await mcpService.connect();

  const server = app.listen(config.port, () => {
    console.log(`===================================================`);
    console.log(`🔒 NEXUS Cyber-Intelligence Backend Running on port ${config.port}`);
    console.log(`📡 API Base: http://localhost:${config.port}${config.apiPrefix}`);
    console.log(`📋 Swagger Docs: http://localhost:${config.port}/docs`);
    console.log(`💚 Health Probe: http://localhost:${config.port}${config.apiPrefix}/health`);
    console.log(`===================================================`);
  });

  const gracefulShutdown = async () => {
    console.log('Initiating graceful shutdown...');
    await mcpService.close();
    // [H7] Disconnect Prisma to release DB connection pool.
    await DatabaseService.disconnect();
    server.close(() => {
      console.log('NEXUS Backend server terminated.');
      process.exit(0);
    });

    // Force exit after 10s if graceful shutdown stalls.
    setTimeout(() => {
      console.error('Graceful shutdown timed out. Forcing exit.');
      process.exit(1);
    }, 10000).unref();
  };

  process.on('SIGTERM', gracefulShutdown);
  process.on('SIGINT', gracefulShutdown);

  // [H7] Catch unhandled rejections and uncaught exceptions to prevent silent crashes.
  process.on('unhandledRejection', (reason: any) => {
    console.error('[FATAL] Unhandled Promise Rejection:', reason);
  });
  process.on('uncaughtException', (err: Error) => {
    console.error('[FATAL] Uncaught Exception:', err);
    // After logging, exit — the process is in an undefined state.
    process.exit(1);
  });
};

if (require.main === module) {
  startServer().catch((err) => {
    console.error('Failed to start NEXUS server:', err);
    process.exit(1);
  });
}
