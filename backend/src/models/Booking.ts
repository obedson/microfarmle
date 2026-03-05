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
  notes?: string;
  rejection_reason?: string;
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

  static async findByIdWithDetails(id: string): Promise<any | null> {
    const { data, error } = await supabase
      .from('bookings')
      .select(`
        *,
        properties (
          id,
          title,
          city,
          lga,
          livestock_type,
          owner_id,
          users!properties_owner_id_fkey (
            id,
            name,
            email
          )
        ),
        users!bookings_farmer_id_fkey (
          id,
          name,
          email,
          phone
        )
      `)
      .eq('id', id)
      .single();

    if (error) return null;
    
    // Flatten the structure for easier access
    return {
      ...data,
      property_title: data.properties?.title,
      property_city: data.properties?.city,
      property_lga: data.properties?.lga,
      property_livestock_type: data.properties?.livestock_type,
      owner_id: data.properties?.users?.id,
      owner_name: data.properties?.users?.name,
      owner_email: data.properties?.users?.email,
      farmer_name: data.users?.name,
      farmer_email: data.users?.email,
      farmer_phone: data.users?.phone,
    };
  }

  static async findByFarmer(farmerId: string): Promise<Booking[]> {
    const { data, error } = await supabase
      .from('bookings')
      .select(`
        *,
        properties (
          title,
          city,
          lga,
          livestock_type,
          users!properties_owner_id_fkey (
            name,
            email,
            phone
          )
        )
      `)
      .eq('farmer_id', farmerId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  static async findByOwner(
    ownerId: string, 
    status?: string, 
    propertyId?: string
  ): Promise<any[]> {
    let query = supabase
      .from('bookings')
      .select(`
        *,
        properties!inner (
          id,
          title,
          city,
          lga,
          livestock_type,
          owner_id
        ),
        users!bookings_farmer_id_fkey (
          id,
          name,
          email,
          phone
        )
      `)
      .eq('properties.owner_id', ownerId);

    if (status) {
      query = query.eq('status', status);
    }

    if (propertyId) {
      query = query.eq('property_id', propertyId);
    }

    query = query.order('created_at', { ascending: false });

    const { data, error } = await query;

    if (error) throw error;
    return data || [];
  }

  static async findByProperty(propertyId: string): Promise<Booking[]> {
    const { data, error } = await supabase
      .from('bookings')
      .select(`
        *,
        users!bookings_farmer_id_fkey (
          name,
          email,
          phone
        )
      `)
      .eq('property_id', propertyId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  static async updateStatus(
    id: string, 
    status: string, 
    rejectionReason?: string
  ): Promise<void> {
    const updateData: any = { 
      status, 
      updated_at: new Date().toISOString() 
    };
    
    if (rejectionReason) {
      updateData.rejection_reason = rejectionReason;
    }

    const { error } = await supabase
      .from('bookings')
      .update(updateData)
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
      .in('status', ['pending', 'confirmed'])
      .or(`and(start_date.lte.${endDate},end_date.gte.${startDate})`);

    if (excludeBookingId) {
      query = query.neq('id', excludeBookingId);
    }

    const { data, error } = await query;

    if (error) throw error;
    return (data?.length || 0) > 0;
  }

  static async getOwnerStats(ownerId: string): Promise<any> {
    // Get bookings
    const { data: bookings, error: bookingsError } = await supabase
      .from('bookings')
      .select(`
        id,
        status,
        payment_status,
        total_amount,
        properties!inner (
          owner_id
        )
      `)
      .eq('properties.owner_id', ownerId);

    if (bookingsError) {
      console.error('Bookings query error:', bookingsError);
      throw bookingsError;
    }

    // Get properties
    const { data: properties, error: propertiesError } = await supabase
      .from('properties')
      .select('id, is_active')
      .eq('owner_id', ownerId);

    if (propertiesError) {
      console.error('Properties query error:', propertiesError);
      throw propertiesError;
    }

    const stats = {
      total: bookings?.length || 0,
      pending: bookings?.filter(b => b.status === 'pending').length || 0,
      confirmed: bookings?.filter(b => b.status === 'confirmed').length || 0,
      completed: bookings?.filter(b => b.status === 'completed').length || 0,
      cancelled: bookings?.filter(b => b.status === 'cancelled').length || 0,
      totalRevenue: bookings
        ?.filter(b => b.payment_status === 'paid')
        .reduce((sum, b) => sum + parseFloat(b.total_amount), 0) || 0,
      pendingRevenue: bookings
        ?.filter(b => b.status === 'pending' || b.status === 'confirmed')
        .reduce((sum, b) => sum + parseFloat(b.total_amount), 0) || 0,
      totalProperties: properties?.length || 0,
      activeProperties: properties?.filter(p => p.is_active).length || 0,
    };

    return stats;
  }

  static async getUpcomingBookings(ownerId: string, limit: number = 5): Promise<any[]> {
    const today = new Date().toISOString().split('T')[0];
    
    const { data, error } = await supabase
      .from('bookings')
      .select(`
        *,
        properties!inner (
          id,
          title,
          owner_id
        ),
        users!bookings_farmer_id_fkey (
          name,
          email,
          phone
        )
      `)
      .eq('properties.owner_id', ownerId)
      .eq('status', 'confirmed')
      .gte('start_date', today)
      .order('start_date', { ascending: true })
      .limit(limit);

    if (error) throw error;
    return data || [];
  }
}
