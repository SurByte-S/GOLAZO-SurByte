import { Pitch, Booking, Product, Sale, User, AuditLog, BookingStatus } from '../types';
import { addHours, startOfDay, endOfDay, isSameDay } from 'date-fns';
import { supabaseService } from './supabaseService';

// Initial Mock Data (Fallback)
const MOCK_PITCHES: Pitch[] = [
  { id: 'p1', name: 'Cancha 1', type: 'F5', price: 1500, active: true },
  { id: 'p2', name: 'Cancha 2', type: 'F5', price: 1500, active: true },
  { id: 'p3', name: 'Cancha 3', type: 'F7', price: 2200, active: true },
];

const MOCK_PRODUCTS: Product[] = [
  { id: 'pr1', name: 'Agua Mineral 500ml', price: 200, category: 'bebida', stock: 50, min_stock: 10, active: true },
  { id: 'pr2', name: 'Gatorade 500ml', price: 350, category: 'bebida', stock: 30, min_stock: 5, active: true },
  { id: 'pr3', name: 'Coca Cola 500ml', price: 300, category: 'bebida', stock: 40, min_stock: 10, active: true },
  { id: 'pr4', name: 'Cerveza 1L', price: 800, category: 'bebida', stock: 20, min_stock: 5, active: true },
];

const MOCK_BOOKINGS: Booking[] = [
  {
    id: 'b1',
    pitchId: 'p1',
    userId: 'cliente@gmail.com',
    clientName: 'Juan Pérez',
    clientPhone: '1122334455',
    startTime: new Date(new Date().setHours(new Date().getHours() - 2)),
    endTime: new Date(new Date().setHours(new Date().getHours() - 1)),
    status: 'confirmed',
    createdAt: new Date(),
    depositAmount: 500,
    isPaid: true
  },
  {
    id: 'b2',
    pitchId: 'p2',
    userId: 'cliente@gmail.com',
    clientName: 'María García',
    clientPhone: '1199887766',
    startTime: new Date(new Date().setHours(new Date().getHours() + 1)),
    endTime: new Date(new Date().setHours(new Date().getHours() + 2)),
    status: 'pending',
    createdAt: new Date(),
    depositAmount: 500,
    isPaid: false
  },
  {
    id: 'b3',
    pitchId: 'p3',
    userId: 'cliente2@gmail.com',
    clientName: 'Roberto Gómez',
    clientPhone: '1155667788',
    startTime: new Date(new Date().setHours(new Date().getHours() + 4)),
    endTime: new Date(new Date().setHours(new Date().getHours() + 5)),
    status: 'confirmed',
    createdAt: new Date(),
    depositAmount: 500,
    isPaid: true
  }
];

// Helper to get from localStorage or use mock
const getStorage = <T>(key: string, initial: T): T => {
  const stored = localStorage.getItem(key);
  if (!stored) return initial;
  try {
    const parsed = JSON.parse(stored);
    // Convert date strings back to Date objects
    return parsed.map((item: any) => {
      const newItem = { ...item };
      if (newItem.startTime) newItem.startTime = new Date(newItem.startTime);
      if (newItem.endTime) newItem.endTime = new Date(newItem.endTime);
      if (newItem.createdAt) newItem.createdAt = new Date(newItem.createdAt);
      if (newItem.date) newItem.date = new Date(newItem.date);
      return newItem;
    });
  } catch {
    return initial;
  }
};

const setStorage = <T>(key: string, data: T) => {
  localStorage.setItem(key, JSON.stringify(data));
};

const isSupabaseConfigured = () => {
  const url = import.meta.env.VITE_SUPABASE_URL;
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
  const configured = !!url && !!key && url !== "" && key !== "";
  if (!configured) {
    // Only log once to avoid spam
    if (!(window as any)._supabaseWarned) {
      console.warn('[DataService] Supabase not configured. Using LocalStorage fallback.');
      (window as any)._supabaseWarned = true;
    }
  }
  return configured;
};

export const dataService = {
  isSupabaseConfigured,
  checkConnection: async () => {
    if (!isSupabaseConfigured()) return false;
    return await supabaseService.testConnection();
  },
  // Pitches
  getPitches: async () => {
    if (isSupabaseConfigured()) {
      try {
        return await supabaseService.getPitches();
      } catch (error) {
        console.error('Error fetching pitches from Supabase:', error);
      }
    }
    return getStorage<Pitch[]>('golazo_pitches', MOCK_PITCHES);
  },
  savePitches: async (pitches: Pitch[]) => {
    if (isSupabaseConfigured()) {
      // Typically handled by individual add/update/delete calls in Supabase
    }
    setStorage('golazo_pitches', pitches);
  },
  
  // Bookings
  getBookings: async () => {
    if (isSupabaseConfigured()) {
      try {
        return await supabaseService.getBookings();
      } catch (error) {
        console.error('Error fetching bookings from Supabase:', error);
      }
    }
    const bookings = getStorage<Booking[]>('golazo_bookings', MOCK_BOOKINGS);
    const now = new Date();
    let hasChanges = false;

    const updatedBookings = bookings.map(b => {
      if ((b.status === 'confirmed' || b.status === 'pending') && b.endTime < now) {
        hasChanges = true;
        return { ...b, status: 'finished' as const };
      }
      return b;
    });

    if (hasChanges) {
      dataService.saveBookings(updatedBookings);
    }

    return updatedBookings;
  },
  saveBookings: async (bookings: Booking[]) => setStorage('golazo_bookings', bookings),
  
  // Products
  getProducts: async () => {
    if (isSupabaseConfigured()) {
      try {
        return await supabaseService.getProducts();
      } catch (error) {
        console.error('Error fetching products from Supabase:', error);
      }
    }
    return getStorage<Product[]>('golazo_products', MOCK_PRODUCTS);
  },
  saveProducts: async (products: Product[]) => setStorage('golazo_products', products),
  
  // Sales
  getSales: async () => {
    if (isSupabaseConfigured()) {
      try {
        return await supabaseService.getSales();
      } catch (error) {
        console.error('Error fetching sales from Supabase:', error);
      }
    }
    const sales = getStorage<Sale[]>('golazo_sales', []);
    return sales.map(s => ({
      ...s,
      totalPrice: typeof s.totalPrice === 'object' && s.totalPrice !== null ? Number((s.totalPrice as any).total) || 0 : Number(s.totalPrice) || 0,
    }));
  },
  saveSales: async (sales: Sale[]) => setStorage('golazo_sales', sales),

  // Auth Simulation (Supabase Auth can be integrated later)
  getCurrentUser: () => {
    const user = localStorage.getItem('golazo_user');
    if (!user) return null;
    try {
      return JSON.parse(user) as User;
    } catch {
      return null;
    }
  },
  login: async (identifier: string, password?: string) => {
    // Super Admin check
    if (identifier === 'superman@gmail.com') {
      const user: User = {
        id: identifier,
        email: identifier,
        name: 'Super Admin Golazo',
        role: 'superadmin'
      };
      localStorage.setItem('golazo_user', JSON.stringify(user));
      dataService.trackOnlineUser(user);
      return user;
    }

    // Admin check
    if (identifier === 'admin@gmail.com') {
      if (password !== 'admin123') {
        throw new Error('Contraseña de administrador incorrecta');
      }
      const user: User = { 
        id: identifier,
        email: identifier,
        name: 'Administrador',
        role: 'admin' 
      };
      localStorage.setItem('golazo_user', JSON.stringify(user));
      dataService.trackOnlineUser(user);
      return user;
    }

    // Client check (Email or Phone)
    const isEmail = identifier.includes('@');
    const user: User = {
      id: identifier,
      email: isEmail ? identifier : undefined,
      phone: !isEmail ? identifier : undefined,
      name: identifier.split('@')[0],
      role: 'client'
    };
    localStorage.setItem('golazo_user', JSON.stringify(user));
    dataService.trackOnlineUser(user);
    return user;
  },
  logout: () => {
    const user = dataService.getCurrentUser();
    if (user) {
      dataService.untrackOnlineUser(user.id);
    }
    localStorage.removeItem('golazo_user');
  },

  // Online Users Tracking (Simulation)
  getOnlineUsers: () => getStorage<User[]>('golazo_online_users', []),
  trackOnlineUser: (user: User) => {
    const online = dataService.getOnlineUsers();
    if (!online.find(u => u.id === user.id)) {
      setStorage('golazo_online_users', [...online, user]);
    }
  },
  untrackOnlineUser: (userId: string) => {
    const online = dataService.getOnlineUsers();
    setStorage('golazo_online_users', online.filter(u => u.id !== userId));
  },

  // Loyalty & Ranking
  getUserPoints: async (userId: string) => {
    const bookings = await dataService.getBookings();
    // 1 point per confirmed booking, 1.5 for promotional hours (10-16)
    return bookings
      .filter(b => b.userId === userId && (b.status === 'confirmed' || b.status === 'finished'))
      .reduce((acc, b) => {
        const hour = b.startTime.getHours();
        const isPromo = hour >= 10 && hour <= 16;
        return acc + (isPromo ? 1.5 : 1);
      }, 0);
  },

  getRanking: async () => {
    const bookings = await dataService.getBookings();
    const confirmedBookings = bookings.filter(b => b.status === 'confirmed' || b.status === 'finished');
    
    const userStats: Record<string, { id: string, name: string, points: number }> = {};
    
    confirmedBookings.forEach(b => {
      if (!userStats[b.userId]) {
        userStats[b.userId] = { 
          id: b.userId, 
          name: b.clientName || b.userId.split('@')[0], 
          points: 0 
        };
      }
      const hour = b.startTime.getHours();
      const isPromo = hour >= 10 && hour <= 16;
      userStats[b.userId].points += isPromo ? 1.5 : 1;
    });

    return Object.values(userStats).sort((a, b) => b.points - a.points);
  },

  // Audit Logs
  getAuditLogs: async () => {
    if (isSupabaseConfigured()) {
      try {
        return await supabaseService.getAuditLogs();
      } catch (error) {
        console.error('Error fetching audit logs from Supabase:', error);
      }
    }
    const logs = getStorage<AuditLog[]>('golazo_audit_logs', []);
    return logs.map(l => ({
      ...l,
      timestamp: new Date(l.timestamp)
    }));
  },
  saveAuditLogs: async (logs: AuditLog[]) => setStorage('golazo_audit_logs', logs),
  logAction: async (action: string, details: string) => {
    const user = dataService.getCurrentUser();
    if (isSupabaseConfigured()) {
      try {
        await supabaseService.logAction(action, details, user?.name);
      } catch (error) {
        console.error('Error logging action to Supabase:', error);
      }
    }
    const logs = await dataService.getAuditLogs();
    const newLog: AuditLog = {
      id: Math.random().toString(36).substr(2, 9),
      action,
      details,
      timestamp: new Date(),
      user: user?.name || 'Sistema'
    };
    dataService.saveAuditLogs([newLog, ...logs].slice(0, 100)); // Keep last 100
  },

  // Deactivated Slots
  getDeactivatedSlots: async () => {
    if (isSupabaseConfigured()) {
      try {
        const slots = await supabaseService.getDeactivatedSlots();
        return new Set(slots.map(s => `${s.slot_date}-${s.slot_hour}-${s.pitch_id}`));
      } catch (error) {
        console.error('Error fetching deactivated slots from Supabase:', error);
      }
    }
    return new Set<string>();
  },
  toggleDeactivatedSlot: async (pitchId: string, date: string, hour: number) => {
    if (isSupabaseConfigured()) {
      try {
        await supabaseService.toggleDeactivatedSlot(pitchId, date, hour);
      } catch (error) {
        console.error('Error toggling deactivated slot in Supabase:', error);
      }
    }
  }
};

// High level API
export const api = {
  // Bookings
  addBooking: async (booking: Omit<Booking, 'id' | 'createdAt'>) => {
    if (isSupabaseConfigured()) {
      try {
        return await supabaseService.addBooking(booking);
      } catch (error) {
        console.error('Error adding booking to Supabase:', error);
        throw error;
      }
    }
    const bookings = await dataService.getBookings();
    
    // Overlap check
    const hasOverlap = bookings.some(existing => {
      if (existing.pitchId !== booking.pitchId || existing.status === 'cancelled') return false;
      return (
        (booking.startTime >= existing.startTime && booking.startTime < existing.endTime) ||
        (booking.endTime > existing.startTime && booking.endTime <= existing.endTime) ||
        (booking.startTime <= existing.startTime && booking.endTime >= existing.endTime)
      );
    });

    if (hasOverlap) throw new Error('Horario ocupado en esta cancha.');

    const newBooking: Booking = {
      ...booking,
      id: Math.random().toString(36).substr(2, 9),
      createdAt: new Date(),
    };
    
    dataService.saveBookings([...bookings, newBooking]);
    return newBooking;
  },

  cancelBooking: async (id: string) => {
    if (isSupabaseConfigured()) {
      try {
        return await supabaseService.cancelBooking(id);
      } catch (error) {
        console.error('Error cancelling booking in Supabase:', error);
      }
    }
    const bookings = await dataService.getBookings();
    const updated = bookings.map(b => b.id === id ? { ...b, status: 'cancelled' as const } : b);
    dataService.saveBookings(updated);
  },

  updateBookingStatus: async (id: string, status: BookingStatus) => {
    if (isSupabaseConfigured()) {
      try {
        return await supabaseService.updateBookingStatus(id, status);
      } catch (error) {
        console.error('Error updating booking status in Supabase:', error);
      }
    }
    const bookings = await dataService.getBookings();
    const updated = bookings.map(b => b.id === id ? { ...b, status } : b);
    dataService.saveBookings(updated);
    dataService.logAction('Estado de Reserva Actualizado', `Reserva ${id} cambiada a ${status}`);
  },

  toggleBookingPayment: async (id: string) => {
    const bookings = await dataService.getBookings();
    const booking = bookings.find(b => b.id === id);
    if (!booking) return;

    if (isSupabaseConfigured()) {
      try {
        return await supabaseService.toggleBookingPayment(id, !booking.isPaid);
      } catch (error) {
        console.error('Error toggling booking payment in Supabase:', error);
      }
    }
    const updated = bookings.map(b => b.id === id ? { ...b, isPaid: !b.isPaid } : b);
    dataService.saveBookings(updated);
    dataService.logAction('Pago de Reserva Actualizado', `Estado de pago de reserva ${id} cambiado`);
  },

  // Sales
  addSale: async (productId: string, quantity: number, paymentMethod?: 'efectivo' | 'transferencia') => {
    const products = await dataService.getProducts();
    const product = products.find(p => p.id === productId);
    if (!product) throw new Error('Producto no encontrado');

    if (product.stock < quantity) {
      throw new Error('Stock insuficiente');
    }

    if (isSupabaseConfigured()) {
      try {
        return await supabaseService.addSale({
          productId,
          quantity,
          totalPrice: product.price * quantity,
          date: new Date(),
          paymentMethod
        });
      } catch (error) {
        console.error('Error adding sale to Supabase:', error);
        throw error; // Let the UI handle the error
      }
    }

    // Deduct stock locally
    const updatedProducts = products.map(p => 
      p.id === productId ? { ...p, stock: p.stock - quantity } : p
    );
    await dataService.saveProducts(updatedProducts);

    const sales = await dataService.getSales();
    const saleId = Math.random().toString(36).substr(2, 9);
    const newSale: Sale = {
      id: saleId,
      productId,
      quantity,
      totalPrice: product.price * quantity,
      date: new Date(),
      paymentMethod,
      items: [{
        id: Math.random().toString(36).substr(2, 9),
        saleId,
        productId,
        quantity,
        price: product.price
      }]
    };
    
    dataService.saveSales([...sales, newSale]);
    return newSale;
  },

  deleteSale: async (id: string) => {
    if (isSupabaseConfigured()) {
      try {
        return await supabaseService.deleteSale(id);
      } catch (error) {
        console.error('Error deleting sale from Supabase:', error);
      }
    }
    const sales = await dataService.getSales();
    const sale = sales.find(s => s.id === id);
    
    if (sale) {
      // Restore stock locally
      const products = await dataService.getProducts();
      const updatedProducts = products.map(p => 
        p.id === sale.productId ? { ...p, stock: p.stock + sale.quantity } : p
      );
      await dataService.saveProducts(updatedProducts);
    }

    dataService.saveSales(sales.filter(s => s.id !== id));
    dataService.logAction('Venta Eliminada', `Se eliminó la venta de ${sale?.productId || id}`);
  },

  // Products CRUD
  addProduct: async (product: Omit<Product, 'id'>) => {
    if (isSupabaseConfigured()) {
      try {
        return await supabaseService.addProduct(product);
      } catch (error) {
        console.error('Error adding product to Supabase:', error);
      }
    }
    const products = await dataService.getProducts();
    const newProduct = { ...product, id: Math.random().toString(36).substr(2, 9) };
    dataService.saveProducts([...products, newProduct]);
    dataService.logAction('Producto Creado', `Se creó el producto ${product.name}`);
    return newProduct;
  },

  updateProduct: async (id: string, updates: Partial<Product>) => {
    if (isSupabaseConfigured()) {
      try {
        return await supabaseService.updateProduct(id, updates);
      } catch (error) {
        console.error('Error updating product in Supabase:', error);
      }
    }
    const products = await dataService.getProducts();
    const product = products.find(p => p.id === id);
    const updated = products.map(p => p.id === id ? { ...p, ...updates } : p);
    dataService.saveProducts(updated);
    dataService.logAction('Producto Actualizado', `Se actualizó el producto ${product?.name || id}`);
  },

  deleteProduct: async (id: string) => {
    if (isSupabaseConfigured()) {
      try {
        return await supabaseService.deleteProduct(id);
      } catch (error) {
        console.error('Error deleting product from Supabase:', error);
      }
    }
    const products = await dataService.getProducts();
    const product = products.find(p => p.id === id);
    dataService.saveProducts(products.filter(p => p.id !== id));
    dataService.logAction('Producto Eliminado', `Se eliminó el producto ${product?.name || id}`);
  },

  bulkUpdateStock: async (updates: { productId: string; quantityToAdd: number; newStock: number }[]) => {
    if (isSupabaseConfigured()) {
      try {
        return await supabaseService.bulkUpdateStock(updates);
      } catch (error) {
        console.error('Error in bulk stock update in Supabase:', error);
        throw error;
      }
    }
    
    const products = await dataService.getProducts();
    const updatedProducts = products.map(p => {
      const update = updates.find(u => u.productId === p.id);
      if (update) {
        return { ...p, stock: update.newStock };
      }
      return p;
    });
    
    await dataService.saveProducts(updatedProducts);
    dataService.logAction('Stock Actualizado', `Se actualizó el stock de ${updates.length} productos`);
  },

  // Pitches CRUD
  addPitch: async (pitch: Omit<Pitch, 'id'>) => {
    if (isSupabaseConfigured()) {
      try {
        return await supabaseService.addPitch(pitch);
      } catch (error) {
        console.error('Error adding pitch to Supabase:', error);
      }
    }
    const pitches = await dataService.getPitches();
    const newPitch = { ...pitch, id: Math.random().toString(36).substr(2, 9) };
    dataService.savePitches([...pitches, newPitch]);
    dataService.logAction('Cancha Creada', `Se creó la cancha ${pitch.name}`);
    return newPitch;
  },

  updatePitch: async (id: string, updates: Partial<Pitch>) => {
    if (isSupabaseConfigured()) {
      try {
        return await supabaseService.updatePitch(id, updates);
      } catch (error) {
        console.error('Error updating pitch in Supabase:', error);
      }
    }
    const pitches = await dataService.getPitches();
    const pitch = pitches.find(p => p.id === id);
    const updated = pitches.map(p => p.id === id ? { ...p, ...updates } : p);
    dataService.savePitches(updated);
    dataService.logAction('Cancha Actualizada', `Se actualizó la cancha ${pitch?.name || id}`);
  },

  deletePitch: async (id: string) => {
    if (isSupabaseConfigured()) {
      try {
        return await supabaseService.deletePitch(id);
      } catch (error) {
        console.error('Error deleting pitch from Supabase:', error);
      }
    }
    const pitches = await dataService.getPitches();
    const pitch = pitches.find(p => p.id === id);
    dataService.savePitches(pitches.filter(p => p.id !== id));
    dataService.logAction('Cancha Eliminada', `Se eliminó la cancha ${pitch?.name || id}`);
  }
};
