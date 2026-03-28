export type PitchType = 'F5' | 'F7' | 'F11';
export type BookingStatus = 'confirmed' | 'cancelled' | 'pending' | 'finished';
export type UserRole = 'admin' | 'client' | 'superadmin';

export interface User {
  id: string;
  email?: string;
  phone?: string;
  name: string;
  role: UserRole;
  password?: string;
}

export interface Pitch {
  id: string;
  name: string;
  type: PitchType;
  price: number;
  active: boolean;
}

export interface Booking {
  id: string;
  pitchId: string;
  userId: string;
  clientName: string;
  clientPhone: string;
  startTime: Date;
  endTime: Date;
  status: BookingStatus;
  createdAt: Date;
  receiptUrl?: string;
  depositAmount?: number;
  isPaid?: boolean;
}

export interface Product {
  id: string;
  name: string;
  price: number;
  category: 'bebida' | 'comida' | 'otro';
  stock: number;
  min_stock: number;
  active: boolean;
}

export interface StockMovement {
  id: string;
  productId: string;
  quantity: number;
  type: 'entrada' | 'salida' | 'ajuste';
  source: string;
  createdAt: Date;
}

export interface SaleItem {
  id: string;
  saleId: string;
  productId: string;
  quantity: number;
  price: number;
}

export interface Sale {
  id: string;
  totalPrice: number;
  date: Date;
  paymentMethod?: 'efectivo' | 'transferencia';
  items?: SaleItem[];
  // Legacy fields for backward compatibility
  productId?: string;
  quantity?: number;
}

export interface AuditLog {
  id: string;
  action: string;
  details: string;
  timestamp: Date;
  user: string;
}

export type PitchStatus = 'available' | 'busy' | 'reserved';
