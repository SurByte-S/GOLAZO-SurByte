import React, { useState, useEffect } from 'react';
import { 
  Home, 
  Calendar as CalendarIcon, 
  Settings, 
  Moon, 
  Sun, 
  Menu, 
  X, 
  Trophy, 
  ShoppingBag, 
  LogOut,
  BarChart3,
  User as UserIcon,
  ShieldCheck,
  Upload,
  Image as ImageIcon,
  Zap,
  Target,
  Activity,
  ChevronRight,
  Lightbulb
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Toaster } from 'sonner';
import Dashboard from './pages/Dashboard';
import Admin from './pages/Admin';
import BookingsList from './pages/BookingsList';
import CalendarPage from './pages/Calendar';
import SalesPage from './pages/Sales';
import RankingPage from './pages/Ranking';
import SmartStats from './pages/SmartStats';
import BusinessAnalysis from './pages/BusinessAnalysis';
import SuperAdminDashboard from './pages/SuperAdminDashboard';
import AIChatFloating from './components/AIChatFloating';
import { ArgentinaLogo } from './components/ArgentinaLogo';
import { Button } from './components/Button';
import { Modal } from './components/Modal';
import { ConfirmModal } from './components/ConfirmModal';
import { cn } from './lib/utils';
import { dataService } from './services/dataService';
import { User } from './types';

type Page = 'dashboard' | 'bookings' | 'calendar' | 'sales' | 'admin' | 'ranking' | 'stats';

export default function App() {
  const [currentPage, setCurrentPage] = useState<Page>('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [showSplash, setShowSplash] = useState(false);
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginType, setLoginType] = useState<'client' | 'admin'>('client');
  const [customLogo, setCustomLogo] = useState<string | null>(localStorage.getItem('golazo_custom_logo'));
  const [isLogoModalOpen, setIsLogoModalOpen] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  useEffect(() => {
    const currentUser = dataService.getCurrentUser();
    if (currentUser) setUser(currentUser);

    const handleStorageChange = () => {
      setCustomLogo(localStorage.getItem('golazo_custom_logo'));
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setCustomLogo(base64String);
        localStorage.setItem('golazo_custom_logo', base64String);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    if (!loginIdentifier) return;
    
    try {
      const newUser = await dataService.login(loginIdentifier, loginType === 'admin' ? loginPassword : undefined);
      
      // Show splash screen presentation
      setShowSplash(true);
      
      // After presentation, set user and hide splash
      setTimeout(() => {
        setUser(newUser);
        setShowSplash(false);
      }, 2500);
    } catch (error) {
      setLoginError(error instanceof Error ? error.message : 'Error al iniciar sesión');
    }
  };

  const handleLogout = () => {
    dataService.logout();
    setUser(null);
    setCurrentPage('dashboard');
  };

  const navItems = [
    { id: 'dashboard', label: 'Inicio', icon: Home, roles: ['admin', 'client'] },
    { id: 'bookings', label: 'Reservas', icon: CalendarIcon, roles: ['admin', 'client'] },
    { id: 'calendar', label: 'Calendario', icon: CalendarIcon, roles: ['admin', 'client'] },
    { id: 'ranking', label: 'Ranking', icon: Trophy, roles: ['admin', 'client'] },
    { id: 'stats', label: 'Estadísticas', icon: BarChart3, roles: ['admin'] },
    { id: 'sales', label: 'Ventas', icon: ShoppingBag, roles: ['admin'] },
    { id: 'admin', label: 'Configuración', icon: Settings, roles: ['admin'] },
  ];

  const filteredNavItems = navItems.filter(item => item.roles.includes(user?.role || ''));

  const BACKGROUND_IMAGES = [
    "https://iili.io/q6oJgJ2.jpg", // Imagen proporcionada por el usuario 1
  ];

  const bgImage = BACKGROUND_IMAGES[0];

  useEffect(() => {
    // No rotation needed
  }, []);

  if (showSplash) {
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-6 relative overflow-hidden">
        <motion.div 
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 1.1 }}
          className="flex flex-col items-center gap-8 text-center"
        >
          <div className="relative">
            <motion.div
              animate={{ 
                scale: [1, 1.1, 1],
                rotate: [0, 5, -5, 0]
              }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            >
              <ArgentinaLogo size="lg" />
            </motion.div>
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: "100%" }}
              transition={{ duration: 2, ease: "easeInOut" }}
              className="absolute -bottom-4 left-0 h-1 bg-gradient-to-r from-sky-400 via-white to-sky-400 rounded-full"
            />
          </div>
          
          <div className="space-y-2">
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="text-white text-4xl md:text-6xl font-black tracking-tighter"
            >
              GOLAZO
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1 }}
              className="text-sky-400 font-black tracking-[0.5em] uppercase text-xs"
            >
              Te da la bienvenida
            </motion.p>
          </div>
        </motion.div>

        {/* Decorative elements */}
        <div className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden">
          <div className="absolute -top-24 -left-24 w-96 h-96 bg-sky-500/20 rounded-full blur-[120px]" />
          <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-sky-500/20 rounded-full blur-[120px]" />
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-zinc-50 flex items-center justify-start p-6 md:p-12 lg:p-24 relative overflow-hidden">
        {/* Background Image - Campeones del Mundo 2022 (Rotativo) */}
        <div className="absolute inset-0 z-0">
          <AnimatePresence mode="wait">
            <motion.img 
              key={bgImage}
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.6 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1 }}
              src={bgImage} 
              alt="Campeones del Mundo 2022" 
              className="w-full h-full object-cover grayscale-[0.2] contrast-125"
              referrerPolicy="no-referrer"
            />
          </AnimatePresence>
          <div className="absolute inset-0 bg-black/20" />
        </div>

        {/* Top Header */}
        <div className="absolute top-12 left-0 right-0 flex justify-center z-20">
           <h2 className="text-sky-400 font-black tracking-[0.4em] text-[10px] uppercase bg-sky-500/10 px-6 py-2 rounded-full border border-sky-500/20 backdrop-blur-md">
             BIENVENIDO A GOLAZO
           </h2>
        </div>

        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          className="w-full max-w-md bg-white/20 backdrop-blur-xl rounded-[48px] p-10 shadow-2xl border border-white/20 relative z-10"
        >
          <div className="flex flex-col items-center mb-10">
            <ArgentinaLogo size="lg" />
            <p className="text-zinc-700 font-black mt-4 tracking-[0.3em] uppercase text-[9px]">Gestión de Canchas</p>
          </div>

          <div className="flex bg-white/30 backdrop-blur-md p-1 rounded-2xl mb-8 border border-white/20">
            <button 
              onClick={() => { setLoginType('client'); setLoginError(null); }}
              className={cn(
                "flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                loginType === 'client' ? "bg-white text-zinc-900 shadow-lg" : "text-zinc-700 hover:bg-white/20"
              )}
            >
              Cliente
            </button>
            <button 
              onClick={() => { setLoginType('admin'); setLoginError(null); }}
              className={cn(
                "flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                loginType === 'admin' ? "bg-white text-zinc-900 shadow-lg" : "text-zinc-700 hover:bg-white/20"
              )}
            >
              Admin
            </button>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-zinc-700 uppercase tracking-[0.2em] ml-1">
                  {loginType === 'client' ? 'Email o Teléfono' : 'Email de Administrador'}
                </label>
                <div className="relative">
                  <UserIcon className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
                  <input 
                    type="text" 
                    required
                    placeholder={loginType === 'client' ? "ej@gmail.com o 11..." : "admin@gmail.com"}
                    className="w-full pl-14 pr-6 py-5 bg-zinc-50/80 border border-zinc-200 text-zinc-900 rounded-3xl focus:ring-2 focus:ring-sky-500 outline-none transition-all placeholder:text-zinc-400"
                    value={loginIdentifier}
                    onChange={e => setLoginIdentifier(e.target.value)}
                  />
                </div>
              </div>

              {loginType === 'admin' && (
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-zinc-700 uppercase tracking-[0.2em] ml-1">Contraseña</label>
                  <div className="relative">
                    <ShieldCheck className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
                    <input 
                      type="password" 
                      required
                      placeholder="••••••••"
                      className="w-full pl-14 pr-6 py-5 bg-zinc-50/80 border border-zinc-200 text-zinc-900 rounded-3xl focus:ring-2 focus:ring-sky-500 outline-none transition-all"
                      value={loginPassword}
                      onChange={e => setLoginPassword(e.target.value)}
                    />
                  </div>
                </div>
              )}

              {loginError && (
                <p className="text-red-500 text-[10px] font-black uppercase tracking-widest text-center bg-red-500/10 py-2 rounded-xl border border-red-500/20">
                  {loginError}
                </p>
              )}
            </div>

            <Button type="submit" className="w-full py-6 text-lg font-black tracking-widest shadow-2xl shadow-sky-500/20 rounded-[24px] bg-argentina text-zinc-900">
              ENTRAR
            </Button>

            {loginType === 'admin' && (
              <p className="text-[9px] text-zinc-700 font-bold uppercase tracking-widest text-center">
                Usa admin@gmail.com / admin123 <br />
                Super Admin: superman@gmail.com
              </p>
            )}
          </form>
        </motion.div>
      </div>
    );
  }

  if (user.role === 'superadmin') {
    return (
      <>
        <SuperAdminDashboard />
        <div className="fixed bottom-8 right-8 z-50">
          <Button 
            onClick={handleLogout}
            className="bg-red-500 hover:bg-red-600 text-white rounded-2xl px-6 py-4 shadow-xl shadow-red-500/20 flex items-center gap-3 font-black uppercase tracking-widest text-xs"
          >
            <LogOut className="w-5 h-5" />
            Cerrar Sesión Global
          </Button>
        </div>
        <Toaster position="top-center" richColors />
      </>
    );
  }

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard': return <Dashboard user={user} onNavigate={(page) => setCurrentPage(page as Page)} />;
      case 'bookings': return <BookingsList user={user} />;
      case 'calendar': return <CalendarPage user={user} />;
      case 'ranking': return <RankingPage user={user} />;
      case 'stats': return <SmartStats />;
      case 'sales': return <SalesPage />;
      case 'admin': return user.role === 'admin' ? <Admin onLogout={handleLogout} /> : <Dashboard user={user} onNavigate={(page) => setCurrentPage(page as Page)} />;
      default: return <Dashboard user={user} onNavigate={(page) => setCurrentPage(page as Page)} />;
    }
  };

  return (
    <div className="h-screen flex flex-col lg:flex-row bg-zinc-50 text-zinc-900 overflow-hidden">
      {/* Sidebar / Desktop Nav */}
      <aside className="z-40 hidden lg:flex flex-col shrink-0 fixed left-0 top-0 h-screen w-56 bg-slate-900 border-r border-slate-800 shadow-xl transition-all duration-300">
        <div className="p-4 flex justify-center">
          <div className="relative group block w-24">
            {user.role === 'admin' && (
              <input 
                type="file" 
                id="logo-upload-sidebar" 
                className="hidden" 
                onChange={handleLogoUpload} 
                accept="image/*" 
              />
            )}
            <div 
              onClick={() => setIsLogoModalOpen(true)}
              className={cn(
                "w-24 h-24 rounded-[32px] border-2 flex flex-col items-center justify-center transition-all overflow-hidden bg-white shadow-2xl relative group/logo cursor-pointer",
                customLogo 
                  ? "border-transparent" 
                  : "border-sky-400/30 hover:border-sky-500"
              )}
            >
              {customLogo ? (
                <img src={customLogo} alt="Logo" className="w-full h-full object-contain p-2" />
              ) : (
                <div className="flex flex-col items-center justify-center p-2">
                  <ArgentinaLogo size="md" showText={false} className="scale-110" />
                  <p className="text-[7px] font-black text-sky-600 uppercase tracking-widest text-center mt-1">
                    {user.role === 'admin' ? 'CONFIGURAR' : 'GOLAZO'}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        <nav className="flex-1 px-3 space-y-1.5">
          {filteredNavItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setCurrentPage(item.id as Page)}
              className={cn(
                "w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl font-bold transition-all shrink-0 border-2 relative overflow-hidden group",
                currentPage === item.id 
                  ? "text-white border-sky-400 shadow-lg" 
                  : "text-slate-400 hover:bg-slate-800 hover:text-white border-transparent hover:border-slate-700"
              )}
            >
              {currentPage === item.id && (
                <div className="absolute inset-0 opacity-30 pointer-events-none" style={{ background: 'var(--bg-flag-ar)' }} />
              )}
              {currentPage === item.id && (
                <div className="w-3 h-2.5 rounded-[2px] overflow-hidden flex flex-col shadow-sm shrink-0 relative z-10">
                  <div className="h-1/3 bg-[#74acdf]" />
                  <div className="h-1/3 bg-white flex items-center justify-center">
                    <div className="w-0.5 h-0.5 rounded-full bg-yellow-400" />
                  </div>
                  <div className="h-1/3 bg-[#74acdf]" />
                </div>
              )}
              <item.icon className={cn(
                "w-4.5 h-4.5 relative z-10",
                currentPage === item.id ? "text-white" : "text-slate-500 group-hover:text-white"
              )} />
              <span className="relative z-10 uppercase tracking-tighter text-xs">{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="mt-auto p-4 border-t border-slate-800 shrink-0 bg-inherit">
          {user.role !== 'admin' ? (
            <button 
              onClick={() => setIsLogoutModalOpen(true)}
              className="w-full px-4 py-3 rounded-2xl hover:bg-slate-800 transition-all group flex items-center justify-center"
            >
              <ArgentinaLogo size="sm" className="transition-all" />
            </button>
          ) : (
            <div className="px-4 py-3 flex items-center justify-center">
              <ArgentinaLogo size="sm" />
            </div>
          )}
        </div>
      </aside>

      {/* Mobile Nav */}
      <header className="lg:hidden fixed top-0 left-0 right-0 border-b px-6 py-4 flex items-center justify-between z-40 bg-sky-50 border-sky-100 shadow-lg">
        <div className="flex items-center gap-3">
          {customLogo ? (
            <div className="flex items-center gap-3">
              <img src={customLogo} alt="Logo" className="w-10 h-10 object-cover rounded-xl border border-zinc-100 shadow-sm" />
              <div className="flex flex-col">
                <span className="text-xs font-black text-zinc-400 uppercase tracking-widest leading-none mb-1">App</span>
                <span className="text-xl font-black tracking-tighter text-zinc-900 leading-none">GOLAZO</span>
              </div>
            </div>
          ) : (
            <ArgentinaLogo size="md" />
          )}
        </div>
        <button 
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="p-2 hover:bg-zinc-100 rounded-xl transition-colors"
        >
          {isMobileMenuOpen ? <X className="w-6 h-6 text-zinc-900" /> : <Menu className="w-6 h-6 text-zinc-900" />}
        </button>
      </header>

      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileMenuOpen(false)}
              className="lg:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
            />
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="lg:hidden fixed inset-x-4 top-[80px] z-50 p-6 space-y-4 rounded-[32px] shadow-2xl border bg-sky-50 border-sky-200 max-h-[calc(100vh-120px)] overflow-y-auto scrollbar-thin scrollbar-thumb-zinc-200"
            >
            {filteredNavItems.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  setCurrentPage(item.id as Page);
                  setIsMobileMenuOpen(false);
                }}
                className={cn(
                  "w-full flex items-center gap-3 px-6 py-4 rounded-2xl font-bold text-lg transition-all relative overflow-hidden",
                  currentPage === item.id 
                    ? "text-zinc-900 shadow-lg shadow-sky-500/20 border-2 border-sky-400" 
                    : "text-zinc-500 hover:bg-zinc-100"
                )}
              >
                {currentPage === item.id && (
                  <div className="absolute inset-0 opacity-30 pointer-events-none" style={{ background: 'var(--bg-flag-ar)' }} />
                )}
                {currentPage === item.id && (
                  <div className="w-5 h-4 rounded-[2px] overflow-hidden flex flex-col shadow-sm shrink-0 relative z-10">
                    <div className="h-1/3 bg-[#74acdf]" />
                    <div className="h-1/3 bg-white flex items-center justify-center">
                      <div className="w-0.5 h-0.5 rounded-full bg-yellow-400" />
                    </div>
                    <div className="h-1/3 bg-[#74acdf]" />
                  </div>
                )}
                <item.icon className={cn("w-6 h-6 relative z-10", currentPage === item.id ? "text-zinc-900" : "text-zinc-400")} />
                <span className="relative z-10 uppercase tracking-tighter">{item.label}</span>
              </button>
            ))}
            <div className="pt-4 border-t border-zinc-200 space-y-2">
              <Button 
                variant="ghost" 
                className="w-full justify-start gap-4 py-4 text-red-500"
                onClick={handleLogout}
              >
                <LogOut className="w-6 h-6" />
                Cerrar Sesión
              </Button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>

      {/* Main Content */}
      <main className="flex-1 lg:ml-56 pt-24 lg:pt-0 p-4 sm:p-6 lg:p-8 w-full relative h-screen overflow-y-auto custom-scrollbar">
        <div className="max-w-[1400px] mx-auto w-full">
          <motion.div
            key={currentPage}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
          >
            {renderPage()}
          </motion.div>
        </div>
      </main>

      {user.role === 'admin' && <AIChatFloating />}
      
      {/* Logo Viewer Modal */}
      <Modal
        isOpen={isLogoModalOpen}
        onClose={() => setIsLogoModalOpen(false)}
        title="Logo del Complejo"
        className="max-w-md"
      >
        <div className="space-y-6">
          <div className="aspect-square w-full rounded-[40px] overflow-hidden bg-zinc-100 border border-zinc-200 shadow-inner flex items-center justify-center">
            {customLogo ? (
              <img src={customLogo} alt="Logo Complejo" className="w-full h-full object-contain p-4" />
            ) : (
              <div className="flex flex-col items-center gap-4 text-zinc-400">
                <ImageIcon className="w-16 h-16 opacity-20" />
                <p className="font-black uppercase tracking-widest text-xs">Sin logo personalizado</p>
              </div>
            )}
          </div>
          
          <div className="flex flex-col gap-3">
            {user.role === 'admin' && (
              <Button 
                onClick={() => {
                  document.getElementById('logo-upload-sidebar')?.click();
                  setIsLogoModalOpen(false);
                }}
                className="w-full py-5 rounded-3xl font-black tracking-widest uppercase gap-3"
              >
                <Upload className="w-5 h-5" />
                Cambiar Imagen
              </Button>
            )}
            <Button 
              variant="outline" 
              onClick={() => setIsLogoModalOpen(false)}
              className="w-full py-5 rounded-3xl font-black tracking-widest uppercase border-zinc-200"
            >
              Cerrar
            </Button>
          </div>
        </div>
      </Modal>

      <Toaster position="top-center" richColors />

      <ConfirmModal
        isOpen={isLogoutModalOpen}
        onClose={() => setIsLogoutModalOpen(false)}
        onConfirm={handleLogout}
        title="Cerrar Sesión"
        message="¿Estás seguro que deseas cerrar la sesión?"
        confirmText="Cerrar Sesión"
        cancelText="Cancelar"
      />
    </div>
  );
}
