import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_PATH = path.join(__dirname, 'projects.json');

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ limit: '10mb', extended: true }));

  // Initialize data file if it doesn't exist or is invalid
  if (!fs.existsSync(DATA_PATH)) {
    const initialData = {
      projects: [],
      users: {}
    };
    fs.writeFileSync(DATA_PATH, JSON.stringify(initialData, null, 2));
  }

  // API Routes
  app.get('/api/projects', (req, res) => {
    try {
      if (!fs.existsSync(DATA_PATH)) {
        return res.json([]);
      }
      const data = JSON.parse(fs.readFileSync(DATA_PATH, 'utf-8'));
      res.json(data.projects || []);
    } catch (err) {
      res.status(500).json({ success: false, error: 'Failed to read data' });
    }
  });

  app.post('/api/projects', (req, res) => {
    try {
      const project = req.body;
      if (!project || !project.title) {
        return res.status(400).json({ success: false, message: 'Geçersiz proje verisi' });
      }
      
      const data = JSON.parse(fs.readFileSync(DATA_PATH, 'utf-8'));
      
      const newProject = {
        ...project,
        id: project.id || `project-${Date.now()}`
      };

      data.projects.unshift(newProject);

      // Also added to users if uid provided
      const uid = project.uid || project.userId;
      if (uid) {
        if (!data.users[uid]) data.users[uid] = { projects: [] };
        data.users[uid].projects.unshift(newProject);
      }

      fs.writeFileSync(DATA_PATH, JSON.stringify(data, null, 2));
      res.json({ success: true, message: "Proje eklendi", project: newProject });
    } catch (err) {
      res.status(500).json({ success: false, message: 'Failed to save data' });
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
      Object.keys(data.users).forEach(uid => {
        if (data.users[uid].projects) {
          data.users[uid].projects = data.users[uid].projects.map((p: any) => 
            String(p.id) === String(id) ? { ...p, ...updatedProject } : p
          );
        }
      });

      fs.writeFileSync(DATA_PATH, JSON.stringify(data, null, 2));
      res.json({ success: true, message: 'Proje güncellendi' });
    } catch (err) {
      res.status(500).json({ success: false, message: 'Failed to update data' });
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

      if (!fs.existsSync(DATA_PATH)) {
        return res.status(404).json({ success: false, message: "Veri dosyası bulunamadı" });
      }

      const data = JSON.parse(fs.readFileSync(DATA_PATH, 'utf-8'));
      const initialCount = data.projects.length;

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
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
