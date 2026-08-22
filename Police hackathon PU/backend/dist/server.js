"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const app_1 = require("./app");
const config_1 = require("./config");
const mcpClient_1 = require("./mcp/mcpClient");
const startServer = async () => {
    const app = (0, app_1.createApp)();
    // Connect to Python MCP server on startup
    await mcpClient_1.mcpService.connect();
    const server = app.listen(config_1.config.port, () => {
        console.log(`===================================================`);
        console.log(`🚀 NEXUS Cyber-Intelligence Backend Running on port ${config_1.config.port}`);
        console.log(`📡 API Base: http://localhost:${config_1.config.port}${config_1.config.apiPrefix}`);
        console.log(`📑 Swagger Docs: http://localhost:${config_1.config.port}/docs`);
        console.log(`🩺 Health Probe: http://localhost:${config_1.config.port}${config_1.config.apiPrefix}/health`);
        console.log(`===================================================`);
    });
    const gracefulShutdown = async () => {
        console.log('Initiating graceful shutdown...');
        await mcpClient_1.mcpService.close();
        server.close(() => {
            console.log('NEXUS Backend server terminated.');
            process.exit(0);
        });
    };
    process.on('SIGTERM', gracefulShutdown);
    process.on('SIGINT', gracefulShutdown);
};
if (require.main === module) {
    startServer().catch((err) => {
        console.error('Failed to start NEXUS server:', err);
        process.exit(1);
    });
}
