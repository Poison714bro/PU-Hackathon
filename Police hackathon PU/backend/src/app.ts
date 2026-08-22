import express, { Express } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import swaggerUi from 'swagger-ui-express';
import { config } from '@/config';
import { errorHandler } from '@/common/middleware/errorHandler';
import { auditLogger } from '@/common/middleware/auditLogger';
import { swaggerDocument } from '@/docs/swagger';

import { authRouter } from '@/modules/auth/auth.router';
import { reconstructRouter } from '@/modules/reconstruct/reconstruct.router';
import { intelligenceRouter } from '@/modules/intelligence/intelligence.router';
import { dashboardRouter } from '@/modules/dashboard/dashboard.router';
import { mapRouter } from '@/modules/map/map.router';
import { graphRouter } from '@/modules/graph/graph.router';
import { trackerRouter } from '@/modules/tracker/tracker.router';
import { investigationsRouter } from '@/modules/investigations/investigations.router';
import { reportsRouter } from '@/modules/reports/reports.router';
import { searchRouter } from '@/modules/search/search.router';
import { healthRouter } from '@/modules/health/health.router';

export const createApp = (): Express => {
  const app = express();

  // [H6] Security Middleware — CSP enabled for API-only server.
  // Swagger UI needs 'unsafe-inline' for its styles, so we allow it only for script/style.
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'", "'unsafe-inline'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          imgSrc: ["'self'", 'data:'],
        },
      },
    })
  );

  // CORS — in production, only allow explicitly configured origin.
  // In development, allow all origins for flexible local dev with Next.js.
  if (config.isProduction) {
    const allowedOrigins = [config.corsOrigin].filter(Boolean);
    app.use(
      cors({
        origin: allowedOrigins,
        credentials: true,
      })
    );
  } else {
    app.use(
      cors({
        origin: true,
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
      })
    );
  }

  // Rate Limiting
  const limiter = rateLimit({
    windowMs: 60 * 1000,
    max: 200,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, error: { code: 'RATE_LIMIT_EXCEEDED', message: 'Too many requests.', statusCode: 429 } },
  });
  app.use(limiter);

  // Parsers & Logging
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true }));
  if (config.nodeEnv !== 'test') {
    app.use(morgan('combined'));
  }
  app.use(auditLogger);

  // API Documentation — only in non-production
  if (!config.isProduction) {
    app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
  }

  // Direct route compatibility for /api/reconstruct
  app.use('/api/reconstruct', reconstructRouter);

  // API Version 1 Routes
  const v1 = express.Router();
  v1.use('/health', healthRouter);
  v1.use('/auth', authRouter);
  v1.use('/reconstruct', reconstructRouter);
  v1.use('/intelligence', intelligenceRouter);
  v1.use('/dashboard', dashboardRouter);
  v1.use('/map', mapRouter);
  v1.use('/graph', graphRouter);
  v1.use('/tracker', trackerRouter);
  v1.use('/investigations', investigationsRouter);
  v1.use('/reports', reportsRouter);
  v1.use('/search', searchRouter);

  app.use(config.apiPrefix, v1);

  // Catch-all fallback for undefined API routes — returns 200 with a
  // descriptive message so the frontend never crashes on unknown paths.
  app.use(`${config.apiPrefix}/*`, (req: any, res: any) => {
    return res.status(200).json({
      success: true,
      data: null,
      message: `No handler for ${req.method} ${req.originalUrl}. Available routes are documented at /docs.`,
      meta: { timestamp: new Date().toISOString() },
    });
  });

  // Global Error Handler
  app.use(errorHandler);

  return app;
};
