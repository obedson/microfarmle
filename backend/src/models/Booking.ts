import supabase from '../utils/supabase';

export interface Booking {
  id: string;
  property_id: string;
  farmer_id: string;
  start_date: string;
  end_date: string;
  total_amount: number;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  payment_status: 'pending' | 'paid' | 'failed';
  payment_reference?: string;
  created_at: string;
  updated_at: string;
}

export class BookingModel {
  static async create(bookingData: Omit<Booking, 'id' | 'created_at' | 'updated_at'>): Promise<Booking> {
    const { data, error } = await supabase
      .from('bookings')
      .insert(bookingData)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async findById(id: string): Promise<Booking | null> {
    const { data, error } = await supabase
      .from('bookings')
      .select('*')
      .eq('id', id)
      .single();

    if (error) return null;
    return data;
  }

  static async findByFarmer(farmerId: string): Promise<Booking[]> {
    const { data, error } = await supabase
      .from('bookings')
      .select('*, properties(title, city)')
      .eq('farmer_id', farmerId);

    if (error) throw error;
    return data || [];
  }

  static async findByProperty(propertyId: string): Promise<Booking[]> {
    const { data, error } = await supabase
      .from('bookings')
      .select('*')
      .eq('property_id', propertyId);

    if (error) throw error;
    return data || [];
  }

  static async updateStatus(id: string, status: string): Promise<void> {
    const { error } = await supabase
      .from('bookings')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (error) throw error;
  }

  static async updatePaymentStatus(
    id: string, 
    paymentStatus: string, 
    paymentReference?: string
  ): Promise<void> {
    const updateData: any = { 
      payment_status: paymentStatus, 
      updated_at: new Date().toISOString() 
    };
    
    if (paymentReference) {
      updateData.payment_reference = paymentReference;
    }

    const { error } = await supabase
      .from('bookings')
      .update(updateData)
      .eq('id', id);

    if (error) throw error;
  }

  static async checkConflict(
    propertyId: string, 
    startDate: string, 
    endDate: string,
    excludeBookingId?: string
  ): Promise<boolean> {
    let query = supabase
      .from('bookings')
      .select('id')
      .eq('property_id', propertyId)
      .neq('status', 'cancelled')
      .or(`start_date.lte.${endDate},end_date.gte.${startDate}`);

    if (excludeBookingId) {
      query = query.neq('id', excludeBookingId);
    }

    const { data, error } = await query;

    if (error) throw error;
    return (data?.length || 0) > 0;
  }
}
