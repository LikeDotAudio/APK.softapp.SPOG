import express from 'express';
import cors from 'cors';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import jwt from 'jsonwebtoken';
import { randomBytes } from 'crypto';
import { parseRoleTable, issueRole } from './roles.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '..');

// No baked-in secret: JWT_SECRET from the environment, else a random per-process key
// (tokens then die with the process — fine for this dev-only API).
const JWT_SECRET = process.env.JWT_SECRET || randomBytes(32).toString('hex');
if (!process.env.JWT_SECRET) console.warn('JWT_SECRET unset: signing with a random per-process key');

declare module 'express-serve-static-core' {
  interface Request {
    userRole?: string;
  }
}

const app = express();
app.use(cors());
app.use(express.json());

// Who may be signed for: a fixed table from SPOG_DEV_ROLES ("role:passphrase,…").
// Unset = guest only. The request no longer chooses its own role (server/roles.ts).
const ROLE_TABLE = parseRoleTable(process.env.SPOG_DEV_ROLES);

// JWT Auth endpoint
app.post('/api/v1/auth/login', (req, res) => {
  const { role, passphrase } = req.body ?? {};
  const granted = issueRole(ROLE_TABLE, role, passphrase);
  if (!granted) { res.status(401).json({ error: 'role not granted' }); return; }
  const token = jwt.sign({ role: granted }, JWT_SECRET, { expiresIn: '12h' });
  res.json({ token, role: granted });
});

// Public Changelog endpoint
app.get('/api/v1/changelog', async (req, res) => {
  const fullPath = path.join(PROJECT_ROOT, 'CHANGELOG.md');
  try {
    const content = await fs.readFile(fullPath, 'utf-8');
    res.type('text/plain').send(content);
  } catch (error) {
    res.status(404).send('Not Found');
  }
});

// Real JWT authentication middleware
const jwtAuth = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const authHeader = req.headers['authorization'];
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as { role: string };
      req.userRole = decoded.role;
    } catch (err) {
      req.userRole = 'guest';
    }
  } else {
    req.userRole = 'guest';
  }
  next();
};

app.use(jwtAuth);

app.get('/api/v1/routes/*routePath', async (req, res) => {
  // express 5 / path-to-regexp 8 syntax for wildcard
  let routePath = req.params.routePath || '';
  if (Array.isArray(routePath)) {
    routePath = routePath.join('/');
  }
  const fullPath = path.join(PROJECT_ROOT, 'Routes', routePath);

  try {
    const stat = await fs.stat(fullPath);
    
    if (stat.isDirectory()) {
      // List directory logic
      try {
        const indexStr = await fs.readFile(path.join(fullPath, 'index.json'), 'utf-8');
        res.json(JSON.parse(indexStr));
      } catch (e) {
        // Fallback autoindex mock (for this scaffold, we just read the dir)
        const files = await fs.readdir(fullPath, { withFileTypes: true });
        const manifest = files.map(f => f.isDirectory() ? f.name + '/' : f.name);
        res.json(manifest);
      }
    } else {
      // Send file, applying role-based payload masking
      const contentStr = await fs.readFile(fullPath, 'utf-8');
      
      if (fullPath.endsWith('.json')) {
        let data = JSON.parse(contentStr);
        
        // --- DATA HIDING & SECURITY (Mockup) ---
        // If the user role doesn't have edit/build privileges, we remove sensitive 
        // authoring or hardware telemetry details from the payload before it reaches the client.
        // This ensures genuine backend security over client-side DOM hiding.
        if (req.userRole === 'guest') {
          // Example: A guest should not see IP endpoints or configuration settings in twists
          if (data.twists && Array.isArray(data.twists)) {
            data.twists = data.twists.map((twist: any) => {
              if (typeof twist === 'object') {
                const safeTwist = { ...twist };
                delete safeTwist.hardwareEndpoint;
                delete safeTwist.adminConfig;
                return safeTwist;
              }
              return twist;
            });
          }
        }
        res.json(data);
      } else {
        res.sendFile(fullPath);
      }
    }
  } catch (error) {
    res.status(404).send('Not Found');
  }
});

// Start the server — DEV ONLY: nothing deploys this (spog.like.audio and the APK.audio
// image are static). Loopback by default; HOST=0.0.0.0 to expose it on purpose.
const PORT = Number(process.env.PORT) || 3000;
const HOST = process.env.HOST || '127.0.0.1';
app.listen(PORT, HOST, () => {
  console.log(`SPOG dev API (DEV ONLY — not deployed) listening on http://${HOST}:${PORT}`);
  console.log(`Roles it will sign: guest${[...ROLE_TABLE.keys()].map((r) => `, ${r}`).join('')} (SPOG_DEV_ROLES)`);
  console.log(`Serving API routes from ${path.join(PROJECT_ROOT, 'Routes')}`);
});
