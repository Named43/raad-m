import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Activity, Clock, Cpu, Server, LogIn, AlertCircle, LogOut, Users, Network, Wifi, ShieldAlert, CheckCircle2, XCircle, ChevronRight, FileText, RefreshCw, MapPin, History, MessageCircle } from 'lucide-react';
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

const formatMikrotikTime = (timeStr: string) => {
  if (!timeStr || timeStr === 'غير معروف' || timeStr === 'لا يزال متصلاً') return { time: timeStr, date: '' };
  
  let timePart = timeStr;
  let datePart = '';
  
  if (timeStr.includes(' ')) {
    const parts = timeStr.split(' ');
    datePart = parts[0];
    timePart = parts[1];
  }
  
  const timeMatch = timePart.match(/(\d{1,2}):(\d{2}):(\d{2})/);
  if (timeMatch) {
    let hours = parseInt(timeMatch[1], 10);
    const minutes = timeMatch[2];
    const seconds = timeMatch[3];
    
    // Add 3 hours offset
    hours = (hours + 3) % 24;
    
    // Convert to 12-hour format
    const ampm = hours >= 12 ? 'م' : 'ص';
    const hours12 = hours % 12 || 12;
    
    const hoursStr = hours12.toString().padStart(2, '0');
    
    return { time: `${hoursStr}:${minutes}:${seconds} ${ampm}`, date: datePart };
  }
  
  return { time: timeStr, date: '' };
};

const formatUptimeArabic = (uptimeStr: string) => {
  if (!uptimeStr || uptimeStr === '0s') return '0 ثانية';
  
  let hours = 0, minutes = 0, seconds = 0;
  
  const wMatch = uptimeStr.match(/(\d+)w/);
  const dMatch = uptimeStr.match(/(\d+)d/);
  const hMatch = uptimeStr.match(/(\d+)h/);
  const mMatch = uptimeStr.match(/(\d+)m/);
  const sMatch = uptimeStr.match(/(\d+)s/);
  
  if (wMatch) hours += parseInt(wMatch[1], 10) * 24 * 7;
  if (dMatch) hours += parseInt(dMatch[1], 10) * 24;
  if (hMatch) hours += parseInt(hMatch[1], 10);
  if (mMatch) minutes = parseInt(mMatch[1], 10);
  if (sMatch) seconds = parseInt(sMatch[1], 10);
  
  const parts = [];
  
  if (hours > 0) parts.push(`${hours} ساعة`);
  if (minutes > 0) parts.push(`${minutes} دقيقة`);
  if (seconds > 0) parts.push(`${seconds} ثانية`);
  
  if (parts.length === 0) return '0 ثانية';
  
  return parts.join(' و ');
};

export default function App() {
  const [showSplash, setShowSplash] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState({
    host: 'us-2.hostddns.us',
    port: '5548',
    username: 'salah',
    password: ''
  });

  const [stats, setStats] = useState<any>(null);
  const [uptimeSeconds, setUptimeSeconds] = useState<number | null>(null);
  const [refreshingId, setRefreshingId] = useState<string | null>(null);
  const whatsappEnabled = true; // Always enabled
  const [whatsappPhone, setWhatsappPhone] = useState(() => localStorage.getItem('whatsapp_phone') || '967770932655');
  const [whatsappApiKey, setWhatsappApiKey] = useState(() => localStorage.getItem('whatsapp_api_key') || '8489896');

  const whatsappEnabledRef = useRef(whatsappEnabled);
  const whatsappPhoneRef = useRef(whatsappPhone);
  const whatsappApiKeyRef = useRef(whatsappApiKey);

  // Sync settings to server background task
  const syncSettingsToBackground = useCallback(async (enabledOverride?: boolean) => {
    // Allow syncing if logged in OR if we are explicitly disabling (logout)
    if (!isLoggedIn && enabledOverride !== false) return;
    
    try {
      await fetch('/api/settings/background', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          enabled: enabledOverride !== undefined ? enabledOverride : whatsappEnabled,
          host: formData.host,
          port: formData.port,
          username: formData.username,
          password: formData.password,
          whatsappPhone: whatsappPhone,
          whatsappApiKey: whatsappApiKey
        })
      });
      console.log("[Background] Settings synced to server successfully");
    } catch (e) {
      console.error("[Background] Failed to sync settings:", e);
    }
  }, [isLoggedIn, whatsappEnabled, whatsappPhone, whatsappApiKey, formData]);

  useEffect(() => {
    whatsappEnabledRef.current = whatsappEnabled;
    if (isLoggedIn) syncSettingsToBackground();
  }, [whatsappEnabled, isLoggedIn, syncSettingsToBackground]);

  useEffect(() => {
    whatsappPhoneRef.current = whatsappPhone;
    localStorage.setItem('whatsapp_phone', whatsappPhone);
    if (isLoggedIn) syncSettingsToBackground();
  }, [whatsappPhone, isLoggedIn, syncSettingsToBackground]);

  useEffect(() => {
    whatsappApiKeyRef.current = whatsappApiKey;
    localStorage.setItem('whatsapp_api_key', whatsappApiKey);
    if (isLoggedIn) syncSettingsToBackground();
  }, [whatsappApiKey, isLoggedIn, syncSettingsToBackground]);

  // Sync when formData changes (e.g. host/username) while logged in
  useEffect(() => {
    if (isLoggedIn) syncSettingsToBackground();
  }, [formData, isLoggedIn, syncSettingsToBackground]);

  const previousActiveNeighbors = useRef<Set<string> | null>(null);

  // Card Check State
  const [showCardCheck, setShowCardCheck] = useState(false);
  const [searchCardNumber, setSearchCardNumber] = useState('');
  const [isCheckingCard, setIsCheckingCard] = useState(false);
  const [cardResult, setCardResult] = useState<any>(null);
  const [cardError, setCardError] = useState('');

  const fetchStatsData = useCallback(async (showToast = false) => {
    if (!isLoggedIn) return false;
    
    try {
      const response = await fetch(`/api/mikrotik/stats`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.indexOf("application/json") !== -1) {
        const result = await response.json();
        if (result.success) {
          setStats(result.data);
          if (result.data.uptime) {
            setUptimeSeconds(parseMikrotikUptimeToSeconds(result.data.uptime));
          }
          
          // Check for disconnections
          if (result.data.activeNeighbors) {
            const currentActive = new Set<string>(result.data.activeNeighbors);
            
            if (previousActiveNeighbors.current) {
              const disconnectedIps = Array.from(previousActiveNeighbors.current).filter((ip: string) => {
                if (currentActive.has(ip)) return false;
                // Only alert for devices that are actually in our topology
                return TOPOLOGY.some(line => line.devices.some(d => d.ip === ip));
              });
              
              if (disconnectedIps.length > 0) {
                playDisconnectAlert();
                disconnectedIps.forEach((ip: string) => {
                  const deviceName = getDeviceNameByIp(ip);
                  toast.error(`انقطاع الاتصال: ${deviceName}`, {
                    description: `القطعة (${ip}) فقدت الاتصال بالشبكة للتو!`,
                    duration: 10000,
                  });

                  // Send WhatsApp notification if enabled
                  if (whatsappEnabledRef.current) {
                    console.log(`[WhatsApp] Disconnection detected for ${deviceName}. Sending notification...`);
                    fetch('/api/notify/whatsapp', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ 
                        deviceName,
                        phone: whatsappPhoneRef.current,
                        apikey: whatsappApiKeyRef.current
                      })
                    })
                    .then(async (res) => {
                      const data = await res.json();
                      if (data.success) {
                        console.log(`[WhatsApp] Notification sent successfully for ${deviceName}`);
                      } else {
                        console.error(`[WhatsApp] Failed to send notification:`, data.error, data.details);
                        toast.error('فشل إرسال تنبيه واتساب', { description: data.error });
                      }
                    })
                    .catch(err => {
                      console.error('WhatsApp Notification Fetch Error:', err);
                      toast.error('خطأ في الاتصال بخدمة التنبيهات');
                    });
                  } else {
                    console.log(`[WhatsApp] Notification skipped for ${deviceName} (WhatsApp disabled)`);
                  }
                });
              }
            }
            
            previousActiveNeighbors.current = currentActive;
          }
          
          if (showToast) {
            toast.success('تم التحديث بنجاح', { duration: 2000 });
          }
          return true;
        }
      }
    } catch (err: any) {
      console.error('فشل التحديث:', err);
      if (showToast) {
        let errorMsg = 'فشل التحديث، يرجى التحقق من الاتصال';
        if (err.message?.includes('fetch') || err.message?.includes('NetworkError')) {
          errorMsg = 'فشل الاتصال بالخادم. يرجى التحقق من اتصالك بالإنترنت أو تحديث الصفحة.';
        }
        toast.error(errorMsg);
      }
    }
    return false;
  }, [isLoggedIn, formData]);

  const handleManualRefresh = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setRefreshingId(id);
    await fetchStatsData(true);
    setRefreshingId(null);
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleCheckCard = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchCardNumber.trim()) return;
    
    setIsCheckingCard(true);
    setCardError('');
    setCardResult(null);

    try {
      const response = await fetch('/api/mikrotik/check-card', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, cardNumber: searchCardNumber.trim() })
      });
      const result = await response.json();
      if (result.success) {
        setCardResult(result.data);
      } else {
        setCardError(result.error || 'لم يتم العثور على الكرت');
      }
    } catch (err) {
      setCardError('فشل الاتصال بالخادم');
    } finally {
      setIsCheckingCard(false);
    }
  };

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
      
      await fetchStatsData(false);
      
      if (isMounted && isLoggedIn) {
        timeoutId = setTimeout(pollData, 3000);
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
        body: JSON.stringify(formData)
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
        // Sync settings to background after successful login
        setTimeout(() => syncSettingsToBackground(), 500);
      } else {
        setError(result.error || 'حدث خطأ غير معروف');
      }
    } catch (err: any) {
      console.error(err);
      let errorMsg = err.message || 'فشل الاتصال بالخادم الداخلي. تأكد من اتصالك بالإنترنت وصحة رابط الخادم.';
      if (errorMsg.includes('fetch') || errorMsg.includes('NetworkError')) {
        errorMsg = 'فشل الاتصال بالخادم. يرجى التحقق من اتصالك بالإنترنت أو تحديث الصفحة.';
      }
      setError(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    // Disable background monitoring on logout
    syncSettingsToBackground(false);
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
            <div className="flex items-center gap-2">
              <button 
                onClick={handleLogout}
                className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors active:scale-95"
              >
                <LogOut size={22} />
              </button>
            </div>
          </div>

          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 space-y-6 max-w-md mx-auto"
          >
            {/* Card Check Button */}
            <button
              onClick={() => setShowCardCheck(true)}
              className="w-full bg-white p-4 rounded-3xl shadow-sm border border-slate-100 flex items-center justify-between hover:bg-slate-50 transition-colors active:scale-[0.98]"
            >
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-2xl">
                  <FileText size={22} />
                </div>
                <div className="flex flex-col items-start">
                  <span className="font-bold text-slate-900">فحص كرت المشترك</span>
                  <span className="text-xs text-slate-500">معرفة الرصيد المتبقي والأيام</span>
                </div>
              </div>
              <ChevronRight size={20} className="text-slate-400" />
            </button>

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
              <div className="bg-white p-4 rounded-3xl shadow-sm border border-slate-100 flex flex-col relative">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2 text-orange-600">
                    <Users size={18} />
                    <span className="text-xs font-bold text-slate-600">إجمالي عدد المتصلين</span>
                  </div>
                  <button 
                    onClick={(e) => handleManualRefresh('total_users', e)}
                    className="flex items-center gap-1 text-[10px] font-bold text-blue-500 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-2 py-1 rounded-md transition-colors"
                  >
                    <RefreshCw size={12} className={cn(refreshingId === 'total_users' && "animate-spin")} />
                    تحديث
                  </button>
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
                      <div className="bg-slate-50 px-4 py-3 border-b border-slate-100 flex items-center justify-between">
                        <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                          <div className="w-1.5 h-4 bg-purple-500 rounded-full" />
                          {village}
                        </h3>
                        <button 
                          onClick={(e) => handleManualRefresh(`village_${village}`, e)}
                          className="flex items-center gap-1 text-[10px] font-bold text-blue-500 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-2 py-1 rounded-md transition-colors"
                        >
                          <RefreshCw size={12} className={cn(refreshingId === `village_${village}` && "animate-spin")} />
                          تحديث
                        </button>
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
                      <div className="bg-slate-50 px-4 py-3 border-b border-slate-100 flex items-center justify-between">
                        <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                          <div className="w-1.5 h-4 bg-rose-500 rounded-full" />
                          {line.name}
                        </h3>
                        <button 
                          onClick={(e) => handleManualRefresh(`line_${line.id}`, e)}
                          className="flex items-center gap-1 text-[10px] font-bold text-blue-500 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-2 py-1 rounded-md transition-colors"
                        >
                          <RefreshCw size={12} className={cn(refreshingId === `line_${line.id}` && "animate-spin")} />
                          تحديث
                        </button>
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
                                <div className="flex items-center gap-1.5 mt-2">
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
          </motion.div>
        </div>
      )}

      {/* Card Check Modal */}
      <AnimatePresence>
        {showCardCheck && (
          <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-4 sm:p-0">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowCardCheck(false)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, y: 100, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 100, scale: 0.95 }}
              className="relative w-full max-w-md bg-white rounded-[2rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="p-6 pb-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                  <FileText className="text-indigo-500" size={24} />
                  فحص كرت المشترك
                </h3>
                <button 
                  onClick={() => setShowCardCheck(false)}
                  className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
                >
                  <XCircle size={24} />
                </button>
              </div>

              <div className="p-6 overflow-y-auto">
                <form onSubmit={handleCheckCard} className="flex gap-2 mb-6">
                  <input
                    type="text"
                    value={searchCardNumber}
                    onChange={(e) => setSearchCardNumber(e.target.value)}
                    placeholder="أدخل رقم الكرت هنا..."
                    className="flex-1 px-4 py-3.5 rounded-2xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all text-lg font-bold text-center"
                    dir="ltr"
                    autoFocus
                  />
                  <button
                    type="submit"
                    disabled={isCheckingCard || !searchCardNumber.trim()}
                    className={cn(
                      "px-6 bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] text-white rounded-2xl font-bold transition-all flex justify-center items-center shadow-lg shadow-indigo-600/20",
                      (isCheckingCard || !searchCardNumber.trim()) && "opacity-70 cursor-not-allowed"
                    )}
                  >
                    {isCheckingCard ? (
                      <div className="w-6 h-6 border-3 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      "فحص"
                    )}
                  </button>
                </form>

                {cardError && (
                  <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="p-4 bg-red-50 text-red-700 rounded-2xl flex items-start gap-3 text-sm border border-red-100 mb-4">
                    <AlertCircle size={18} className="shrink-0 mt-0.5" />
                    <p>{cardError}</p>
                  </motion.div>
                )}

                {cardResult && (
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }} 
                    animate={{ opacity: 1, y: 0 }} 
                    className="space-y-4"
                  >
                    <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-6 rounded-3xl text-white shadow-lg shadow-indigo-500/20 relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-10 -mt-10"></div>
                      <div className="absolute bottom-0 left-0 w-24 h-24 bg-black/10 rounded-full blur-xl -ml-8 -mb-8"></div>
                      
                      <div className="relative z-10">
                        {(() => {
                          const isUnlimited = cardResult.package.includes('8000');
                          const dataUsed = cardResult.dataUsed;
                          const dataLimit = cardResult.dataLimit;
                          const dataRemaining = Math.max(0, dataLimit - dataUsed);
                          const dataUsedPercentage = dataLimit > 0 ? Math.min(100, Math.max(0, (dataUsed / dataLimit) * 100)) : 0;

                          const timeUsedSec = parseMikrotikUptimeToSeconds(cardResult.timeUsed);
                          const timeLimitSec = parseMikrotikUptimeToSeconds(cardResult.timeLimit);
                          const timeRemainingSec = Math.max(0, timeLimitSec - timeUsedSec);
                          const timeUsedPercentage = timeLimitSec > 0 ? Math.min(100, Math.max(0, (timeUsedSec / timeLimitSec) * 100)) : 0;

                          const circumference = 2 * Math.PI * 36;

                          return (
                            <>
                              {isUnlimited ? (
                                <div className="text-2xl font-black mb-6 text-center mt-2">هذا الكرت مفتوح</div>
                              ) : (
                                <>
                                  <div className="text-indigo-100 text-sm font-medium mb-1">الكرت أبو</div>
                                  <div className="text-3xl font-black mb-6">{cardResult.package}</div>
                                </>
                              )}
                              
                              <div className="flex flex-col gap-4">
                                <div className="bg-white/10 p-5 rounded-3xl backdrop-blur-sm border border-white/10 flex items-center justify-between">
                                  <div className="text-right">
                                    <div className="text-indigo-100 text-sm mb-1">الرصيد المتبقي</div>
                                    <div className="font-bold text-2xl" dir="ltr">
                                      {isUnlimited ? "مفتوح التحميل" : formatBytes(dataRemaining)}
                                    </div>
                                  </div>
                                  {!isUnlimited && (
                                    <div className="relative flex items-center justify-center w-20 h-20 shrink-0">
                                      <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                                        <circle cx="50" cy="50" r="36" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-white/10" />
                                        <motion.circle
                                          cx="50" cy="50" r="36" stroke="currentColor" strokeWidth="8" fill="transparent"
                                          strokeDasharray={circumference}
                                          initial={{ strokeDashoffset: circumference }}
                                          animate={{ strokeDashoffset: circumference - (dataUsedPercentage / 100) * circumference }}
                                          transition={{ duration: 1.5, ease: "easeOut" }}
                                          className={dataUsedPercentage < 80 ? "text-emerald-400" : "text-rose-400"}
                                          strokeLinecap="round"
                                        />
                                      </svg>
                                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                                        <span className="text-sm font-bold">{Math.round(dataUsedPercentage)}%</span>
                                        <span className="text-[9px] text-indigo-100 -mt-1">مستخدم</span>
                                      </div>
                                    </div>
                                  )}
                                </div>
                                
                                <div className="bg-white/10 p-5 rounded-3xl backdrop-blur-sm border border-white/10 flex items-center justify-between">
                                  <div className="text-right">
                                    <div className="text-indigo-100 text-sm mb-1">الوقت المتبقي</div>
                                    <div className="font-bold text-xl">
                                      {isUnlimited ? "مفتوح الوقت" : formatSecondsToArabicUptime(timeRemainingSec)}
                                    </div>
                                  </div>
                                  {!isUnlimited && (
                                    <div className="relative flex items-center justify-center w-20 h-20 shrink-0">
                                      <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                                        <circle cx="50" cy="50" r="36" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-white/10" />
                                        <motion.circle
                                          cx="50" cy="50" r="36" stroke="currentColor" strokeWidth="8" fill="transparent"
                                          strokeDasharray={circumference}
                                          initial={{ strokeDashoffset: circumference }}
                                          animate={{ strokeDashoffset: circumference - (timeUsedPercentage / 100) * circumference }}
                                          transition={{ duration: 1.5, ease: "easeOut", delay: 0.2 }}
                                          className={timeUsedPercentage < 80 ? "text-sky-400" : "text-rose-400"}
                                          strokeLinecap="round"
                                        />
                                      </svg>
                                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                                        <span className="text-sm font-bold">{Math.round(timeUsedPercentage)}%</span>
                                        <span className="text-[9px] text-indigo-100 -mt-1">مستخدم</span>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>

                              {isUnlimited && (
                                <div className="mt-6 text-center text-indigo-100 text-sm font-medium bg-white/10 py-3 px-4 rounded-xl backdrop-blur-sm border border-white/10">
                                  هذا الكرت خاص بمالك هذه الشبكه
                                </div>
                              )}

                              {cardResult.sessionHistory && cardResult.sessionHistory.length > 0 ? (
                                <div className="mt-8 bg-slate-50/50 p-4 rounded-[2rem] border border-slate-100">
                                  <h4 className="text-sm font-bold text-slate-700 mb-4 flex items-center gap-2 px-2">
                                    <div className="p-2 bg-indigo-100 text-indigo-600 rounded-xl">
                                      <History size={16} />
                                    </div>
                                    آخر عشر اتصالات لهذا الكرت
                                  </h4>
                                  <div className="space-y-3">
                                    {cardResult.sessionHistory.map((session: any, idx: number) => {
                                      const formattedStartTime = formatMikrotikTime(session.startTime);
                                      const formattedEndTime = formatMikrotikTime(session.endTime);
                                      const formattedUptime = formatUptimeArabic(session.uptime);
                                      
                                      return (
                                        <motion.div 
                                          key={idx}
                                          initial={{ opacity: 0, y: 10 }}
                                          animate={{ opacity: 1, y: 0 }}
                                          transition={{ delay: idx * 0.05 }}
                                          className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow"
                                        >
                                          <div className="flex items-center justify-between mb-4">
                                            <div className="flex items-center gap-3">
                                              <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-2xl">
                                                <MapPin size={20} />
                                              </div>
                                              <div className="text-right">
                                                <div className="font-bold text-slate-800 text-sm">{session.site}</div>
                                              </div>
                                            </div>
                                            <div className="bg-emerald-50 text-emerald-700 text-[10px] font-bold px-3 py-1.5 rounded-xl border border-emerald-100 flex items-center gap-1.5">
                                              <Clock size={12} />
                                              {formattedUptime}
                                            </div>
                                          </div>
                                          
                                          <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-50">
                                            <div className="bg-slate-50 p-2.5 rounded-2xl text-right">
                                              <div className="text-[9px] text-slate-400 mb-1 flex items-center gap-1 justify-end">
                                                <LogOut size={10} className="text-rose-400" />
                                                وقت الخروج
                                              </div>
                                              <div className="flex flex-col items-end">
                                                <div className="text-xs font-bold text-slate-700 bg-white px-2 py-1 rounded-lg border border-slate-100 shadow-sm inline-block" dir="ltr">
                                                  {formattedEndTime.time}
                                                </div>
                                                {formattedEndTime.date && (
                                                  <div className="text-[9px] text-slate-400 mt-1">{formattedEndTime.date}</div>
                                                )}
                                              </div>
                                            </div>
                                            <div className="bg-slate-50 p-2.5 rounded-2xl text-right">
                                              <div className="text-[9px] text-slate-400 mb-1 flex items-center gap-1 justify-end">
                                                <Clock size={10} className="text-indigo-400" />
                                                وقت الدخول
                                              </div>
                                              <div className="flex flex-col items-end">
                                                <div className="text-xs font-bold text-slate-700 bg-white px-2 py-1 rounded-lg border border-slate-100 shadow-sm inline-block" dir="ltr">
                                                  {formattedStartTime.time}
                                                </div>
                                                {formattedStartTime.date && (
                                                  <div className="text-[9px] text-slate-400 mt-1">{formattedStartTime.date}</div>
                                                )}
                                              </div>
                                            </div>
                                          </div>
                                        </motion.div>
                                      );
                                    })}
                                  </div>
                                </div>
                              ) : (
                                <div className="mt-8 p-6 bg-slate-50 rounded-3xl border border-dashed border-slate-200 text-center">
                                  <History size={32} className="mx-auto text-slate-300 mb-2" />
                                  <p className="text-sm font-bold text-slate-500">لا يوجد سجل جلسات لهذا الكرت حالياً</p>
                                  <p className="text-[10px] text-slate-400 mt-1">قد يكون الكرت جديداً أو لم يتم استخدامه بعد</p>
                                </div>
                              )}
                            </>
                          );
                        })()}
                      </div>
                    </div>
                  </motion.div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
