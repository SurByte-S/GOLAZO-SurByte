import { supabase } from '../lib/supabase';
import { Pitch, Booking, Product, Sale, User, AuditLog, BookingStatus } from '../types';

const log = (message: string, data?: any) => {
  console.log(`[Supabase Service] ${message}`, data || '');
};

const logError = (message: string, error: any) => {
  console.error(`[Supabase Service Error] ${message}:`, error);
};

export const supabaseService = {
  // Test Connection
  testConnection: async () => {
    try {
      log('Testing connection...');
      const { data, error } = await supabase.from('pitches').select('id').limit(1);
      if (error) throw error;
      log('Connection test successful');
      return true;
    } catch (error) {
      logError('Connection test failed', error);
      return false;
    }
  },

  // Pitches
  getPitches: async () => {
    log('Fetching pitches...');
    const { data, error } = await supabase
      .from('pitches')
      .select('*')
      .order('name');
    
    if (error) {
      logError('Error fetching pitches', error);
      throw error;
    }
    
    log('Pitches fetched successfully', data);
    return (data || []) as Pitch[];
  },

  addPitch: async (pitch: Omit<Pitch, 'id'>) => {
    log('Adding pitch', pitch);
    const { data, error } = await supabase
      .from('pitches')
      .insert([pitch])
      .select()
      .single();
    
    if (error) {
      logError('Error adding pitch', error);
      throw error;
    }
    
    log('Pitch added successfully', data);
    return data as Pitch;
  },

  updatePitch: async (id: string, updates: Partial<Pitch>) => {
    log(`Updating pitch ${id}`, updates);
    const { error } = await supabase
      .from('pitches')
      .update(updates)
      .eq('id', id);
    
    if (error) {
      logError(`Error updating pitch ${id}`, error);
      throw error;
    }
    log(`Pitch ${id} updated successfully`);
  },

  deletePitch: async (id: string) => {
    log(`Deleting pitch ${id}`);
    const { error } = await supabase
      .from('pitches')
      .delete()
      .eq('id', id);
    
    if (error) {
      logError(`Error deleting pitch ${id}`, error);
      throw error;
    }
    log(`Pitch ${id} deleted successfully`);
  },

  // Bookings
  getBookings: async () => {
    log('Fetching bookings...');
    const { data, error } = await supabase
      .from('bookings')
      .select('*')
      .order('start_time', { ascending: true });
    
    if (error) {
      logError('Error fetching bookings', error);
      throw error;
    }
    
    log('Bookings fetched successfully', data);
    
    // Convert snake_case to camelCase and string dates to Date objects
    return (data || []).map(b => ({
      id: b.id,
      pitchId: b.pitch_id,
      userId: b.user_id,
      clientName: b.client_name,
      clientPhone: b.client_phone,
      startTime: new Date(b.start_time),
      endTime: new Date(b.end_time),
      status: b.status,
      createdAt: new Date(b.created_at),
      depositAmount: b.deposit_amount,
      isPaid: b.is_paid
    })) as Booking[];
  },

  addBooking: async (booking: Omit<Booking, 'id' | 'createdAt'>) => {
    log('Adding booking', booking);
    const startTime = booking.startTime;
    const dateStr = startTime.toISOString().split('T')[0];
    const timeStr = startTime.toTimeString().split(' ')[0];

    const { data, error } = await supabase
      .from('bookings')
      .insert([{
        pitch_id: booking.pitchId,
        user_id: booking.userId,
        client_name: booking.clientName,
        client_phone: booking.clientPhone,
        date: dateStr,
        time: timeStr,
        start_time: booking.startTime.toISOString(),
        end_time: booking.endTime.toISOString(),
        status: booking.status,
        deposit_amount: booking.depositAmount || 0,
        is_paid: booking.isPaid || false
      }])
      .select()
      .single();
    
    if (error) {
      logError('Error adding booking', error);
      throw error;
    }
    
    log('Booking added successfully', data);
    return {
      id: data.id,
      pitchId: data.pitch_id,
      userId: data.user_id,
      clientName: data.client_name,
      clientPhone: data.client_phone,
      startTime: new Date(data.start_time),
      endTime: new Date(data.end_time),
      status: data.status,
      createdAt: new Date(data.created_at),
      depositAmount: data.deposit_amount,
      isPaid: data.is_paid
    } as Booking;
  },

  updateBookingStatus: async (id: string, status: BookingStatus) => {
    log(`Updating booking ${id} status to ${status}`);
    const { error } = await supabase
      .from('bookings')
      .update({ status })
      .eq('id', id);
    
    if (error) {
      logError(`Error updating booking ${id} status`, error);
      throw error;
    }
    log(`Booking ${id} status updated successfully`);
  },

  cancelBooking: async (id: string) => {
    log(`Cancelling booking ${id}`);
    const { error } = await supabase
      .from('bookings')
      .update({ status: 'cancelled' })
      .eq('id', id);
    
    if (error) {
      logError(`Error cancelling booking ${id}`, error);
      throw error;
    }
    log(`Booking ${id} cancelled successfully`);
  },

  toggleBookingPayment: async (id: string, isPaid: boolean) => {
    log(`Toggling booking ${id} payment to ${isPaid}`);
    const { error } = await supabase
      .from('bookings')
      .update({ is_paid: isPaid })
      .eq('id', id);
    
    if (error) {
      logError(`Error toggling booking ${id} payment`, error);
      throw error;
    }
    log(`Booking ${id} payment toggled successfully`);
  },

  // Products
  getProducts: async () => {
    log('Fetching products...');
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('name');
    
    if (error) {
      logError('Error fetching products', error);
      throw error;
    }
    
    log('Products fetched successfully', data);
    return (data || []) as Product[];
  },

  addProduct: async (product: Omit<Product, 'id'>) => {
    log('Adding product', product);
    const { data, error } = await supabase
      .from('products')
      .insert([product])
      .select()
      .single();
    
    if (error) {
      logError('Error adding product', error);
      throw error;
    }
    
    log('Product added successfully', data);
    return data as Product;
  },

  updateProduct: async (id: string, updates: Partial<Product>) => {
    log(`Updating product ${id}`, updates);
    const { error } = await supabase
      .from('products')
      .update(updates)
      .eq('id', id);
    
    if (error) {
      logError(`Error updating product ${id}`, error);
      throw error;
    }
    log(`Product ${id} updated successfully`);
  },

  deleteProduct: async (id: string) => {
    log(`Deleting product ${id}`);
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', id);
    
    if (error) {
      logError(`Error deleting product ${id}`, error);
      throw error;
    }
    log(`Product ${id} deleted successfully`);
  },

  bulkUpdateStock: async (updates: { productId: string; quantityToAdd: number; newStock: number }[]) => {
    log(`Bulk updating stock for ${updates.length} products`);
    
    // In Supabase JS, we can't do a single bulk update easily without an RPC.
    // We'll do them sequentially or in parallel.
    const promises = updates.map(async (update) => {
      // Update product stock
      const { error: productError } = await supabase
        .from('products')
        .update({ stock: update.newStock })
        .eq('id', update.productId);
        
      if (productError) throw productError;
      
      // Insert stock movement
      const { error: movementError } = await supabase
        .from('stock_movements')
        .insert([{
          product_id: update.productId,
          quantity: update.quantityToAdd,
          type: 'ajuste',
          source: 'manual'
        }]);
        
      if (movementError) throw movementError;
    });
    
    try {
      await Promise.all(promises);
      log('Bulk stock update successful');
    } catch (error) {
      logError('Error in bulk stock update', error);
      throw error;
    }
  },

  // Sales
  getSales: async () => {
    log('Fetching sales...');
    const { data, error } = await supabase
      .from('sales')
      .select('*, sale_items(*)')
      .order('created_at', { ascending: false });
    
    if (error) {
      logError('Error fetching sales', error);
      throw error;
    }
    
    log('Sales fetched successfully', data);
    return (data || []).map(s => ({
      id: s.id,
      productId: s.product_id,
      quantity: s.quantity,
      totalPrice: s.total_price,
      date: new Date(s.created_at),
      paymentMethod: s.payment_method,
      items: s.sale_items?.map((item: any) => ({
        productId: item.product_id,
        quantity: item.quantity,
        price: item.price
      }))
    })) as Sale[];
  },

  addSale: async (sale: Omit<Sale, 'id'>) => {
    log('Adding sale', sale);
    
    // Check stock first
    const { data: product, error: fetchError } = await supabase
      .from('products')
      .select('stock')
      .eq('id', sale.productId)
      .single();
      
    if (fetchError) {
      logError('Error fetching product stock', fetchError);
      throw fetchError;
    }
    
    if (product.stock < sale.quantity) {
      throw new Error('Stock insuficiente');
    }

    // Deduct stock
    const { error: updateError } = await supabase
      .from('products')
      .update({ stock: product.stock - sale.quantity })
      .eq('id', sale.productId);
      
    if (updateError) {
      logError('Error updating product stock', updateError);
      throw updateError;
    }

    // Insert stock movement for sale
    const { error: movementError } = await supabase
      .from('stock_movements')
      .insert([{
        product_id: sale.productId,
        quantity: -sale.quantity,
        type: 'salida',
        source: 'venta'
      }]);
      
    if (movementError) {
      logError('Error inserting stock movement for sale', movementError);
      // Not throwing here to not fail the sale if only logging fails
    }

    const { data, error } = await supabase
      .from('sales')
      .insert([{
        product_id: sale.productId,
        quantity: sale.quantity,
        total_price: sale.totalPrice,
        amount: sale.totalPrice,
        payment_method: sale.paymentMethod,
        created_at: sale.date.toISOString()
      }])
      .select()
      .single();
    
    if (error) {
      logError('Error adding sale', error);
      throw error;
    }

    // Insert into sale_items
    const { error: itemsError } = await supabase
      .from('sale_items')
      .insert([{
        sale_id: data.id,
        product_id: sale.productId,
        quantity: sale.quantity,
        price: product.price
      }]);

    if (itemsError) {
      logError('Error adding sale items', itemsError);
      // Ideally we would rollback the sale here, but Supabase JS doesn't support transactions
      // without RPC. We'll proceed but log the error.
    }
    
    log('Sale added successfully', data);
    return {
      id: data.id,
      productId: data.product_id,
      quantity: data.quantity,
      totalPrice: data.total_price,
      date: new Date(data.created_at)
    } as Sale;
  },

  deleteSale: async (id: string) => {
    log(`Deleting sale ${id}`);
    
    // Get sale details first to restore stock
    const { data: sale, error: fetchError } = await supabase
      .from('sales')
      .select('product_id, quantity')
      .eq('id', id)
      .single();
      
    if (!fetchError && sale) {
      // Get current product stock
      const { data: product } = await supabase
        .from('products')
        .select('stock')
        .eq('id', sale.product_id)
        .single();
        
      if (product) {
        // Restore stock
        await supabase
          .from('products')
          .update({ stock: product.stock + sale.quantity })
          .eq('id', sale.product_id);
          
        // Insert stock movement for sale deletion
        await supabase
          .from('stock_movements')
          .insert([{
            product_id: sale.product_id,
            quantity: sale.quantity,
            type: 'entrada',
            source: 'ajuste' // or 'cancelacion_venta' if we add that to types
          }]);
      }
    }

    const { error } = await supabase
      .from('sales')
      .delete()
      .eq('id', id);
    
    if (error) {
      logError(`Error deleting sale ${id}`, error);
      throw error;
    }
    log(`Sale ${id} deleted successfully`);
  },

  // Audit Logs
  getAuditLogs: async () => {
    log('Fetching audit logs...');
    const { data, error } = await supabase
      .from('audit_logs')
      .select('*')
      .order('timestamp', { ascending: false })
      .limit(100);
    
    if (error) {
      logError('Error fetching audit logs', error);
      throw error;
    }
    
    log('Audit logs fetched successfully', data);
    return (data || []).map(l => ({
      id: l.id,
      action: l.action,
      details: l.details,
      timestamp: new Date(l.timestamp),
      user: l.user_name
    })) as AuditLog[];
  },

  // Deactivated Slots
  getDeactivatedSlots: async () => {
    log('Fetching deactivated slots...');
    const { data, error } = await supabase
      .from('deactivated_slots')
      .select('*');
    
    if (error) {
      logError('Error fetching deactivated slots', error);
      throw error;
    }
    
    log('Deactivated slots fetched successfully', data);
    return (data || []) as any[];
  },

  toggleDeactivatedSlot: async (pitchId: string, date: string, hour: number) => {
    log(`Toggling deactivated slot: ${pitchId} on ${date} at ${hour}:00`);
    // Check if it exists
    const { data: existing } = await supabase
      .from('deactivated_slots')
      .select('id')
      .eq('pitch_id', pitchId)
      .eq('slot_date', date)
      .eq('slot_hour', hour)
      .maybeSingle();
    
    if (existing) {
      log('Slot is currently deactivated, activating it...');
      const { error } = await supabase
        .from('deactivated_slots')
        .delete()
        .eq('id', existing.id);
      if (error) {
        logError('Error activating slot', error);
        throw error;
      }
      log('Slot activated successfully');
    } else {
      log('Slot is currently active, deactivating it...');
      const { error } = await supabase
        .from('deactivated_slots')
        .insert([{
          pitch_id: pitchId,
          slot_date: date,
          slot_hour: hour
        }]);
      if (error) {
        logError('Error deactivating slot', error);
        throw error;
      }
      log('Slot deactivated successfully');
    }
  },

  logAction: async (action: string, details: string, userName: string = 'Sistema') => {
    const { error } = await supabase
      .from('audit_logs')
      .insert([{
        action,
        details,
        user_name: userName,
        timestamp: new Date().toISOString()
      }]);
    
    if (error) {
      logError('Error logging action', error);
    } else {
      log(`Action logged: ${action}`);
    }
  }
};
