import express from "express";
import { createServer as createViteServer } from "vite";
import { RouterOSAPI } from "node-routeros";
import path from "path";
import cors from "cors";

process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors()); // Enable CORS for all origins
  app.use(express.json());

  const networksToTrack = [
    { id: 'net_71', name: 'الشبكة 71 في الراك', prefix: '172.17.71.' },
    { id: 'net_47', name: 'الشبكة رقم 47 في الحلقوم', prefix: '172.17.59.' },
    { id: 'net_11', name: 'الشبكة رقم 11 في صفوه', prefix: '172.17.35.' },
    { id: 'net_6', name: 'الشبكة رقم 6 في المركز كراثه', prefix: '172.17.20.' },
    { id: 'net_5', name: 'الشبكة رقم 5 في المركز كراثه', prefix: '172.17.33.' },
    { id: 'modem_62', name: 'المودم رقم 62 فوق بيت ابو ريان', prefix: '172.17.67.' },
    { id: 'net_8', name: 'الشبكة رقم 8 على الصحيه في كراثه', prefix: '172.17.60.' },
    { id: 'modem_63_meshal', name: 'المودم رقم 63 على بيت مشعل', prefix: '172.17.63.' },
    { id: 'modem_100', name: 'المودم رقم 100 على بيت سالمين في كراثه', prefix: '172.17.13.' },
    { id: 'modem_abdulmohsen', name: 'مودم داخلي خاص ب عبدالمحسن في كراثه', prefix: '172.17.62.' },
    { id: 'modem_63_haidara', name: 'مودم رقم 63 على بيت بن حيدره', prefix: '172.17.34.' },
    { id: 'modem_97', name: 'مودم رقم 97 عند خميس بن ناصر', prefix: '172.17.38.' },
    { id: 'modem_abu_abdullah', name: 'المودم ابو عبدالله على البيت في الباريه', prefix: '172.17.29.' },
    { id: 'net_4_kuraith', name: 'الشبكة رقم 4 فوق كريث', prefix: '172.17.56.' },
    { id: 'modems_kuraith', name: 'المتصلين على الموادم الموجوده في كريث', prefix: '172.17.40.' },
    { id: 'net_10_qarada', name: 'الشبكه رقم 10 فوق قراضه', prefix: '172.17.53.' },
    { id: 'net_13_qarada', name: 'الشبكه رقم 13 فوق قراضه', prefix: '172.17.54.' },
    { id: 'modem_27_alkhaleef_qarada', name: 'المودم رقم 27 في الخليف والموادم المتصله عليه في قراضه', prefix: '172.17.16.' },
    { id: 'modem_91_aljadida_qarada', name: 'المودم رقم 91 في الجديده والموادم المتصله عليه في قراضه', prefix: '172.17.15.' },
    { id: 'modem_30_qarada', name: 'مودم رقم 30 في قراضه', prefix: '172.20.' },
    { id: 'net_12_yabrom', name: 'الشبكه رقم 12 فوق يبروم', prefix: '172.17.41.' },
    { id: 'modem_abdullah_bamarhoul', name: 'مودم على بيت عبدالله بامرحول في يبروم', prefix: '172.17.65.' },
    { id: 'modem_21_bakhabizan', name: 'مودم رقم 21 على بيت باخبيزان في يبروم', prefix: '172.17.48.' },
    { id: 'modem_balbahith', name: 'مودم على بيت بلبحيث في يبروم', prefix: '172.17.61.' },
    { id: 'modem_private_yabrom_1', name: 'مودم خاص لصاحب بيت في يبروم', prefix: '172.17.66.' },
    { id: 'modem_private_yabrom_2', name: 'مودم خاص لصاحب بيت في يبروم', prefix: '172.17.51.' },
    { id: 'modem_53_abu_nayef', name: 'مودم رقم 53 على بيت ابو نايف درعون', prefix: '172.17.28.' },
    { id: 'net_13_laqhal', name: 'شبكه رقم 13 في لقحل شروج الباكيلي', prefix: '172.17.22.' },
    { id: 'net_14_laqhal', name: 'شبكه رقم 14 في لقحل شروج الباكيلي', prefix: '172.17.23.' },
    { id: 'net_20_sada', name: 'شبكه رقم 20 على حصن سده', prefix: '172.17.50.' },
    { id: 'net_19_sada', name: 'شبكه رقم 19 على حصن سده', prefix: '172.17.7.' },
    { id: 'modem_saad_alsaba', name: 'مودم على بيت سعد السبع في سده', prefix: '172.17.10.' },
    { id: 'modem_yaseen_sada', name: 'مودم على بيت ياسين في سده', prefix: '172.17.12.' },
    { id: 'modem_40_abu_mahdi', name: 'مودم رقم 40 على بيت ابو مهدي في ملاحه', prefix: '172.17.58.' },
    { id: 'modem_20_bazil', name: 'مودم رقم 20 في مجمع باذيل ملاحه', prefix: '172.17.36.' },
    { id: 'net_18_farasha', name: 'شبكه رقم 18 فوق الفراشه', prefix: '172.17.27.' },
    { id: 'modem_qir_farasha', name: 'مودم عند قير الفراشه', prefix: '172.17.5.' },
    { id: 'net_92_alsakho', name: 'شبكه رقم 92 في السخو', prefix: '172.17.9.' },
    { id: 'net_16_lmbarka', name: 'شبكه رقم 16 على حصن لمباركه', prefix: '172.17.25.' },
    { id: 'net_17_lmbarka', name: 'شبكه رقم 17 على حصن لمباركه', prefix: '172.17.26.' },
    { id: 'modem_abdullah_ali_lmbarka', name: 'مودم على بيت عبدالله علي في لمباركه', prefix: '172.17.3.' },
    { id: 'modem_house_lmbarka', name: 'مودم غلى بيت في لمباركه', prefix: '172.17.4.' },
  ];

  const TOPOLOGY = [
    {
      id: 'karatha_line',
      name: 'خط كراثه',
      devices: [
        { ip: '192.168.11.92', name: 'مرسل من الرئيسي الى كراثه', parentIp: null },
        { ip: '192.168.11.91', name: 'مستلم من الرئيسي فوق كراثه', parentIp: '192.168.11.92' },
        { ip: '192.168.12.60', name: 'ام تو رقم 5 فوق كراثه', parentIp: '192.168.11.91' },
        { ip: '192.168.12.150', name: 'ام تو رقم 6 فوق كراثه', parentIp: '192.168.11.91' },
        { ip: '192.168.11.201', name: 'ام فايف في المركز مرسل باتجاه الصحيه و البيوت في كراثه', parentIp: '192.168.11.91' },
        { ip: '192.168.11.187', name: 'مرسل من المركز الى البرج فوق كريث', parentIp: '192.168.11.91' },
        { ip: '192.168.11.31', name: 'ام فايف مستقبل فوق كريث', parentIp: '192.168.11.187' },
        { ip: '192.168.11.4', name: 'ام فايف فوق كريث مرسل للموادم', parentIp: '192.168.11.31' },
      ]
    },
    {
      id: 'halqoum_safwa_bariya_line',
      name: 'خط الحلقوم + صفوه +بيت الباريه',
      devices: [
        { ip: '192.168.11.5', name: 'مرسل من الرئيسي الى صفوه + الباريه +الحلقوم', parentIp: null },
        { ip: '192.168.11.18', name: 'مستقبل الحلقوم', parentIp: '192.168.11.5' },
        { ip: '192.168.11.198', name: 'مستقبل البيت الباريه', parentIp: '192.168.11.5' },
        { ip: '192.168.11.208', name: 'مستقبل صفوه', parentIp: '192.168.11.5' },
        { ip: '192.168.12.209', name: 'ام تو فوق صفوة رقم 11', parentIp: '192.168.11.208' },
      ]
    },
    {
      id: 'qarada_line',
      name: 'خط قراضه',
      devices: [
        { ip: '192.168.11.191', name: 'مرسل من الريئسي الى الجعدن', parentIp: null },
        { ip: '192.168.11.190', name: 'المستقبل في الجعدن من الرئيسي', parentIp: '192.168.11.191' },
        { ip: '192.168.11.7', name: 'مرسل من الجعدن الى فوق قرضه', parentIp: '192.168.11.190' },
        { ip: '192.168.11.174', name: 'مستقبل فوق قراضه من الجعدن', parentIp: '192.168.11.7' },
        { ip: '192.168.12.146', name: 'ام تو رقم 10 فوق قراضه', parentIp: '192.168.11.174' },
        { ip: '192.168.12.175', name: 'ام تو رقم 13 فوق قراضه', parentIp: '192.168.11.174' },
        { ip: '192.168.11.6', name: 'ام فايف المرسل فوق قراضه للموادم', parentIp: '192.168.11.174' },
      ]
    },
    {
      id: 'alkoud_line',
      name: 'خط من الريسي الى الكود',
      devices: [
        { ip: '192.168.11.8', name: 'مرسل من الرئيسي الى الكود', parentIp: null },
        { ip: '192.168.11.9', name: 'مستقبل في الكود من الرئيسي', parentIp: '192.168.11.8' },
        { ip: '192.168.11.10', name: 'مرسل من الكود الى الكوره فوق يبروم', parentIp: '192.168.11.9' },
        { ip: '192.168.11.199', name: 'مرسل من الكود الى لقحل شروج الباكيلي', parentIp: '192.168.11.9' },
      ]
    },
    {
      id: 'alkoura_yabrom_daraoun_line',
      name: 'خط الكود الى الكوره اضافه الى يبروم و درعون',
      devices: [
        { ip: '192.168.11.142', name: 'مستقبل في الكوره فوق يبروم من الكود', parentIp: null },
        { ip: '192.168.11.141', name: 'مرسل من الكوره الى درعون', parentIp: '192.168.11.142' },
        { ip: '192.168.11.57', name: 'مستقبل في درعون من الكوره على بيت ابو نايف', parentIp: '192.168.11.141' },
        { ip: '192.168.12.74', name: 'ام تو رقم 12 فوق يبروم', parentIp: '192.168.11.142' },
        { ip: '192.168.11.118', name: 'مرسل من الكوره الى بيوت يبروم وباخبيزان', parentIp: '192.168.11.142' },
        { ip: '192.168.11.15', name: 'مستقبل على بيت باخبيزان من الكورة', parentIp: '192.168.11.118' },
        { ip: '192.168.11.21', name: 'مستقبل عند بلبحيث من الكوره', parentIp: '192.168.11.118' },
      ]
    },
    {
      id: 'laqhal_shrouj_albakili_line',
      name: 'خط موزع في لقحل على شروج الباكيلي',
      devices: [
        { ip: '192.168.11.194', name: 'مستقبل في لقحل من الكود', parentIp: null },
        { ip: '192.168.11.19', name: 'مرسل الى من لقحل الى سده', parentIp: '192.168.11.194' },
        { ip: '192.168.11.249', name: 'مستقبل على حصن سده من لقحل', parentIp: '192.168.11.19' },
        { ip: '192.168.11.213', name: 'مرسل على على حصن سده الى السخو و الى البيوت في سده', parentIp: '192.168.11.249' },
        { ip: '192.168.11.3', name: 'مستقبل في السخو من حصن سده', parentIp: '192.168.11.213' },
        { ip: '192.168.12.122', name: 'ام تو رقم 92 في السخو', parentIp: '192.168.11.3' },
        { ip: '192.168.11.211', name: 'مستقبل على بيت ياسين من حصن سده', parentIp: '192.168.11.213' },
        { ip: '192.168.12.20', name: 'شبكه ام تو رقم 20 على حصن سده', parentIp: '192.168.11.213' },
        { ip: '192.168.12.33', name: 'شبكه رقم 19 على حصن سده', parentIp: '192.168.11.213' },
        { ip: '192.168.11.247', name: 'مرسل من لقحل الى ملاحه + الفراشه + مجمع بلعويد', parentIp: '192.168.11.194' },
        { ip: '192.168.11.13', name: 'مستقبل في ملاحه من لقحل عند ابو مهدي', parentIp: '192.168.11.247' },
        { ip: '192.168.11.108', name: 'مستقبل في ملاحه من لقحل على مجمع باذيل', parentIp: '192.168.11.247' },
        { ip: '192.168.11.242', name: 'مستقبل فوق الفراشه من لقحل', parentIp: '192.168.11.247' },
        { ip: '192.168.12.214', name: 'ام تو فوق الفراشه رقم 18', parentIp: '192.168.11.242' },
        { ip: '192.168.11.43', name: 'مرسل من لقحل الى لمباركه', parentIp: '192.168.11.194' },
        { ip: '192.168.11.44', name: 'مستقبل على حصن لمباركه من لقحل', parentIp: '192.168.11.43' },
        { ip: '192.168.11.175', name: 'مرسل من حصن لمباركه الى البيوت في لمباركه', parentIp: '192.168.11.44' },
        { ip: '192.168.12.108', name: 'ام تو رقم 16 على حصن لمباركه', parentIp: '192.168.11.44' },
        { ip: '192.168.12.78', name: 'ام تو رقم 17 على حصن لمباركه', parentIp: '192.168.11.44' },
        { ip: '192.168.11.41', name: 'مستقبل من حصن لمباركه على بيت عبدلله علي', parentIp: '192.168.11.175' },
        { ip: '192.168.11.42', name: 'مستقبل من حصن لمباركه على بيت عماد محمد في لمباركه', parentIp: '192.168.11.175' },
        { ip: '192.168.12.223', name: 'ام تو رقم13 في لقحل', parentIp: '192.168.11.194' },
        { ip: '192.168.12.211', name: 'ام تو رقم 14 في لقحل', parentIp: '192.168.11.194' },
      ]
    }
  ];

  // Background monitoring state
  let backgroundSettings = {
    enabled: false,
    host: '',
    port: '8728',
    username: '',
    password: '',
    whatsappPhone: '967770932655',
    whatsappApiKey: '8489896'
  };

  let previousActiveNeighbors = new Set<string>();
  let monitoringInterval: NodeJS.Timeout | null = null;

  const getDeviceNameByIp = (ip: string) => {
    for (const line of TOPOLOGY) {
      const device = line.devices.find(d => d.ip === ip);
      if (device) return device.name;
    }
    return ip;
  };

  const sendWhatsAppNotification = async (deviceName: string, phone: string, apikey: string) => {
    const message = `تنبيه: انقطع الاتصال عن قطعة (${deviceName}) الآن!`;
    const url = `https://api.callmebot.com/whatsapp.php?phone=${phone}&text=${encodeURIComponent(message)}&apikey=${apikey}`;
    
    try {
      const response = await fetch(url);
      const data = await response.text();
      console.log(`[Background WhatsApp] Sent to ${phone} for ${deviceName}. Response: ${data}`);
    } catch (e) {
      console.error(`[Background WhatsApp] Error sending to ${phone}:`, e);
    }
  };

  const runMonitoringTask = async () => {
    if (!backgroundSettings.enabled || !backgroundSettings.host || !backgroundSettings.username) return;

    console.log(`[Monitoring] Checking Mikrotik at ${backgroundSettings.host}...`);
    let client: RouterOSAPI | null = null;

    try {
      client = new RouterOSAPI({
        host: backgroundSettings.host,
        port: parseInt(backgroundSettings.port) || 8728,
        user: backgroundSettings.username,
        password: backgroundSettings.password,
        timeout: 10
      });

      client.on('error', () => {}); // Silence errors
      await client.connect();
      
      const neighbors = await client.write('/ip/neighbor/print');
      if (neighbors && Array.isArray(neighbors)) {
        const currentActive = new Set<string>(
          neighbors.map((n: any) => n.address || n.address4).filter(Boolean)
        );

        if (previousActiveNeighbors.size > 0) {
          const disconnected = Array.from(previousActiveNeighbors).filter(ip => !currentActive.has(ip));
          
          for (const ip of disconnected) {
            const deviceName = getDeviceNameByIp(ip);
            console.log(`[Monitoring] Device disconnected: ${deviceName} (${ip})`);
            await sendWhatsAppNotification(deviceName, backgroundSettings.whatsappPhone, backgroundSettings.whatsappApiKey);
          }
        }

        previousActiveNeighbors = currentActive;
      }
    } catch (e) {
      console.error(`[Monitoring] Error polling Mikrotik:`, e);
    } finally {
      if (client) {
        try { client.close().catch(() => {}); } catch (e) {}
      }
    }
  };

  // Start background monitoring loop
  const startMonitoring = () => {
    if (monitoringInterval) clearInterval(monitoringInterval);
    previousActiveNeighbors = new Set<string>(); // Reset state for fresh start
    monitoringInterval = setInterval(runMonitoringTask, 30000); // Check every 30 seconds
    console.log("[Monitoring] Background service started.");
  };

  app.post("/api/settings/background", (req, res) => {
    const { enabled, host, port, username, password, whatsappPhone, whatsappApiKey } = req.body;
    
    backgroundSettings = {
      enabled: !!enabled,
      host: host || backgroundSettings.host,
      port: port || backgroundSettings.port,
      username: username || backgroundSettings.username,
      password: password || backgroundSettings.password,
      whatsappPhone: whatsappPhone || backgroundSettings.whatsappPhone,
      whatsappApiKey: whatsappApiKey || backgroundSettings.whatsappApiKey
    };

    if (backgroundSettings.enabled) {
      startMonitoring();
    } else if (monitoringInterval) {
      clearInterval(monitoringInterval);
      monitoringInterval = null;
      console.log("[Monitoring] Background service stopped.");
    }

    res.json({ success: true, settings: { ...backgroundSettings, password: '****' } });
  });

  app.get("/api/settings/background", (req, res) => {
    res.json({ success: true, settings: { ...backgroundSettings, password: '****' } });
  });

  app.post("/api/notify/whatsapp", async (req, res) => {
    const { deviceName, phone: customPhone, apikey: customApiKey } = req.body;
    const phone = customPhone || process.env.CALLMEBOT_PHONE || "967770932655";
    const apikey = customApiKey || process.env.CALLMEBOT_API_KEY || "8489896";

    console.log(`[WhatsApp] Attempting to notify for device: ${deviceName} to ${phone}`);

    if (!deviceName) {
      return res.status(400).json({ success: false, error: "اسم الجهاز مطلوب" });
    }

    const message = `تنبيه: انقطع الاتصال عن قطعة (${deviceName}) الآن!`;
    // Reverted to WhatsApp API as per user's corrected instructions
    const url = `https://api.callmebot.com/whatsapp.php?phone=${phone}&text=${encodeURIComponent(message)}&apikey=${apikey}`;

    try {
      // Use global fetch if available (Node 18+), otherwise use https module
      if (typeof fetch !== 'undefined') {
        const response = await fetch(url);
        const data = await response.text();
        console.log(`[WhatsApp] CallMeBot Response: ${data}`);
        
        // CallMeBot sometimes returns 200 even for errors, check body content
        const isActuallySuccess = response.ok && (
          data.toLowerCase().includes('success') || 
          data.toLowerCase().includes('sent') || 
          data.toLowerCase().includes('queued')
        );

        if (isActuallySuccess) {
          return res.json({ success: true, details: data });
        } else {
          return res.status(500).json({ 
            success: false, 
            error: data.includes('API Key') ? "مفتاح الـ API غير صالح" : "فشل إرسال التنبيه عبر واتساب", 
            details: data 
          });
        }
      }

      // Fallback to https module
      const https = await import('https');
      const request = https.get(url, (response) => {
        let data = '';
        response.on('data', (chunk) => { data += chunk; });
        response.on('end', () => {
          console.log(`[WhatsApp] CallMeBot Response (https): ${data}`);
          
          const isActuallySuccess = response.statusCode === 200 && (
            data.toLowerCase().includes('success') || 
            data.toLowerCase().includes('sent') || 
            data.toLowerCase().includes('queued')
          );

          if (isActuallySuccess) {
            if (!res.headersSent) res.json({ success: true, details: data });
          } else {
            if (!res.headersSent) res.status(500).json({ 
              success: false, 
              error: data.includes('API Key') ? "مفتاح الـ API غير صالح" : "فشل إرسال التنبيه عبر واتساب", 
              details: data 
            });
          }
        });
      });
      
      request.on('error', (err) => {
        console.error("[WhatsApp] Request Error:", err);
        if (!res.headersSent) res.status(500).json({ success: false, error: "خطأ في الاتصال بخدمة واتساب", details: err.message });
      });
      
      request.setTimeout(10000, () => {
        request.destroy();
        if (!res.headersSent) res.status(500).json({ success: false, error: "انتهت مهلة الاتصال بخدمة واتساب" });
      });
    } catch (error: any) {
      console.error("[WhatsApp] Notification Error:", error);
      if (!res.headersSent) res.status(500).json({ success: false, error: "خطأ داخلي في الخادم", details: error.message });
    }
  });

  app.post("/api/mikrotik/stats", async (req, res) => {
    const { host, port, username, password } = req.body;
    
    if (!host || !username || password === undefined) {
      return res.status(400).json({ success: false, error: "الرجاء إدخال جميع البيانات المطلوبة" });
    }

    // Sanitize host in case user provides a full URL (e.g., http://myrouter.com)
    let cleanHost = host.trim();
    try {
      if (cleanHost.startsWith('http://') || cleanHost.startsWith('https://')) {
        cleanHost = new URL(cleanHost).hostname;
      } else if (cleanHost.includes('/')) {
        cleanHost = cleanHost.split('/')[0];
      }
    } catch (e) {
      // Ignore URL parsing errors and use the original string
    }

    let client: RouterOSAPI | null = null;

    try {
      client = new RouterOSAPI({
        host: cleanHost,
        port: parseInt(port) || 8728,
        user: username,
        password: password,
        timeout: 10,
        tls: parseInt(port) === 8729 ? {} : undefined
      });

      // Prevent unhandled error events from crashing the Node.js process
      client.on('error', (err) => {
        console.error('RouterOSAPI Client Error:', err);
      });

      await client.connect();
      const resources = await client.write('/system/resource/print');
      
      let hotspotActiveCount = 0;
      let networkCounts = networksToTrack.map(n => ({ ...n, count: 0 }));
      let activeNeighbors: string[] = [];

      try {
        const neighbors = await client.write('/ip/neighbor/print');
        if (neighbors && Array.isArray(neighbors)) {
          // Extract both IPv4 and IPv6 addresses if available, usually 'address' or 'address4'
          activeNeighbors = neighbors
            .map((n: any) => n.address || n.address4)
            .filter(Boolean);
        }
      } catch (e) {
        console.warn("Could not fetch neighbors:", e);
      }

      try {
        const hotspotActive = await client.write('/ip/hotspot/active/print');
        if (hotspotActive) {
          hotspotActiveCount = hotspotActive.length;
          networkCounts = networksToTrack.map(net => {
            const count = hotspotActive.filter((user: any) => 
              user.address && user.address.startsWith(net.prefix)
            ).length;
            return { ...net, count };
          });
        }
      } catch (e) {
        console.warn("Could not fetch hotspot active users (package might not be installed):", e);
      }

      if (resources && resources.length > 0) {
        res.json({ 
          success: true, 
          data: {
            ...resources[0],
            hotspotActiveCount,
            networkCounts,
            activeNeighbors
          } 
        });
      } else {
        res.status(500).json({ success: false, error: "لم يتم إرجاع أي بيانات من الراوتر" });
      }
    } catch (error: any) {
      console.error("MikroTik Error:", error);
      
      // Provide a more user-friendly error message for common issues
      let errorMessage = error.message || "فشل الاتصال بالراوتر. تأكد من صحة البيانات ومن تفعيل الـ API.";
      if (errorMessage.includes("Username or password is invalid") || errorMessage.includes("invalid user name or password")) {
        errorMessage = "اسم المستخدم أو كلمة المرور غير صحيحة.";
      } else if (errorMessage.includes("timeout") || errorMessage.includes("ETIMEDOUT")) {
        errorMessage = "انتهى وقت الاتصال. تأكد من أن عنوان الـ IP صحيح وأن الراوتر متصل بالإنترنت.";
      } else if (errorMessage.includes("ECONNREFUSED")) {
        errorMessage = "تم رفض الاتصال. تأكد من تفعيل خدمة الـ API في الراوتر على المنفذ المحدد.";
      }

      res.status(500).json({ success: false, error: errorMessage });
    } finally {
      if (client) {
        try {
          client.close().catch(() => {});
        } catch (e) {
          // Ignore close errors
        }
      }
    }
  });

  app.post("/api/mikrotik/check-card", async (req, res) => {
    const { host, port, username, password, cardNumber } = req.body;
    
    if (!host || !username || password === undefined || !cardNumber) {
      return res.status(400).json({ success: false, error: "الرجاء إدخال جميع البيانات المطلوبة" });
    }

    let cleanHost = host.trim();
    try {
      if (cleanHost.startsWith('http://') || cleanHost.startsWith('https://')) {
        cleanHost = new URL(cleanHost).hostname;
      } else if (cleanHost.includes('/')) {
        cleanHost = cleanHost.split('/')[0];
      }
    } catch (e) {}

    let client: RouterOSAPI | null = null;

    try {
      client = new RouterOSAPI({
        host: cleanHost,
        port: parseInt(port) || 8728,
        user: username,
        password: password,
        timeout: 10,
        tls: parseInt(port) === 8729 ? {} : undefined
      });

      client.on('error', (err) => {
        console.error('RouterOSAPI Client Error:', err);
      });

      await client.connect();

      let userFound = null;
      let userType = '';

      // Try ROS v6 User Manager ONLY (as requested by user)
      try {
        const um6Users = await client.write('/tool/user-manager/user/print', [
          '?username=' + cardNumber,
          '=.proplist=username,actual-profile,download-used,upload-used,uptime-used,transfer-limit,uptime-limit'
        ]);
        if (um6Users && um6Users.length > 0) {
          userFound = um6Users[0];
          userType = 'usermanager6';
        }
      } catch(e) {
        console.error("Error searching in User Manager v6:", e);
      }

      if (!userFound) {
        return res.status(404).json({ success: false, error: "لم يتم العثور على الكرت" });
      }

      // Fetch session history from User Manager v6
      let sessionHistory: any[] = [];
      try {
        const um6Sessions = await client.write('/tool/user-manager/session/print', [
          '?user=' + cardNumber.trim()
        ]);
        
        if (um6Sessions && Array.isArray(um6Sessions)) {
          um6Sessions.reverse().forEach((session: any) => {
            let ip = session['user-ip'] || session['from-address'] || session['calling-station-id'];
            let siteName = 'موقع غير معروف';
            
            if (ip) {
              // Remove CIDR or port if present (e.g., 192.168.1.1/32 or 192.168.1.1:1234)
              ip = ip.split('/')[0].split(':')[0].trim();
              
              // Sort networks by prefix length descending to match the most specific one first
              const sortedNetworks = [...networksToTrack].sort((a, b) => b.prefix.length - a.prefix.length);
              const network = sortedNetworks.find(n => ip.startsWith(n.prefix.trim()));
              
              if (network) {
                siteName = network.name;
              }
            }

            const getField = (obj: any, keys: string[]) => {
              for (const k of keys) {
                if (obj[k] && obj[k] !== '') return obj[k];
                if (obj['.' + k] && obj['.' + k] !== '') return obj['.' + k];
                const underscoreKey = k.replace(/-/g, '_');
                if (obj[underscoreKey] && obj[underscoreKey] !== '') return obj[underscoreKey];
              }
              // Last resort: find any key containing the search term and 'time'
              const search = keys[0].split('-')[0]; // e.g., 'start' or 'from'
              const foundKey = Object.keys(obj).find(k => 
                (k.toLowerCase().includes(search) || k.toLowerCase().includes('time')) && 
                obj[k] && obj[k] !== ''
              );
              return foundKey ? obj[foundKey] : null;
            };

            const startTime = getField(session, ['start-time', 'from-time', 'start_time', 'from_time']);
            const endTime = getField(session, ['end-time', 'till-time', 'end_time', 'till_time']);

            if (!startTime || !endTime) {
              console.warn("DEBUG: Missing time fields in session:", JSON.stringify(session, null, 2));
            }

            sessionHistory.push({
              site: siteName,
              startTime: startTime || 'غير معروف',
              endTime: endTime || (session['active'] === 'true' || session['.active'] === 'true' ? 'لا يزال متصلاً' : 'غير معروف'),
              uptime: session['uptime'] || session['.uptime'] || '0s',
              ip: ip || 'غير متوفر'
            });
          });
          // Limit to last 10 sessions
          sessionHistory = sessionHistory.slice(0, 10);
        }
      } catch (e) {
        console.warn("Error fetching User Manager sessions:", e);
      }

      // Normalize data
      let packageName = userFound.profile || userFound['actual-profile'] || userFound.group || 'غير محدد';
      
      let dataUsed = 0;
      if (userType === 'hotspot') {
        dataUsed = parseInt(userFound['bytes-in'] || '0') + parseInt(userFound['bytes-out'] || '0');
      } else {
        dataUsed = parseInt(userFound['download-used'] || '0') + parseInt(userFound['upload-used'] || '0');
      }
      
      let dataLimit = parseInt(userFound['limit-bytes-total'] || userFound['transfer-limit'] || '0');
      let timeUsed = userFound['uptime'] || userFound['uptime-used'] || '0s';
      let timeLimit = userFound['limit-uptime'] || userFound['uptime-limit'] || '0s';

      // Hardcoded Data & Time Limits based on package name
      if (packageName) {
        if (packageName.includes('8000')) {
          dataLimit = 0; // مفتوح
          timeLimit = '0s'; // مفتوح
        } else if (packageName.includes('7000')) {
          dataLimit = 32 * 1024 * 1024 * 1024; // 32 GB
          timeLimit = (45 * 86400) + 's'; // 45 days
        } else if (packageName.includes('3000')) {
          dataLimit = 18.5 * 1024 * 1024 * 1024; // 18.5 GB
          timeLimit = (30 * 86400) + 's'; // 30 days
        } else if (packageName.includes('2000')) {
          dataLimit = 11.5 * 1024 * 1024 * 1024; // 11.5 GB
          timeLimit = (28 * 86400) + 's'; // 28 days
        } else if (packageName.includes('1000')) {
          dataLimit = 4 * 1024 * 1024 * 1024; // 4 GB
          timeLimit = (12 * 86400) + 's'; // 12 days
        } else if (packageName.includes('500')) {
          dataLimit = 1600 * 1024 * 1024; // 1600 MB
          timeLimit = (5 * 86400) + 's'; // 5 days
        } else if (packageName.includes('200')) {
          dataLimit = 600 * 1024 * 1024; // 600 MB
          timeLimit = (2 * 86400) + 's'; // 2 days
        }
      }

      res.json({
        success: true,
        data: {
          cardNumber,
          package: packageName,
          dataUsed,
          dataLimit,
          timeUsed,
          timeLimit,
          userType,
          sessionHistory
        }
      });

    } catch (error: any) {
      console.error("MikroTik Check Card Error:", error);
      res.status(500).json({ success: false, error: "فشل الاتصال بالراوتر للبحث عن الكرت" });
    } finally {
      if (client) {
        try {
          client.close().catch(() => {});
        } catch (e) {}
      }
    }
  });

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
