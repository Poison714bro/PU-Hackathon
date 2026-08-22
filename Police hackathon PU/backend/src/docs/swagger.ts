export const swaggerDocument = {
  openapi: '3.0.0',
  info: {
    title: 'NEXUS Cyber-Intelligence Platform API',
    version: '1.0.0',
    description: 'Production REST API for dark-web cyber-intelligence investigation and timeline reconstruction.',
  },
  servers: [
    {
      url: 'http://localhost:3001/api/v1',
      description: 'Local Development Server',
    },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
    },
  },
  security: [{ bearerAuth: [] }],
  paths: {
    '/health': {
      get: {
        summary: 'Health and readiness probe',
        responses: {
          200: { description: 'System health summary including MCP state' },
        },
      },
    },
    '/auth/login': {
      post: {
        summary: 'User authentication',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  username: { type: 'string' },
                  password: { type: 'string' },
                },
                required: ['username', 'password'],
              },
            },
          },
        },
        responses: {
          200: { description: 'JWT authentication token' },
          401: { description: 'Invalid credentials' },
        },
      },
    },
    '/reconstruct': {
      post: {
        summary: 'Reconstruct target entity profile & on-chain metrics via Python MCP',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  query: { type: 'string', example: 'DarkPhoenix_77' },
                },
                required: ['query'],
              },
            },
          },
        },
        responses: {
          200: { description: 'Reconstructed dossier and blockchain financial profile' },
        },
      },
    },
    '/intelligence/entities': {
      get: {
        summary: 'List intelligence suspect entities',
        parameters: [
          { name: 'category', in: 'query', schema: { type: 'string' } },
          { name: 'status', in: 'query', schema: { type: 'string' } },
          { name: 'riskMin', in: 'query', schema: { type: 'number' } },
        ],
        responses: {
          200: { description: 'Array of target entities' },
        },
      },
    },
    '/dashboard/kpis': {
      get: {
        summary: 'Retrieve operational dashboard KPIs',
        responses: {
          200: { description: 'Aggregated intelligence metrics' },
        },
      },
    },
    '/map/pins': {
      get: {
        summary: 'Geospatial incident pins',
        responses: {
          200: { description: 'Array of mapped locations' },
        },
      },
    },
    '/tracker': {
      get: {
        summary: 'Movement telemetry dataset (100 nodes)',
        responses: {
          200: { description: 'Paginated movement tracking nodes' },
        },
      },
    },
  },
};
