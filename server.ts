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
