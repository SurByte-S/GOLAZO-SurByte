import React, { useState, useEffect, useRef } from 'react';
import { 
  User, 
  X, 
  Send, 
  MessageSquare,
  ChevronDown,
  Settings,
  DollarSign,
  Info,
  Coffee,
  Star
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { GoogleGenAI, Type, FunctionDeclaration } from "@google/genai";
import { dataService, api } from '../services/dataService';
import { supabase } from '../lib/supabase';
import { cn } from '../lib/utils';

interface Message {
  role: 'user' | 'bot';
  text: string;
}

export default function AIChatFloating() {
  const [isOpen, setIsOpen] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState<Message[]>([
    { role: 'bot', text: '¡Buenas, fanatico! Soy LIO. Estoy acá para darte una mano con las estadísticas, sacarte cualquier duda o hasta cambiar los precios de las canchas y las bebidas si me lo pedís. ¿En qué te puedo ayudar hoy?' }
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages, isOpen]);

  useEffect(() => {
    const subscription = supabase
      .channel('bot:notifications')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications' }, payload => {
        const type = payload.new.type;
        if (type === 'booking') {
          const message = payload.new.message.split('|')[0];
          setChatMessages(prev => [...prev, { role: 'bot', text: `¡Che! ${message}. Revisá el panel para más detalles.` }]);
        } else if (type === 'stock') {
          setChatMessages(prev => [...prev, { role: 'bot', text: '¡Atención! Hay productos con stock bajo, ¿querés reponerlos?' }]);
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, []);

  const updatePitchPrice: FunctionDeclaration = {
    name: "updatePitchPrice",
    parameters: {
      type: Type.OBJECT,
      description: "Actualiza el precio de una cancha de fútbol.",
      properties: {
        pitchId: {
          type: Type.STRING,
          description: "El ID de la cancha (ej: p1, p2, p3).",
        },
        newPrice: {
          type: Type.NUMBER,
          description: "El nuevo precio para la cancha.",
        },
      },
      required: ["pitchId", "newPrice"],
    },
  };

  const updateProductPrice: FunctionDeclaration = {
    name: "updateProductPrice",
    parameters: {
      type: Type.OBJECT,
      description: "Actualiza el precio de un producto del bar (bebida).",
      properties: {
        productId: {
          type: Type.STRING,
          description: "El ID del producto (ej: pr1, pr2).",
        },
        newPrice: {
          type: Type.NUMBER,
          description: "El nuevo precio para el producto.",
        },
      },
      required: ["productId", "newPrice"],
    },
  };

  const cancelBooking: FunctionDeclaration = {
    name: "cancelBooking",
    parameters: {
      type: Type.OBJECT,
      description: "Cancela una reserva de cancha existente.",
      properties: {
        pitchId: {
          type: Type.STRING,
          description: "El ID de la cancha (ej: p1, p2, p3).",
        },
        date: {
          type: Type.STRING,
          description: "La fecha de la reserva en formato YYYY-MM-DD.",
        },
        hour: {
          type: Type.NUMBER,
          description: "La hora de inicio de la reserva (ej: 14, 15, 20).",
        },
      },
      required: ["pitchId", "date", "hour"],
    },
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const userMsg = chatInput;
    setChatMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setChatInput('');
    setIsTyping(true);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });
      
      const [pitches, products, bookingsRaw] = await Promise.all([
        dataService.getPitches(),
        dataService.getProducts(),
        dataService.getBookings()
      ]);
      const bookings = bookingsRaw;

      const systemInstruction = `
       Eres LIO, asistente argentino para dueños de fútbol 5.
Hablas informal (che, viste, crack).
Puedes:
- Ver estadísticas
- Cambiar precios
- Cancelar reservas
No puedes modificar UI.
      `;

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: userMsg,
        config: { 
          systemInstruction,
          tools: [{ functionDeclarations: [updatePitchPrice, updateProductPrice, cancelBooking] }]
        }
      });

      const functionCalls = response.functionCalls;
      if (functionCalls) {
        for (const call of functionCalls) {
          if (call.name === "updatePitchPrice") {
            const { pitchId, newPrice } = call.args as { pitchId: string, newPrice: number };
            await api.updatePitch(pitchId, { price: newPrice });
            setChatMessages(prev => [...prev, { role: 'bot', text: `He actualizado el precio de la cancha ${pitchId} a $${newPrice} correctamente.` }]);
          } else if (call.name === "updateProductPrice") {
            const { productId, newPrice } = call.args as { productId: string, newPrice: number };
            await api.updateProduct(productId, { price: newPrice });
            setChatMessages(prev => [...prev, { role: 'bot', text: `He actualizado el precio del producto ${productId} a $${newPrice} correctamente.` }]);
          } else if (call.name === "cancelBooking") {
            const { pitchId, date, hour } = call.args as { pitchId: string, date: string, hour: number };
            const currentBookings = await dataService.getBookings();
            const bookingToCancel = currentBookings.find(b => 
              b.pitchId === pitchId && 
              b.status === 'confirmed' &&
              b.startTime.toISOString().startsWith(date) &&
              b.startTime.getHours() === hour
            );

            if (bookingToCancel) {
              await api.cancelBooking(bookingToCancel.id);
              setChatMessages(prev => [...prev, { role: 'bot', text: `He cancelado la reserva de la cancha ${pitchId} para el día ${date} a las ${hour}:00 hs.` }]);
            } else {
              setChatMessages(prev => [...prev, { role: 'bot', text: `No encontré ninguna reserva confirmada para la cancha ${pitchId} el día ${date} a las ${hour}:00 hs.` }]);
            }
          }
        }
      } else {
        const botResponse = response.text || "Lo siento, no pude procesar tu solicitud.";
        setChatMessages(prev => [...prev, { role: 'bot', text: botResponse }]);
      }
    } catch (error) {
      console.error("AI Error:", error);
      setChatMessages(prev => [...prev, { role: 'bot', text: "Hubo un error al conectar con el asistente. Por favor, intenta de nuevo más tarde." }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <>
      {/* Floating Button (The "Gauchito Mascot") */}
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "fixed bottom-8 right-8 w-20 h-20 rounded-full flex items-center justify-center z-50 transition-all group",
          isOpen 
            ? "bg-white text-zinc-900 shadow-2xl border border-zinc-200" 
            : "bg-transparent"
        )}
      >
        {isOpen ? (
          <X className="w-8 h-8" />
        ) : (
          <div className="relative w-full h-full flex items-center justify-center">
            {/* The "Pelota Gauchita" Mascot */}
            <div className="relative w-16 h-16 bg-sky-400 rounded-full border-4 border-zinc-900 shadow-xl flex items-center justify-center overflow-visible">
              {/* Soccer Ball Pattern (Emoji Style ⚽) */}
              <div className="absolute inset-0 rounded-full overflow-hidden pointer-events-none">
                {/* Central Pentagon */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-6 bg-zinc-900" style={{ clipPath: 'polygon(50% 0%, 100% 38%, 82% 100%, 18% 100%, 0% 38%)' }} />
                
                {/* Lines connecting pentagons */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-0.5 bg-zinc-900/40 rotate-0" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-0.5 bg-zinc-900/40 rotate-[72deg]" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-0.5 bg-zinc-900/40 rotate-[144deg]" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-0.5 bg-zinc-900/40 rotate-[216deg]" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-0.5 bg-zinc-900/40 rotate-[288deg]" />

                {/* Surrounding partial pentagons */}
                <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-5 h-5 bg-zinc-900" style={{ clipPath: 'polygon(50% 0%, 100% 38%, 82% 100%, 18% 100%, 0% 38%)' }} />
                <div className="absolute top-2 -left-2 w-5 h-5 bg-zinc-900 rotate-[-45deg]" style={{ clipPath: 'polygon(50% 0%, 100% 38%, 82% 100%, 18% 100%, 0% 38%)' }} />
                <div className="absolute top-2 -right-2 w-5 h-5 bg-zinc-900 rotate-[45deg]" style={{ clipPath: 'polygon(50% 0%, 100% 38%, 82% 100%, 18% 100%, 0% 38%)' }} />
                <div className="absolute -bottom-2 left-2 w-5 h-5 bg-zinc-900 rotate-[180deg]" style={{ clipPath: 'polygon(50% 0%, 100% 38%, 82% 100%, 18% 100%, 0% 38%)' }} />
                <div className="absolute -bottom-2 right-2 w-5 h-5 bg-zinc-900 rotate-[180deg]" style={{ clipPath: 'polygon(50% 0%, 100% 38%, 82% 100%, 18% 100%, 0% 38%)' }} />
              </div>

              {/* Eyes */}
              <div className="relative z-20 flex gap-3 mt-1">
                <div className="w-3 h-3 bg-zinc-900 rounded-full flex items-center justify-center">
                  <div className="w-1 h-1 bg-white rounded-full -mt-1 -ml-1" />
                </div>
                <div className="w-3 h-3 bg-zinc-900 rounded-full flex items-center justify-center">
                  <div className="w-1 h-1 bg-white rounded-full -mt-1 -ml-1" />
                </div>
              </div>

              {/* Smile */}
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 w-6 h-3 border-b-2 border-zinc-900 rounded-full" />
            </div>
            
            {/* Notification Badge */}
            <div className="absolute top-2 right-2 w-5 h-5 bg-yellow-500 rounded-full border-2 border-white flex items-center justify-center shadow-lg z-50">
              <span className="text-[8px] font-black text-zinc-900">!</span>
            </div>
          </div>
        )}
      </motion.button>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-0 right-0 w-full h-[100dvh] sm:bottom-28 sm:right-8 sm:w-[400px] sm:h-[600px] sm:max-h-[700px] bg-white sm:rounded-[32px] shadow-2xl z-[60] overflow-hidden border-t sm:border border-zinc-200 flex flex-col"
          >
            {/* Header - SaaS Premium Style */}
            <div className="px-6 py-5 bg-white border-b border-zinc-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-10 h-10 bg-sky-50 rounded-xl flex items-center justify-center border border-sky-100">
                    <User className="w-6 h-6 text-sky-500" />
                  </div>
                  <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 border-2 border-white rounded-full" />
                </div>
                <div>
                  <h3 className="font-bold text-zinc-900 text-sm leading-none">LIO</h3>
                  <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest mt-1">En línea ahora</p>
                </div>
              </div>
              <button 
                onClick={() => setIsOpen(false)}
                className="p-2 hover:bg-zinc-50 rounded-xl transition-colors text-zinc-400 hover:text-zinc-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-zinc-50/30 scroll-smooth">
              {chatMessages.map((msg, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={cn(
                    "flex flex-col max-w-[80%]",
                    msg.role === 'user' ? "ml-auto items-end" : "mr-auto items-start"
                  )}
                >
                  <div className={cn(
                    "px-4 py-3 text-sm font-medium leading-relaxed shadow-sm",
                    msg.role === 'user' 
                      ? "bg-sky-600 text-white rounded-2xl rounded-tr-none" 
                      : "bg-white text-zinc-700 rounded-2xl rounded-tl-none border border-zinc-100"
                  )}>
                    {msg.text}
                  </div>
                  <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-tighter mt-1.5 px-1">
                    {msg.role === 'user' ? 'Tú' : 'Lio'} • {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </motion.div>
              ))}
              
              {isTyping && (
                <div className="flex flex-col items-start max-w-[80%] mr-auto">
                  <div className="bg-white border border-zinc-100 px-4 py-3 rounded-2xl rounded-tl-none flex gap-1.5 shadow-sm">
                    <span className="w-1.5 h-1.5 bg-sky-400 rounded-full animate-bounce" />
                    <span className="w-1.5 h-1.5 bg-sky-400 rounded-full animate-bounce [animation-delay:0.2s]" />
                    <span className="w-1.5 h-1.5 bg-sky-400 rounded-full animate-bounce [animation-delay:0.4s]" />
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 bg-white border-t border-zinc-100">
              {/* Quick Actions - Minimal Pills */}
              <div className="mb-4 flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                {[
                  { label: "Precios", text: "Cambia el precio de la Cancha 1 a $1800" },
                  { label: "Ventas", text: "¿Cómo van las ventas?" },
                  { label: "Cancelar", text: "Cancela el turno de la Cancha 1 para hoy a las 20hs" }
                ].map((action, idx) => (
                  <button 
                    key={idx}
                    onClick={() => setChatInput(action.text)}
                    className="whitespace-nowrap text-[10px] font-bold text-zinc-500 uppercase tracking-widest border border-zinc-200 px-3 py-2 rounded-full hover:bg-sky-50 hover:border-sky-200 hover:text-sky-600 transition-all"
                  >
                    {action.label}
                  </button>
                ))}
              </div>

              <form onSubmit={handleSendMessage} className="relative flex items-center gap-2">
                <div className="relative flex-1">
                  <input 
                    type="text"
                    placeholder="Escribe tu mensaje..."
                    className="w-full bg-zinc-50 border border-zinc-200 rounded-2xl py-3.5 pl-5 pr-12 text-sm font-medium focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 outline-none transition-all text-zinc-900 placeholder:text-zinc-400"
                    value={chatInput}
                    onChange={e => setChatInput(e.target.value)}
                  />
                  <button 
                    type="submit"
                    disabled={!chatInput.trim() || isTyping}
                    className="absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 bg-sky-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-sky-600/20 hover:bg-sky-500 transition-all disabled:opacity-50 disabled:grayscale"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </form>
              <p className="text-[9px] text-center text-zinc-400 font-medium mt-3 uppercase tracking-widest">
                Desarrollado por Golazo AI
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
