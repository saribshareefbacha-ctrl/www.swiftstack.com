import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import express from 'express';
import { getFullCMSData, initializeDatabase, saveFullCMSData } from './db';

initializeDatabase();

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '15mb' }));

  app.get('/api/health', (_req, res) => {
    res.json({
      ok: true,
      platform: 'SwiftStack (SS)',
      founder: 'Muhammad Sarib Randhawa',
      firebaseProject: 'swiftstack-a75b2',
    });
  });

  app.get('/api/cms', (_req, res) => {
    res.json(getFullCMSData());
  });

  app.put('/api/cms/sync', (req, res) => {
    const saved = saveFullCMSData(req.body);
    res.json(saved);
  });

  const httpServer = http.createServer(app);
  const isProd = process.env.NODE_ENV === 'production';

  if (isProd) {
    const distPath = path.resolve(process.cwd(), 'docs');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  } else {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        allowedHosts: true,
        hmr: {
          server: httpServer,
        },
      },
      appType: 'custom',
    });

    app.use((req, res, next) => {
      if (req.path === '/' || req.path === '/index.html') {
        const htmlFile = fs.existsSync(path.resolve(process.cwd(), 'app.html'))
          ? path.resolve(process.cwd(), 'app.html')
          : path.resolve(process.cwd(), 'index.html');
        const rawHtml = fs.readFileSync(htmlFile, 'utf-8');
        vite
          .transformIndexHtml(req.originalUrl, rawHtml)
          .then((transformed) => {
            res.status(200).set({ 'Content-Type': 'text/html' }).end(transformed);
          })
          .catch(next);
        return;
      }
      next();
    });

    app.use(vite.middlewares);
  }

  const PORT = Number(process.env.PORT || 3000);
  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`SwiftStack (SS) Platform running at http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start SwiftStack server:', err);
  process.exit(1);
});
