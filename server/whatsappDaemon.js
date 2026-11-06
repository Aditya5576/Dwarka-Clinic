/**
 * Local WhatsApp Automation Daemon for Dr. Baldawa's Dwarka Clinic PWA
 * Runs locally on http://127.0.0.1:3001
 * Uses @whiskeysockets/baileys with persistent multi-file auth credentials in server/.wauth/
 */

import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3001;

// Restrict CORS to local origins (PWA and local loopback)
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) {
      return callback(null, true);
    }
    return callback(new Error('Cross-origin request blocked by Dwarka Clinic CORS policy.'));
  }
}));
app.use(express.json({ limit: '15mb' }));

const AUTH_FOLDER = path.join(__dirname, '.wauth');
if (!fs.existsSync(AUTH_FOLDER)) {
  fs.mkdirSync(AUTH_FOLDER, { recursive: true });
}

let sock = null;
let isConnected = false;
let botPhone = null;
let baileysAvailable = false;

// Attempt dynamic import of Baileys and QR code terminal
async function initWhatsApp() {
  try {
    const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = await import('@whiskeysockets/baileys');
    const qrcode = (await import('qrcode-terminal')).default;
    const pino = (await import('pino')).default;

    baileysAvailable = true;
    console.log('[WhatsApp Daemon] Initializing Baileys Multi-Device Client...');

    const { state, saveCreds } = await useMultiFileAuthState(AUTH_FOLDER);

    sock = makeWASocket({
      auth: state,
      printQRInTerminal: false,
      logger: pino({ level: 'silent' }),
      browser: ["Dwarka Clinic PWA", "Chrome", "1.0.0"]
    });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', (update) => {
      const { connection, lastDisconnect, qr } = update;

      if (qr) {
        console.log('\n======================================================');
        console.log('  DWARKA CLINIC — SCAN WHATSAPP QR CODE TO LINK');
        console.log('======================================================\n');
        qrcode.generate(qr, { small: true });
        console.log('\nOpen WhatsApp on phone -> Linked Devices -> Link a Device\n');
      }

      if (connection === 'close') {
        isConnected = false;
        const statusCode = lastDisconnect?.error?.output?.statusCode;
        const shouldReconnect = statusCode !== DisconnectReason.loggedOut;
        console.log(`[WhatsApp Daemon] Connection closed (code: ${statusCode}). Reconnecting: ${shouldReconnect}`);
        if (shouldReconnect) {
          setTimeout(initWhatsApp, 4000);
        } else {
          console.log('[WhatsApp Daemon] Logged out. Scan new QR code on restart.');
        }
      } else if (connection === 'open') {
        isConnected = true;
        botPhone = sock?.user?.id?.split(':')[0] || 'Connected';
        console.log(`[WhatsApp Daemon] Connected successfully as: +${botPhone}`);
      }
    });

  } catch (err) {
    baileysAvailable = false;
    console.warn('[WhatsApp Daemon] Note: @whiskeysockets/baileys is not yet installed in server/node_modules.');
    console.warn('[WhatsApp Daemon] Run "start-whatsapp-daemon.bat" to install and launch.');
  }
}

// REST Endpoints
app.get('/api/status', (req, res) => {
  res.json({
    online: true,
    connected: isConnected,
    phone: botPhone,
    baileysInstalled: baileysAvailable
  });
});

app.post('/api/send-message', async (req, res) => {
  const { phone, message, mediaBase64 } = req.body;

  if (!phone || !message) {
    return res.status(400).json({ success: false, error: 'Phone and message are required.' });
  }

  const cleanPhone = String(phone).replace(/\D/g, '').slice(-10);
  if (cleanPhone.length !== 10) {
    return res.status(400).json({ success: false, error: 'Invalid 10-digit Indian phone number.' });
  }

  const jid = `91${cleanPhone}@s.whatsapp.net`;

  if (!isConnected || !sock) {
    return res.status(503).json({
      success: false,
      error: 'WhatsApp daemon is not connected. Scan QR code in daemon terminal.'
    });
  }

  try {
    if (mediaBase64 && typeof mediaBase64 === 'string' && mediaBase64.includes(',')) {
      const parts = mediaBase64.split(',');
      const buffer = Buffer.from(parts[1], 'base64');
      const mimeMatch = parts[0].match(/:(.*?);/);
      const mimetype = mimeMatch ? mimeMatch[1] : 'image/jpeg';

      await sock.sendMessage(jid, {
        image: buffer,
        mimetype,
        caption: message
      });
    } else {
      await sock.sendMessage(jid, { text: message });
    }

    const maskedTarget = `+91 ${cleanPhone.slice(0, 2)}****${cleanPhone.slice(-2)}`;
    console.log(`[WhatsApp Daemon] Message successfully dispatched to ${maskedTarget}`);
    return res.json({ success: true, jid });
  } catch (err) {
    const maskedTarget = `+91 ${cleanPhone.slice(0, 2)}****${cleanPhone.slice(-2)}`;
    console.error(`[WhatsApp Daemon] Failed to send message to ${maskedTarget}:`, err);
    return res.status(500).json({ success: false, error: err.message || 'Failed to dispatch message.' });
  }
});

// Start Express Listener
app.listen(PORT, '127.0.0.1', () => {
  console.log(`[WhatsApp Daemon] Dwarka Clinic local server running on http://127.0.0.1:${PORT}`);
  initWhatsApp();
});

