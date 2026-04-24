import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';

const DATA_PATH = path.join(process.cwd(), 'projects.json');
const DIST_PATH = path.join(process.cwd(), 'dist');

async function startServer() {
  const app = express();
  const PORT = process.env.PORT || 3000;

  console.log(`[SERVER] Starting server...`);
  console.log(`[SERVER] CWD: ${process.cwd()}`);
  console.log(`[SERVER] DATA_PATH: ${DATA_PATH}`);
  console.log(`[SERVER] NODE_ENV: ${process.env.NODE_ENV}`);

  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ limit: '10mb', extended: true }));

  // Health check
  app.get('/api/health', (req, res) => res.json({ status: 'ok', time: new Date().toISOString() }));

  // Initialize data file
  if (!fs.existsSync(DATA_PATH)) {
    console.log(`[SERVER] Initializing ${DATA_PATH}`);
    fs.writeFileSync(DATA_PATH, JSON.stringify({ projects: [], users: {} }, null, 2));
  }

  // API Middleware
  app.use('/api', (req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    if (req.method === 'OPTIONS') {
      return res.sendStatus(200);
    }
    
    console.log(`[API] ${req.method} ${req.originalUrl}`);
    next();
  });

  // API Routes
  app.get('/api/projects', (req, res) => {
    try {
      const data = JSON.parse(fs.readFileSync(DATA_PATH, 'utf-8'));
      res.json(data.projects || []);
    } catch (err) {
      console.error('[API ERROR] GET /api/projects:', err);
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
        order: data.projects.length
      };

      data.projects.unshift(newProject);
      fs.writeFileSync(DATA_PATH, JSON.stringify(data, null, 2));
      
      res.json({ success: true, message: 'Proje eklendi', project: newProject });
    } catch (err) {
      console.error('[API ERROR] POST /api/projects:', err);
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

      // Update in users as well
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
      console.error('[API ERROR] PUT /api/projects:', err);
      res.status(500).json({ success: false, message: 'Güncelleme hatası' });
    }
  });

  // Revised DELETE Route
  app.delete(['/api/projects/:uid/:projectId', '/api/projects/:projectId'], (req: any, res: any) => {
    try {
      const { uid, projectId } = req.params;
      const targetId = projectId || uid;
      
      if (!targetId) {
        return res.status(400).json({ success: false, message: "Eksik veri: Project ID gerekli" });
      }

      const data = JSON.parse(fs.readFileSync(DATA_PATH, 'utf-8'));

      // Filter and update
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

      res.json({
        success: true,
        message: "Proje silindi",
        deletedId: targetId
      });
    } catch (err: any) {
      console.error('[API ERROR] DELETE /api/projects:', err);
      res.status(500).json({ success: false, message: err.message || 'Silme işlemi başarısız' });
    }
  });

  // Vite preview setup for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Production statics
    app.use(express.static(DIST_PATH));
    app.get('*', (req, res) => {
      res.sendFile(path.join(DIST_PATH, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
