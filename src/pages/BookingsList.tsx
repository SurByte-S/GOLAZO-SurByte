import React, { useState, useEffect } from 'react';
import { format, isSameDay } from 'date-fns';
import { es } from 'date-fns/locale';
import { 
  Search, 
  Calendar as CalendarIcon, 
  Trash2, 
  Phone, 
  User as UserIcon, 
  Clock, 
  MapPin,
  Filter,
  ChevronRight,
  Trophy,
  DollarSign,
  Image as ImageIcon,
  FileText,
  ExternalLink,
  Download,
  Maximize2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Card, CardContent } from '../components/Card';
import { Button } from '../components/Button';
import { Modal } from '../components/Modal';
import { ConfirmModal } from '../components/ConfirmModal';
import { Badge } from '../components/Badge';
import { dataService, api } from '../services/dataService';
import { Booking, Pitch, User } from '../types';
import { cn } from '../lib/utils';

interface BookingsListProps {
  user: User;
}

export default function BookingsList({ user }: BookingsListProps) {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [pitches, setPitches] = useState<Pitch[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'confirmed' | 'cancelled'>('all');
  const [confirmCancel, setConfirmCancel] = useState<string | null>(null);
  const [selectedBookingForDetail, setSelectedBookingForDetail] = useState<Booking | null>(null);

  useEffect(() => {
    setPitches(dataService.getPitches());
    setBookings(dataService.getBookings());
  }, []);

  const filteredBookings = bookings.filter(b => {
    const matchesSearch = b.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         b.clientPhone.includes(searchTerm);
    const matchesStatus = filterStatus === 'all' || b.status === filterStatus;
    const matchesUser = user.role === 'admin' || b.userId === user.id;
    
    return matchesSearch && matchesStatus && matchesUser;
  }).sort((a, b) => b.startTime.getTime() - a.startTime.getTime());

  const handleCancel = async (id: string) => {
    setConfirmCancel(id);
  };

  const executeCancel = async () => {
    if (!confirmCancel) return;
    try {
      await api.cancelBooking(confirmCancel);
      setBookings(dataService.getBookings());
      setConfirmCancel(null);
    } catch (error) {
      alert('Error al cancelar la reserva');
    }
  };

  return (
    <div className="space-y-8 pb-20">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-zinc-900 tracking-tighter">
            {user.role === 'admin' ? 'Gestión de Reservas' : 'Mis Reservas'}
          </h1>
          <p className="text-zinc-500 font-medium">Historial y próximos turnos</p>
        </div>
      </header>

      <div className="flex flex-col lg:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
          <input
            type="text"
            placeholder="Buscar por nombre o teléfono..."
            className="w-full pl-12 pr-4 py-4 bg-white border border-zinc-100 rounded-2xl shadow-sm focus:ring-2 focus:ring-sky-500 outline-none transition-all"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex gap-3">
          <select
            className="bg-white px-6 py-4 rounded-2xl border border-zinc-100 shadow-sm font-bold text-sm outline-none focus:ring-2 focus:ring-sky-500"
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value as any)}
          >
            <option value="all">Todos los estados</option>
            <option value="confirmed">Confirmados</option>
            <option value="cancelled">Cancelados</option>
          </select>
        </div>
      </div>

      <div className="space-y-4">
        <AnimatePresence mode="popLayout">
          {filteredBookings.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-24 bg-white rounded-[40px] border-2 border-dashed border-zinc-100"
            >
              <div className="w-20 h-20 bg-zinc-50 rounded-3xl flex items-center justify-center mx-auto mb-6">
                <CalendarIcon className="w-10 h-10 text-zinc-200" />
              </div>
              <h3 className="text-xl font-black text-zinc-900 mb-2">No se encontraron reservas</h3>
              <p className="text-zinc-400 font-medium">Intenta cambiar los filtros o realiza una nueva reserva.</p>
            </motion.div>
          ) : (
            filteredBookings.map((booking, i) => {
              const pitch = pitches.find(p => p.id === booking.pitchId);
              const isPast = booking.startTime < new Date();
              
              return (
                <motion.div
                  key={booking.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  layout
                >
                  <Card className={cn(
                    "border-none shadow-sm hover:shadow-xl transition-all group overflow-hidden",
                    booking.status === 'cancelled' && "opacity-60"
                  )}>
                    <CardContent className="p-0">
                      <div className="flex flex-col md:flex-row md:items-center">
                        {/* Date Column */}
                        <div className={cn(
                          "md:w-32 p-6 flex flex-col items-center justify-center text-center border-b md:border-b-0 md:border-r border-zinc-50",
                          booking.status === 'confirmed' ? "bg-sky-50/30" : "bg-zinc-50/50"
                        )}>
                          <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-1">
                            {format(booking.startTime, 'MMM', { locale: es })}
                          </span>
                          <span className="text-3xl font-black text-zinc-900 leading-none">
                            {format(booking.startTime, 'dd')}
                          </span>
                          <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mt-1">
                            {format(booking.startTime, 'yyyy')}
                          </span>
                        </div>

                        {/* Info Column */}
                        <div className="flex-1 p-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
                          <div className="space-y-3">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-zinc-50 rounded-xl flex items-center justify-center text-zinc-400 group-hover:bg-sky-50 group-hover:text-sky-500 transition-colors">
                                <UserIcon className="w-5 h-5" />
                              </div>
                              <div>
                                <h4 className="text-lg font-black text-zinc-900">{booking.clientName}</h4>
                                <div className="flex items-center gap-2">
                                  <Badge variant={booking.status === 'confirmed' ? 'success' : 'danger'}>
                                    {booking.status === 'confirmed' ? 'Confirmado' : 'Cancelado'}
                                  </Badge>
                                  {isPast && booking.status === 'confirmed' && (
                                    <Badge variant="neutral">Finalizado</Badge>
                                  )}
                                </div>
                              </div>
                            </div>

                            <div className="flex flex-wrap gap-x-6 gap-y-2">
                              <div className="flex items-center gap-2 text-zinc-500 font-bold text-sm">
                                <Clock className="w-4 h-4 text-sky-500" />
                                {format(booking.startTime, 'HH:mm')} - {format(booking.endTime, 'HH:mm')} hs
                              </div>
                              <div className="flex items-center gap-2 text-zinc-500 font-bold text-sm">
                                <Phone className="w-4 h-4 text-sky-500" />
                                {booking.clientPhone}
                              </div>
                              <div className="flex items-center gap-2 text-zinc-500 font-bold text-sm">
                                <MapPin className="w-4 h-4 text-sky-500" />
                                {pitch?.name || 'Cancha eliminada'} ({pitch?.type})
                              </div>
                              {booking.depositAmount && (
                                <div className="flex items-center gap-2 text-sky-600 font-bold text-sm">
                                  <DollarSign className="w-4 h-4" />
                                  Seña: ${booking.depositAmount}
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-3">
                            {booking.receiptUrl && (
                              <Button 
                                variant="outline" 
                                size="sm" 
                                className="px-6 py-3 rounded-xl border-zinc-100 text-zinc-500 hover:bg-zinc-50 font-bold"
                                onClick={() => window.open(booking.receiptUrl, '_blank')}
                              >
                                {booking.receiptUrl.startsWith('data:application/pdf') ? (
                                  <FileText className="w-4 h-4 mr-2" />
                                ) : (
                                  <ImageIcon className="w-4 h-4 mr-2" />
                                )}
                                Ver Comprobante
                              </Button>
                            )}
                            {booking.status === 'confirmed' && !isPast && (
                              <Button 
                                variant="outline" 
                                size="sm" 
                                className="px-6 py-3 rounded-xl border-red-100 text-red-500 hover:bg-red-50 font-bold"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleCancel(booking.id);
                                }}
                              >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Cancelar
                              </Button>
                            )}
                            <button 
                              onClick={() => setSelectedBookingForDetail(booking)}
                              className="w-10 h-10 bg-zinc-50 rounded-full flex items-center justify-center text-zinc-300 group-hover:bg-zinc-100 group-hover:text-zinc-900 transition-all"
                            >
                              <ChevronRight className="w-5 h-5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })
          )}
        </AnimatePresence>
      </div>
      {/* Booking Detail Modal */}
      <Modal
        isOpen={!!selectedBookingForDetail}
        onClose={() => setSelectedBookingForDetail(null)}
        title="Detalles de la Reserva"
      >
        {selectedBookingForDetail && (
          <div className="space-y-6">
            <div className="flex items-center gap-4 p-4 bg-zinc-50 rounded-2xl">
              <div className="w-12 h-12 bg-sky-500 rounded-xl flex items-center justify-center text-white">
                <CalendarIcon className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-black text-zinc-900">
                  {format(selectedBookingForDetail.startTime, "EEEE d 'de' MMMM", { locale: es })}
                </h3>
                <p className="text-zinc-500 font-bold">
                  {format(selectedBookingForDetail.startTime, 'HH:mm')} - {format(selectedBookingForDetail.endTime, 'HH:mm')} hs
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-zinc-50 rounded-2xl">
                <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1">Cliente</p>
                <p className="font-bold text-zinc-900">{selectedBookingForDetail.clientName}</p>
              </div>
              <div className="p-4 bg-zinc-50 rounded-2xl">
                <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1">Teléfono</p>
                <p className="font-bold text-zinc-900">{selectedBookingForDetail.clientPhone}</p>
              </div>
              <div className="p-4 bg-zinc-50 rounded-2xl">
                <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1">Cancha</p>
                <p className="font-bold text-zinc-900">
                  {pitches.find(p => p.id === selectedBookingForDetail.pitchId)?.name || 'Cancha eliminada'}
                </p>
              </div>
              <div className="p-4 bg-zinc-50 rounded-2xl">
                <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1">Estado</p>
                <Badge variant={selectedBookingForDetail.status === 'confirmed' ? 'success' : 'danger'}>
                  {selectedBookingForDetail.status === 'confirmed' ? 'Confirmado' : 'Cancelado'}
                </Badge>
              </div>
            </div>

            {selectedBookingForDetail.receiptUrl && (
              <div className="space-y-3">
                <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1">Comprobante de Seña</p>
                <div className="relative aspect-video rounded-2xl overflow-hidden bg-zinc-100 border border-zinc-200 group">
                  {selectedBookingForDetail.receiptUrl.startsWith('data:application/pdf') ? (
                    <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center">
                      <FileText className="w-16 h-16 text-zinc-400 mb-4" />
                      <p className="text-zinc-500 font-bold mb-4">Comprobante en formato PDF</p>
                      <Button 
                        variant="secondary" 
                        size="sm" 
                        className="rounded-xl"
                        onClick={() => {
                          const link = document.createElement('a');
                          link.href = selectedBookingForDetail.receiptUrl!;
                          link.download = `comprobante-${selectedBookingForDetail.id}.pdf`;
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
                        src={selectedBookingForDetail.receiptUrl} 
                        alt="Comprobante" 
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <Button 
                          variant="secondary" 
                          size="sm" 
                          className="rounded-xl"
                          onClick={() => window.open(selectedBookingForDetail.receiptUrl, '_blank')}
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

            {user.role === 'admin' && selectedBookingForDetail.status === 'confirmed' && (
              <div className="pt-4">
                <Button 
                  variant="outline" 
                  className="w-full py-4 border-red-100 text-red-500 hover:bg-red-50"
                  onClick={() => {
                    handleCancel(selectedBookingForDetail.id);
                    setSelectedBookingForDetail(null);
                  }}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Cancelar Reserva
                </Button>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Confirm Cancel Modal */}
      <ConfirmModal
        isOpen={!!confirmCancel}
        onClose={() => setConfirmCancel(null)}
        onConfirm={executeCancel}
        title="Cancelar Reserva"
        message="¿Estás seguro de que deseas cancelar esta reserva? El turno quedará disponible nuevamente."
        confirmText="CANCELAR TURNO"
        cancelText="VOLVER"
      />
    </div>
  );
}
