import React, { useState, useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { format, addHours, isSameDay, startOfMonth, endOfMonth, startOfWeek, addDays, eachDayOfInterval } from 'date-fns';
import { es } from 'date-fns/locale';
import { DayPicker } from 'react-day-picker';
import { 
  Calendar as CalendarIcon, 
  Plus, 
  ChevronLeft, 
  ChevronRight, 
  Clock, 
  MapPin, 
  Phone, 
  User, 
  TrendingUp, 
  DollarSign, 
  Users, 
  Activity,
  Trophy,
  LayoutGrid,
  List,
  Maximize2,
  Minimize2,
  Share2,
  Upload,
  Image as ImageIcon,
  CheckCircle2,
  FileText,
  Download,
  Timer,
  Zap
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { domToPng } from 'modern-screenshot';
import { Button } from '../components/Button';
import { Card, CardContent, CardHeader } from '../components/Card';
import { Modal } from '../components/Modal';
import { Badge } from '../components/Badge';
import ArgentinaCountdown from '../components/ArgentinaCountdown';
import { ArgentinaLogo } from '../components/ArgentinaLogo';
import { dataService, api } from '../services/dataService';
import { Pitch, Booking, User as UserType, Sale } from '../types';
import { cn } from '../lib/utils';

interface DashboardProps {
  user: UserType;
  onNavigate?: (page: string) => void;
  onLogout?: () => void;
}

export default function Dashboard({ user, onNavigate, onLogout }: DashboardProps) {
  const [pitches, setPitches] = useState<Pitch[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [bookingTimer, setBookingTimer] = useState<number | null>(null);
  const [selectedPitch, setSelectedPitch] = useState<Pitch | null>(null);
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [viewMode, setViewMode] = useState<'day' | 'week'>('day');
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [isBookingDetailModalOpen, setIsBookingDetailModalOpen] = useState(false);
  const [isPitchScheduleModalOpen, setIsPitchScheduleModalOpen] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const gridRef = useRef<HTMLDivElement>(null);
  
  const [formData, setFormData] = useState({
    clientName: user.role === 'client' ? user.name : '',
    clientPhone: '',
    receipt: null as string | null,
    depositAmount: ''
  });

  const [userPoints, setUserPoints] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      const p = await dataService.getPitches();
      const b = await dataService.getBookings();
      const s = await dataService.getSales();
      const points = await dataService.getUserPoints(user.id);
      
      setPitches(p);
      setBookings(b);
      setSales(s);
      setUserPoints(points);
    };
    fetchData();
  }, [selectedDate, user.id]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isBookingModalOpen && bookingTimer !== null && bookingTimer > 0) {
      interval = setInterval(() => {
        setBookingTimer(prev => (prev !== null ? prev - 1 : null));
      }, 1000);
    } else if (isBookingModalOpen && bookingTimer === 0) {
      setIsBookingModalOpen(false);
      setBookingTimer(null);
      toast.error("Tiempo de reserva agotado. El turno ha sido liberado.");
    }
    return () => clearInterval(interval);
  }, [isBookingModalOpen, bookingTimer]);

  useEffect(() => {
    if (!isBookingModalOpen) {
      setBookingTimer(null);
    }
  }, [isBookingModalOpen]);

  const handleBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPitch || !selectedTime) return;

    if (!formData.receipt) {
      alert('Por favor, carga el comprobante de la seña.');
      return;
    }

    const [h, m] = selectedTime.split(':').map(Number);
    const startTime = new Date(selectedDate);
    startTime.setHours(h, m, 0, 0);
    const endTime = addHours(startTime, 1);

    try {
      const isPromo = h >= 10 && h <= 16;
      const points = isPromo ? 1.5 : 1;

      await api.addBooking({
        pitchId: selectedPitch.id,
        userId: user.id,
        clientName: formData.clientName,
        clientPhone: formData.clientPhone,
        startTime,
        endTime,
        status: 'confirmed',
        receiptUrl: formData.receipt,
        depositAmount: Number(formData.depositAmount) || 0
      });
      const updatedBookings = await dataService.getBookings();
      setBookings(updatedBookings);
      const updatedPoints = await dataService.getUserPoints(user.id);
      setUserPoints(updatedPoints);
      setIsBookingModalOpen(false);
      setFormData({ 
        clientName: user.role === 'client' ? user.name : '', 
        clientPhone: '', 
        receipt: null, 
        depositAmount: '' 
      });
      
      toast.success('¡Reserva confirmada!', {
        description: isPromo 
          ? `¡Sumaste +${points} puntos por horario promocional! 🔥`
          : `¡Sumaste +${points} puntos!`,
      });
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Check file size (limit to 2MB for localStorage safety)
      if (file.size > 2 * 1024 * 1024) {
        alert('El archivo es muy pesado (máximo 2MB). Por favor, sube una imagen más pequeña o un PDF liviano.');
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, receipt: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const shareAvailability = async () => {
    if (!gridRef.current) return;
    setIsSharing(true);
    try {
      const image = await domToPng(gridRef.current, {
        backgroundColor: '#09090b',
        scale: 2,
      });
      
      const link = document.createElement('a');
      link.download = `disponibilidad-${format(selectedDate, 'dd-MM-yyyy')}.png`;
      link.href = image;
      link.click();

      const availableSlots = pitches.map(p => {
        const slots = hours.filter(h => !bookings.some(b => 
          b.pitchId === p.id && 
          b.startTime.getHours() === h && 
          isSameDay(b.startTime, selectedDate) && 
          b.status === 'confirmed'
        )).map(h => `${h.toString().padStart(2, '0')}:00`);
        return `*${p.name}*: ${slots.join(', ')}`;
      }).join('\n');

      const text = encodeURIComponent(`⚽ *Disponibilidad Golazo - ${format(selectedDate, 'dd/MM/yyyy')}*\n\n${availableSlots}\n\n¡Reserva tu turno ahora!`);
      window.open(`https://wa.me/?text=${text}`, '_blank');
    } catch (error) {
      console.error('Error sharing:', error);
    } finally {
      setIsSharing(false);
    }
  };

  const getPitchStatus = (pitchId: string) => {
    const now = new Date();
    const currentBooking = bookings.find(b => 
      b.pitchId === pitchId && 
      now >= b.startTime && 
      now < b.endTime &&
      b.status === 'confirmed'
    );
    return currentBooking ? 'busy' : 'available';
  };

  // Metrics
  const todayBookings = bookings.filter(b => isSameDay(b.startTime, new Date()) && b.status === 'confirmed');
  const todayIncome = todayBookings.reduce((acc, b) => {
    const pitch = pitches.find(p => p.id === b.pitchId);
    return acc + (pitch?.price || 0);
  }, 0);

  const monthStart = startOfMonth(new Date());
  const monthEnd = endOfMonth(new Date());
  const monthBookings = bookings.filter(b => b.startTime >= monthStart && b.startTime <= monthEnd && b.status === 'confirmed');
  const monthIncome = monthBookings.reduce((acc, b) => {
    const pitch = pitches.find(p => p.id === b.pitchId);
    return acc + (pitch?.price || 0);
  }, 0);

  const occupiedPitchesCount = pitches.filter(p => getPitchStatus(p.id) === 'busy').length;

  const hours = Array.from({ length: 12 }, (_, i) => (i + 14) % 24); // 14:00 to 01:00 (starts at 00:00)

  const weekDays = eachDayOfInterval({
    start: startOfWeek(selectedDate, { weekStartsOn: 1 }),
    end: addDays(startOfWeek(selectedDate, { weekStartsOn: 1 }), 6)
  });

  const [weather, setWeather] = useState<{ temp: number; condition: string; icon: string; locationName: string }>({
    temp: 22,
    condition: 'Cargando...',
    icon: '⏳',
    locationName: 'Tu ubicación'
  });

  useEffect(() => {
    const fetchWeather = async (lat: number, lon: number) => {
      try {
        let city = 'Tu ubicación';
        try {
          // Fetch location name with a timeout or just handle failure
          const locResponse = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`, {
            headers: {
              'Accept-Language': 'es'
            }
          });
          if (locResponse.ok) {
            const locData = await locResponse.json();
            city = locData.address.city || locData.address.town || locData.address.village || 'Tu ubicación';
          }
        } catch (locError) {
          console.warn('Error fetching location name:', locError);
        }

        const response = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`);
        if (!response.ok) throw new Error(`Weather API responded with status: ${response.status}`);
        
        const data = await response.json();
        const current = data.current_weather;
        
        if (!current) throw new Error('No current weather data available');

        // Map WMO Weather interpretation codes (WW)
        const getCondition = (code: number) => {
          if (code === 0) return { text: 'Despejado', icon: '☀️' };
          if (code <= 3) return { text: 'Parcialmente Nublado', icon: '🌤️' };
          if (code <= 48) return { text: 'Niebla', icon: '🌫️' };
          if (code <= 55) return { text: 'Llovizna', icon: '🌦️' };
          if (code <= 65) return { text: 'Lluvia', icon: '🌧️' };
          if (code <= 75) return { text: 'Nieve', icon: '❄️' };
          if (code <= 82) return { text: 'Chubascos', icon: '🌦️' };
          if (code <= 99) return { text: 'Tormenta', icon: '⛈️' };
          return { text: 'Soleado', icon: '☀️' };
        };

        const { text, icon } = getCondition(current.weathercode);
        setWeather({
          temp: Math.round(current.temperature),
          condition: text,
          icon: icon,
          locationName: city
        });
      } catch (error) {
        // Fallback to a default state instead of logging an error
        setWeather({ 
          temp: 22, 
          condition: 'Soleado', 
          icon: '☀️', 
          locationName: 'Buenos Aires' 
        });
      }
    };

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          fetchWeather(position.coords.latitude, position.coords.longitude);
        },
        (error) => {
          console.error('Geolocation error:', error);
          // Fallback to Buenos Aires
          fetchWeather(-34.6037, -58.3816);
        }
      );
    } else {
      // Fallback to Buenos Aires
      fetchWeather(-34.6037, -58.3816);
    }
  }, []);

  if (user.role === 'client') {
    return (
      <div className="space-y-8 pb-20 max-w-4xl mx-auto">
        <header className="flex flex-col gap-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-4">
                <div className="md:hidden">
                  <ArgentinaLogo size="sm" showText={true} />
                </div>
                <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-zinc-900 tracking-tighter uppercase italic">INICIO</h1>
              </div>
              <div className="flex flex-col">
                <p className="text-zinc-500 font-bold text-lg italic">¡Hola, {user.name}! 👋</p>
                <p className="text-zinc-400 text-[10px] font-black uppercase tracking-[0.3em]">Panel de Jugador</p>
              </div>
            </div>
          </div>
        </header>

        <section className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <button 
              onClick={() => onNavigate && onNavigate('calendar')}
              className="w-full text-left bg-gradient-to-br from-sky-500 to-blue-600 p-6 rounded-[24px] shadow-lg shadow-sky-500/20 hover:scale-[1.02] transition-all group relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
              <CalendarIcon className="w-8 h-8 text-white mb-4" />
              <h3 className="text-2xl font-black text-white tracking-tighter uppercase italic">Reservar Cancha</h3>
              <p className="text-sky-100 text-xs font-bold mt-1">Ver horarios disponibles</p>
            </button>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <button 
              onClick={() => onNavigate && onNavigate('bookings')}
              className="w-full text-left bg-white p-6 rounded-[24px] shadow-sm border border-zinc-100 hover:border-sky-200 hover:shadow-md transition-all group relative overflow-hidden"
            >
              <List className="w-8 h-8 text-sky-500 mb-4" />
              <h3 className="text-2xl font-black text-zinc-900 tracking-tighter uppercase italic">Mis Reservas</h3>
              <p className="text-zinc-500 text-xs font-bold mt-1">Ver historial y próximas</p>
            </button>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <button 
              onClick={() => onNavigate && onNavigate('ranking')}
              className="w-full text-left bg-white p-6 rounded-[24px] shadow-sm border border-zinc-100 hover:border-yellow-200 hover:shadow-md transition-all group relative overflow-hidden"
            >
              <Trophy className="w-8 h-8 text-yellow-500 mb-4" />
              <h3 className="text-2xl font-black text-zinc-900 tracking-tighter uppercase italic">Ranking</h3>
              <p className="text-zinc-500 text-xs font-bold mt-1">Mis puntos: {userPoints}</p>
            </button>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
            <button 
              onClick={() => onLogout && onLogout()}
              className="w-full text-left bg-red-50 p-6 rounded-[24px] shadow-sm border border-red-100 hover:bg-red-100 transition-all group relative overflow-hidden"
            >
              <User className="w-8 h-8 text-red-500 mb-4" />
              <h3 className="text-2xl font-black text-red-700 tracking-tighter uppercase italic">Cerrar Sesión</h3>
              <p className="text-red-500/80 text-xs font-bold mt-1">Salir de la cuenta</p>
            </button>
          </motion.div>
        </section>
      </div>
    );
  }

  return (
    <div className="space-y-10 pb-20">
      {/* Welcome & Stats Section */}
      <header className="flex flex-col gap-10">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
          <div className="space-y-2">
            <div className="flex items-center gap-4">
              <div className="md:hidden">
                <ArgentinaLogo size="sm" showText={true} />
              </div>
              <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black text-zinc-900 tracking-tighter uppercase italic">INICIO</h1>
            </div>
            <div className="flex flex-col">
              <p className="text-zinc-500 font-bold text-lg italic">¡Hola, {user.name}! 👋</p>
              <p className="text-zinc-400 text-[10px] font-black uppercase tracking-[0.3em]">Panel de control Golazo • Gestión Profesional</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="hidden md:block">
              <ArgentinaLogo size="md" />
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-black text-zinc-900 tracking-tight uppercase italic flex items-center gap-3">
              <div className="w-2 h-8 bg-sky-500 rounded-full" />
              Resumen de Hoy
            </h2>
            <Badge variant="neutral" className="px-4 py-1.5 rounded-xl border-zinc-200 text-zinc-400 font-black text-[10px] uppercase tracking-widest">
              Actualizado hace 1 min
            </Badge>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { label: 'Turnos Hoy', value: todayBookings.length, icon: CalendarIcon, color: 'bg-blue-500', trend: '+12%', show: user.role === 'admin' },
              { label: 'Ingresos Hoy', value: `$${todayIncome}`, icon: DollarSign, color: 'bg-emerald-500', trend: '+8%', show: user.role === 'admin' },
              { label: 'Ingresos Mes', value: `$${monthIncome}`, icon: TrendingUp, color: 'bg-sky-500', trend: '+15%', show: user.role === 'admin' },
              { label: 'Canchas Ocupadas', value: `${occupiedPitchesCount}/${pitches.length}`, icon: Activity, color: 'bg-orange-500', trend: 'Estable', show: user.role === 'admin' },
            ].filter(s => s.show).map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
              >
                <Card className="border-none shadow-sm bg-white overflow-hidden group hover:scale-[1.02] transition-all rounded-[20px] relative border border-zinc-100">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className={cn("p-3 rounded-xl text-white shadow-md", stat.color)}>
                        <stat.icon className="w-5 h-5" />
                      </div>
                      <Badge variant="success" className="px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-tighter">
                        {stat.trend}
                      </Badge>
                    </div>
                    <div className="space-y-1">
                      <p className="text-zinc-400 font-black text-[9px] uppercase tracking-[0.2em]">{stat.label}</p>
                      <h3 className="text-2xl font-black text-zinc-900 tracking-tighter italic uppercase">{stat.value}</h3>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </section>
      </header>

      {/* Main Content Area: SaaS Premium Dashboard Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Column: Sidebar (3 columns) */}
        <aside className="lg:col-span-3 space-y-6 order-2 lg:order-1">
          <div className="bg-white p-6 rounded-[24px] shadow-sm border border-zinc-100">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-sm font-black text-zinc-900 uppercase tracking-widest flex items-center gap-2">
                <Clock className="w-4 h-4 text-sky-500" />
                Agenda Hoy
              </h3>
              <Badge variant="neutral" className="text-[9px] font-black uppercase tracking-widest bg-zinc-50 border-zinc-100">
                {format(selectedDate, 'dd/MM')}
              </Badge>
            </div>
            
            <div className="space-y-2 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
              {hours.map(hour => {
                const timeStr = `${hour.toString().padStart(2, '0')}:00`;
                const occupiedCount = bookings.filter(b => 
                  b.startTime.getHours() === hour && 
                  isSameDay(b.startTime, selectedDate) && 
                  b.status === 'confirmed'
                ).length;
                
                const isFullyOccupied = occupiedCount === pitches.length;

                return (
                  <div 
                    key={hour}
                    className={cn(
                      "flex items-center justify-between p-3 rounded-xl border transition-all",
                      isFullyOccupied 
                        ? "bg-red-50/50 border-red-100 text-red-700" 
                        : "bg-emerald-50/50 border-emerald-100 text-emerald-700"
                    )}
                  >
                    <span className="font-bold text-xs">{timeStr}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-[9px] font-black uppercase tracking-tighter opacity-70">
                        {occupiedCount}/{pitches.length}
                      </span>
                      <div className={cn(
                        "w-1.5 h-1.5 rounded-full",
                        isFullyOccupied ? "bg-red-500" : "bg-emerald-500"
                      )} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="bg-zinc-900 p-6 rounded-[24px] text-white shadow-xl relative overflow-hidden">
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-4">
                <Zap className="w-4 h-4 text-sky-400" />
                <span className="text-[10px] font-black uppercase tracking-widest">Ocupación</span>
              </div>
              <div className="text-3xl font-black italic tracking-tighter mb-1">
                {Math.round((bookings.filter(b => isSameDay(b.startTime, selectedDate)).length / (hours.length * pitches.length)) * 100)}%
              </div>
              <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden mt-3">
                <div 
                  className="h-full bg-sky-500 transition-all duration-1000" 
                  style={{ width: `${(bookings.filter(b => isSameDay(b.startTime, selectedDate)).length / (hours.length * pitches.length)) * 100}%` }}
                />
              </div>
            </div>
          </div>
        </aside>

        {/* Center Column: Main Content (6 columns) */}
        <main className="lg:col-span-6 space-y-8 order-1 lg:order-2">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-black text-zinc-900 tracking-tight uppercase italic flex items-center gap-3">
              <div className="w-1 h-5 bg-sky-500 rounded-full" />
              Canchas Disponibles
            </h2>
            <div className="flex items-center gap-2 bg-white p-1 rounded-xl border border-zinc-100 shadow-sm">
              <Button variant="ghost" size="sm" onClick={() => setSelectedDate(d => addDays(d, -1))} className="h-8 w-8 p-0 rounded-lg">
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <span className="px-2 text-[10px] font-black text-zinc-600 uppercase tracking-widest">
                {format(selectedDate, "d MMM", { locale: es })}
              </span>
              <Button variant="ghost" size="sm" onClick={() => setSelectedDate(d => addDays(d, 1))} className="h-8 w-8 p-0 rounded-lg">
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {pitches.map((pitch) => {
              const status = getPitchStatus(pitch.id);
              const pitchBookings = bookings.filter(b => b.pitchId === pitch.id && isSameDay(b.startTime, selectedDate) && b.status === 'confirmed');
              const occupancyPercentage = (pitchBookings.length / hours.length) * 100;

              return (
                <Card 
                  key={pitch.id}
                  className="border-none shadow-sm hover:shadow-md transition-all group bg-white rounded-[24px] overflow-hidden border border-zinc-100"
                >
                  <div className="h-40 relative overflow-hidden">
                    <img 
                      src={`https://picsum.photos/seed/${pitch.name}/600/400`} 
                      alt={pitch.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                    <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between">
                      <div>
                        <h3 className="font-black text-white text-lg uppercase italic tracking-tight leading-none">{pitch.name}</h3>
                        <p className="text-[9px] font-black text-white/60 uppercase tracking-widest mt-1">{pitch.type}</p>
                      </div>
                      <Badge 
                        variant={status === 'available' ? 'success' : 'danger'} 
                        className="px-2 py-0.5 rounded-lg text-[8px] font-black uppercase tracking-widest bg-white/10 backdrop-blur-md border-white/20 text-white"
                      >
                        {status === 'available' ? 'Libre' : 'En Juego'}
                      </Badge>
                    </div>
                  </div>

                  <CardContent className="p-5 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <DollarSign className="w-3.5 h-3.5 text-emerald-500" />
                        <span className="text-lg font-black text-zinc-900 tracking-tighter">${pitch.price}</span>
                        <span className="text-[9px] font-bold uppercase text-zinc-400">/ hr</span>
                      </div>
                      <div className="h-1.5 w-24 bg-zinc-100 rounded-full overflow-hidden">
                        <div 
                          className={cn(
                            "h-full transition-all duration-1000",
                            occupancyPercentage > 80 ? "bg-red-500" : occupancyPercentage > 40 ? "bg-orange-500" : "bg-emerald-500"
                          )} 
                          style={{ width: `${occupancyPercentage}%` }}
                        />
                      </div>
                    </div>

                    <Button 
                      className="w-full py-3 rounded-xl font-black text-[10px] tracking-widest uppercase bg-zinc-900 text-white hover:bg-zinc-800 transition-all"
                      onClick={() => {
                        setSelectedPitch(pitch);
                        setIsPitchScheduleModalOpen(true);
                      }}
                    >
                      Ver Horarios
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </main>

        {/* Right Column: Widgets (3 columns) */}
        <aside className="lg:col-span-3 space-y-6 order-3">
          {/* Weather Widget */}
          <div className="bg-white p-6 rounded-[24px] border border-zinc-100 shadow-sm flex flex-col items-center text-center">
            <div className="w-16 h-16 bg-sky-50 rounded-full flex items-center justify-center mb-4">
              <span className="text-4xl">{weather.icon}</span>
            </div>
            <div className="space-y-0.5">
              <h4 className="text-3xl font-black text-zinc-900 tracking-tighter">{weather.temp}°C</h4>
              <p className="text-[9px] font-black text-sky-500 uppercase tracking-widest">{weather.locationName}</p>
              <p className="text-[10px] font-bold text-zinc-400 mt-1">{weather.condition}</p>
            </div>
          </div>

          {/* World Cup Widget */}
          <div className="bg-white p-6 rounded-[24px] border border-zinc-100 shadow-sm space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <Trophy className="w-4 h-4 text-sky-500" />
              <h3 className="text-[10px] font-black text-zinc-900 uppercase tracking-widest">Mundial 2026</h3>
            </div>
            <ArgentinaCountdown />
          </div>

          {/* Quick Actions */}
          <div className="space-y-3">
            <Button 
              variant="outline" 
              className="w-full h-12 rounded-xl border-zinc-200 font-black text-[10px] uppercase tracking-widest gap-2"
              onClick={() => onNavigate ? onNavigate('calendar') : window.location.href = '/calendar'}
            >
              <CalendarIcon className="w-4 h-4" />
              Ir al Calendario
            </Button>
          </div>
        </aside>
      </div>

      {/* Pitch Schedule Modal (Time Selection Menu) */}
      <Modal
        isOpen={isPitchScheduleModalOpen}
        onClose={() => setIsPitchScheduleModalOpen(false)}
        title={selectedPitch ? `Agenda: ${selectedPitch.name}` : 'Seleccionar Horario'}
        className="max-w-lg"
      >
        <div className="space-y-6">
          {/* Pitch Info Header */}
          <div className="flex items-center justify-between p-4 bg-zinc-50 rounded-3xl border border-zinc-100">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-sky-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-sky-500/20">
                <Trophy className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-black text-zinc-900">{selectedPitch?.name}</h4>
                <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">{selectedPitch?.type} • ${selectedPitch?.price}/hr</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs font-black text-zinc-400 uppercase tracking-widest mb-1">Fecha</p>
              <p className="text-sm font-black text-sky-600">
                {format(selectedDate, "d 'de' MMM", { locale: es })}
              </p>
            </div>
          </div>

          {/* Legend */}
          <div className="flex items-center gap-4 px-2">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-sky-500" />
              <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Disponible</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500" />
              <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Ocupado</span>
            </div>
          </div>

          {/* Time Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {hours.map(hour => {
              const timeStr = `${hour.toString().padStart(2, '0')}:00`;
              const booking = bookings.find(b => 
                b.pitchId === selectedPitch?.id && 
                b.startTime.getHours() === hour &&
                isSameDay(b.startTime, selectedDate) &&
                b.status === 'confirmed'
              );
              const isBooked = !!booking;

              return (
                <button
                  key={hour}
                  onClick={() => {
                    if (isBooked) {
                      if (user.role === 'admin') {
                        setSelectedBooking(booking);
                        setIsBookingDetailModalOpen(true);
                      }
                    } else {
                      setSelectedTime(timeStr);
                      setIsPitchScheduleModalOpen(false);
                      setBookingTimer(300); // 5 minutes
                      setIsBookingModalOpen(true);
                    }
                  }}
                  className={cn(
                    "flex flex-col items-center justify-center py-5 rounded-3xl border-2 transition-all gap-1 relative overflow-hidden group/time",
                    isBooked 
                      ? (user.role === 'admin' 
                          ? "bg-red-50 border-red-100 text-red-600 hover:bg-red-500 hover:text-white" 
                          : "bg-zinc-50 border-zinc-100 text-zinc-300 cursor-not-allowed")
                      : "bg-white border-zinc-100 text-zinc-900 hover:border-sky-500 hover:bg-sky-50 hover:text-sky-600"
                  )}
                >
                  <span className="text-lg font-black">{timeStr}</span>
                  <span className={cn(
                    "text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full",
                    isBooked ? "bg-red-100 text-red-600" : "bg-sky-100 text-sky-600"
                  )}>
                    {isBooked ? 'Ocupado' : 'Libre'}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="pt-2">
            <Button 
              variant="outline" 
              className="w-full py-5 rounded-3xl font-black tracking-widest uppercase border-zinc-200"
              onClick={() => setIsPitchScheduleModalOpen(false)}
            >
              VOLVER AL DASHBOARD
            </Button>
          </div>
        </div>
      </Modal>

      {/* Booking Modal */}
      <Modal
        isOpen={isBookingModalOpen}
        onClose={() => setIsBookingModalOpen(false)}
        title={`Reservar ${selectedPitch?.name}`}
      >
        {bookingTimer !== null && (
          <div className="flex items-center justify-center gap-2 bg-red-50 text-red-600 py-3 rounded-2xl border border-red-100 mb-6 animate-pulse">
            <Timer className="w-5 h-5" />
            <span className="font-black tracking-widest uppercase text-xs">
              Tiempo restante: {Math.floor(bookingTimer / 60)}:{(bookingTimer % 60).toString().padStart(2, '0')}
            </span>
          </div>
        )}
        <form onSubmit={handleBooking} className="space-y-6">
          <div className="bg-zinc-50 p-6 rounded-3xl space-y-3 border border-zinc-100">
            <div className="flex items-center gap-3 text-zinc-600">
              <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center shadow-sm">
                <Clock className="w-4 h-4 text-sky-500" />
              </div>
              <span className="font-bold">{selectedTime} hs - {format(selectedDate, 'dd/MM/yyyy')}</span>
            </div>
            <div className="flex items-center gap-3 text-zinc-600">
              <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center shadow-sm">
                <MapPin className="w-4 h-4 text-sky-500" />
              </div>
              <span className="font-bold">{selectedPitch?.type} - ${selectedPitch?.price}</span>
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-bold text-zinc-700 ml-1">Nombre del cliente</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
                <input
                  required
                  type="text"
                  placeholder="Ej: Juan Pérez"
                  className="w-full pl-12 pr-4 py-4 bg-zinc-50 border border-zinc-200 rounded-2xl focus:ring-2 focus:ring-sky-500 outline-none transition-all text-zinc-900"
                  value={formData.clientName}
                  onChange={e => setFormData({ ...formData, clientName: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-zinc-700 ml-1">Teléfono de contacto</label>
              <div className="relative">
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
                <input
                  required
                  type="tel"
                  placeholder="Ej: 11 1234 5678"
                  className="w-full pl-12 pr-4 py-4 bg-zinc-50 border border-zinc-200 rounded-2xl focus:ring-2 focus:ring-sky-500 outline-none transition-all text-zinc-900"
                  value={formData.clientPhone}
                  onChange={e => setFormData({ ...formData, clientPhone: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-zinc-700 ml-1">Monto de la seña</label>
              <div className="relative">
                <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
                <input
                  required
                  type="number"
                  placeholder="Ej: 500"
                  className="w-full pl-12 pr-4 py-4 bg-zinc-50 border border-zinc-200 rounded-2xl focus:ring-2 focus:ring-sky-500 outline-none transition-all text-zinc-900"
                  value={formData.depositAmount}
                  onChange={e => setFormData({ ...formData, depositAmount: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-zinc-700 ml-1">Comprobante de transferencia</label>
              <div 
                className={cn(
                  "relative border-2 border-dashed rounded-2xl p-4 transition-all flex flex-col items-center justify-center gap-2 cursor-pointer group",
                  formData.receipt ? "border-sky-500 bg-sky-500/5" : "border-zinc-200 hover:border-sky-500 hover:bg-sky-500/5"
                )}
                onClick={() => document.getElementById('receipt-upload')?.click()}
              >
                <input 
                  id="receipt-upload"
                  type="file" 
                  accept="image/*,application/pdf" 
                  className="hidden" 
                  onChange={handleFileChange}
                />
                
                {formData.receipt ? (
                  <>
                    <div className="w-10 h-10 bg-sky-500 rounded-full flex items-center justify-center text-white shadow-lg">
                      <CheckCircle2 className="w-5 h-5" />
                    </div>
                    <p className="text-xs font-black text-sky-600 uppercase tracking-widest">¡Comprobante cargado!</p>
                    <button 
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setFormData(prev => ({ ...prev, receipt: null }));
                      }}
                      className="text-[9px] font-black text-zinc-400 hover:text-red-500 uppercase tracking-widest"
                    >
                      Cambiar imagen
                    </button>
                  </>
                ) : (
                  <>
                    <div className="w-10 h-10 bg-zinc-100 rounded-2xl flex items-center justify-center text-zinc-400 group-hover:text-sky-500 transition-colors">
                      <Upload className="w-5 h-5" />
                    </div>
                    <div className="text-center">
                      <p className="text-xs font-bold text-zinc-600">Haz clic para subir el comprobante</p>
                      <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest mt-1">MP, Transferencia, etc.</p>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          <Button type="submit" className="w-full py-5 text-lg font-black tracking-tight shadow-xl shadow-sky-500/20">
            CONFIRMAR RESERVA
          </Button>
        </form>
      </Modal>
      {/* Booking Detail Modal */}
      <Modal
        isOpen={isBookingDetailModalOpen}
        onClose={() => setIsBookingDetailModalOpen(false)}
        title="Detalles de la Reserva"
      >
        {selectedBooking && (
          <div className="space-y-6">
            <div className="bg-zinc-50 p-6 rounded-3xl space-y-4 border border-zinc-100">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm">
                  <User className="w-6 h-6 text-sky-500" />
                </div>
                <div>
                  <p className="text-sm font-bold text-zinc-400 uppercase tracking-widest">Cliente</p>
                  <p className="text-xl font-black text-zinc-900">{selectedBooking.clientName}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm">
                  <Phone className="w-6 h-6 text-sky-500" />
                </div>
                <div>
                  <p className="text-sm font-bold text-zinc-400 uppercase tracking-widest">Teléfono</p>
                  <p className="text-xl font-black text-zinc-900">{selectedBooking.clientPhone}</p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm">
                  <Clock className="w-6 h-6 text-sky-500" />
                </div>
                <div>
                  <p className="text-sm font-bold text-zinc-400 uppercase tracking-widest">Horario</p>
                  <p className="text-xl font-black text-zinc-900">
                    {format(selectedBooking.startTime, 'HH:mm')} hs - {format(selectedBooking.startTime, 'dd/MM/yyyy')}
                  </p>
                </div>
              </div>

              {selectedBooking.depositAmount && (
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm">
                    <DollarSign className="w-6 h-6 text-sky-500" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-zinc-400 uppercase tracking-widest">Seña</p>
                    <p className="text-xl font-black text-sky-600">${selectedBooking.depositAmount}</p>
                  </div>
                </div>
              )}

              {selectedBooking.receiptUrl && (
                <div className="space-y-2">
                  <p className="text-sm font-bold text-zinc-400 uppercase tracking-widest">Comprobante</p>
                  <div className="relative group aspect-video rounded-2xl overflow-hidden border border-zinc-200 bg-zinc-100 flex items-center justify-center">
                    {selectedBooking.receiptUrl.startsWith('data:application/pdf') ? (
                      <div className="flex flex-col items-center gap-3 p-6 text-center">
                        <div className="w-16 h-16 bg-red-500/10 rounded-2xl flex items-center justify-center text-red-500">
                          <FileText className="w-8 h-8" />
                        </div>
                        <div>
                          <p className="font-bold text-zinc-900">Archivo PDF</p>
                          <p className="text-xs text-zinc-500">Haz clic para abrir el documento</p>
                        </div>
                        <Button 
                          variant="secondary" 
                          size="sm" 
                          className="rounded-xl mt-2"
                          onClick={() => {
                            const link = document.createElement('a');
                            link.href = selectedBooking.receiptUrl!;
                            link.download = `comprobante-${selectedBooking.clientName}.pdf`;
                            link.click();
                          }}
                        >
                          <Download className="w-4 h-4 mr-2" />
                          Descargar PDF
                        </Button>
                      </div>
                    ) : (
                      <>
                        <img 
                          src={selectedBooking.receiptUrl} 
                          alt="Comprobante" 
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <Button 
                            variant="secondary" 
                            size="sm" 
                            className="rounded-xl"
                            onClick={() => window.open(selectedBooking.receiptUrl, '_blank')}
                          >
                            <Maximize2 className="w-4 h-4 mr-2" />
                            Ver Pantalla Completa
                          </Button>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <Button 
                variant="outline" 
                className="flex-1 py-4 rounded-2xl"
                onClick={() => setIsBookingDetailModalOpen(false)}
              >
                CERRAR
              </Button>
              <Button 
                variant="danger" 
                className="flex-1 py-4 rounded-2xl font-black"
                onClick={async () => {
                  try {
                    await api.cancelBooking(selectedBooking.id);
                    const updatedBookings = await dataService.getBookings();
                    setBookings(updatedBookings);
                    setIsBookingDetailModalOpen(false);
                  } catch (error) {
                    alert('Error al cancelar la reserva');
                  }
                }}
              >
                CANCELAR TURNO
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
