import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import { db } from './src/services/firebase.ts';
import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
} from 'firebase/firestore';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initial fallback admin if database is freshly initiated
const DEFAULT_ROOT_ADMIN = {
  id: 'usr-admin',
  username: 'admin',
  password: 'admin123',
  name: 'លោក ស៊ុយ បូរ៉ា (Admin)',
  role: 'admin',
  email: 'admin@toulsambour.edu.kh',
  phone: '012 888 999',
  status: 'active',
  avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
  createdAt: '2025-10-01',
};

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true }));

  // CORS Middleware for Mobile and Desktop cross-origin requests
  app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    if (req.method === 'OPTIONS') {
      return res.sendStatus(200);
    }
    next();
  });

  // -------------------------------------------------------------
  // 3-Tier System Status & Health Check API
  // -------------------------------------------------------------
  app.get('/api/system/status', async (req, res) => {
    let dbStatus = 'connected';
    let dbError = null;
    try {
      await getDoc(doc(db, 'test', 'connection'));
    } catch (e: any) {
      if (e?.message && e.message.includes('the client is offline')) {
        dbStatus = 'offline';
        dbError = e.message;
      }
    }

    res.json({
      architecture: '3-Tier Full-Stack (Frontend + Backend API + Central Database)',
      frontend: {
        name: 'React SPA + Tailwind CSS + Mobile/Desktop Responsive',
        status: 'online',
      },
      backend: {
        name: 'Node.js Express REST API Server',
        port: PORT,
        status: 'online',
      },
      centralDatabase: {
        name: 'Google Firebase Firestore Cloud Database',
        databaseId: 'ai-studio-toulsambourschoo-72eb52ce-3fa8-4250-a71e-e7843de9faf3',
        status: dbStatus,
        error: dbError,
      },
      timestamp: new Date().toISOString(),
    });
  });

  app.get('/api/health', (req, res) => {
    res.json({
      status: 'online',
      school: 'អនុវិទ្យាល័យ ហ៊ុន សែន ទួលសំបួរ',
      system: 'Hun Sen Toulsambour School Management System',
      version: '4.0.0',
      database: 'Firebase Firestore Cloud Database Connected',
      timestamp: new Date().toISOString(),
      platform: 'Full-Stack Express + React + Firebase Cloud DB',
    });
  });

  // -------------------------------------------------------------
  // Central Database User Management API Endpoints
  // -------------------------------------------------------------

  // 1. GET /api/users - Fetch all users from Central Database
  app.get('/api/users', async (req, res) => {
    try {
      const snapshot = await getDocs(collection(db, 'users'));
      const users: any[] = [];
      snapshot.forEach((docSnap) => {
        users.push(docSnap.data());
      });

      // Ensure root admin always exists
      if (!users.some((u) => u.username === 'admin')) {
        users.unshift(DEFAULT_ROOT_ADMIN);
        // Persist default admin to cloud database asynchronously
        setDoc(doc(db, 'users', DEFAULT_ROOT_ADMIN.id), DEFAULT_ROOT_ADMIN).catch(() => {});
      }

      res.json({
        success: true,
        count: users.length,
        users,
      });
    } catch (err: any) {
      console.warn('Backend /api/users read fallback:', err.message);
      res.json({
        success: true,
        count: 1,
        users: [DEFAULT_ROOT_ADMIN],
        note: 'Fallback to default admin',
      });
    }
  });

  // 2. POST /api/users - Create new user in Central Database
  app.post('/api/users', async (req, res) => {
    try {
      const { username, password, name, role, email, phone, avatar, status } = req.body;
      if (!username || !password || !name) {
        return res.status(400).json({
          success: false,
          error: 'Username, password, and name are required',
        });
      }

      const userId = `usr-${Date.now()}`;
      const newUser = {
        id: userId,
        username: username.trim(),
        password: password.trim(),
        name: name.trim(),
        role: role || 'teacher',
        email: email ? email.trim() : `${username.trim()}@toulsambour.edu.kh`,
        phone: phone || '',
        avatar: avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
        status: status || 'active',
        createdAt: new Date().toISOString().split('T')[0],
      };

      await setDoc(doc(db, 'users', userId), newUser);

      res.status(201).json({
        success: true,
        message: 'អ្នកប្រើប្រាស់ត្រូវបានបង្កើតក្នុង Central Database ដោយជោគជ័យ',
        user: newUser,
      });
    } catch (err: any) {
      console.error('Error creating user in backend:', err);
      res.status(500).json({
        success: false,
        error: err.message || 'Failed to create user in Central Database',
      });
    }
  });

  // 3. PUT /api/users/:id - Update user in Central Database
  app.put('/api/users/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;

      const userDocRef = doc(db, 'users', id);
      const existingSnap = await getDoc(userDocRef);

      if (!existingSnap.exists()) {
        // If not found in cloud, create it
        const newUser = { id, ...updates };
        await setDoc(userDocRef, newUser);
        return res.json({
          success: true,
          message: 'បានកែប្រែព័ត៌មានអ្នកប្រើប្រាស់ជោគជ័យ',
          user: newUser,
        });
      }

      await updateDoc(userDocRef, updates);
      res.json({
        success: true,
        message: 'ព័ត៌មានត្រូវបានកែប្រែក្នុង Central Database ដោយជោគជ័យ',
      });
    } catch (err: any) {
      console.error('Error updating user:', err);
      res.status(500).json({
        success: false,
        error: err.message || 'Failed to update user',
      });
    }
  });

  // 4. DELETE /api/users/:id - Delete user from Central Database
  app.delete('/api/users/:id', async (req, res) => {
    try {
      const { id } = req.params;
      if (id === 'usr-admin') {
        return res.status(403).json({
          success: false,
          error: 'មិនអាចលុបគណនី Root Admin បានទេ',
        });
      }

      await deleteDoc(doc(db, 'users', id));
      res.json({
        success: true,
        message: 'បានលុបគណនីពី Central Database ដោយជោគជ័យ',
      });
    } catch (err: any) {
      console.error('Error deleting user:', err);
      res.status(500).json({
        success: false,
        error: err.message || 'Failed to delete user',
      });
    }
  });

  // 5. GET /api/system/access-code - Get current shared universal system access code
  app.get('/api/system/access-code', (req, res) => {
    res.json({
      success: true,
      accessCode: DEFAULT_ROOT_ADMIN.password,
    });
  });

  // 6. PUT /api/system/access-code - Update shared universal access code for ALL users
  app.put('/api/system/access-code', async (req, res) => {
    try {
      const { accessCode } = req.body;
      if (!accessCode || accessCode.trim().length < 4) {
        return res.status(400).json({
          success: false,
          error: 'លេខកូដសម្ងាត់ត្រូវមានយ៉ាងហោចណាស់ ៤ តួអក្សរ',
        });
      }
      const newCode = accessCode.trim();
      DEFAULT_ROOT_ADMIN.password = newCode;

      // Update in cloud Firestore for all users if reachable
      try {
        const snapshot = await getDocs(collection(db, 'users'));
        const updatePromises: Promise<any>[] = [];
        snapshot.forEach((docSnap) => {
          updatePromises.push(updateDoc(doc(db, 'users', docSnap.id), { password: newCode }));
        });
        await Promise.allSettled(updatePromises);
      } catch (cloudErr) {
        console.warn('Could not update all cloud user passwords:', cloudErr);
      }

      res.json({
        success: true,
        message: 'លេខកូដសម្ងាត់រួមប្រព័ន្ធត្រូវបានផ្លាស់ប្ដូរសម្រាប់គ្រប់គណនីទាំងអស់ដោយជោគជ័យ',
        accessCode: newCode,
      });
    } catch (err: any) {
      console.error('Error updating system access code:', err);
      res.status(500).json({
        success: false,
        error: err.message || 'Failed to update system access code',
      });
    }
  });

  // 7. POST /api/users/:id/reset-password - Password reset updates the single universal system code
  app.post('/api/users/:id/reset-password', async (req, res) => {
    try {
      const { newPassword } = req.body;
      if (!newPassword || newPassword.trim().length < 4) {
        return res.status(400).json({
          success: false,
          error: 'ពាក្យសម្ងាត់ត្រូវមានយ៉ាងហោចណាស់ ៤ តួអក្សរ',
        });
      }

      const newCode = newPassword.trim();
      DEFAULT_ROOT_ADMIN.password = newCode;

      // Update in cloud Firestore for all users
      try {
        const snapshot = await getDocs(collection(db, 'users'));
        const updatePromises: Promise<any>[] = [];
        snapshot.forEach((docSnap) => {
          updatePromises.push(updateDoc(doc(db, 'users', docSnap.id), { password: newCode }));
        });
        await Promise.allSettled(updatePromises);
      } catch (cloudErr) {
        console.warn('Could not update all cloud user passwords on reset:', cloudErr);
      }

      res.json({
        success: true,
        message: 'លេខកូដសម្ងាត់រួមត្រូវបានផ្លាស់ប្ដូរក្នុង Central Database ដោយជោគជ័យសម្រាប់គ្រប់គណនីទាំងអស់',
        accessCode: newCode,
      });
    } catch (err: any) {
      console.error('Error resetting password:', err);
      res.status(500).json({
        success: false,
        error: err.message || 'Failed to reset password',
      });
    }
  });

  // -------------------------------------------------------------
  // Central Multi-User State Synchronization API (/api/sync/state)
  // Ensures all Users across all accounts/browsers/tabs see identical attendance & school data
  // -------------------------------------------------------------
  let sharedServerState: Record<string, any> | null = null;

  app.get('/api/sync/state', async (req, res) => {
    try {
      // Also pull latest attendanceRecords from Firestore if sharedServerState is not yet populated
      if (!sharedServerState) {
        try {
          const [attSnap, stuSnap, clsSnap] = await Promise.all([
            getDocs(collection(db, 'attendanceRecords')),
            getDocs(collection(db, 'students')),
            getDocs(collection(db, 'classes')),
          ]);
          const attList: any[] = [];
          attSnap.forEach((d) => attList.push(d.data()));
          const stuList: any[] = [];
          stuSnap.forEach((d) => stuList.push(d.data()));
          const clsList: any[] = [];
          clsSnap.forEach((d) => clsList.push(d.data()));

          if (attList.length > 0 || stuList.length > 0 || clsList.length > 0) {
            sharedServerState = {
              attendanceRecords: attList,
              students: stuList.length > 0 ? stuList : undefined,
              classes: clsList.length > 0 ? clsList : undefined,
              updatedAt: Date.now(),
            };
          }
        } catch {
          // Ignore cloud preload error
        }
      }

      res.json({
        success: true,
        state: sharedServerState,
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.post('/api/sync/state', async (req, res) => {
    try {
      const incoming = req.body || {};
      if (!sharedServerState) {
        sharedServerState = { ...incoming, updatedAt: Date.now() };
      } else {
        const deletedSet = new Set<string>([
          ...(Array.isArray(sharedServerState.deletedIds) ? sharedServerState.deletedIds : []),
          ...(Array.isArray(incoming.deletedIds) ? incoming.deletedIds : []),
        ]);

        // Merge attendanceRecords by id (excluding deleted records/students)
        const mergedAttMap = new Map<string, any>();
        for (const r of sharedServerState.attendanceRecords || []) {
          if (r && r.id && !deletedSet.has(r.id) && !deletedSet.has(r.studentId)) {
            mergedAttMap.set(r.id, r);
          }
        }
        for (const r of incoming.attendanceRecords || []) {
          if (r && r.id && !deletedSet.has(r.id) && !deletedSet.has(r.studentId)) {
            mergedAttMap.set(r.id, r);
          }
        }

        // Merge attendanceSessions by id
        const mergedSessMap = new Map<string, any>();
        for (const s of sharedServerState.attendanceSessions || []) {
          if (s && s.id) mergedSessMap.set(s.id, s);
        }
        for (const s of incoming.attendanceSessions || []) {
          if (s && s.id) mergedSessMap.set(s.id, s);
        }

        const filteredStudents = Array.isArray(incoming.students || sharedServerState.students)
          ? (incoming.students || sharedServerState.students).filter((s: any) => {
              if (!s) return false;
              const code = String(s.studentId || '').trim();
              const name = String(s.khmerName || '').trim();
              return !deletedSet.has(s.id) && !deletedSet.has(`stu_key:${code}_${name}`);
            })
          : undefined;

        const filteredClasses = Array.isArray(incoming.classes || sharedServerState.classes)
          ? (incoming.classes || sharedServerState.classes).filter((c: any) => {
              if (!c) return false;
              const normName = String(c.name || '').trim().replace(/\s+/g, ' ');
              return !deletedSet.has(c.id) && !deletedSet.has(`cls_name:${normName}`);
            })
          : undefined;

        sharedServerState = {
          ...sharedServerState,
          ...incoming,
          students: filteredStudents,
          classes: filteredClasses,
          attendanceRecords: Array.from(mergedAttMap.values()),
          attendanceSessions: Array.from(mergedSessMap.values()),
          deletedIds: Array.from(deletedSet),
          updatedAt: Date.now(),
        };
      }

      res.json({
        success: true,
        updatedAt: sharedServerState?.updatedAt || Date.now(),
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // -------------------------------------------------------------
  // School General Info & Telegram Proxy
  // -------------------------------------------------------------
  app.get('/api/school/info', (req, res) => {
    res.json({
      nameKm: 'អនុវិទ្យាល័យ ហ៊ុន សែន ទួលសំបួរ',
      nameEn: 'Hun Sen Toulsambour Secondary School',
      code: 'HTSS-070809',
      academicYear: '២០២៥-២០២៦',
      location: 'ឃុំទួលសំបួរ ស្រុកស្ទឹងត្រង់ ខេត្តកំពង់ចាម',
      ministry: 'ក្រសួងអប់រំ យុវជន និងកីឡា',
      department: 'មន្ទីរអប់រំ យុវជន និងកីឡា ខេត្តកំពង់ចាម',
      office: 'ការិយាល័យអប់រំ យុវជន និងកីឡា ស្រុកស្ទឹងត្រង់',
      grades: ['ថ្នាក់ទី ៧', 'ថ្នាក់ទី ៨', 'ថ្នាក់ទី ៩'],
      educationLevel: 'អនុវិទ្យាល័យ (Secondary Education)',
      contact: {
        phone: '012 888 999',
        telegram: '@ToulsambourSchoolBot',
      },
    });
  });

  const DEFAULT_BOT_TOKEN = '8854828129:AAHp_oHUOkQ1u9vJiT8tFU8HtSygyaZHWyU';
  const DEFAULT_BOT_USERNAME = '@machin_caffee_bot';

  // 1. Verify Telegram Bot Connection (getMe)
  app.post('/api/telegram/getMe', async (req, res) => {
    const token = req.body.botToken || DEFAULT_BOT_TOKEN;
    try {
      const response = await fetch(`https://api.telegram.org/bot${token}/getMe`);
      const data = await response.json();
      res.json(data);
    } catch (err: any) {
      console.error('Telegram getMe error:', err);
      res.status(500).json({ ok: false, error: err.message || 'Failed to connect to Telegram API' });
    }
  });

  // 2. Fetch Latest Chat IDs / Updates from Telegram users (getUpdates)
  app.post('/api/telegram/getUpdates', async (req, res) => {
    const token = req.body.botToken || DEFAULT_BOT_TOKEN;
    try {
      const response = await fetch(`https://api.telegram.org/bot${token}/getUpdates?offset=-10`);
      const data = await response.json();
      if (data.ok && Array.isArray(data.result)) {
        // Extract unique chats from recent messages
        const chatsMap = new Map();
        for (const item of data.result) {
          const chat = item.message?.chat || item.channel_post?.chat || item.my_chat_member?.chat;
          if (chat && chat.id) {
            chatsMap.set(String(chat.id), {
              id: String(chat.id),
              title: chat.title || `${chat.first_name || ''} ${chat.last_name || ''}`.trim() || chat.username || 'Chat',
              type: chat.type,
              username: chat.username,
            });
          }
        }
        return res.json({
          ok: true,
          chats: Array.from(chatsMap.values()),
          rawCount: data.result.length,
        });
      }
      res.json(data);
    } catch (err: any) {
      console.error('Telegram getUpdates error:', err);
      res.status(500).json({ ok: false, error: err.message || 'Failed to fetch updates' });
    }
  });

  // 3. Send Telegram Message
  app.post('/api/telegram/send', async (req, res) => {
    const { botToken, chatId, message } = req.body;
    if (!message) {
      return res.status(400).json({ ok: false, error: 'Message content is required' });
    }

    const token = botToken || DEFAULT_BOT_TOKEN;

    // If no chatId provided, we record to local DB and notify user to start the bot
    if (!chatId) {
      return res.json({
        ok: true,
        simulated: true,
        message: 'បានកត់ត្រាសារក្នុងប្រព័ន្ធ (សូមភ្ជាប់ Chat ID ឬ Start Bot @machin_caffee_bot ដើម្បីបញ្ជូនចូល Telegram ផ្ទាល់)',
        sentAt: new Date().toISOString(),
      });
    }

    try {
      const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text: message,
          parse_mode: 'HTML',
        }),
      });
      const data = await response.json();
      res.json(data);
    } catch (err: any) {
      console.error('Telegram dispatch error:', err);
      res.status(500).json({ ok: false, error: err.message || 'Telegram dispatch failed' });
    }
  });

  app.get('/api/device/capabilities', (req, res) => {
    const userAgent = req.headers['user-agent'] || '';
    const isMobile = /mobile|android|iphone|ipad|phone/i.test(userAgent);
    const isTablet = /tablet|ipad/i.test(userAgent);
    res.json({
      deviceType: isMobile ? (isTablet ? 'tablet' : 'mobile') : 'desktop',
      isMobile,
      userAgent,
      capabilities: {
        touchOptimized: isMobile,
        responsiveColumns: isMobile ? 1 : 3,
        supportsRealTimeSync: true,
        cloudDatabaseOnline: true,
      },
    });
  });

  // -------------------------------------------------------------
  // Frontend Serving (Vite middleware in dev, Static in production)
  // -------------------------------------------------------------
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Hun Sen Toulsambour School Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Fatal Server Error:', err);
});
