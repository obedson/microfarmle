import supabase from '../utils/supabase.js';
import { verifyPaystackPayment, isDevelopmentMode } from '../utils/paystack.js';

export class GroupModel {
  static async createWithPayment(groupData: any, userId: string, paymentRef: string) {
    const entryFee = Number(groupData.entry_fee);
    if (entryFee < 500 || entryFee > 10000) {
      throw new Error('Entry fee must be between ₦500 and ₦10,000');
    }

    // Verify payment (skip in development mode)
    if (!isDevelopmentMode()) {
      const verification = await verifyPaystackPayment(paymentRef);
      
      if (!verification.valid) {
        throw new Error(verification.message || 'Payment verification failed');
      }

      if (verification.amount < entryFee) {
        throw new Error(`Payment amount (₦${verification.amount}) is less than entry fee (₦${entryFee})`);
      }
    } else {
      console.log('⚠️  DEV MODE: Skipping payment verification');
    }

    // Use atomic RPC function
    const { data, error } = await supabase.rpc('create_group_with_creator', {
      p_name: groupData.name,
      p_description: groupData.description,
      p_category: groupData.category,
      p_creator_id: userId,
      p_state_id: groupData.state_id,
      p_lga_id: groupData.lga_id,
      p_entry_fee: entryFee,
      p_max_members: groupData.max_members || 50,
      p_payment_reference: paymentRef,
      p_amount_paid: entryFee
    });

    if (error) {
      if (error.message?.includes('already used')) {
        throw new Error('This payment reference has already been used');
      }
      throw error;
    }

    // Fetch and return the created group
    const { data: group, error: fetchError } = await supabase
      .from('groups')
      .select('*')
      .eq('id', data.group_id)
      .single();

    if (fetchError) throw fetchError;
    return group;
  }

  static async findNearby(stateId?: string, lgaId?: string) {
    let query = supabase.from('groups').select('*').eq('is_active', true);
    if (stateId) query = query.eq('state_id', stateId);
    if (lgaId) query = query.eq('lga_id', lgaId);
    const { data, error } = await query;
    if (error) throw error;
    return data;
  }

  static async findById(id: string) {
    const { data, error } = await supabase
      .from('groups')
      .select('*, creator:users!creator_id(name, email)')
      .eq('id', id)
      .single();
    if (error) throw error;
    return data;
  }

  static async joinGroup(groupId: string, userId: string, paymentRef: string, amount: number) {
    const { data, error } = await supabase
      .from('group_members')
      .insert({ 
        group_id: groupId, 
        user_id: userId,
        payment_reference: paymentRef,
        amount_paid: amount,
        payment_status: 'pending'
      })
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  static async confirmPayment(memberId: string) {
    const { data, error } = await supabase
      .rpc('confirm_group_payment_transaction', { p_member_id: memberId });
    
    if (error) throw error;
    return data;
  }

  static async getMembers(groupId: string) {
    const { data, error } = await supabase
      .from('group_members')
      .select('*, user:users(id, name, email, role)')
      .eq('group_id', groupId)
      .eq('payment_status', 'paid');
    if (error) throw error;
    return data;
  }

  static async canCreateGroup(userId: string) {
    const { data, error } = await supabase
      .from('users')
      .select('paid_referrals_count, role')
      .eq('id', userId)
      .single();
    if (error) throw error;
    
    // Admins can always create groups
    if (data.role === 'admin') return true;
    
    // Regular users need 10 paid referrals
    return data.paid_referrals_count >= 10;
  }
}
