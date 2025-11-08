import supabase from '../utils/supabase';

export interface FarmRecord {
  id: string;
  farmer_id: string;
  property_id: string;
  livestock_type: string;
  livestock_count: number;
  feed_consumption: number;
  mortality_count: number;
  expenses: number;
  expense_category: string;
  notes?: string;
  record_date: string;
  created_at: string;
}

export class FarmRecordModel {
  static async create(recordData: Omit<FarmRecord, 'id' | 'created_at'>) {
    const { data, error } = await supabase
      .from('farm_records')
      .insert([recordData])
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async findByFarmer(farmerId: string) {
    const { data, error } = await supabase
      .from('farm_records')
      .select('*')
      .eq('farmer_id', farmerId)
      .order('record_date', { ascending: false });

    if (error) throw error;
    return data;
  }

  static async findByProperty(propertyId: string) {
    const { data, error } = await supabase
      .from('farm_records')
      .select('*')
      .eq('property_id', propertyId)
      .order('record_date', { ascending: false });

    if (error) throw error;
    return data;
  }

  static async getAnalytics(farmerId: string, startDate: string, endDate: string) {
    const { data, error } = await supabase
      .from('farm_records')
      .select('*')
      .eq('farmer_id', farmerId)
      .gte('record_date', startDate)
      .lte('record_date', endDate);

    if (error) throw error;
    return data;
  }

  static async update(id: string, updates: Partial<FarmRecord>) {
    const { data, error } = await supabase
      .from('farm_records')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async delete(id: string) {
    const { error } = await supabase
      .from('farm_records')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }
}
