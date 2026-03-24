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
  Star
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Toaster } from 'sonner';
import Dashboard from './pages/Dashboard';
import Admin from './pages/Admin';
import BookingsList from './pages/BookingsList';
import CalendarPage from './pages/Calendar';
import SalesPage from './pages/Sales';
import RankingPage from './pages/Ranking';
import StatsPage from './pages/Stats';
import AIChatFloating from './components/AIChatFloating';
import { ArgentinaLogo } from './components/ArgentinaLogo';
import { Button } from './components/Button';
import { Modal } from './components/Modal';
import { cn } from './lib/utils';
import { dataService } from './services/dataService';
import { User } from './types';

type Page = 'dashboard' | 'bookings' | 'calendar' | 'sales' | 'admin' | 'ranking' | 'stats';

export default function App() {
  const [currentPage, setCurrentPage] = useState<Page>('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [showSplash, setShowSplash] = useState(false);
  const [loginEmail, setLoginEmail] = useState('');
  const [customLogo, setCustomLogo] = useState<string | null>(localStorage.getItem('golazo_custom_logo'));
  const [isLogoModalOpen, setIsLogoModalOpen] = useState(false);

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

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginEmail) return;
    const newUser = dataService.login(loginEmail);
    
    // Show splash screen presentation
    setShowSplash(true);
    
    // After presentation, set user and hide splash
    setTimeout(() => {
      setUser(newUser);
      setShowSplash(false);
    }, 2500);
  };

  const handleLogout = () => {
    dataService.logout();
    setUser(null);
    setCurrentPage('dashboard');
  };

  const navItems = [
    { id: 'dashboard', label: 'INICIO', icon: Home, roles: ['admin', 'client'] },
    { id: 'bookings', label: 'Mis Reservas', icon: CalendarIcon, roles: ['admin', 'client'] },
    { id: 'calendar', label: 'Calendario', icon: CalendarIcon, roles: ['admin', 'client'] },
    { id: 'ranking', label: 'Ranking & Puntos', icon: Trophy, roles: ['admin', 'client'] },
    { id: 'stats', label: 'Estadísticas', icon: BarChart3, roles: ['admin'] },
    { id: 'sales', label: 'Ventas/Bar', icon: ShoppingBag, roles: ['admin'] },
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
      <div className="min-h-screen bg-zinc-50 flex items-center justify-center p-6 relative overflow-hidden">
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

          <form onSubmit={handleLogin} className="space-y-8">
            <div className="space-y-3">
              <label className="text-[10px] font-black text-zinc-700 uppercase tracking-[0.2em] ml-1">Tu Email</label>
              <div className="relative">
                <UserIcon className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
                <input 
                  type="email" 
                  required
                  placeholder="admin@gmail.com"
                  className="w-full pl-14 pr-6 py-5 bg-zinc-50 border border-zinc-200 text-zinc-900 rounded-3xl focus:ring-2 focus:ring-sky-500 outline-none transition-all placeholder:text-zinc-400"
                  value={loginEmail}
                  onChange={e => setLoginEmail(e.target.value)}
                />
              </div>
              <p className="text-[9px] text-zinc-700 font-bold uppercase tracking-widest mt-3 ml-1 text-center">
                Usa admin@gmail.com para panel de control
              </p>
            </div>

            <Button type="submit" className="w-full py-6 text-lg font-black tracking-widest shadow-2xl shadow-sky-500/20 rounded-[24px] bg-argentina text-zinc-900">
              ENTRAR
            </Button>
          </form>
        </motion.div>
      </div>
    );
  }

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard': return <Dashboard user={user} />;
      case 'bookings': return <BookingsList user={user} />;
      case 'calendar': return <CalendarPage user={user} />;
      case 'ranking': return <RankingPage user={user} />;
      case 'stats': return <StatsPage />;
      case 'sales': return <SalesPage />;
      case 'admin': return user.role === 'admin' ? <Admin /> : <Dashboard user={user} />;
      default: return <Dashboard user={user} />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-zinc-50 text-zinc-900 overflow-x-hidden">
      {/* Sidebar / Desktop Nav */}
      <aside className="z-40 hidden lg:flex flex-col shrink-0 fixed left-0 top-0 bottom-0 w-64 bg-zinc-50 border-r border-zinc-200 shadow-xl">
        <div className="p-4 flex justify-center">
          <div className="relative group block w-32">
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
                "w-32 h-32 rounded-3xl border-2 flex flex-col items-center justify-center transition-all overflow-hidden bg-white shadow-sm relative group/logo cursor-pointer",
                customLogo 
                  ? "border-transparent" 
                  : "border-zinc-200 hover:border-sky-500/50 hover:bg-sky-500/5"
              )}
            >
              {customLogo ? (
                <>
                  <img src={customLogo} alt="Logo" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/logo:opacity-100 flex flex-col items-center justify-center transition-opacity gap-2">
                    <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center">
                      <ImageIcon className="w-5 h-5 text-white" />
                    </div>
                    <p className="text-[10px] font-black text-white uppercase tracking-widest">Ver Logo</p>
                  </div>
                </>
              ) : (
                <>
                  <div className="w-12 h-12 rounded-2xl bg-zinc-50 flex items-center justify-center mb-3 group-hover/logo:scale-110 transition-transform">
                    <ImageIcon className="w-6 h-6 text-zinc-400" />
                  </div>
                  <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest text-center px-4">
                    {user.role === 'admin' ? 'Configura tu logo' : 'Sin logo configurado'}
                  </p>
                </>
              )}
            </div>
            
            {user.role === 'admin' && (
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  document.getElementById('logo-upload-sidebar')?.click();
                }}
                className="absolute -bottom-2 -right-2 w-10 h-10 bg-argentina text-zinc-900 rounded-2xl shadow-lg flex items-center justify-center hover:scale-110 transition-transform z-10 border-4 border-zinc-50"
                title="Cambiar Logo"
              >
                <Upload className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        <nav className="flex-1 px-4 space-y-2 overflow-y-auto scrollbar-thin scrollbar-thumb-zinc-200">
          {filteredNavItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setCurrentPage(item.id as Page)}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3 rounded-2xl font-bold transition-all shrink-0 border-2 relative overflow-hidden group",
                currentPage === item.id 
                  ? "text-zinc-900 border-sky-400 shadow-lg" 
                  : "text-zinc-500 hover:bg-white hover:text-zinc-900 border-transparent hover:border-zinc-100"
              )}
            >
              {currentPage === item.id && (
                <div className="absolute inset-0 opacity-30 pointer-events-none" style={{ background: 'var(--bg-flag-ar)' }} />
              )}
              {currentPage === item.id && (
                <div className="w-4 h-3 rounded-[2px] overflow-hidden flex flex-col shadow-sm shrink-0 relative z-10">
                  <div className="h-1/3 bg-[#74acdf]" />
                  <div className="h-1/3 bg-white flex items-center justify-center">
                    <div className="w-0.5 h-0.5 rounded-full bg-yellow-400" />
                  </div>
                  <div className="h-1/3 bg-[#74acdf]" />
                </div>
              )}
              <item.icon className={cn(
                "w-5 h-5 relative z-10",
                currentPage === item.id ? "text-zinc-900" : "text-zinc-400 group-hover:text-zinc-900"
              )} />
              <span className="relative z-10 uppercase tracking-tighter text-sm">{item.label}</span>
              {currentPage === item.id && (
                <motion.div 
                  layoutId="active-pill"
                  className="ml-auto w-1.5 h-1.5 rounded-full bg-zinc-900 relative z-10"
                />
              )}
            </button>
          ))}
        </nav>

        <div className="p-4 space-y-2 border-t border-zinc-200 shrink-0 bg-inherit">
          {/* Logo Golazo moved here */}
          <div className="px-4 py-3 opacity-60 hover:opacity-100 transition-all cursor-default mb-2">
            <ArgentinaLogo size="sm" />
          </div>

          <div className="px-4 py-3 flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-zinc-100 flex items-center justify-center">
              <UserIcon className="w-4 h-4 text-zinc-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold truncate text-zinc-900">{user.name}</p>
              <p className="text-[10px] uppercase tracking-widest text-zinc-400 font-black flex items-center gap-1">
                {user.role === 'admin' && <ShieldCheck className="w-3 h-3 text-sky-500" />}
                {user.role}
              </p>
            </div>
          </div>
          <Button 
            variant="ghost" 
            className="w-full justify-start gap-3 text-red-500 hover:bg-red-500/10"
            onClick={handleLogout}
          >
            <LogOut className="w-5 h-5" />
            Cerrar Sesión
          </Button>
        </div>
      </aside>

      {/* Mobile Nav */}
      <header className="lg:hidden fixed top-0 left-0 right-0 border-b px-6 py-4 flex items-center justify-between z-40 bg-white border-zinc-900 shadow-lg">
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
              className="lg:hidden fixed inset-x-4 top-[80px] z-50 p-6 space-y-4 rounded-[32px] shadow-2xl border bg-white border-zinc-900 max-h-[calc(100vh-120px)] overflow-y-auto scrollbar-thin scrollbar-thumb-zinc-200"
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
      <main className="flex-1 lg:ml-64 pt-24 lg:pt-0 p-6 lg:p-10 w-full max-w-full relative">
        <motion.div
          key={currentPage}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
        >
          {renderPage()}
        </motion.div>
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
    </div>
  );
}
