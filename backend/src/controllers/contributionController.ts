import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.js';
import { ContributionModel } from '../models/Contribution.js';
import supabase from '../utils/supabase.js';

export const updateSettings = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const settings = req.body;

    // Verify user is group creator
    const { data: group } = await supabase
      .from('groups')
      .select('creator_id')
      .eq('id', id)
      .single();

    if (group?.creator_id !== req.user.id) {
      return res.status(403).json({ error: 'Only group creator can update settings' });
    }

    const { data, error } = await supabase
      .from('groups')
      .update({
        contribution_enabled: settings.contribution_enabled,
        contribution_amount: settings.contribution_amount,
        payment_day: settings.payment_day,
        grace_period_days: settings.grace_period_days,
        late_penalty_amount: settings.late_penalty_amount,
        late_penalty_type: settings.late_penalty_type,
        auto_suspend_after: settings.auto_suspend_after,
        auto_expel_after: settings.auto_expel_after
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    res.json(data);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const getSettings = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    // Verify user is group creator
    const { data: group } = await supabase
      .from('groups')
      .select('creator_id')
      .eq('id', id)
      .single();

    if (group?.creator_id !== req.user.id) {
      return res.status(403).json({ error: 'Only group creator can view settings' });
    }

    const { data, error } = await supabase
      .from('groups')
      .select('contribution_enabled, contribution_amount, payment_day, grace_period_days, late_penalty_amount, late_penalty_type, auto_suspend_after, auto_expel_after')
      .eq('id', id)
      .single();

    if (error) throw error;
    res.json(data);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const createCycle = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { month, year } = req.body;

    const cycle = await ContributionModel.createCycle(id, month, year);
    res.status(201).json(cycle);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const getCurrentCycle = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const cycle = await ContributionModel.getCurrentCycle(id);
    
    if (!cycle) {
      return res.status(404).json({ error: 'No active cycle found' });
    }

    res.json(cycle);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const getCycleDetails = async (req: AuthRequest, res: Response) => {
  try {
    const { cycleId } = req.params;
    const details = await ContributionModel.getCycleDetails(cycleId);
    res.json(details);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const makePayment = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { payment_reference } = req.body;

    // Get contribution details
    const { data: contribution } = await supabase
      .from('member_contributions')
      .select('*, member:group_members(user_id)')
      .eq('id', id)
      .single();

    if (contribution?.member.user_id !== req.user.id) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const penalty = await ContributionModel.calculatePenalty(id);
    const totalAmount = contribution.expected_amount + penalty;

    const payment = await ContributionModel.recordPayment(id, totalAmount, payment_reference);
    res.json(payment);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const getMyHistory = async (req: AuthRequest, res: Response) => {
  try {
    // Get user's group memberships
    const { data: memberships } = await supabase
      .from('group_members')
      .select('id')
      .eq('user_id', req.user.id);

    if (!memberships || memberships.length === 0) {
      return res.json([]);
    }

    const memberIds = memberships.map(m => m.id);
    const history = await ContributionModel.getMemberHistory(memberIds[0]);
    res.json(history);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const suspendMember = async (req: AuthRequest, res: Response) => {
  try {
    const { memberId } = req.params;

    const member = await ContributionModel.updateMemberStatus(memberId, 'suspended');
    res.json(member);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const expelMember = async (req: AuthRequest, res: Response) => {
  try {
    const { memberId } = req.params;

    const member = await ContributionModel.updateMemberStatus(memberId, 'expelled');
    res.json(member);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const getContributionById = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from('member_contributions')
      .select(`
        *,
        member:group_members(user_id, user:users(email, name)),
        cycle:contribution_cycles(
          cycle_month,
          cycle_year,
          deadline_date,
          group:groups(name, grace_period_days, late_penalty_amount, late_penalty_type)
        )
      `)
      .eq('id', id)
      .single();

    if (error) throw error;
    res.json(data);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const getPenalty = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const penalty = await ContributionModel.calculatePenalty(id);
    res.json({ penalty });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};
