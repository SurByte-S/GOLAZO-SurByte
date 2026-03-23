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
import { cn } from '../lib/utils';

import ArgentinaCountdown from './ArgentinaCountdown';

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
      
      const pitches = dataService.getPitches();
      const products = dataService.getProducts();
      const bookings = dataService.getBookings();

      const systemInstruction = `
        Eres "LIO", un asistente experto y muy argentino para dueños de complejos de fútbol 5.
        
        Tu personalidad:
        - Hablas como un gaucho moderno, amable y servicial, pero con la humildad y el carisma de un grande.
        - Usas expresiones argentinas como "fanatico", "che", "viste", "un lujo", "meta nomás".
        - Eres muy profesional pero con ese toque campero y futbolero.
        - Tu estado actual es "En la cancha...", listo para jugar.
        
        Tus capacidades:
        1. Responder dudas sobre el negocio y estadísticas.
        2. Cambiar precios de canchas usando la herramienta 'updatePitchPrice'.
        3. Cambiar precios de bebidas usando la herramienta 'updateProductPrice'.
        4. Cancelar reservas de canchas usando la herramienta 'cancelBooking'.
        
        Novedades:
        - Todas las reservas ahora requieren una seña anticipada y la carga de un comprobante de transferencia (MP, etc.).
        - El horario de atención es de 14:00 a 01:00 hs.
        
        Limitaciones IMPORTANTES:
        - NO puedes cambiar nada de la interfaz (UI), diseño o código de la página. Explica que eso solo lo pueden hacer los programadores.
        - Solo puedes cambiar precios de canchas, productos y cancelar reservas.
        
        Contexto actual:
        - Canchas disponibles: ${JSON.stringify(pitches)}
        - Productos disponibles: ${JSON.stringify(products)}
        - Reservas actuales (solo confirmadas): ${JSON.stringify(bookings.filter(b => b.status === 'confirmed'))}
        
        Para cancelar una reserva, necesitas el pitchId, la fecha (YYYY-MM-DD) y la hora.
        Responde siempre manteniendo tu personaje de Gaucho Argento.
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
            const bookings = dataService.getBookings();
            const bookingToCancel = bookings.find(b => 
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
      {/* Argentina Countdown Floating */}
      {!isOpen && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="fixed bottom-32 right-8 z-40"
        >
          <ArgentinaCountdown variant="floating" />
        </motion.div>
      )}

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
            className="fixed bottom-28 right-4 md:right-8 w-[calc(100vw-2rem)] md:w-[400px] h-[calc(100vh-12rem)] md:h-[600px] max-h-[700px] bg-white rounded-[32px] shadow-2xl z-50 overflow-hidden border border-zinc-200 flex flex-col"
          >
            {/* Header */}
            <div className="p-6 bg-gradient-to-r from-sky-500 via-white to-sky-500 text-zinc-900 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-zinc-100 rounded-xl flex items-center justify-center shadow-lg">
                  <User className="w-6 h-6 text-sky-400" />
                </div>
                <div>
                  <h3 className="font-black text-sm tracking-tight">LIO</h3>
                  <p className="text-[10px] font-bold text-sky-700 uppercase tracking-widest">En la cancha...</p>
                </div>
              </div>
              <button 
                onClick={() => setIsOpen(false)}
                className="p-2 hover:bg-sky-100 rounded-xl transition-colors text-sky-900"
              >
                <ChevronDown className="w-5 h-5" />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4 scrollbar-hide">
              {chatMessages.map((msg, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: msg.role === 'user' ? 20 : -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className={cn(
                    "max-w-[85%] p-4 rounded-2xl text-sm font-medium leading-relaxed shadow-sm",
                    msg.role === 'user' 
                      ? "bg-sky-500 text-white ml-auto rounded-tr-none" 
                      : "bg-zinc-100 text-zinc-900 mr-auto rounded-tl-none border-l-4 border-sky-400"
                  )}
                >
                  {msg.text}
                </motion.div>
              ))}
              {isTyping && (
                <div className="bg-zinc-100 text-zinc-500 p-4 rounded-2xl rounded-tl-none mr-auto flex gap-1">
                  <span className="w-1.5 h-1.5 bg-zinc-500 rounded-full animate-bounce" />
                  <span className="w-1.5 h-1.5 bg-zinc-500 rounded-full animate-bounce [animation-delay:0.2s]" />
                  <span className="w-1.5 h-1.5 bg-zinc-500 rounded-full animate-bounce [animation-delay:0.4s]" />
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Input */}
            <div className="p-6 border-t border-zinc-200 bg-zinc-50/50">
              <form onSubmit={handleSendMessage} className="relative">
                <input 
                  type="text"
                  placeholder="Escribe tu mensaje..."
                  className="w-full bg-white border border-zinc-200 rounded-2xl py-4 pl-6 pr-14 text-sm font-medium focus:ring-2 focus:ring-sky-500 outline-none transition-all shadow-sm text-zinc-900"
                  value={chatInput}
                  onChange={e => setChatInput(e.target.value)}
                />
                <button 
                  type="submit"
                  disabled={!chatInput.trim() || isTyping}
                  className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-sky-500 rounded-xl flex items-center justify-center text-white shadow-lg shadow-sky-500/20 hover:bg-sky-400 transition-colors disabled:opacity-50"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
              
              <div className="mt-4 flex flex-wrap gap-2">
                <button 
                  onClick={() => setChatInput("Cambia el precio de la Cancha 1 a $1800")}
                  className="text-[10px] font-black text-zinc-500 uppercase tracking-widest border border-zinc-200 px-3 py-1.5 rounded-full hover:bg-zinc-100 transition-all"
                >
                  Cambiar Precios
                </button>
                <button 
                  onClick={() => setChatInput("¿Cómo van las ventas?")}
                  className="text-[10px] font-black text-zinc-500 uppercase tracking-widest border border-zinc-200 px-3 py-1.5 rounded-full hover:bg-zinc-100 transition-all"
                >
                  Estadísticas
                </button>
                <button 
                  onClick={() => setChatInput("Cancela el turno de la Cancha 1 para hoy a las 20hs")}
                  className="text-[10px] font-black text-zinc-500 uppercase tracking-widest border border-zinc-200 px-3 py-1.5 rounded-full hover:bg-zinc-100 transition-all"
                >
                  Cancelar Turnos
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
