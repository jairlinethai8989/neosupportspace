import Link from "next/link";
import { Zap, ShieldCheck, BarChart3, MessageSquare } from "lucide-react";

export default function Home() {
  return (
    <div className="relative min-h-screen bg-white overflow-hidden font-sans">
      {/* Background Decor */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-50 rounded-full blur-[120px] opacity-60" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-50 rounded-full blur-[120px] opacity-60" />
      </div>

      <main className="relative z-10 container mx-auto px-6 pt-20 pb-24">
        {/* Hero Section */}
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-900 text-white text-[10px] font-black uppercase tracking-[0.2em] shadow-xl shadow-slate-200">
            <Zap className="w-3 h-3 fill-yellow-400 text-yellow-400" />
            Next-Gen Support Intelligence
          </div>
          
          <h1 className="text-6xl md:text-8xl font-black text-slate-900 tracking-tighter leading-[0.9]">
            NEO<span className="text-blue-600">SUPPORT</span>
          </h1>
          
          <p className="text-xl text-slate-500 font-medium max-w-2xl mx-auto leading-relaxed">
            ระบบจัดการงานสนับสนุนลูกค้าผ่าน LINE LIFF ที่มาพร้อมกับ Dashboard วิเคราะห์ข้อมูลอัจฉริยะ 
            ยกระดับการให้บริการด้วยความรวดเร็วและแม่นยำ
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-8">
            <Link 
              href="/liff" 
              className="px-10 py-5 bg-blue-600 text-white rounded-2xl font-black text-lg transition-all hover:bg-blue-700 hover:scale-[1.02] active:scale-95 shadow-2xl shadow-blue-200 flex items-center justify-center gap-3"
            >
              <MessageSquare className="w-5 h-5" />
              Customer Portal (LIFF)
            </Link>
            <Link 
              href="/login" 
              className="px-10 py-5 bg-white text-slate-900 border-2 border-slate-100 rounded-2xl font-black text-lg transition-all hover:bg-slate-50 hover:border-slate-200 hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-3"
            >
              <BarChart3 className="w-5 h-5" />
              Agent Dashboard
            </Link>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-32 max-w-6xl mx-auto">
          <div className="p-10 rounded-[40px] bg-slate-50 border border-white space-y-4 hover:bg-white hover:shadow-2xl transition-all duration-500 group">
            <div className="w-14 h-14 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <MessageSquare className="w-7 h-7" />
            </div>
            <h3 className="text-xl font-black text-slate-900">LINE-First</h3>
            <p className="text-slate-500 font-medium text-sm leading-relaxed">เชื่อมต่อกับลูกค้าผ่าน LINE LIFF ได้โดยตรง ลดขั้นตอนและเพิ่มความสะดวกสูงสุด</p>
          </div>

          <div className="p-10 rounded-[40px] bg-slate-50 border border-white space-y-4 hover:bg-white hover:shadow-2xl transition-all duration-500 group">
            <div className="w-14 h-14 rounded-2xl bg-indigo-100 text-indigo-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <BarChart3 className="w-7 h-7" />
            </div>
            <h3 className="text-xl font-black text-slate-900">Live Analytics</h3>
            <p className="text-slate-500 font-medium text-sm leading-relaxed">วิเคราะห์ผลลัพธ์การทำงานแบบ Real-time พร้อมกราฟสรุปข้อมูลที่ปรับแต่งได้</p>
          </div>

          <div className="p-10 rounded-[40px] bg-slate-50 border border-white space-y-4 hover:bg-white hover:shadow-2xl transition-all duration-500 group">
            <div className="w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <ShieldCheck className="w-7 h-7" />
            </div>
            <h3 className="text-xl font-black text-slate-900">Secure & Agile</h3>
            <p className="text-slate-500 font-medium text-sm leading-relaxed">ระบบจัดการสิทธิ์ที่ปลอดภัยและยืดหยุ่น รองรับการโอนถ่ายงานระหว่างทีม</p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 py-12 border-t border-slate-50 bg-white/50 backdrop-blur-md">
        <div className="container mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="text-sm font-black text-slate-400 tracking-[0.3em] grayscale opacity-50">
            NEOSUPPORT © 2026
          </div>
          <div className="flex gap-8">
            <a href="#" className="text-xs font-black text-slate-400 uppercase tracking-widest hover:text-blue-600 transition-colors">Documentation</a>
            <a href="#" className="text-xs font-black text-slate-400 uppercase tracking-widest hover:text-blue-600 transition-colors">Privacy Policy</a>
            <a href="#" className="text-xs font-black text-slate-400 uppercase tracking-widest hover:text-blue-600 transition-colors">Support</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
