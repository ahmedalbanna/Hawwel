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
  ChevronLeft,
  Moon,
  Sun,
  Shield,
  FileText,
  Camera,
  Fingerprint,
  Globe,
  Calendar,
  Filter,
  X,
  CreditCard,
  FileDigit,
  Download
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// --- Types ---

type Role = 'SENDER' | 'BENEFICIARY' | 'MERCHANT';
type ViewState = 'DASHBOARD' | 'PROFILE' | 'HISTORY' | 'USSD' | 'ONBOARDING';

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
  merchantAddress?: string;
  senderName?: string;
  recipientName?: string;
  date: string;
  time?: string;
  status: 'COMPLETED' | 'PENDING';
  notes?: string;
}

interface AppState {
  role: Role;
  balance: number;
  transactions: Transaction[];
  credits: { [merchantId: string]: number };
}

// --- Constants & Mock Data ---

const MERCHANTS: Merchant[] = [
  { id: 'm1', name: 'بقالة الحاج جمال', category: 'GROCERY', address: 'شارع القاهرة، صنعاء' },
  { id: 'm2', name: 'صيدلية الأمل', category: 'PHARMACY', address: 'حي الروضة، تعز' },
  { id: 'm3', name: 'محطة النور للوقود', category: 'FUEL', address: 'طريق الميناء، عدن' },
  { id: 'm4', name: 'مدرسة النهضة الحديثة', category: 'SCHOOL', address: 'سيئون، حضرموت' },
];

const INITIAL_TRANSACTIONS: Transaction[] = [
  { id: 't1', amount: 50000, type: 'SENT', category: 'غذاء', recipientName: 'فاطمة محمد', date: 'منذ ساعتين', time: '14:30', status: 'COMPLETED', notes: 'مصروف البيت الشهري' },
  { id: 't2', amount: 15000, type: 'SPENT', category: 'دواء', merchantName: 'صيدلية الأمل', merchantAddress: 'حي الروضة، تعز', date: 'أمس', time: '18:45', status: 'COMPLETED', notes: 'أدوية الضغط' },
  { id: 't3', amount: 100000, type: 'RECEIVED', category: 'رصيد مفتوح', senderName: 'أحمد (السعودية)', date: 'قبل ٣ أيام', time: '09:00', status: 'COMPLETED' },
  { id: 't4', amount: 20000, type: 'SPENT', category: 'وقود', merchantName: 'محطة النور', merchantAddress: 'طريق الميناء، عدن', date: 'قبل ٤ أيام', time: '16:20', status: 'COMPLETED' },
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

const Navbar = ({ role, setRole, isDark, setIsDark, setView }: { role: Role, setRole: (r: Role) => void, isDark: boolean, setIsDark: (b: boolean) => void, setView: (v: ViewState) => void }) => {
  return (
    <nav className="fixed top-0 left-0 right-0 h-16 bg-white dark:bg-natural-100 border-b border-natural-200 px-4 flex items-center justify-between z-50 transition-all duration-300 shadow-sm" dir="rtl">
      <div className="flex items-center gap-2 cursor-pointer" onClick={() => setView('DASHBOARD')}>
        <div className="bg-natural-800 p-2 rounded-xl text-white">
          <ArrowLeftRight size={24} />
        </div>
        <span className="text-xl font-bold text-natural-800 tracking-tight">حوِّل</span>
      </div>

      <div className="flex items-center gap-3">
        <button onClick={() => setIsDark(!isDark)} className="text-natural-800 p-2 hover:bg-natural-200 rounded-full transition-colors">
          {isDark ? <Sun size={20} /> : <Moon size={20} />}
        </button>
        <select 
          value={role} 
          onChange={(e) => { setRole(e.target.value as Role); setView('DASHBOARD'); }}
          className="bg-natural-100 dark:bg-natural-200 text-natural-800 text-sm py-1.5 px-3 rounded-full border border-natural-200 outline-none focus:ring-2 focus:ring-natural-800 transition-all cursor-pointer"
        >
          <option value="SENDER">مغترب (مرسل)</option>
          <option value="BENEFICIARY">أهل (مستفيد)</option>
          <option value="MERCHANT">تاجر (وكيل)</option>
        </select>
        <button className="text-natural-800 p-2 hover:bg-natural-100 dark:hover:bg-natural-200 rounded-full transition-colors relative">
          <Bell size={20} />
          <span className="absolute top-1 right-1 w-2 h-2 bg-rose-500 rounded-full animate-pulse border-2 border-white dark:border-natural-100"></span>
        </button>
      </div>
    </nav>
  );
};

// --- Shared Components ---

const TransactionDetailsModal = ({ tx, onClose }: { tx: Transaction, onClose: () => void }) => (
  <AnimatePresence>
    <motion.div 
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-4 bg-natural-800/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div 
        initial={{ y: 100, scale: 0.9 }} animate={{ y: 0, scale: 1 }} exit={{ y: 100, scale: 0.9 }}
        onClick={e => e.stopPropagation()}
        className="w-full max-w-md bg-white dark:bg-natural-50 rounded-[40px] p-8 shadow-2xl relative"
      >
        <button onClick={onClose} className="absolute top-6 left-6 text-gray-400 p-2 hover:bg-natural-100 rounded-full transition-colors">
          <X size={24} />
        </button>
        <div className="flex flex-col items-center text-center">
          <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 ${tx.type === 'RECEIVED' ? 'bg-emerald-100 text-emerald-600' : tx.type === 'SENT' ? 'bg-blue-100 text-blue-600' : 'bg-rose-100 text-rose-600'}`}>
            {tx.type === 'RECEIVED' ? <ArrowRight className="rotate-45" size={32} /> : tx.type === 'SENT' ? <Send size={32} /> : <ShoppingCart size={32} />}
          </div>
          <h3 className="text-2xl font-bold text-natural-900 mb-1">{formatYER(tx.amount)}</h3>
          <p className="text-sm font-medium text-gray-500 mb-6">{tx.type === 'RECEIVED' ? 'تحويل وارد' : tx.type === 'SENT' ? 'حوالة صادرة' : 'عملية شراء'}</p>
          
          <div className="w-full bg-natural-100 rounded-2xl p-4 text-right space-y-3">
            <div className="flex justify-between border-b border-natural-200 pb-2">
              <span className="text-xs text-gray-500">التاريخ والوقت</span>
              <span className="text-sm font-bold">{tx.date} • {tx.time || '10:00'}</span>
            </div>
            {tx.merchantName && (
              <div className="flex justify-between border-b border-natural-200 pb-2">
                <span className="text-xs text-gray-500">التاجر</span>
                <span className="text-sm font-bold text-natural-800">{tx.merchantName}</span>
              </div>
            )}
            {tx.merchantAddress && (
              <div className="flex justify-between border-b border-natural-200 pb-2">
                <span className="text-xs text-gray-500">العنوان</span>
                <span className="text-sm font-bold">{tx.merchantAddress}</span>
              </div>
            )}
            {tx.recipientName && (
              <div className="flex justify-between border-b border-natural-200 pb-2">
                <span className="text-xs text-gray-500">المستفيد</span>
                <span className="text-sm font-bold">{tx.recipientName}</span>
              </div>
            )}
            <div className="flex justify-between border-b border-natural-200 pb-2">
              <span className="text-xs text-gray-500">التصنيف</span>
              <span className="text-sm font-bold bg-white px-2 py-0.5 rounded-md">{tx.category}</span>
            </div>
            {tx.notes && (
              <div className="flex justify-between">
                <span className="text-xs text-gray-500">ملاحظات</span>
                <span className="text-sm font-medium italic">{tx.notes}</span>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </motion.div>
  </AnimatePresence>
);

const ProfileView = ({ role }: { role: Role }) => {
  return (
    <div className="space-y-6 pt-20 pb-24 px-4" dir="rtl">
      <header className="text-center mb-8">
        <div className="w-24 h-24 bg-natural-200 rounded-full mx-auto mb-4 flex items-center justify-center border-4 border-white shadow-md relative">
          <User size={40} className="text-natural-800" />
          <div className="absolute bottom-0 right-0 bg-natural-800 text-white p-1.5 rounded-full border-2 border-white cursor-pointer">
            <Camera size={14} />
          </div>
        </div>
        <h2 className="text-2xl font-bold text-natural-900">
          {role === 'SENDER' ? 'محمد المغترب' : role === 'BENEFICIARY' ? 'هند أحمد' : 'الحاج جمال'}
        </h2>
        <p className="text-gray-500 text-sm">
          {role === 'SENDER' ? 'السعودية - مكة مكرمة' : role === 'BENEFICIARY' ? 'اليمن - صنعاء' : 'تاجر جملة - بقالة مواد غذائية'}
        </p>
      </header>

      <div className="bg-white rounded-3xl p-5 border border-natural-200 space-y-4">
        <h3 className="font-bold text-natural-800 border-b border-natural-100 pb-2">البيانات الشخصية</h3>
        <div className="grid grid-cols-1 gap-4">
          <div>
            <label className="text-xs text-gray-400">رقم الهاتف المرتبط</label>
            <p className="text-sm font-bold" dir="ltr">+967 77X XXX XXX</p>
          </div>
          {role === 'MERCHANT' && (
            <div>
              <label className="text-xs text-gray-400">السجل التجاري</label>
              <p className="text-sm font-bold">123456789 (موثق <CheckCircle2 size={12} className="inline text-emerald-600" />)</p>
            </div>
          )}
          <div>
             <label className="text-xs text-gray-400">الحالة الأمنية (KYC)</label>
             <div className="flex items-center gap-2 mt-1">
               <span className="bg-emerald-100 text-emerald-700 text-xs px-2 py-1 rounded-full font-bold flex items-center gap-1">
                 <Shield size={12}/> تم التحقق من الهوية
               </span>
             </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-3xl p-2 border border-natural-200">
        <button className="flex items-center gap-3 w-full p-3 hover:bg-natural-50 rounded-2xl transition-colors text-right">
          <div className="p-2 bg-blue-50 text-blue-600 rounded-lg"><Fingerprint size={20} /></div>
          <div className="flex-1 font-medium">البصمة والأمان</div>
          <ChevronLeft size={16} className="text-gray-400" />
        </button>
        <button className="flex items-center gap-3 w-full p-3 hover:bg-natural-50 rounded-2xl transition-colors text-right">
          <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg"><FileText size={20} /></div>
          <div className="flex-1 font-medium">تحديث بيانات الهوية</div>
          <ChevronLeft size={16} className="text-gray-400" />
        </button>
        <button className="flex items-center gap-3 w-full p-3 hover:bg-natural-50 rounded-2xl transition-colors text-right">
          <div className="p-2 bg-rose-50 text-rose-600 rounded-lg"><Globe size={20} /></div>
          <div className="flex-1 font-medium">اللغة والإشعارات</div>
          <ChevronLeft size={16} className="text-gray-400" />
        </button>
      </div>
    </div>
  );
};

const USSDSimulator = ({ onClose }: { onClose: () => void }) => {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('مرحباً بك في خدمة حوِّل USSD\n\n1. الاستعلام عن الرصيد\n2. سداد مشتريات (للتاجر)\n3. إشِعارات\n\nأدخل الرقم:');
  const [step, setStep] = useState(0);

  const handleSend = () => {
    if (step === 0 && input === '1') {
      setOutput('رصيدك الحالي:\nرصيد عام: ١٠٠،٠٠٠ ر.ي\nرصيد البقالة: ٨٥،٠٠٠ ر.ي\n\n0. رجوع');
      setStep(1);
    } else if (step === 0 && input === '2') {
      setOutput('أدخل كود التاجر:');
      setStep(2);
    } else if (step === 2) {
      setOutput(`جاري الدفع للتاجر ${input}...\n\nأدخل المبلغ:`);
      setStep(3);
    } else if (step === 3) {
      setOutput(`تم خصم ${input} ر.ي بنجاح.\n\nرقم العملية: 123456\n\n0. للقائمة الرئيسية`);
      setStep(1);
    } else if (input === '0') {
      setOutput('مرحباً بك في خدمة حوِّل USSD\n\n1. الاستعلام عن الرصيد\n2. سداد مشتريات (للتاجر)\n3. إشِعارات\n\nأدخل الرقم:');
      setStep(0);
    } else {
      setOutput('إدخال غير صحيح.\n0. رجوع');
    }
    setInput('');
  };

  return (
    <div className="space-y-6 pt-20 pb-24 px-4" dir="rtl">
      <header className="mb-4">
        <h2 className="text-2xl font-bold text-natural-900 mb-1">محاكي USSD</h2>
        <p className="text-sm text-gray-500">جرب تجربة الخدمة بدون إنترنت عبر أرقامUSSD مثل #123*</p>
      </header>

      <div className="bg-black text-green-400 font-mono p-6 rounded-[32px] min-h-[300px] flex flex-col shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-8 bg-gray-900 flex items-center px-4 justify-between" dir="ltr">
          <div className="flex gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500" onClick={onClose} />
            <div className="w-3 h-3 rounded-full bg-yellow-500" />
            <div className="w-3 h-3 rounded-full bg-green-500" />
          </div>
          <span className="text-[10px] text-gray-400">Terminal</span>
        </div>
        
        <div className="mt-8 flex-1 whitespace-pre-wrap leading-relaxed text-sm">
          {output}
        </div>
        
        <div className="mt-4 flex gap-2">
          <input 
            type="text" 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="flex-1 bg-transparent border-b border-green-700 outline-none text-green-400 font-mono"
            placeholder="أدخل..."
            autoFocus
          />
          <button onClick={handleSend} className="bg-green-800 text-white px-4 py-1.5 rounded-lg text-sm font-bold">إرسال</button>
        </div>
      </div>
    </div>
  );
};

const MerchantOnboarding = ({ setView }: { setView: (v: ViewState) => void }) => {
  const [step, setStep] = useState(1);
  return (
    <div className="space-y-6 pt-20 pb-24 px-4" dir="rtl">
      <div className="bg-white rounded-3xl p-6 border border-natural-200 shadow-sm relative overflow-hidden">
        {step === 1 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
            <h2 className="text-2xl font-bold text-natural-900 mb-2">تسجيل تاجر جديد</h2>
            <p className="text-sm text-gray-500">انضم إلى شبكة حوِّل كوكيل معتمد وابدأ في استقبال المدفوعات بسلاسة.</p>
            <div className="space-y-3 mt-6">
              <input type="text" placeholder="الاسم التجاري" className="w-full bg-natural-50 border p-3 rounded-xl outline-none focus:border-natural-800" />
              <select className="w-full bg-natural-50 border p-3 rounded-xl outline-none focus:border-natural-800">
                <option>بقالة / مواد غذائية</option>
                <option>صيدلية / طبي</option>
                <option>محطة وقود</option>
                <option>تعليم</option>
              </select>
              <input type="text" placeholder="عنوان النشاط" className="w-full bg-natural-50 border p-3 rounded-xl outline-none focus:border-natural-800" />
            </div>
            <button onClick={() => setStep(2)} className="w-full bg-natural-800 text-white p-4 rounded-xl font-bold mt-6 hover:bg-natural-900">التالي: التحقق</button>
          </motion.div>
        )}
        {step === 2 && (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
            <h2 className="text-xl font-bold text-natural-900 mb-2">التحقق من الهوية والسجل</h2>
            <div className="border-2 border-dashed border-natural-200 p-6 rounded-2xl flex flex-col items-center justify-center text-gray-400 bg-natural-50 hover:bg-natural-100 transition-colors cursor-pointer">
              <Camera size={32} className="mb-2" />
              <p className="text-sm font-bold">التقط صورة للسجل التجاري</p>
            </div>
            <div className="border-2 border-dashed border-natural-200 p-6 rounded-2xl flex flex-col items-center justify-center text-gray-400 bg-natural-50 hover:bg-natural-100 transition-colors cursor-pointer">
              <FileDigit size={32} className="mb-2" />
              <p className="text-sm font-bold">التقط صورة للهوية أو جواز السفر</p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setStep(1)} className="flex-1 bg-natural-100 text-natural-800 p-4 rounded-xl font-bold">رجوع</button>
              <button onClick={() => setStep(3)} className="flex-[2] bg-natural-800 text-white p-4 rounded-xl font-bold">متابعة</button>
            </div>
          </motion.div>
        )}
        {step === 3 && (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
            <h2 className="text-xl font-bold text-natural-900 mb-2">العمولة وبدء العمل</h2>
            <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-100 mb-4">
              <h3 className="font-bold text-emerald-800 mb-2">هيكل العمولات الخاص بك</h3>
              <ul className="text-sm space-y-2 text-emerald-700">
                <li>• عمولة ١٪ على المبيعات العامة</li>
                <li>• عمولة ٠.٥٪ على المبيعات المشترطة (بحسب الفئة)</li>
                <li>• تسوية فورية للرصيد عند الطلب</li>
              </ul>
            </div>
            <button onClick={() => setView('DASHBOARD')} className="w-full bg-natural-800 text-white p-4 rounded-xl font-bold hover:bg-natural-900">
              موافق والذهاب للوحة التحكم
            </button>
          </motion.div>
        )}
      </div>
    </div>
  );
};

// --- Views ---

const SenderDashboard = ({ onSelectTx }: { onSelectTx: (tx: Transaction) => void }) => {
  const [step, setStep] = useState(1);
  const [amount, setAmount] = useState('');
  const [selectedMerchant, setSelectedMerchant] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [filterType, setFilterType] = useState<'ALL' | 'SENT' | 'RECEIVED' | 'SPENT'>('ALL');

  const handleSend = () => {
    setIsSuccess(true);
    setTimeout(() => {
      setIsSuccess(false);
      setStep(1);
      setAmount('');
      setSelectedMerchant(null);
    }, 3000);
  };

  const filteredTx = INITIAL_TRANSACTIONS.filter(t => filterType === 'ALL' || t.type === filterType);

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
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-lg font-bold text-gray-900">العمليات الأخيرة</h2>
          <div className="flex gap-2">
             <select value={filterType} onChange={e => setFilterType(e.target.value as any)} className="bg-white border text-xs border-natural-200 p-1.5 rounded-lg outline-none text-natural-800 focus:ring-1 focus:ring-natural-800">
               <option value="ALL">الكل</option>
               <option value="SENT">صادر</option>
             </select>
          </div>
        </div>
        <div className="space-y-3">
          {filteredTx.filter(t => t.type === 'SENT').map(t => (
            <div key={t.id} onClick={() => onSelectTx(t)} className="bg-white border border-natural-200 p-4 rounded-3xl flex items-center justify-between group hover:shadow-md transition-shadow cursor-pointer">
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
          {filteredTx.length === 0 && <p className="text-center text-gray-400 text-sm py-4">لا توجد عمليات</p>}
        </div>
      </div>
    </div>
  );
};

const BeneficiaryDashboard = ({ onSelectTx }: { onSelectTx: (tx: Transaction) => void }) => {
  const [showQR, setShowQR] = useState(false);
  const [filterType, setFilterType] = useState<'ALL' | 'RECEIVED' | 'SPENT'>('ALL');

  const filteredTx = INITIAL_TRANSACTIONS.filter(t => filterType === 'ALL' || t.type === filterType);

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
          <div className="flex gap-2">
             <select value={filterType} onChange={e => setFilterType(e.target.value as any)} className="bg-white border text-xs border-natural-200 p-1.5 rounded-lg outline-none text-natural-800 focus:ring-1 focus:ring-natural-800">
               <option value="ALL">الكل</option>
               <option value="RECEIVED">وارد</option>
               <option value="SPENT">مشتريات</option>
             </select>
          </div>
        </div>
        <div className="space-y-4">
          {filteredTx.map(t => (
            <div key={t.id} onClick={() => onSelectTx(t)} className="flex items-center justify-between bg-white p-3 rounded-2xl border border-transparent hover:border-natural-200 cursor-pointer transition-colors shadow-sm">
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${t.type === 'RECEIVED' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                  {t.type === 'RECEIVED' ? <ArrowRight className="rotate-45" /> : <ShoppingCart />}
                </div>
                <div>
                  <p className="font-bold text-gray-900 text-sm">{t.type === 'RECEIVED' ? t.senderName : t.merchantName}</p>
                  <p className="text-[10px] text-gray-400">{t.date} • {t.category}</p>
                </div>
              </div>
              <div className={`font-bold text-sm ${t.type === 'RECEIVED' ? 'text-emerald-600' : 'text-gray-900'}`}>
                {t.type === 'RECEIVED' ? '+' : '-'}{formatYER(t.amount)}
              </div>
            </div>
          ))}
          {filteredTx.length === 0 && <p className="text-center text-gray-400 text-sm py-4">لا توجد عمليات</p>}
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

const MerchantDashboard = ({ onSelectTx }: { onSelectTx: (tx: Transaction) => void }) => {
  const [checkoutAmount, setCheckoutAmount] = useState('');
  const [success, setSuccess] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const sampleRecentSales = [
    { name: 'فاطمة محمد', time: 'منذ 5 دقائق', amount: 4500, txMock: INITIAL_TRANSACTIONS[0] },
    { name: 'خديجة علي', time: 'منذ 20 دقيقة', amount: 6500, txMock: INITIAL_TRANSACTIONS[1] },
    { name: 'آمنة سالم', time: 'منذ 35 دقيقة', amount: 8500, txMock: INITIAL_TRANSACTIONS[3] },
  ];

  const filteredSales = sampleRecentSales.filter(sale => 
    sale.name.includes(searchQuery) || String(sale.amount).includes(searchQuery)
  );

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
          <div className="relative">
             <input 
               type="text" 
               placeholder="بحث بالاسم أو المبلغ"
               value={searchQuery}
               onChange={e => setSearchQuery(e.target.value)}
               className="bg-white border border-natural-200 text-xs py-1.5 px-3 pr-8 rounded-full outline-none focus:border-natural-800 w-40"
             />
             <Search size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
          </div>
        </div>
        <div className="space-y-2">
          {filteredSales.map((sale, i) => (
            <div key={i} onClick={() => onSelectTx(sale.txMock)} className="bg-white border border-natural-200 p-4 rounded-2xl flex items-center justify-between transition-shadow hover:shadow-sm cursor-pointer">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-natural-100 rounded-full flex items-center justify-center text-natural-800 font-bold text-xs uppercase">
                  {sale.name[0]}
                </div>
                <div>
                  <p className="font-bold text-gray-900 text-sm">{sale.name}</p>
                  <p className="text-[10px] text-gray-400">{sale.time}</p>
                </div>
              </div>
              <div className="font-bold text-sm text-gray-900">
                {formatYER(sale.amount)}
              </div>
            </div>
          ))}
          {filteredSales.length === 0 && <p className="text-xs text-gray-500 text-center py-4">لا توجد نتائج</p>}
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
  const [view, setView] = useState<ViewState>('DASHBOARD');
  const [isLoading, setIsLoading] = useState(true);
  const [isDark, setIsDark] = useState(false);
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 1200);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDark]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-natural-50 dark:bg-natural-100 flex flex-col items-center justify-center space-y-4" dir="rtl">
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          className="bg-natural-800 p-4 rounded-3xl text-white shadow-lg"
        >
          <ArrowLeftRight size={48} />
        </motion.div>
        <motion.p 
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
          className="text-natural-800 dark:text-natural-800 font-bold text-xl tracking-tighter"
        >
          حوِّل - جاري التحميل...
        </motion.p>
      </div>
    );
  }

  const renderView = () => {
    if (view === 'PROFILE') return <ProfileView role={role} />;
    if (view === 'USSD') return <USSDSimulator onClose={() => setView('DASHBOARD')} />;
    if (view === 'ONBOARDING') return <MerchantOnboarding setView={setView} />;
    
    if (role === 'SENDER') return <SenderDashboard onSelectTx={setSelectedTx} />;
    if (role === 'BENEFICIARY') return <BeneficiaryDashboard onSelectTx={setSelectedTx} />;
    if (role === 'MERCHANT') return <MerchantDashboard onSelectTx={setSelectedTx} />;
    return null;
  };

  return (
    <div className="min-h-screen bg-natural-50 dark:bg-natural-100 text-[#1A1A1A] dark:text-natural-900 selection:bg-natural-200 font-sans" dir="rtl">
      <Navbar role={role} setRole={setRole} isDark={isDark} setIsDark={setIsDark} setView={setView} />
      
      <main className="max-w-md mx-auto min-h-screen pb-24 relative">
        <AnimatePresence mode="wait">
          <motion.div
            key={`${role}-${view}`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
          >
            {renderView()}
          </motion.div>
        </AnimatePresence>

        {/* Global Bottom Navigation */}
        <div className="fixed bottom-4 pb-safe left-1/2 -translate-x-1/2 bg-white/90 dark:bg-natural-50/90 backdrop-blur-md px-6 py-3 rounded-[32px] border border-natural-200 dark:border-natural-100 shadow-xl flex items-center gap-8 z-[60]">
          <button 
             onClick={() => setView('DASHBOARD')}
             className={`flex flex-col items-center gap-1 transition-all ${view === 'DASHBOARD' ? 'text-natural-800 font-bold scale-110' : 'text-gray-400 hover:text-gray-600'}`}
          >
            {role === 'SENDER' ? <Send size={24} /> : role === 'BENEFICIARY' ? <Wallet size={24} /> : <Store size={24} />}
            <span className="text-[10px]">{role === 'SENDER' ? 'إرسال' : role === 'BENEFICIARY' ? 'محفظتي' : 'المتجر'}</span>
          </button>
          
          {role === 'BENEFICIARY' && (
            <button 
               onClick={() => setView('USSD')}
               className={`flex flex-col items-center gap-1 transition-all ${view === 'USSD' ? 'text-natural-800 font-bold scale-110' : 'text-gray-400 hover:text-gray-600'}`}
            >
              <Smartphone size={24} />
              <span className="text-[10px]">USSD</span>
            </button>
          )}

          {role === 'MERCHANT' && (
            <button 
               onClick={() => setView('ONBOARDING')}
               className={`flex flex-col items-center gap-1 transition-all ${view === 'ONBOARDING' ? 'text-natural-800 font-bold scale-110' : 'text-gray-400 hover:text-gray-600'}`}
            >
              <FileDigit size={24} />
              <span className="text-[10px]">التسجيل</span>
            </button>
          )}

          <button 
             onClick={() => setView('PROFILE')}
             className={`flex flex-col items-center gap-1 transition-all ${view === 'PROFILE' ? 'text-natural-800 font-bold scale-110' : 'text-gray-400 hover:text-gray-600'}`}
          >
            <User size={24} />
            <span className="text-[10px]">حسابي</span>
          </button>
        </div>
      </main>

      {selectedTx && <TransactionDetailsModal tx={selectedTx} onClose={() => setSelectedTx(null)}/>}

      {/* Decorative background elements */}
      <div className="fixed top-0 left-0 w-full h-1/2 bg-gradient-to-b from-natural-100/50 dark:from-natural-200/20 to-transparent -z-10 pointer-events-none"></div>
    </div>
  );
}
