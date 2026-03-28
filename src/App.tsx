import React, { useState, useEffect, useRef } from 'react';
import { Activity, Clock, Cpu, Server, LogIn, AlertCircle, LogOut, Users, Network, Wifi, ShieldAlert, CheckCircle2, XCircle, ChevronRight, MessageCircle, FileText } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Toaster, toast } from 'sonner';
import { cn, parseMikrotikUptimeToSeconds, formatSecondsToArabicUptime } from './lib/utils';

const translateLog = (message: string) => {
  if (!message) return '';
  let translated = message;
  
  const dictionary: Record<string, string> = {
    'logged in': 'سجل دخوله',
    'logged out': 'سجل خروجه',
    'login failure': 'فشل تسجيل الدخول',
    'connected': 'اتصل',
    'disconnected': 'انقطع الاتصال',
    'link up': 'الرابط متصل',
    'link down': 'الرابط غير متصل',
    'assigned': 'تم تعيين',
    'deassigned': 'تم إلغاء تعيين',
    'interface': 'المنفذ',
    'system': 'النظام',
    'error': 'خطأ',
    'critical': 'حرج',
    'warning': 'تحذير',
    'info': 'معلومة',
    'user': 'المستخدم',
    'password': 'كلمة المرور',
    'invalid': 'غير صالح',
    'timeout': 'انتهى الوقت',
    'reboot': 'إعادة تشغيل',
    'shutdown': 'إيقاف تشغيل',
    'started': 'بدأ',
    'stopped': 'توقف',
    'changed': 'تغير',
    'added': 'أضيف',
    'removed': 'أزيل',
    'failed': 'فشل',
    'success': 'نجاح',
    'authentication': 'المصادقة',
    'mac address': 'عنوان الماك',
    'ip address': 'عنوان الآي بي',
    'dhcp': 'خادم DHCP',
    'hotspot': 'نقطة الاتصال',
    'pppoe': 'PPPoE',
    'wireless': 'الشبكة اللاسلكية',
    'bridge': 'الجسر',
    'route': 'المسار',
    'firewall': 'جدار الحماية',
    'filter': 'الفلتر',
    'nat': 'النات',
    'mangle': 'المانجل',
    'queue': 'قائمة الانتظار',
    'script': 'السكربت',
    'scheduler': 'المجدول',
    'up': 'يعمل',
    'down': 'متوقف',
    'from': 'من',
    'to': 'إلى',
    'via': 'عبر',
    'by': 'بواسطة',
    'on': 'على',
    'in': 'في',
    'out': 'خارج',
    'for': 'لـ',
    'with': 'مع',
    'without': 'بدون'
  };

  for (const [eng, ar] of Object.entries(dictionary)) {
    const regex = new RegExp(`\\b${eng}\\b`, 'gi');
    translated = translated.replace(regex, ar);
  }
  
  return translated;
};

const getDeviceNameByIp = (ip: string) => {
  for (const line of TOPOLOGY) {
    const device = line.devices.find(d => d.ip === ip);
    if (device) return device.name;
  }
  return ip;
};

const playDisconnectAlert = () => {
  try {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    
    const playTone = (freq: number, type: OscillatorType, startTime: number, duration: number) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, startTime);
      
      gain.gain.setValueAtTime(0, startTime);
      gain.gain.linearRampToValueAtTime(0.3, startTime + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.01, startTime + duration);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(startTime);
      osc.stop(startTime + duration);
    };

    const now = ctx.currentTime;
    // Play a descending warning tone (two quick beeps)
    playTone(800, 'square', now, 0.2);
    playTone(600, 'square', now + 0.25, 0.4);
  } catch (e) {
    console.error("Audio play failed", e);
  }
};

// Topology Definition for Neighbors
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
      { ip: '192.168.11.42', name: 'مستقبل من الحصن على بيت في لمباركه', parentIp: '192.168.11.175' },
      { ip: '192.168.12.223', name: 'ام تو رقم13 في لقحل', parentIp: '192.168.11.194' },
      { ip: '192.168.12.211', name: 'ام تو رقم 14 في لقحل', parentIp: '192.168.11.194' },
    ]
  }
];

const DEVICE_IPS = TOPOLOGY.flatMap(line => line.devices.map(d => d.ip));

const SplashScreen = ({ onComplete }: { onComplete: () => void }) => {
  const [progress, setProgress] = useState(0);
  const [text, setText] = useState('');
  const fullText = "تطوير م.صلاح بارحيم";

  useEffect(() => {
    const duration = 8000;
    const intervalTime = 50;
    const steps = duration / intervalTime;
    let currentStep = 0;

    const progressInterval = setInterval(() => {
      currentStep++;
      setProgress(Math.min((currentStep / steps) * 100, 100));
      if (currentStep >= steps) {
        clearInterval(progressInterval);
        setTimeout(onComplete, 200);
      }
    }, intervalTime);

    let charIndex = 0;
    const typeWriterInterval = setInterval(() => {
      if (charIndex <= fullText.length) {
        setText(fullText.slice(0, charIndex));
        charIndex++;
      } else {
        clearInterval(typeWriterInterval);
      }
    }, 150);

    return () => {
      clearInterval(progressInterval);
      clearInterval(typeWriterInterval);
    };
  }, [onComplete]);

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-slate-900 text-white p-6"
      dir="rtl"
    >
      <div className="flex-1 flex flex-col items-center justify-center w-full max-w-md">
        <motion.div 
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="mb-8 w-full flex flex-col items-center"
        >
          <div className="w-24 h-24 bg-blue-600 rounded-3xl flex items-center justify-center shadow-2xl shadow-blue-600/50 mb-6">
            <Server size={48} strokeWidth={1.5} className="text-white" />
          </div>
          <h1 className="text-3xl font-bold text-center mb-2">رعد نت</h1>
          <p className="text-blue-200 text-center text-sm opacity-80">صمم هذا التطبيق خصيصا لشبكه رعد نت</p>
        </motion.div>

        <div className="w-full mt-12 space-y-2">
          <div className="flex justify-between text-xs font-medium text-blue-200 px-1">
            <span>جاري التحميل...</span>
            <span dir="ltr">{Math.round(progress)}%</span>
          </div>
          <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
            <motion.div 
              className="h-full bg-blue-500 rounded-full"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="pt-6 flex items-center justify-center">
            <p className="text-white text-lg font-bold font-mono tracking-wide" dir="rtl">
              {text}
              <span className="animate-pulse inline-block w-2 h-5 bg-blue-500 mr-1.5 align-middle rounded-sm"></span>
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default function App() {
  const [showSplash, setShowSplash] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState({
    host: 'remote.alnooah.pro',
    port: '21153',
    username: 'salah',
    password: ''
  });

  const [stats, setStats] = useState<any>(null);
  const [uptimeSeconds, setUptimeSeconds] = useState<number | null>(null);
  const previousActiveNeighbors = useRef<Set<string> | null>(null);

  // Live ticking effect for uptime
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isLoggedIn && uptimeSeconds !== null) {
      interval = setInterval(() => {
        setUptimeSeconds(prev => (prev !== null ? prev + 1 : null));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isLoggedIn, uptimeSeconds !== null]);

  // Periodic polling for live updates
  useEffect(() => {
    let isMounted = true;
    let timeoutId: NodeJS.Timeout;

    const pollData = async () => {
      if (!isLoggedIn) return;
      
      try {
        const response = await fetch(`/api/mikrotik/stats`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...formData, deviceIps: DEVICE_IPS })
        });
        
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.indexOf("application/json") !== -1) {
          const result = await response.json();
          if (result.success && isMounted) {
            setStats(result.data);
            if (result.data.uptime) {
              setUptimeSeconds(parseMikrotikUptimeToSeconds(result.data.uptime));
            }
            
            // Check for disconnections
            if (result.data.activeNeighbors) {
              const currentActive = new Set<string>(result.data.activeNeighbors);
              
              if (previousActiveNeighbors.current) {
                const disconnectedIps = Array.from(previousActiveNeighbors.current).filter(ip => !currentActive.has(ip));
                
                if (disconnectedIps.length > 0) {
                  playDisconnectAlert();
                  disconnectedIps.forEach(ip => {
                    const deviceName = getDeviceNameByIp(ip);
                    toast.error(`انقطاع الاتصال: ${deviceName}`, {
                      description: `القطعة (${ip}) فقدت الاتصال بالشبكة للتو!`,
                      duration: 10000,
                    });
                  });
                }
              }
              
              previousActiveNeighbors.current = currentActive;
            }
          }
        }
      } catch (err) {
        console.error('فشل التحديث اللحظي للبيانات:', err);
      } finally {
        if (isMounted && isLoggedIn) {
          timeoutId = setTimeout(pollData, 3000);
        }
      }
    };

    if (isLoggedIn) {
      // Start polling
      timeoutId = setTimeout(pollData, 3000);
    }

    return () => {
      isMounted = false;
      clearTimeout(timeoutId);
    };
  }, [isLoggedIn, formData]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch(`/api/mikrotik/stats`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, deviceIps: DEVICE_IPS })
      });

      const contentType = response.headers.get("content-type");
      if (!contentType || contentType.indexOf("application/json") === -1) {
        throw new Error("استجابة غير صالحة من الخادم.");
      }

      const result = await response.json();

      if (result.success) {
        setStats(result.data);
        if (result.data.uptime) {
          setUptimeSeconds(parseMikrotikUptimeToSeconds(result.data.uptime));
        }
        setIsLoggedIn(true);
      } else {
        setError(result.error || 'حدث خطأ غير معروف');
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'فشل الاتصال بالخادم الداخلي. تأكد من اتصالك بالإنترنت وصحة رابط الخادم.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setStats(null);
    setUptimeSeconds(null);
  };

  const groupedNetworks = React.useMemo(() => {
    if (!stats?.networkCounts) return {};
    const villages = [
      'الباريه', 'كراثه', 'صفوه', 'الحلقوم', 'كريث', 
      'قراضه', 'يبروم', 'درعون', 'سده', 'ملاحه', 
      'الفراشه', 'الراك', 'لقحل', 'السخو', 'لمباركه'
    ];
    return stats.networkCounts.reduce((acc: any, net: any) => {
      let foundVillage = 'كراثه';
      for (const v of villages) {
        if (net.name.includes(v)) {
          foundVillage = v === 'لقحل' ? 'لقحل شروج الباكيلي' : v;
          break;
        }
      }
      if (!acc[foundVillage]) acc[foundVillage] = [];
      acc[foundVillage].push(net);
      return acc;
    }, {});
  }, [stats?.networkCounts]);

  const sortedVillages = React.useMemo(() => {
    return Object.keys(groupedNetworks).sort((a, b) => {
      if (a === 'مناطق أخرى') return 1;
      if (b === 'مناطق أخرى') return -1;
      return 0;
    });
  }, [groupedNetworks]);

  const deviceStatuses = React.useMemo(() => {
    if (!stats?.activeNeighbors) return {};
    
    const activeSet = new Set(stats.activeNeighbors);
    const statuses: Record<string, { isOnline: boolean, isRootCause: boolean }> = {};

    TOPOLOGY.forEach(line => {
      line.devices.forEach(device => {
        const isOnline = activeSet.has(device.ip);
        
        let isRootCause = false;
        if (!isOnline) {
          if (!device.parentIp) {
            isRootCause = true;
          } else {
            const parentOnline = activeSet.has(device.parentIp);
            if (parentOnline) {
              isRootCause = true;
            }
          }
        }

        statuses[device.ip] = { isOnline, isRootCause };
      });
    });

    return statuses;
  }, [stats?.activeNeighbors]);

  return (
    <div className="min-h-[100dvh] bg-slate-50 text-slate-900 font-sans select-none" dir="rtl">
      <Toaster position="top-center" richColors theme="light" dir="rtl" />
      <AnimatePresence>
        {showSplash && <SplashScreen onComplete={() => setShowSplash(false)} />}
      </AnimatePresence>
      
      {!isLoggedIn ? (
        // Mobile-First Login Screen
        <div className="min-h-[100dvh] flex flex-col justify-center p-6 max-w-md mx-auto">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full"
          >
            <div className="text-center mb-10">
              <div className="inline-flex items-center justify-center p-4 bg-blue-600 text-white rounded-3xl mb-6 shadow-lg shadow-blue-600/20">
                <Server size={40} strokeWidth={1.5} />
              </div>
              <h1 className="text-3xl font-bold tracking-tight text-slate-900 mb-2">رعد نت</h1>
              <p className="text-slate-500 text-sm">تسجيل الدخول للوحة المراقبة</p>
            </div>

            {error && (
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="mb-6 p-4 bg-red-50 text-red-700 rounded-2xl flex items-start gap-3 text-sm border border-red-100">
                <AlertCircle size={18} className="shrink-0 mt-0.5" />
                <p>{error}</p>
              </motion.div>
            )}

            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-4 bg-white p-2 rounded-3xl shadow-sm border border-slate-100">
                <div className="px-2 pb-2 pt-2">
                  <label className="block text-xs font-semibold text-slate-500 mb-1.5 px-2">كلمة المرور</label>
                  <input 
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3.5 rounded-2xl bg-slate-50 border-transparent focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all text-left text-lg"
                    dir="ltr"
                    autoFocus
                  />
                </div>
              </div>

              <button 
                type="submit"
                disabled={isLoading}
                className={cn(
                  "w-full py-4 px-4 bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white rounded-2xl font-bold text-lg transition-all mt-8 flex justify-center items-center gap-2 shadow-lg shadow-blue-600/20",
                  isLoading && "opacity-70 cursor-not-allowed"
                )}
              >
                {isLoading ? (
                  <div className="w-6 h-6 border-3 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    تسجيل الدخول
                    <LogIn size={20} />
                  </>
                )}
              </button>
            </form>

            <div className="mt-12">
              <a 
                href="https://wa.me/967770932655" 
                target="_blank" 
                rel="noopener noreferrer"
                className="w-full py-4 px-4 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-700 rounded-2xl font-bold text-sm transition-all flex justify-center items-center gap-2"
              >
                <MessageCircle size={20} />
                احصل على تطبيق مماثل لهذا خاص بشبكتك
              </a>
            </div>
          </motion.div>
        </div>
      ) : (
        // Mobile-First Dashboard
        <div className="pb-20">
          {/* Sticky App Bar */}
          <div className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-slate-200 shadow-sm px-4 py-3 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <div className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
              </div>
              <div className="flex flex-col">
                <span className="text-xs text-slate-500 font-medium">متصل بـ</span>
                <span className="text-sm font-bold text-slate-900">رعد نت</span>
              </div>
            </div>
            <button 
              onClick={handleLogout}
              className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors active:scale-95"
            >
              <LogOut size={22} />
            </button>
          </div>

          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 space-y-6 max-w-md mx-auto"
          >
            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-3">
              {/* Uptime */}
              <div className="bg-white p-4 rounded-3xl shadow-sm border border-slate-100 flex flex-col">
                <div className="flex items-center gap-2 mb-3 text-blue-600">
                  <Clock size={18} />
                  <span className="text-xs font-bold text-slate-600">التشغيل</span>
                </div>
                <div className="text-lg font-bold text-slate-900 mt-auto leading-tight">
                  {uptimeSeconds !== null ? formatSecondsToArabicUptime(uptimeSeconds) : '--'}
                </div>
              </div>

              {/* Users */}
              <div className="bg-white p-4 rounded-3xl shadow-sm border border-slate-100 flex flex-col">
                <div className="flex items-center gap-2 mb-3 text-orange-600">
                  <Users size={18} />
                  <span className="text-xs font-bold text-slate-600">إجمالي عدد المتصلين</span>
                </div>
                <div className="text-2xl font-black text-slate-900 mt-auto" dir="ltr">
                  {stats?.hotspotActiveCount ?? '0'}
                </div>
              </div>

              {/* CPU */}
              <div className="bg-white p-4 rounded-3xl shadow-sm border border-slate-100 flex flex-col col-span-2">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2 text-emerald-600">
                    <Cpu size={18} />
                    <span className="text-xs font-bold text-slate-600">المعالج</span>
                  </div>
                  <div className="text-lg font-bold text-slate-900" dir="ltr">
                    {stats?.['cpu-load'] || '0'}%
                  </div>
                </div>
                <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                  <div 
                    className={cn(
                      "h-full rounded-full transition-all duration-1000",
                      parseInt(stats?.['cpu-load'] || '0') > 80 ? "bg-red-500" : 
                      parseInt(stats?.['cpu-load'] || '0') > 50 ? "bg-amber-500" : "bg-emerald-500"
                    )}
                    style={{ width: `${stats?.['cpu-load'] || 0}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Networks Section */}
            {stats?.networkCounts && stats.networkCounts.length > 0 && (
              <div className="pt-2">
                <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2 px-1">
                  <Wifi size={20} className="text-purple-500" />
                  المتصلين حسب القرية
                </h2>
                
                <div className="space-y-3">
                  {sortedVillages.map((village) => (
                    <div key={village} className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
                      <div className="bg-slate-50 px-4 py-3 border-b border-slate-100">
                        <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                          <div className="w-1.5 h-4 bg-purple-500 rounded-full" />
                          {village}
                        </h3>
                      </div>
                      <div className="divide-y divide-slate-50">
                        {groupedNetworks[village].map((net: any) => (
                          <div key={net.id} className="flex items-center justify-between p-4">
                            <div className="flex items-center gap-3">
                              <Network size={16} className="text-slate-400" />
                              <span className="text-sm font-semibold text-slate-700">{net.name}</span>
                            </div>
                            <div className="bg-purple-50 text-purple-700 font-bold px-3 py-1 rounded-xl text-sm" dir="ltr">
                              {net.count}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Topology Section */}
            {stats?.activeNeighbors && (
              <div className="pt-2">
                <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2 px-1">
                  <ShieldAlert size={20} className="text-rose-500" />
                  مراقبة قطع الشبكة
                </h2>

                <div className="space-y-4">
                  {TOPOLOGY.map((line) => (
                    <div key={line.id} className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
                      <div className="bg-slate-50 px-4 py-3 border-b border-slate-100">
                        <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                          <div className="w-1.5 h-4 bg-rose-500 rounded-full" />
                          {line.name}
                        </h3>
                      </div>
                      <div className="p-4 space-y-3">
                        {line.devices.map((device) => {
                          const status = deviceStatuses[device.ip];
                          const isOnline = status?.isOnline ?? false;
                          const isRootCause = status?.isRootCause ?? false;

                          return (
                            <div 
                              key={device.ip} 
                              className={cn(
                                "flex items-center gap-3 p-3 rounded-2xl border transition-all",
                                isOnline ? "bg-white border-slate-100" : 
                                isRootCause ? "bg-red-50 border-red-200" : "bg-slate-50 border-slate-100 opacity-60"
                              )}
                            >
                              <div className={cn(
                                "w-10 h-10 rounded-full flex items-center justify-center shrink-0",
                                isOnline ? "bg-emerald-100 text-emerald-600" : "bg-red-100 text-red-600"
                              )}>
                                {isOnline ? <CheckCircle2 size={20} /> : <XCircle size={20} />}
                              </div>
                              <div className="flex-1 min-w-0">
                                <h4 className="font-bold text-sm text-slate-800 break-words leading-tight">{device.name}</h4>
                                <div className="text-xs text-slate-500 mt-1 mb-2" dir="ltr">{device.ip}</div>
                                <div className="flex items-center gap-1.5">
                                  <div className="relative flex h-2 w-2">
                                    {isOnline && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>}
                                    <span className={cn("relative inline-flex rounded-full h-2 w-2", isOnline ? "bg-emerald-500" : "bg-red-500")}></span>
                                  </div>
                                  <span className={cn("text-xs font-bold", isOnline ? "text-emerald-600" : "text-red-600")}>
                                    {isOnline ? "متصل بالشبكة" : "غير متصل بالشبكة"}
                                  </span>
                                </div>
                              </div>
                              {isRootCause && (
                                <div className="shrink-0 bg-red-600 text-white text-[10px] font-bold px-2 py-1 rounded-lg">
                                  الخلل هنا
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Logs Section */}
            {stats?.logs && stats.logs.length > 0 && (
              <div className="pt-2">
                <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2 px-1">
                  <FileText size={20} className="text-blue-500" />
                  سجل الأحداث (Logs)
                </h2>

                <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden p-4">
                  <ol className="list-decimal list-inside space-y-3">
                    {stats.logs.map((log: any, index: number) => (
                      <li key={log['.id'] || index} className="text-sm font-medium text-slate-800 leading-relaxed border-b border-slate-50 pb-3 last:border-0 last:pb-0">
                        <div className="inline-flex items-center gap-2 mr-2">
                          <span className="text-xs font-bold text-slate-500" dir="ltr">{log.time}</span>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 uppercase tracking-wider">
                            {log.topics}
                          </span>
                        </div>
                        <p className="mt-1 mr-6 text-slate-700">
                          {translateLog(log.message)}
                        </p>
                      </li>
                    ))}
                  </ol>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </div>
  );
}
