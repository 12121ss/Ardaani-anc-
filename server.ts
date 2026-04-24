import express from 'express';
import fs from 'fs';
import path from 'path';
import cors from 'cors';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';

const DATA_PATH = path.join(process.cwd(), 'projects.json');
const DIST_PATH = path.join(process.cwd(), 'dist');

async function startServer() {
  const app = express();
  const PORT = process.env.PORT || 3000;

  console.log(`[SERVER] Node Version: ${process.version}`);
  console.log(`[SERVER] ENV: ${process.env.NODE_ENV}`);
  console.log(`[SERVER] PORT: ${PORT}`);

  app.use(cors());
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ limit: '50mb', extended: true }));

  // Initialize data file
  if (!fs.existsSync(DATA_PATH)) {
    console.log(`[SERVER] Initializing data file at ${DATA_PATH}`);
    fs.writeFileSync(DATA_PATH, JSON.stringify({ projects: [], users: {} }, null, 2));
  }

  // Health check - define this early
  app.get('/api/health', (req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

  // API Route Debugging Middleware
  app.use('/api', (req, res, next) => {
    console.log(`[API LOG] ${req.method} ${req.url}`);
    next();
  });

  // API Routes
  app.get('/api/projects', (req, res) => {
    try {
      const data = JSON.parse(fs.readFileSync(DATA_PATH, 'utf-8'));
      res.json(data.projects || []);
    } catch (err) {
      console.error('[API ERR] GET projects:', err);
      res.status(500).json({ success: false, message: 'Veri okuma hatası' });
    }
  });

  app.post('/api/projects', (req, res) => {
    try {
      const project = req.body;
      if (!project || !project.title) {
        return res.status(400).json({ success: false, message: 'Eksik proje bilgisi' });
      }
      
      const data = JSON.parse(fs.readFileSync(DATA_PATH, 'utf-8'));
      const newProject = {
        ...project,
        id: `project-${Date.now()}`,
        order: data.projects ? data.projects.length : 0
      };

      if (!data.projects) data.projects = [];
      data.projects.unshift(newProject);
      fs.writeFileSync(DATA_PATH, JSON.stringify(data, null, 2));
      
      console.log(`[API OK] Created project: ${newProject.id}`);
      res.json({ success: true, message: 'Proje eklendi', project: newProject });
    } catch (err) {
      console.error('[API ERR] POST projects:', err);
      res.status(500).json({ success: false, message: 'Kaydetme hatası' });
    }
  });

  app.put('/api/projects/:id', (req, res) => {
    try {
      const { id } = req.params;
      const updatedProject = req.body;
      const data = JSON.parse(fs.readFileSync(DATA_PATH, 'utf-8'));

      const index = data.projects.findIndex((p: any) => String(p.id) === String(id));
      if (index === -1) {
        return res.status(404).json({ success: false, message: 'Proje bulunamadı' });
      }

      data.projects[index] = { ...data.projects[index], ...updatedProject };

      if (data.users) {
        Object.keys(data.users).forEach(uid => {
          if (data.users[uid].projects) {
            data.users[uid].projects = data.users[uid].projects.map((p: any) => 
              String(p.id) === String(id) ? { ...p, ...updatedProject } : p
            );
          }
        });
      }

      fs.writeFileSync(DATA_PATH, JSON.stringify(data, null, 2));
      res.json({ success: true, message: 'Proje güncellendi' });
    } catch (err) {
      console.error('[API ERR] PUT projects:', err);
      res.status(500).json({ success: false, message: 'Güncelleme hatası' });
    }
  });

  app.delete(['/api/projects/:uid/:projectId', '/api/projects/:projectId'], (req: any, res: any) => {
    try {
      const { uid, projectId } = req.params;
      const targetId = projectId || uid;
      
      if (!targetId) {
        return res.status(400).json({ success: false, message: "Eksik veri: Project ID gerekli" });
      }

      const data = JSON.parse(fs.readFileSync(DATA_PATH, 'utf-8'));
      data.projects = data.projects.filter((p: any) => String(p.id) !== String(targetId));
      
      if (data.users) {
        Object.keys(data.users).forEach(key => {
          if (data.users[key].projects) {
            data.users[key].projects = data.users[key].projects.filter(
              (p: any) => String(p.id) !== String(targetId)
            );
          }
        });
      }

      fs.writeFileSync(DATA_PATH, JSON.stringify(data, null, 2), 'utf-8');
      res.json({ success: true, message: "Proje silindi", deletedId: targetId });
    } catch (err: any) {
      console.error('[API ERR] DELETE projects:', err);
      res.status(500).json({ success: false, message: 'Silme işlemi başarısız' });
    }
  });

  // Serve static files / Vite middleware AFTER API routes
  if (process.env.NODE_ENV !== 'production') {
    console.log('[SERVER] Running in DEVELOPMENT mode with Vite Middleware');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    console.log(`[SERVER] Running in PRODUCTION mode, serving dist from ${DIST_PATH}`);
    if (fs.existsSync(DIST_PATH)) {
      app.use(express.static(DIST_PATH));
      app.get('*', (req, res) => {
        res.sendFile(path.join(DIST_PATH, 'index.html'));
      });
    } else {
      console.error(`[SERVER] ERROR: dist directory not found at ${DIST_PATH}. Make sure to run 'npm run build' first.`);
      app.get('*', (req, res) => {
        res.status(500).send('Production build missing. Please run build command.');
      });
    }
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[SERVER] Express server listening on 0.0.0.0:${PORT}`);
  });
}

startServer().catch(err => {
  console.error('[SERVER] Failed to start server:', err);
});
