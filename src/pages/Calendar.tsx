import React, { useState, useEffect } from 'react';
import { format, addDays, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay, addHours, startOfHour } from 'date-fns';
import { es } from 'date-fns/locale';
import { DayPicker } from 'react-day-picker';
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalendarIcon, 
  Filter, 
  Clock, 
  User, 
  Phone, 
  MapPin,
  Trophy,
  Maximize2,
  Minimize2,
  DollarSign,
  FileText,
  Download,
  Zap,
  Info,
  AlertCircle,
  CheckCircle2,
  Star,
  Plus,
  Share2
} from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'motion/react';
import { Button } from '../components/Button';
import { Card, CardContent, CardHeader } from '../components/Card';
import { Badge } from '../components/Badge';
import { Modal } from '../components/Modal';
import { ConfirmModal } from '../components/ConfirmModal';
import { dataService, api } from '../services/dataService';
import { Pitch, Booking, User as UserType } from '../types';
import { cn } from '../lib/utils';

interface CalendarProps {
  user: UserType;
}

export default function CalendarPage({ user }: CalendarProps) {
  const [pitches, setPitches] = useState<Pitch[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [view, setView] = useState<'day' | 'week'>('day');
  const [filterPitch, setFilterPitch] = useState<string>('all');
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [isCompact, setIsCompact] = useState(false);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [isConfirmCancelOpen, setIsConfirmCancelOpen] = useState(false);
  const [hoveredSlot, setHoveredSlot] = useState<{ hour: number, day: Date, pitch: Pitch } | null>(null);
  
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [bookingData, setBookingData] = useState({
    pitch: null as Pitch | null,
    date: new Date(),
    time: '',
    clientName: user.role === 'client' ? user.name : '',
    clientPhone: '',
    receipt: null as string | null,
    depositAmount: ''
  });

  useEffect(() => {
    setPitches(dataService.getPitches());
    setBookings(dataService.getBookings());
  }, [selectedDate]);

  const hours = Array.from({ length: 15 }, (_, i) => (i + 10) % 24); // 10:00 to 01:00
  
  const days = view === 'day' 
    ? [selectedDate] 
    : eachDayOfInterval({
        start: startOfWeek(selectedDate, { weekStartsOn: 1 }),
        end: endOfWeek(selectedDate, { weekStartsOn: 1 })
      });

  const filteredPitches = filterPitch === 'all' 
    ? pitches 
    : pitches.filter(p => p.id === filterPitch);

  const isPromoHour = (hour: number) => hour >= 10 && hour <= 16;

  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookingData.pitch || !bookingData.time) return;

    if (!bookingData.receipt) {
      toast.error('Por favor, carga el comprobante de la seña.');
      return;
    }

    const [h, m] = bookingData.time.split(':').map(Number);
    const startTime = new Date(bookingData.date);
    startTime.setHours(h, m, 0, 0);
    const endTime = addHours(startTime, 1);

    try {
      const isPromo = h >= 10 && h <= 16;
      const points = isPromo ? 1.5 : 1;

      await api.addBooking({
        pitchId: bookingData.pitch.id,
        userId: user.id,
        clientName: bookingData.clientName,
        clientPhone: bookingData.clientPhone,
        startTime,
        endTime,
        status: 'confirmed',
        receiptUrl: bookingData.receipt,
        depositAmount: Number(bookingData.depositAmount) || 0
      });
      
      setBookings(dataService.getBookings());
      setIsBookingModalOpen(false);
      setBookingData(prev => ({ ...prev, receipt: null, depositAmount: '' }));
      
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
      if (file.size > 2 * 1024 * 1024) {
        toast.error('El archivo es muy pesado (máximo 2MB).');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setBookingData(prev => ({ ...prev, receipt: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Tier 1: Date Selector, Share, General Actions */}
      <header className="space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
            <div className="relative">
              <div className="flex items-center gap-1 bg-white p-1.5 rounded-2xl border border-zinc-200 shadow-saas">
                <Button 
                  variant="ghost" 
                  className="h-12 w-12 p-0 rounded-xl" 
                  onClick={() => setSelectedDate(d => addDays(d, view === 'day' ? -1 : -7))}
                >
                  <ChevronLeft className="w-5 h-5" />
                </Button>
                <Button 
                  variant="ghost" 
                  className="h-12 px-4 text-xs font-black hover:bg-zinc-100 rounded-xl" 
                  onClick={() => setSelectedDate(new Date())}
                >
                  HOY
                </Button>
                <button 
                  onClick={() => setIsCalendarOpen(!isCalendarOpen)}
                  className="px-4 text-sm font-black text-zinc-700 min-w-[160px] text-center hover:bg-zinc-50 h-12 rounded-xl transition-colors flex items-center justify-center gap-2"
                >
                  <CalendarIcon className="w-4 h-4 text-primary" />
                  {view === 'day' 
                    ? format(selectedDate, "d 'de' MMMM", { locale: es })
                    : `${format(days[0], "d MMM")} - ${format(days[6], "d MMM")}`
                  }
                </button>
                <Button 
                  variant="ghost" 
                  className="h-12 w-12 p-0 rounded-xl" 
                  onClick={() => setSelectedDate(d => addDays(d, view === 'day' ? 1 : 7))}>
                  <ChevronRight className="w-5 h-5" />
                </Button>
              </div>

              {isCalendarOpen && (
                <div className="absolute top-full left-0 mt-2 z-50 bg-white border border-zinc-200 rounded-3xl shadow-premium p-4">
                  <DayPicker
                    mode="single"
                    selected={selectedDate}
                    onSelect={(date) => {
                      if (date) setSelectedDate(date);
                      setIsCalendarOpen(false);
                    }}
                    locale={es}
                    className="rdp-custom"
                  />
                </div>
              )}
            </div>
            <h1 className="hidden xl:block text-2xl font-black text-zinc-900 tracking-tight">Calendario</h1>
          </div>

          <div className="grid grid-cols-2 lg:flex items-center gap-3">
            <Button 
              variant="outline" 
              className="h-14 lg:h-12 font-black text-[11px] uppercase tracking-wider rounded-2xl border-zinc-200 shadow-saas bg-white"
              onClick={() => {
                navigator.clipboard.writeText(window.location.href);
                toast.success('Link de disponibilidad copiado', {
                  description: 'Ya podés compartirlo con tus clientes.'
                });
              }}
            >
              <Share2 className="w-4 h-4 mr-2 hidden sm:inline" />
              Compartir disponibilidad
            </Button>
            <Button className="h-14 lg:h-12 font-black text-[11px] uppercase tracking-wider rounded-2xl shadow-premium bg-zinc-900 text-white hover:bg-zinc-800 flex items-center justify-center gap-2 relative overflow-hidden">
              <div className="absolute inset-0 opacity-20 pointer-events-none" style={{ background: 'var(--bg-flag-ar)' }} />
              <div className="w-4 h-3 rounded-[2px] overflow-hidden flex flex-col shadow-sm shrink-0 relative z-10">
                <div className="h-1/3 bg-[#74acdf]" />
                <div className="h-1/3 bg-white flex items-center justify-center">
                  <div className="w-0.5 h-0.5 rounded-full bg-yellow-400" />
                </div>
                <div className="h-1/3 bg-[#74acdf]" />
              </div>
              <Plus className="w-4 h-4 hidden sm:inline relative z-10" />
              <span className="relative z-10">Nueva Reserva</span>
            </Button>
          </div>
        </div>

        {/* Header Tier 2: Filters, View Toggles, Compact Switch */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 pt-4 border-t border-zinc-100">
          <div className="flex flex-1 items-center gap-3">
            <div className="relative group flex-1 sm:max-w-xs">
              <Filter className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 group-hover:text-primary transition-colors" />
              <select
                className="w-full bg-white pl-11 pr-4 h-14 rounded-2xl border border-zinc-200 shadow-saas font-black text-xs uppercase tracking-widest outline-none focus:ring-2 focus:ring-primary/20 appearance-none cursor-pointer hover:border-zinc-300 transition-all"
                value={filterPitch}
                onChange={e => setFilterPitch(e.target.value)}
              >
                <option value="all">Todas las canchas</option>
                {pitches.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex flex-1 bg-white p-1.5 rounded-2xl border border-zinc-200 shadow-saas">
              <button
                onClick={() => setView('day')}
                className={cn(
                  "flex-1 sm:flex-none px-6 h-11 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 relative overflow-hidden",
                  view === 'day' ? "text-zinc-900 shadow-saas border border-sky-300" : "text-zinc-500 hover:text-zinc-900"
                )}
              >
                {view === 'day' && (
                  <div className="absolute inset-0 opacity-30 pointer-events-none" style={{ background: 'var(--bg-flag-ar)' }} />
                )}
                {view === 'day' && (
                  <div className="w-4 h-3 rounded-[2px] overflow-hidden flex flex-col shadow-sm shrink-0 relative z-10">
                    <div className="h-1/3 bg-[#74acdf]" />
                    <div className="h-1/3 bg-white flex items-center justify-center">
                      <div className="w-0.5 h-0.5 rounded-full bg-yellow-400" />
                    </div>
                    <div className="h-1/3 bg-[#74acdf]" />
                  </div>
                )}
                <span className="relative z-10">Día</span>
              </button>
              <button
                onClick={() => setView('week')}
                className={cn(
                  "flex-1 sm:flex-none px-6 h-11 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 relative overflow-hidden",
                  view === 'week' ? "text-zinc-900 shadow-saas border border-sky-300" : "text-zinc-500 hover:text-zinc-900"
                )}
              >
                {view === 'week' && (
                  <div className="absolute inset-0 opacity-30 pointer-events-none" style={{ background: 'var(--bg-flag-ar)' }} />
                )}
                {view === 'week' && (
                  <div className="w-4 h-3 rounded-[2px] overflow-hidden flex flex-col shadow-sm shrink-0 relative z-10">
                    <div className="h-1/3 bg-[#74acdf]" />
                    <div className="h-1/3 bg-white flex items-center justify-center">
                      <div className="w-0.5 h-0.5 rounded-full bg-yellow-400" />
                    </div>
                    <div className="h-1/3 bg-[#74acdf]" />
                  </div>
                )}
                <span className="relative z-10">Semana</span>
              </button>
            </div>

            <div className="flex bg-white p-1.5 rounded-2xl border border-zinc-200 shadow-saas">
              <button
                onClick={() => setIsCompact(!isCompact)}
                className={cn(
                  "h-11 w-11 flex items-center justify-center rounded-xl transition-all",
                  isCompact ? "bg-zinc-100 text-zinc-900" : "text-zinc-400 hover:text-zinc-900"
                )}
                title={isCompact ? "Vista Normal" : "Vista Compacta"}
              >
                {isCompact ? <Maximize2 className="w-5 h-5" /> : <Minimize2 className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Promo Banner */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-sky-500/10 border border-sky-500/20 p-5 rounded-3xl flex items-center justify-between gap-4 shadow-lg shadow-sky-500/5"
      >
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-sky-500 rounded-2xl flex items-center justify-center shadow-lg shadow-sky-500/20">
            <Zap className="w-6 h-6 text-white animate-pulse" />
          </div>
          <div>
            <h3 className="text-base font-black text-zinc-900 tracking-tight">¡Horarios Promocionales! 🔥</h3>
            <p className="text-xs font-bold text-zinc-500">Hoy de 10:00 a 16:00 sumás <span className="text-sky-600 font-black">+1.5 puntos</span> por reserva.</p>
          </div>
        </div>
      </motion.div>

      <Card className="border-none shadow-premium rounded-[2.5rem] bg-white relative">
        <div 
          id="calendar-scroll-container"
          className="w-full overflow-x-hidden scrollbar-thin scrollbar-thumb-zinc-200"
        >
          <div className="w-full relative">
            {/* Football Pitch Background Overlay (Subtle) */}
            <div className="absolute inset-0 pointer-events-none opacity-[0.03] z-0" 
                 style={{ 
                   backgroundImage: `url("data:image/svg+xml,%3Csvg width='400' height='600' viewBox='0 0 400 600' xmlns='http://www.w3.org/2000/svg'%3E%3Crect width='400' height='600' fill='%2374acdf'/%3E%3Cline x1='0' y1='300' x2='400' y2='300' stroke='white' stroke-width='4'/%3E%3Ccircle cx='200' cy='300' r='60' fill='none' stroke='white' stroke-width='4'/%3E%3Crect x='100' y='0' width='200' height='100' fill='none' stroke='white' stroke-width='4'/%3E%3Crect x='100' y='500' width='200' height='100' fill='none' stroke='white' stroke-width='4'/%3E%3C/svg%3E")`,
                   backgroundSize: '100% 100%'
                 }} 
            />

            {/* Header Row - Sticky */}
            <div 
              className="grid border-b border-zinc-100 bg-white/90 backdrop-blur-md sticky top-0 z-40 shadow-sm"
              style={{ gridTemplateColumns: `100px repeat(${days.length}, 1fr)` }}
            >
              <div className="p-4 border-r border-zinc-100 bg-zinc-50/50 flex items-center justify-center">
                <Trophy className="w-5 h-5 text-zinc-300" />
              </div>
              {days.map(day => (
                <div 
                  key={day.toString()} 
                  className={cn(
                    "p-4 text-center border-r border-zinc-100 last:border-r-0 bg-zinc-50/50 transition-all",
                    isSameDay(day, new Date()) && "bg-sky-50 ring-2 ring-inset ring-sky-500/20"
                  )}
                >
                  <p className={cn(
                    "text-[10px] uppercase tracking-[0.2em] font-black mb-1",
                    isSameDay(day, new Date()) ? "text-sky-600" : "text-zinc-400"
                  )}>
                    {format(day, 'EEEE', { locale: es })}
                  </p>
                  <p className={cn(
                    "text-2xl font-black tracking-tighter",
                    isSameDay(day, new Date()) ? "text-sky-600" : "text-zinc-900"
                  )}>
                    {format(day, 'd')}
                  </p>
                </div>
              ))}
            </div>

            {/* Time Rows */}
            <div className="relative z-10">
              {hours.map(hour => (
                <div 
                  key={hour} 
                  id={`slot-${hour}`}
                  className={cn(
                    "grid border-b border-zinc-100 last:border-b-0 group/row",
                    isCompact ? "min-h-[100px]" : "min-h-[180px]"
                  )}
                  style={{ gridTemplateColumns: `100px repeat(${days.length}, 1fr)` }}
                >
                  <div className="p-4 border-r border-zinc-100 bg-zinc-50/30 flex flex-col items-center justify-center gap-2 sticky left-0 z-20 backdrop-blur-sm">
                    <span className="text-xl font-black text-zinc-400 group-hover/row:text-zinc-900 transition-colors">
                      {hour.toString().padStart(2, '0')}:00
                    </span>
                    {isPromoHour(hour) && (
                      <Badge variant="success" className="bg-sky-500 text-white border-none text-[9px] px-2 py-0.5 font-black shadow-sm shadow-sky-500/20">PROMO</Badge>
                    )}
                  </div>
                  {days.map(day => (
                    <div key={day.toString()} className="p-2 border-r border-zinc-100 last:border-r-0 relative">
                      <div className="grid grid-cols-1 gap-2 h-full">
                        {filteredPitches.map(pitch => {
                          const booking = bookings.find(b => 
                            b.pitchId === pitch.id && 
                            b.startTime.getHours() === hour &&
                            isSameDay(b.startTime, day) &&
                            b.status === 'confirmed'
                          );

                          const isOccupied = !!booking;
                          const isPromo = isPromoHour(hour);
                          const isOwnBooking = booking?.userId === user.id;
                          const canSeeDetails = user.role === 'admin' || isOwnBooking;

                          return (
                            <motion.div
                              key={`${pitch.id}-${hour}-${day.toISOString()}`}
                              className="relative h-full"
                              onMouseEnter={() => !isOccupied && setHoveredSlot({ hour, day, pitch })}
                              onMouseLeave={() => setHoveredSlot(null)}
                            >
                              <div
                                role="button"
                                tabIndex={isOccupied && !canSeeDetails ? -1 : 0}
                                onClick={() => {
                                  if (isOccupied) {
                                    if (canSeeDetails) setSelectedBooking(booking);
                                  } else {
                                    setBookingData({
                                      ...bookingData,
                                      pitch,
                                      date: day,
                                      time: `${hour.toString().padStart(2, '0')}:00`
                                    });
                                    setIsBookingModalOpen(true);
                                  }
                                }}
                                className={cn(
                                  "w-full h-full p-4 rounded-[1.5rem] text-left transition-all relative overflow-hidden group/slot flex flex-col justify-between border-2 outline-none",
                                  isOccupied 
                                    ? "bg-zinc-50/80 border-zinc-100 text-zinc-400 cursor-default grayscale opacity-60" 
                                    : isPromo 
                                      ? "bg-sky-50 border-sky-200 text-sky-700 hover:bg-sky-100 hover:border-sky-300 cursor-pointer shadow-sm"
                                      : "bg-white border-zinc-100 text-zinc-700 hover:bg-sky-50 hover:border-sky-200 cursor-pointer shadow-sm",
                                  !isOccupied && "hover:scale-[1.02] hover:shadow-md active:scale-[0.98]"
                                )}
                              >
                                <div className="flex items-center justify-between gap-2">
                                  <div className="flex items-center gap-1.5">
                                    <div className={cn(
                                      "w-2.5 h-2.5 rounded-full",
                                      isOccupied ? "bg-zinc-300" : isPromo ? "bg-sky-500 animate-pulse" : "bg-sky-400"
                                    )} />
                                    <span className="text-[11px] font-black uppercase tracking-widest opacity-80 truncate">
                                      {pitch.name}
                                    </span>
                                  </div>
                                  {!isOccupied && isPromo && (
                                    <Zap className="w-3.5 h-3.5 text-sky-500" />
                                  )}
                                </div>

                                <div className="mt-2 flex items-end justify-between">
                                  <div>
                                    <p className="text-sm font-black truncate max-w-[120px] flex items-center gap-1.5">
                                      {isOccupied ? (canSeeDetails ? booking.clientName : 'RESERVADO') : 'DISPONIBLE'}
                                      {isOccupied && booking.isPaid && (
                                        <CheckCircle2 className="w-3.5 h-3.5 text-sky-500 shrink-0" />
                                      )}
                                    </p>
                                    {!isOccupied && (
                                      <p className="text-[11px] font-bold opacity-60 mt-0.5 text-sky-600/70">
                                        Click para reservar
                                      </p>
                                    )}
                                  </div>
                                  {!isOccupied && (
                                    <div className={cn(
                                      "px-2.5 py-1 rounded-full text-[10px] font-black shadow-sm",
                                      isPromo ? "bg-sky-500 text-white" : "bg-sky-100 text-sky-600"
                                    )}>
                                      +{isPromo ? '1.5' : '1'} PTS
                                    </div>
                                  )}
                                </div>

                                {/* Hover Overlay */}
                                <AnimatePresence>
                                  {hoveredSlot?.hour === hour && hoveredSlot?.pitch.id === pitch.id && isSameDay(hoveredSlot.day, day) && (
                                    <motion.div
                                      initial={{ opacity: 0, scale: 1.1 }}
                                      animate={{ opacity: 1, scale: 1 }}
                                      exit={{ opacity: 0, scale: 1.1 }}
                                      className="absolute inset-0 z-10 bg-argentina backdrop-blur-[2px] flex flex-col items-center justify-center gap-2"
                                    >
                                      <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                                        <Plus className="w-5 h-5 text-zinc-900" />
                                      </div>
                                      <span className="text-[10px] font-black text-zinc-900 tracking-[0.2em] uppercase">Reservar</span>
                                    </motion.div>
                                  )}
                                </AnimatePresence>
                              </div>
                            </motion.div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      </Card>

      {/* Booking Modal */}
      <Modal
        isOpen={isBookingModalOpen}
        onClose={() => setIsBookingModalOpen(false)}
        title="Nueva Reserva"
      >
        <form onSubmit={handleBookingSubmit} className="space-y-6">
          <div className="p-4 bg-zinc-50 rounded-2xl border border-zinc-100 flex items-center gap-4">
            <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-sm border border-zinc-100">
              <CalendarIcon className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Detalles del turno</p>
              <h3 className="text-base font-bold text-zinc-900">
                {bookingData.pitch?.name} • {bookingData.time} hs
              </h3>
              <p className="text-xs text-zinc-500">{format(bookingData.date, "EEEE d 'de' MMMM", { locale: es })}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-700 ml-1">Nombre del Cliente</label>
              <input 
                type="text" 
                required
                placeholder="Ej: Juan Pérez"
                className="w-full px-4 py-2.5 bg-white border border-zinc-200 rounded-xl focus:ring-2 focus:ring-primary/20 outline-none text-sm font-medium"
                value={bookingData.clientName}
                onChange={e => setBookingData(prev => ({ ...prev, clientName: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-700 ml-1">Teléfono</label>
              <input 
                type="tel" 
                required
                placeholder="Ej: 11 2345 6789"
                className="w-full px-4 py-2.5 bg-white border border-zinc-200 rounded-xl focus:ring-2 focus:ring-primary/20 outline-none text-sm font-medium"
                value={bookingData.clientPhone}
                onChange={e => setBookingData(prev => ({ ...prev, clientPhone: e.target.value }))}
              />
            </div>
          </div>
          
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-zinc-700 ml-1">Comprobante de Seña (Mín. $500)</label>
            <div className="relative group">
              <input 
                type="file" 
                accept="image/*,application/pdf"
                onChange={handleFileChange}
                className="hidden"
                id="receipt-upload"
              />
              <label 
                htmlFor="receipt-upload"
                className={cn(
                  "w-full px-6 py-6 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center gap-2 cursor-pointer transition-all",
                  bookingData.receipt ? "border-emerald-500 bg-emerald-50" : "border-zinc-200 hover:border-primary/40 hover:bg-primary/5"
                )}
              >
                {bookingData.receipt ? (
                  <>
                    <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                    <p className="text-xs font-bold text-emerald-600">¡Comprobante Cargado!</p>
                  </>
                ) : (
                  <>
                    <Download className="w-6 h-6 text-zinc-400 group-hover:text-primary transition-colors" />
                    <div className="text-center">
                      <p className="text-xs font-bold text-zinc-900">Subir Comprobante</p>
                      <p className="text-[10px] text-zinc-500">Imagen o PDF (Máx 2MB)</p>
                    </div>
                  </>
                )}
              </label>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-zinc-700 ml-1">Monto de la Seña ($)</label>
            <div className="relative">
              <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
              <input 
                type="number" 
                placeholder="0.00"
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-zinc-200 rounded-xl focus:ring-2 focus:ring-primary/20 outline-none text-sm font-medium"
                value={bookingData.depositAmount}
                onChange={e => setBookingData(prev => ({ ...prev, depositAmount: e.target.value }))}
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <div className="flex items-center gap-2 text-primary">
              <Zap className="w-4 h-4 fill-primary" />
              <span className="text-xs font-bold">+{isPromoHour(parseInt(bookingData.time)) ? '1.5' : '1'} Puntos</span>
            </div>
            <div className="flex gap-3">
              <Button type="button" variant="ghost" onClick={() => setIsBookingModalOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" className="px-8 shadow-lg shadow-primary/20">
                Confirmar Reserva
              </Button>
            </div>
          </div>
        </form>
      </Modal>

      {/* Booking Detail Modal */}
      <Modal
        isOpen={!!selectedBooking}
        onClose={() => setSelectedBooking(null)}
        title="Detalles de la Reserva"
      >
        {selectedBooking && (
          <div className="space-y-6">
            <div className="flex items-center gap-4 p-4 bg-zinc-50 rounded-2xl border border-zinc-100">
              <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-sm border border-zinc-100">
                <User className="w-6 h-6 text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-zinc-900">{selectedBooking.clientName}</h3>
                <div className="flex items-center gap-2">
                  <Badge variant="success" className="bg-emerald-100 text-emerald-700 border-none">Confirmada</Badge>
                  {selectedBooking.isPaid ? (
                    <Badge variant="success" className="bg-blue-100 text-blue-700 border-none flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Pagado
                    </Badge>
                  ) : (
                    <Badge variant="neutral" className="bg-amber-100 text-amber-700 border-none flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" /> Pendiente
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            {/* Playing Now Alert */}
            {new Date() >= selectedBooking.startTime && new Date() <= selectedBooking.endTime && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-center gap-3"
              >
                <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center shrink-0">
                  <Zap className="w-5 h-5 text-amber-600 animate-pulse" />
                </div>
                <div>
                  <p className="text-sm font-bold text-amber-900">¡Partido en Juego!</p>
                  <p className="text-xs text-amber-700">El partido se está jugando ahora. Asegúrate de cobrar el saldo pendiente.</p>
                </div>
              </motion.div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-zinc-50 rounded-xl space-y-1">
                <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1">
                  <Clock className="w-3 h-3" /> Horario
                </p>
                <p className="text-sm font-bold text-zinc-900">
                  {format(selectedBooking.startTime, 'HH:mm')} - {format(selectedBooking.endTime, 'HH:mm')} hs
                </p>
              </div>
              <div className="p-3 bg-zinc-50 rounded-xl space-y-1">
                <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1">
                  <CalendarIcon className="w-3 h-3" /> Fecha
                </p>
                <p className="text-sm font-bold text-zinc-900">
                  {format(selectedBooking.startTime, "d 'de' MMM", { locale: es })}
                </p>
              </div>
              <div className="p-3 bg-zinc-50 rounded-xl space-y-1">
                <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1">
                  <Phone className="w-3 h-3" /> Teléfono
                </p>
                <p className="text-sm font-bold text-zinc-900">{selectedBooking.clientPhone}</p>
              </div>
              <div className="p-3 bg-zinc-50 rounded-xl space-y-1">
                <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1">
                  <MapPin className="w-3 h-3" /> Cancha
                </p>
                <p className="text-sm font-bold text-zinc-900">
                  {pitches.find(p => p.id === selectedBooking.pitchId)?.name}
                </p>
              </div>
            </div>

            {selectedBooking.depositAmount && (
              <div className="p-4 bg-primary/5 rounded-xl border border-primary/10 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                    <DollarSign className="w-4 h-4 text-primary" />
                  </div>
                  <span className="text-sm font-bold text-zinc-700">Seña abonada</span>
                </div>
                <span className="text-lg font-bold text-primary">${selectedBooking.depositAmount}</span>
              </div>
            )}

            {selectedBooking.receiptUrl && (
              <div className="space-y-2">
                <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Comprobante</p>
                <div className="relative group aspect-video rounded-2xl overflow-hidden border border-zinc-200 bg-zinc-100 flex items-center justify-center">
                  {selectedBooking.receiptUrl.startsWith('data:application/pdf') ? (
                    <div className="flex flex-col items-center gap-2 p-4 text-center">
                      <FileText className="w-8 h-8 text-red-500" />
                      <p className="text-xs font-bold text-zinc-900">Archivo PDF</p>
                      <Button 
                        variant="secondary" 
                        size="sm" 
                        className="h-8 text-[10px]"
                        onClick={() => {
                          const link = document.createElement('a');
                          link.href = selectedBooking.receiptUrl!;
                          link.download = `comprobante-${selectedBooking.clientName}.pdf`;
                          link.click();
                        }}
                      >
                        Descargar
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
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <Button 
                          variant="secondary" 
                          size="sm" 
                          className="h-8 text-[10px]"
                          onClick={() => window.open(selectedBooking.receiptUrl, '_blank')}
                        >
                          Ver Completo
                        </Button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}

            {user.role === 'admin' && (
              <div className="pt-4 flex flex-col gap-3">
                <div className="flex gap-3">
                  <Button 
                    variant={selectedBooking.isPaid ? "outline" : "primary"}
                    className={cn(
                      "flex-1 font-bold",
                      selectedBooking.isPaid ? "border-emerald-200 text-emerald-600 hover:bg-emerald-50" : "bg-emerald-600 hover:bg-emerald-700 text-white"
                    )}
                    onClick={async () => {
                      await api.toggleBookingPayment(selectedBooking.id);
                      setBookings(dataService.getBookings());
                      setSelectedBooking(prev => prev ? { ...prev, isPaid: !prev.isPaid } : null);
                      toast.success(selectedBooking.isPaid ? 'Pago cancelado' : '¡Pago registrado!');
                    }}
                  >
                    {selectedBooking.isPaid ? 'Marcar como Pendiente' : 'Marcar como Pagado'}
                  </Button>
                  <Button className="flex-1 font-bold">Editar</Button>
                </div>
                <Button 
                  variant="ghost" 
                  className="w-full text-red-500 hover:bg-red-50 font-bold"
                  onClick={() => setIsConfirmCancelOpen(true)}
                >
                  Cancelar Reserva
                </Button>
              </div>
            )}
          </div>
        )}
      </Modal>

      <ConfirmModal
        isOpen={isConfirmCancelOpen}
        onClose={() => setIsConfirmCancelOpen(false)}
        onConfirm={async () => {
          if (selectedBooking) {
            await api.cancelBooking(selectedBooking.id);
            setBookings(dataService.getBookings());
            setSelectedBooking(null);
          }
        }}
        title="Cancelar Reserva"
        message="¿Estás seguro de que deseas cancelar esta reserva? El turno quedará disponible nuevamente."
        confirmText="CANCELAR TURNO"
        cancelText="VOLVER"
      />
    </div>
  );
}
