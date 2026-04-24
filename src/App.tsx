/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { 
  Send, 
  Wallet, 
  Store, 
  History, 
  User, 
  ArrowLeftRight, 
  CheckCircle2, 
  Plus, 
  Smartphone, 
  ShoppingCart, 
  Search,
  Check,
  AlertCircle,
  QrCode,
  Bell,
  ArrowRight,
  TrendingUp,
  MapPin,
  ChevronLeft
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// --- Types ---

type Role = 'SENDER' | 'BENEFICIARY' | 'MERCHANT';

interface Merchant {
  id: string;
  name: string;
  category: 'GROCERY' | 'PHARMACY' | 'FUEL' | 'SCHOOL' | 'OTHER';
  address: string;
  image?: string;
}

interface Transaction {
  id: string;
  amount: number;
  type: 'RECEIVED' | 'SPENT' | 'SENT';
  category: string;
  merchantName?: string;
  senderName?: string;
  recipientName?: string;
  date: string;
  status: 'COMPLETED' | 'PENDING';
}

interface AppState {
  role: Role;
  balance: number;
  transactions: Transaction[];
  credits: { [merchantId: string]: number }; // For conditional credits
}

// --- Constants & Mock Data ---

const MERCHANTS: Merchant[] = [
  { id: 'm1', name: 'بقالة الحاج جمال', category: 'GROCERY', address: 'شارع القاهرة، صنعاء' },
  { id: 'm2', name: 'صيدلية الأمل', category: 'PHARMACY', address: 'حي الروضة، تعز' },
  { id: 'm3', name: 'محطة النور للوقود', category: 'FUEL', address: 'طريق الميناء، عدن' },
  { id: 'm4', name: 'مدرسة النهضة الحديثة', category: 'SCHOOL', address: 'سيئون، حضرموت' },
];

const INITIAL_TRANSACTIONS: Transaction[] = [
  { id: 't1', amount: 50000, type: 'SENT', category: 'غذاء', recipientName: 'فاطمة محمد', date: 'منذ ساعتين', status: 'COMPLETED' },
  { id: 't2', amount: 15000, type: 'SPENT', category: 'دواء', merchantName: 'صيدلية الأمل', date: 'أمس', status: 'COMPLETED' },
  { id: 't3', amount: 100000, type: 'RECEIVED', category: 'رصيد مفتوح', senderName: 'أحمد (السعودية)', date: 'قبل ٣ أيام', status: 'COMPLETED' },
];

// --- Utilities ---

const formatYER = (val: number) => {
  return new Intl.NumberFormat('ar-YE', { 
    style: 'currency', 
    currency: 'YER',
    maximumFractionDigits: 0 
  }).format(val).replace('YER', 'ر.ي');
};

// --- Components ---

const Navbar = ({ role, setRole }: { role: Role, setRole: (r: Role) => void }) => {
  return (
    <nav className="fixed top-0 left-0 right-0 h-16 bg-white border-b border-natural-200 px-4 flex items-center justify-between z-50 transition-all duration-300 shadow-sm" dir="rtl">
      <div className="flex items-center gap-2">
        <div className="bg-natural-800 p-2 rounded-xl text-white">
          <ArrowLeftRight size={24} />
        </div>
        <span className="text-xl font-bold text-natural-800 tracking-tight">حوِّل</span>
      </div>

      <div className="flex items-center gap-4">
        <select 
          value={role} 
          onChange={(e) => setRole(e.target.value as Role)}
          className="bg-natural-100 text-natural-800 text-sm py-1.5 px-3 rounded-full border border-natural-200 outline-none focus:ring-2 focus:ring-natural-800 transition-all"
        >
          <option value="SENDER">مغترب (مرسل)</option>
          <option value="BENEFICIARY">أهل (مستفيد)</option>
          <option value="MERCHANT">تاجر (وكيل)</option>
        </select>
        <button className="text-natural-800 p-2 hover:bg-natural-100 rounded-full transition-colors relative">
          <Bell size={20} />
          <span className="absolute top-1 right-1 w-2 h-2 bg-rose-500 rounded-full animate-pulse border-2 border-white"></span>
        </button>
      </div>
    </nav>
  );
};

// --- Views ---

const SenderDashboard = () => {
  const [step, setStep] = useState(1);
  const [amount, setAmount] = useState('');
  const [selectedMerchant, setSelectedMerchant] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSend = () => {
    setIsSuccess(true);
    setTimeout(() => {
      setIsSuccess(false);
      setStep(1);
      setAmount('');
      setSelectedMerchant(null);
    }, 3000);
  };

  return (
    <div className="space-y-6 pt-20" dir="rtl">
      <header className="px-4 py-4">
        <h1 className="text-2xl font-bold text-gray-900">أهلاً بك، محمد</h1>
        <p className="text-gray-500 text-sm">أرسل لأهلك الطمأنينة والغذاء اليوم.</p>
      </header>

      {/* Quick Stats */}
      <div className="px-4 grid grid-cols-2 gap-4">
        <div className="bg-natural-800 rounded-3xl p-5 text-white shadow-md overflow-hidden relative group">
          <div className="absolute -right-4 -bottom-4 bg-white/10 w-24 h-24 rounded-full group-hover:scale-150 transition-transform duration-700"></div>
          <TrendingUp className="mb-2 text-natural-100" size={20} />
          <h3 className="text-sm opacity-90">إجمالي الحوالات</h3>
          <p className="text-xl font-bold mt-1">٣،٤٥٠ ر.س</p>
        </div>
        <div className="bg-white rounded-3xl p-5 border border-natural-200 shadow-sm relative overflow-hidden group">
          <History className="mb-2 text-natural-800" size={20} />
          <h3 className="text-sm text-gray-500">آخر حوالة</h3>
          <p className="text-xl font-bold mt-1 text-gray-900">٥٠٠ ر.س</p>
        </div>
      </div>

      {/* Main Action: Send Money */}
      <div className="px-4">
        <div className="bg-natural-100 border border-natural-200 rounded-3xl p-6 relative">
          <h2 className="text-lg font-bold text-natural-800 mb-4 flex items-center gap-2">
            <Plus size={20} className="text-natural-800" />
            حوالة جديدة
          </h2>

          <AnimatePresence mode="wait">
            {!isSuccess ? (
              <motion.div
                key="form"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
              >
                {step === 1 && (
                  <div className="space-y-4">
                    <label className="block text-sm font-medium text-gray-700">أدخل المبلغ المراد تحويله (بالريال اليمني)</label>
                    <div className="relative">
                      <input 
                        type="number"
                        placeholder="0.00"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        className="w-full bg-white border-2 border-natural-200 rounded-2xl py-4 px-6 text-2xl font-bold focus:border-natural-800 focus:ring-0 outline-none text-natural-800"
                      />
                      <span className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-400 font-bold">ر.ي</span>
                    </div>
                    <button 
                      disabled={!amount}
                      onClick={() => setStep(2)}
                      className="w-full bg-natural-800 text-white rounded-2xl py-4 font-bold shadow-md hover:bg-natural-900 active:scale-95 transition-all disabled:opacity-50"
                    >
                      متابعة
                    </button>
                  </div>
                )}

                {step === 2 && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium text-gray-700">اختر التاجر أو الغرض (اختياري)</label>
                      <button onClick={() => setStep(1)} className="text-natural-800 text-xs flex items-center gap-1">
                        <ChevronLeft size={16} /> رجوع
                      </button>
                    </div>
                    
                    <div className="grid grid-cols-1 gap-2 max-h-60 overflow-y-auto pr-1">
                      <button 
                        onClick={() => setSelectedMerchant('OPEN')}
                        className={`p-3 rounded-2xl border-2 flex items-center justify-between transition-all ${selectedMerchant === 'OPEN' ? 'bg-natural-200 border-natural-800' : 'bg-white border-gray-100'}`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="bg-blue-100 p-2 rounded-xl text-blue-600"><Wallet size={20}/></div>
                          <div className="text-right">
                            <p className="font-bold text-sm text-gray-900">رصيد مفتوح</p>
                            <p className="text-[10px] text-gray-500">حرية الشراء من أي مكان</p>
                          </div>
                        </div>
                        {selectedMerchant === 'OPEN' && <CheckCircle2 size={20} className="text-natural-800" />}
                      </button>

                      {MERCHANTS.map(m => (
                        <button 
                          key={m.id}
                          onClick={() => setSelectedMerchant(m.id)}
                          className={`p-3 rounded-2xl border-2 flex items-center justify-between transition-all ${selectedMerchant === m.id ? 'bg-natural-200 border-natural-800' : 'bg-white border-gray-100'}`}
                        >
                          <div className="flex items-center gap-3">
                            <div className="bg-natural-100 p-2 rounded-xl text-natural-800"><Store size={20}/></div>
                            <div className="text-right">
                              <p className="font-bold text-sm text-gray-900">{m.name}</p>
                              <p className="text-[10px] text-gray-500">{m.address}</p>
                            </div>
                          </div>
                          {selectedMerchant === m.id && <CheckCircle2 size={20} className="text-natural-800" />}
                        </button>
                      ))}
                    </div>

                    <button 
                      onClick={handleSend}
                      className="w-full bg-natural-800 text-white rounded-2xl py-4 font-bold shadow-md hover:bg-natural-900 active:scale-95 transition-all"
                    >
                      إرسال الحوالة الآن
                    </button>
                  </div>
                )}
              </motion.div>
            ) : (
              <motion.div 
                key="success"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="flex flex-col items-center py-10"
              >
                <div className="w-20 h-20 bg-natural-100 text-natural-800 rounded-full flex items-center justify-center mb-4">
                  <Check size={40} strokeWidth={3} />
                </div>
                <h3 className="text-xl font-bold text-natural-800">تم الإرسال بنجاح!</h3>
                <p className="text-sm text-gray-500 text-center mt-2">ستصل رسالة نصية لأهلك فوراً.</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* History */}
      <div className="px-4 pb-10">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-900">العمليات الأخيرة</h2>
          <button className="text-natural-800 text-sm font-medium">عرض الكل</button>
        </div>
        <div className="space-y-3">
          {INITIAL_TRANSACTIONS.filter(t => t.type === 'SENT').map(t => (
            <div key={t.id} className="bg-white border border-natural-200 p-4 rounded-3xl flex items-center justify-between group hover:shadow-md transition-shadow">
               <div className="flex items-center gap-3">
                 <div className="w-12 h-12 bg-natural-100 rounded-2xl flex items-center justify-center text-natural-800 group-hover:bg-natural-200 transition-colors">
                   <User size={24} />
                 </div>
                 <div>
                   <p className="font-bold text-gray-900">{t.recipientName}</p>
                   <p className="text-xs text-gray-400">{t.date} • {t.category}</p>
                 </div>
               </div>
               <div className="text-left font-bold text-red-600">
                 -{formatYER(t.amount)}
               </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const BeneficiaryDashboard = () => {
  const [showQR, setShowQR] = useState(false);

  return (
    <div className="space-y-6 pt-20" dir="rtl">
      <header className="px-4 py-4 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">أهلاً بكِ، هند</h1>
          <p className="text-gray-500 text-sm font-medium">رزقكِ اليوم مبارك.</p>
        </div>
        <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-natural-800 p-0.5">
          <div className="w-full h-full bg-natural-100 rounded-full flex items-center justify-center text-natural-800 font-bold uppercase">
            هـ
          </div>
        </div>
      </header>

      {/* Wallet Card */}
      <div className="px-4">
        <div className="bg-natural-800 rounded-[32px] p-8 text-white relative overflow-hidden shadow-md">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-bl-full"></div>
          <div className="absolute bottom-[-20%] left-[-10%] w-40 h-40 bg-natural-100/10 rounded-full blur-3xl"></div>
          
          <div className="relative z-10">
            <h3 className="text-sm opacity-80 mb-2 flex items-center gap-2">
              <Wallet size={16} /> رصيدك المتاح
            </h3>
            <p className="text-4xl font-bold flex items-baseline gap-2 font-mono">
              ١٨٥،٠٠٠ <span className="text-sm opacity-70">ر.ي</span>
            </p>
            
            <div className="mt-8 grid grid-cols-2 gap-4 border-t border-white/10 pt-6">
              <div>
                <p className="text-[10px] opacity-70 mb-1 uppercase tracking-wider">رصيد البقالة</p>
                <p className="text-lg font-bold font-mono tracking-tighter">٨٥،٠٠٠ ر.ي</p>
              </div>
              <div>
                <p className="text-[10px] opacity-70 mb-1 uppercase tracking-wider">رصيد عام</p>
                <p className="text-lg font-bold font-mono tracking-tighter text-natural-200">١٠٠،٠٠٠ ر.ي</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="px-4 pt-2">
        <button 
          onClick={() => setShowQR(true)}
          className="w-full bg-white border-2 border-natural-200 text-natural-800 py-5 rounded-[24px] font-bold flex items-center justify-center gap-3 hover:bg-natural-100 active:scale-95 transition-all shadow-sm"
        >
          <div className="bg-natural-800 text-white p-2 rounded-xl">
             <QrCode size={24} />
          </div>
          إظهار كود الدفع (QR) للتاجر
        </button>
      </div>

      {/* Merchant Limits / Specific Credits */}
      <div className="px-4 space-y-4">
        <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
          <MapPin size={20} className="text-natural-800" />
          مراكز صرف مخصصة لكِ
        </h2>
        <div className="flex gap-4 overflow-x-auto pb-4 -mx-4 px-4 no-scrollbar">
          {MERCHANTS.slice(0, 3).map((m, idx) => (
            <div key={m.id} className="min-w-[200px] bg-white border border-natural-200 rounded-3xl p-5 shadow-sm">
              <div className={`w-10 h-10 rounded-2xl flex items-center justify-center mb-3 ${idx === 0 ? 'bg-orange-100 text-orange-600' : 'bg-blue-100 text-blue-600'}`}>
                {idx === 0 ? <ShoppingCart size={20}/> : <Store size={20}/>}
              </div>
              <p className="font-bold text-sm text-gray-900 mb-1">{m.name}</p>
              <p className="text-[10px] text-gray-400 mb-3">{m.address}</p>
              <div className="h-1.5 w-full bg-natural-100 rounded-full overflow-hidden">
                <div className={`h-full ${idx === 0 ? 'bg-orange-500 w-[60%]' : 'bg-blue-500 w-[30%]'}`}></div>
              </div>
              <div className="mt-2 flex justify-between items-center text-[10px]">
                <span className="text-gray-400">الرصيد</span>
                <span className="font-bold text-gray-700">{idx === 0 ? '١٥،٠٠٠' : '٥٠،٠٠٠'} ر.ي</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* History */}
      <div className="px-4 pb-20">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-900">سجل المصاريف</h2>
          <button className="text-natural-800 text-sm font-medium">عرض الفواتير</button>
        </div>
        <div className="space-y-4">
          {INITIAL_TRANSACTIONS.filter(t => t.type !== 'SENT').map(t => (
            <div key={t.id} className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${t.type === 'RECEIVED' ? 'bg-natural-100 text-natural-800' : 'bg-rose-50 text-rose-600'}`}>
                  {t.type === 'RECEIVED' ? <ArrowRight className="rotate-45" /> : <ShoppingCart />}
                </div>
                <div>
                  <p className="font-bold text-gray-900 text-sm">{t.type === 'RECEIVED' ? t.senderName : t.merchantName}</p>
                  <p className="text-[10px] text-gray-400">{t.date} • {t.category}</p>
                </div>
              </div>
              <div className={`font-bold text-sm ${t.type === 'RECEIVED' ? 'text-natural-800' : 'text-gray-900'}`}>
                {t.type === 'RECEIVED' ? '+' : '-'}{formatYER(t.amount)}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* QR Code Modal Overlay */}
      <AnimatePresence>
        {showQR && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-4 bg-natural-800/40 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ y: 100, scale: 0.9 }}
              animate={{ y: 0, scale: 1 }}
              exit={{ y: 100, scale: 0.9 }}
              className="w-full max-w-md bg-white rounded-[40px] p-8 shadow-2xl relative"
            >
              <button 
                onClick={() => setShowQR(false)}
                className="absolute top-6 left-6 text-gray-400 p-2"
              >
                <Plus className="rotate-45" size={32} />
              </button>
              
              <div className="flex flex-col items-center text-center">
                <div className="bg-natural-100 text-natural-800 px-4 py-1.5 rounded-full text-xs font-bold mb-6">كود دفع خاص بكِ</div>
                <div className="bg-natural-100 p-6 rounded-[32px] border-4 border-natural-200 mb-6">
                   <QrCode size={180} className="text-natural-800" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">امسحي الكود عند التاجر</h3>
                <p className="text-sm text-gray-500">يتغير هذا الكود كل ٣ دقائق لضمان أمان حسابكِ.</p>
                
                <div className="mt-8 bg-natural-100 w-full rounded-2xl p-4 border border-natural-200 flex items-center justify-between">
                  <div className="text-right">
                    <p className="text-[10px] text-gray-400 uppercase font-bold">هاتف المستفيد</p>
                    <p className="font-mono text-sm">٠٩٦٧ ٧٧١ ٢٣٤ ٥٦٧</p>
                  </div>
                  <Smartphone className="text-natural-800 opacity-20" size={32} />
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const MerchantDashboard = () => {
  const [checkoutAmount, setCheckoutAmount] = useState('');
  const [success, setSuccess] = useState(false);

  const handleCheckout = (e: React.FormEvent) => {
    e.preventDefault();
    setSuccess(true);
    setTimeout(() => {
      setSuccess(false);
      setCheckoutAmount('');
    }, 4000);
  };

  return (
    <div className="space-y-6 pt-20 pb-20" dir="rtl">
      <header className="px-4 py-4">
        <h1 className="text-2xl font-bold text-gray-900">وكيل معتمد: الحاج جمال</h1>
        <p className="text-gray-500 text-sm">مرحباً بك في لوحة تحكم التاجر</p>
      </header>

      {/* Sale Action Area */}
      <div className="px-4">
        <div className="bg-white border-2 border-natural-200 rounded-[32px] p-6 shadow-sm overflow-hidden relative">
          <div className="absolute top-0 left-0 w-2 h-full bg-natural-800"></div>
          
          <h2 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
            <ShoppingCart className="text-natural-800" /> عملية بيع جديدة
          </h2>

          <AnimatePresence mode="wait">
            {!success ? (
              <motion.form 
                key="form"
                onSubmit={handleCheckout} 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="space-y-5"
              >
                <div>
                  <label className="block text-xs font-bold text-gray-400 mb-2 uppercase tracking-wide">أدخل مبلغ الفاتورة</label>
                  <div className="relative">
                    <input 
                      type="number"
                      required
                      placeholder="0.00"
                      value={checkoutAmount}
                      onChange={(e) => setCheckoutAmount(e.target.value)}
                      className="w-full bg-natural-100 border-2 border-transparent rounded-2xl py-4 px-6 text-2xl font-bold font-mono focus:bg-white focus:border-natural-800 transition-all outline-none"
                    />
                    <span className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-400 font-bold">ر.ي</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <button type="button" className="bg-natural-100 text-natural-800 py-4 rounded-2xl font-bold flex flex-col items-center gap-1 border border-natural-200">
                    <QrCode size={20} />
                    <span className="text-xs">مسح الكود</span>
                  </button>
                  <button type="button" className="bg-natural-100 text-natural-800 py-4 rounded-2xl font-bold flex flex-col items-center gap-1 border border-natural-200">
                    <Smartphone size={20} />
                    <span className="text-xs">رقم الهاتف</span>
                  </button>
                </div>

                <button 
                  type="submit"
                  className="w-full bg-natural-800 text-white py-5 rounded-[20px] font-bold text-lg shadow-md hover:bg-natural-900 active:scale-95 transition-all"
                >
                  إتمتم العملية وخصم الرصيد
                </button>
              </motion.form>
            ) : (
              <motion.div 
                key="success"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col items-center py-6 text-center"
              >
                <div className="w-16 h-16 bg-natural-800 text-white rounded-full flex items-center justify-center mb-4">
                  <Check size={32} />
                </div>
                <h3 className="text-xl font-bold text-gray-900">تم الخصم بنجاح</h3>
                <p className="text-sm text-gray-500 mt-2">رصيد الفاتورة: {formatYER(Number(checkoutAmount))}</p>
                <div className="mt-6 p-4 bg-natural-100 rounded-2xl w-full border border-natural-200">
                  <p className="text-[10px] text-natural-800 font-bold uppercase mb-1">الرصيد المتبقي للعميلة</p>
                  <p className="text-lg font-bold text-natural-800">٧٠،٠٠٠ ر.ي</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Merchant Stats */}
      <div className="px-4 grid grid-cols-2 gap-4">
        <div className="bg-white border border-natural-200 rounded-[24px] p-5">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">مبيعات اليوم</p>
          <p className="text-xl font-bold text-gray-900 font-mono">٤٥،٠٠٠ <span className="text-[10px] text-gray-400">ر.ي</span></p>
        </div>
        <div className="bg-white border border-natural-200 rounded-[24px] p-5">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">عمولتك المتوقعة</p>
          <p className="text-xl font-bold text-natural-800 font-mono">٤٥٠ <span className="text-[10px] text-natural-800 tracking-tight">ر.ي</span></p>
        </div>
      </div>

      {/* Recent Sales List */}
      <div className="px-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-900">آخر المبيعات</h2>
          <button className="text-gray-400"><Search size={20}/></button>
        </div>
        <div className="space-y-2">
          {['فاطمة محمد', 'خديجة علي', 'آمنة سالم'].map((name, i) => (
            <div key={i} className="bg-white border border-natural-200 p-4 rounded-2xl flex items-center justify-between transition-shadow hover:shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-natural-100 rounded-full flex items-center justify-center text-natural-800 font-bold text-xs uppercase">
                  {name[0]}
                </div>
                <div>
                  <p className="font-bold text-gray-900 text-sm">{name}</p>
                  <p className="text-[10px] text-gray-400">منذ {5 + i * 15} دقيقة</p>
                </div>
              </div>
              <div className="font-bold text-sm text-gray-900">
                {formatYER(4500 + i * 2000)}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Settle Up Action */}
      <div className="px-4">
        <button className="w-full bg-natural-800 text-white p-5 rounded-[24px] font-bold flex items-center justify-between shadow-md active:bg-natural-900">
           <div className="flex items-center gap-3">
             <div className="bg-white/10 p-2 rounded-xl"><AlertCircle size={20} /></div>
             <span>طلب تسوية المستحقات</span>
           </div>
           <div className="text-natural-200 font-mono text-sm">١٨٥،٤٠٠ ر.ي</div>
        </button>
      </div>
    </div>
  );
};

// --- Main App Component ---

export default function App() {
  const [role, setRole] = useState<Role>('SENDER');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 1200);
    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-natural-50 flex flex-col items-center justify-center space-y-4" dir="rtl">
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          className="bg-natural-800 p-4 rounded-3xl text-white shadow-lg"
        >
          <ArrowLeftRight size={48} />
        </motion.div>
        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-natural-800 font-bold text-xl tracking-tighter"
        >
          حوِّل - جاري التحميل...
        </motion.p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-natural-50 text-[#1A1A1A] selection:bg-natural-200 font-sans" dir="rtl">
      <Navbar role={role} setRole={setRole} />
      
      <main className="max-w-md mx-auto min-h-screen pb-24 relative">
        <AnimatePresence mode="wait">
          <motion.div
            key={role}
            initial={{ opacity: 0, x: role === 'SENDER' ? 20 : -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
          >
            {role === 'SENDER' && <SenderDashboard />}
            {role === 'BENEFICIARY' && <BeneficiaryDashboard />}
            {role === 'MERCHANT' && <MerchantDashboard />}
          </motion.div>
        </AnimatePresence>

        {/* Floating Role Switcher Labels for clarity */}
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 bg-white/90 backdrop-blur-md px-6 py-3 rounded-full border border-natural-200 shadow-md flex items-center gap-6 z-[60]">
          <button 
             onClick={() => setRole('SENDER')}
             className={`flex flex-col items-center gap-1 transition-all ${role === 'SENDER' ? 'text-natural-800 font-bold scale-110' : 'text-gray-400 hober:text-gray-600'}`}
          >
            <History size={20} />
            <span className="text-[10px]">المرسل</span>
          </button>
          <button 
             onClick={() => setRole('BENEFICIARY')}
             className={`flex flex-col items-center gap-1 transition-all ${role === 'BENEFICIARY' ? 'text-natural-800 font-bold scale-110' : 'text-gray-400 hober:text-gray-600'}`}
          >
            <Wallet size={20} />
            <span className="text-[10px]">المستفيد</span>
          </button>
          <button 
             onClick={() => setRole('MERCHANT')}
             className={`flex flex-col items-center gap-1 transition-all ${role === 'MERCHANT' ? 'text-natural-800 font-bold scale-110' : 'text-gray-400 hober:text-gray-600'}`}
          >
            <Store size={20} />
            <span className="text-[10px]">التاجر</span>
          </button>
        </div>
      </main>

      {/* Decorative background elements */}
      <div className="fixed top-0 left-0 w-full h-1/2 bg-gradient-to-b from-natural-100/50 to-transparent -z-10 pointer-events-none"></div>
    </div>
  );
}
