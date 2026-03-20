import React, { useState, useEffect } from 'react';
import { Activity, Clock, Cpu, Server, LogIn, AlertCircle, LogOut, Users, Network, Wifi, ShieldAlert, CheckCircle2, XCircle } from 'lucide-react';
import { motion } from 'motion/react';
import { cn, parseMikrotikUptimeToSeconds, formatSecondsToArabicUptime } from './lib/utils';

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
  }
];

const DEVICE_IPS = TOPOLOGY.flatMap(line => line.devices.map(d => d.ip));

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState({
    host: '',
    port: '8728',
    username: 'admin',
    password: ''
  });

  const [stats, setStats] = useState<any>(null);
  const [uptimeSeconds, setUptimeSeconds] = useState<number | null>(null);

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
    let interval: NodeJS.Timeout;
    if (isLoggedIn) {
      interval = setInterval(async () => {
        try {
          const response = await fetch('/api/mikrotik/stats', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...formData, deviceIps: DEVICE_IPS })
          });
          const result = await response.json();
          if (result.success) {
            setStats(result.data);
            // Sync uptime occasionally to prevent drift
            if (result.data.uptime) {
              setUptimeSeconds(parseMikrotikUptimeToSeconds(result.data.uptime));
            }
          }
        } catch (err) {
          console.error('فشل التحديث اللحظي للبيانات:', err);
        }
      }, 5000); // تحديث كل 5 ثواني
    }
    return () => clearInterval(interval);
  }, [isLoggedIn, formData]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/api/mikrotik/stats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, deviceIps: DEVICE_IPS })
      });

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
    } catch (err) {
      setError('فشل الاتصال بالخادم الداخلي');
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
      'الفراشه', 'الراك', 'لقحل'
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

  // Calculate device status based on active neighbors
  const deviceStatuses = React.useMemo(() => {
    if (!stats?.activeNeighbors) return {};
    
    const activeSet = new Set(stats.activeNeighbors);
    const statuses: Record<string, { isOnline: boolean, isRootCause: boolean }> = {};

    TOPOLOGY.forEach(line => {
      line.devices.forEach(device => {
        const isOnline = activeSet.has(device.ip);
        
        let isRootCause = false;
        if (!isOnline) {
          // It's offline. Is it the root cause?
          // It's the root cause if it has no parent, OR its parent IS online.
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
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans" dir="rtl">
      <div className="max-w-4xl mx-auto p-6 pt-12">
        
        <header className="mb-12 text-center relative">
          <div className="inline-flex items-center justify-center p-3 bg-blue-100 text-blue-600 rounded-2xl mb-4">
            <Server size={32} />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 mb-2">لوحة تحكم ميكروتك</h1>
          <p className="text-slate-500">راقب حالة الراوتر الخاص بك بسهولة</p>
          {isLoggedIn && (
            <div className="absolute top-0 left-0 flex items-center gap-2 bg-emerald-50 text-emerald-600 px-3 py-1.5 rounded-full text-sm font-medium border border-emerald-100">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </span>
              تحديث لحظي
            </div>
          )}
        </header>

        {!isLoggedIn ? (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-md mx-auto bg-white rounded-2xl shadow-sm border border-slate-200 p-8"
          >
            <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
              <LogIn size={20} className="text-slate-400" />
              تسجيل الدخول للراوتر
            </h2>

            {error && (
              <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-xl flex items-start gap-3 text-sm">
                <AlertCircle size={18} className="shrink-0 mt-0.5" />
                <p>{error}</p>
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">عنوان الـ IP أو الرابط (Domain)</label>
                <input 
                  type="text"
                  name="host"
                  required
                  placeholder="مثال: 192.168.88.1 أو myrouter.net"
                  value={formData.host}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-left"
                  dir="ltr"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">منفذ الـ API</label>
                <input 
                  type="text"
                  name="port"
                  placeholder="8728"
                  value={formData.port}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-left"
                  dir="ltr"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">اسم المستخدم</label>
                <input 
                  type="text"
                  name="username"
                  required
                  value={formData.username}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-left"
                  dir="ltr"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">كلمة المرور</label>
                <input 
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-left"
                  dir="ltr"
                />
              </div>

              <button 
                type="submit"
                disabled={isLoading}
                className={cn(
                  "w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-all mt-6 flex justify-center items-center gap-2",
                  isLoading && "opacity-70 cursor-not-allowed"
                )}
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    تسجيل الدخول
                  </>
                )}
              </button>
            </form>
          </motion.div>
        ) : (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="space-y-6"
          >
            <div className="flex justify-between items-center bg-white p-4 rounded-2xl shadow-sm border border-slate-200">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="font-medium text-slate-700">متصل بـ <span dir="ltr" className="text-slate-900">{formData.host}</span></span>
              </div>
              <button 
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              >
                <LogOut size={16} />
                تسجيل الخروج
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {/* Uptime Card */}
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col">
                <div className="flex items-center gap-3 mb-4 text-blue-600">
                  <div className="p-2 bg-blue-50 rounded-lg">
                    <Clock size={24} />
                  </div>
                  <h3 className="font-semibold text-slate-700">مدة التشغيل</h3>
                </div>
                <div className="text-xl font-bold text-slate-900 mt-auto leading-relaxed">
                  {uptimeSeconds !== null ? formatSecondsToArabicUptime(uptimeSeconds) : 'غير متوفر'}
                </div>
                <p className="text-sm text-slate-500 mt-1">الوقت المنقضي منذ آخر إعادة تشغيل</p>
              </div>

              {/* Version Card */}
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col">
                <div className="flex items-center gap-3 mb-4 text-indigo-600">
                  <div className="p-2 bg-indigo-50 rounded-lg">
                    <Activity size={24} />
                  </div>
                  <h3 className="font-semibold text-slate-700">إصدار النظام</h3>
                </div>
                <div className="text-2xl font-bold text-slate-900 mt-auto" dir="ltr">
                  v{stats?.version || 'غير متوفر'}
                </div>
                <p className="text-sm text-slate-500 mt-1">نسخة RouterOS المثبتة</p>
              </div>

              {/* CPU Card */}
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col">
                <div className="flex items-center gap-3 mb-4 text-emerald-600">
                  <div className="p-2 bg-emerald-50 rounded-lg">
                    <Cpu size={24} />
                  </div>
                  <h3 className="font-semibold text-slate-700">حالة المعالج</h3>
                </div>
                <div className="text-2xl font-bold text-slate-900 mt-auto flex items-baseline gap-1" dir="ltr">
                  {stats?.['cpu-load'] || '0'} <span className="text-lg text-slate-500">%</span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full mt-3 overflow-hidden">
                  <div 
                    className={cn(
                      "h-full rounded-full transition-all duration-1000",
                      parseInt(stats?.['cpu-load'] || '0') > 80 ? "bg-red-500" : 
                      parseInt(stats?.['cpu-load'] || '0') > 50 ? "bg-amber-500" : "bg-emerald-500"
                    )}
                    style={{ width: `${stats?.['cpu-load'] || 0}%` }}
                  />
                </div>
                <p className="text-sm text-slate-500 mt-2">استهلاك المعالج الحالي</p>
              </div>

              {/* Hotspot Active Card */}
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col">
                <div className="flex items-center gap-3 mb-4 text-orange-600">
                  <div className="p-2 bg-orange-50 rounded-lg">
                    <Users size={24} />
                  </div>
                  <h3 className="font-semibold text-slate-700">عدد المتصلين بالشبكه</h3>
                </div>
                <div className="text-2xl font-bold text-slate-900 mt-auto" dir="ltr">
                  {stats?.hotspotActiveCount ?? '0'}
                </div>
                <p className="text-sm text-slate-500 mt-1">عدد المستخدمين النشطين حالياً</p>
              </div>
            </div>

            {/* Neighbors Monitoring Section */}
            {stats?.activeNeighbors && (
              <div className="mt-12">
                <div className="flex items-center gap-3 mb-8">
                  <div className="p-2 bg-rose-100 text-rose-600 rounded-xl">
                    <ShieldAlert size={24} />
                  </div>
                  <h2 className="text-2xl font-bold text-slate-800">مراقبة قطع الشبكة</h2>
                </div>

                <div className="space-y-8">
                  {TOPOLOGY.map((line) => (
                    <div key={line.id} className="bg-slate-50/50 p-6 rounded-3xl border border-slate-100">
                      <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
                        <span className="w-2 h-6 bg-rose-500 rounded-full inline-block"></span>
                        {line.name}
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {line.devices.map((device) => {
                          const status = deviceStatuses[device.ip];
                          const isOnline = status?.isOnline ?? false;
                          const isRootCause = status?.isRootCause ?? false;

                          return (
                            <div 
                              key={device.ip} 
                              className={cn(
                                "p-5 rounded-2xl shadow-sm border flex flex-col transition-all",
                                isOnline ? "bg-white border-emerald-200" : 
                                isRootCause ? "bg-red-50 border-red-300 shadow-red-100" : "bg-slate-100 border-slate-200 opacity-75"
                              )}
                            >
                              <div className="flex items-start justify-between mb-3">
                                <div className={cn(
                                  "flex items-center gap-2",
                                  isOnline ? "text-emerald-600" : "text-red-600"
                                )}>
                                  {isOnline ? <CheckCircle2 size={20} /> : <XCircle size={20} />}
                                  <span className="text-sm font-bold">
                                    {isOnline ? 'متصل' : 'غير متصل'}
                                  </span>
                                </div>
                              </div>
                              <h4 className={cn(
                                "font-semibold text-sm mb-4 leading-relaxed",
                                isOnline ? "text-slate-700" : "text-slate-800"
                              )}>
                                {device.name}
                              </h4>
                              
                              {isRootCause && (
                                <div className="mt-auto bg-red-100 text-red-700 text-xs font-bold px-3 py-2 rounded-lg flex items-center gap-2">
                                  <AlertCircle size={14} />
                                  الخلل في هذه القطعة
                                </div>
                              )}
                              {!isOnline && !isRootCause && (
                                <div className="mt-auto text-slate-500 text-xs font-medium px-1">
                                  مفصول بسبب انقطاع قبله
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

            {/* Networks Section */}
            {stats?.networkCounts && stats.networkCounts.length > 0 && (
              <div className="mt-12">
                <div className="flex items-center gap-3 mb-8">
                  <div className="p-2 bg-purple-100 text-purple-600 rounded-xl">
                    <Wifi size={24} />
                  </div>
                  <h2 className="text-2xl font-bold text-slate-800">إحصائيات الشبكات حسب القرية</h2>
                </div>
                
                <div className="space-y-8">
                  {sortedVillages.map((village) => (
                    <div key={village} className="bg-slate-50/50 p-6 rounded-3xl border border-slate-100">
                      <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
                        <span className="w-2 h-6 bg-purple-500 rounded-full inline-block"></span>
                        {village}
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {groupedNetworks[village].map((net: any) => (
                          <div key={net.id} className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 flex flex-col hover:shadow-md transition-shadow">
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex items-center gap-2 text-purple-600">
                                <Network size={18} />
                              </div>
                            </div>
                            <h4 className="font-semibold text-slate-700 text-sm mb-4 leading-relaxed">{net.name}</h4>
                            <div className="mt-auto flex items-end justify-between">
                              <span className="text-sm text-slate-500">عدد المتصلين:</span>
                              <div className="text-2xl font-bold text-slate-900" dir="ltr">
                                {net.count}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
}
