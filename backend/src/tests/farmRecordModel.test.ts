import { FarmRecordModel } from '../models/FarmRecord.js';
import supabase from '../utils/supabase.js';

jest.mock('../utils/supabase.js', () => ({
  __esModule: true,
  default: { from: jest.fn(), rpc: jest.fn() },
}));

describe('FarmRecordModel tenant and owner boundaries', () => {
  beforeEach(() => jest.clearAllMocks());

  it('filters protected fields and scopes updates to the authenticated farmer', async () => {
    const single = jest.fn().mockResolvedValue({ data: { id: 'record-1' }, error: null });
    const select = jest.fn().mockReturnValue({ single });
    const eqFarmer = jest.fn().mockReturnValue({ select });
    const eqOrganization = jest.fn().mockReturnValue({ eq: eqFarmer });
    const eqId = jest.fn().mockReturnValue({ eq: eqOrganization });
    const update = jest.fn().mockReturnValue({ eq: eqId });
    (supabase.from as jest.Mock).mockReturnValue({ update });

    await FarmRecordModel.update('record-1', 'organization-1', 'farmer-1', {
      organization_id: 'organization-2',
      farmer_id: 'farmer-2',
      livestock_count: 12,
      notes: 'Updated',
    } as any);

    expect(update).toHaveBeenCalledWith({ livestock_count: 12, notes: 'Updated' });
    expect(eqOrganization).toHaveBeenCalledWith('organization_id', 'organization-1');
    expect(eqFarmer).toHaveBeenCalledWith('farmer_id', 'farmer-1');
  });

  it('archives through the atomic tenant and actor checked command without deleting history', async () => {
    (supabase.rpc as jest.Mock).mockResolvedValue({error:null});
    await FarmRecordModel.delete('record-1', 'organization-1', 'farmer-1');
    expect(supabase.rpc).toHaveBeenCalledWith('archive_legacy_farm_record', {
      p_organization:'organization-1',p_actor:'farmer-1',p_record:'record-1',
    });
    expect(supabase.from).not.toHaveBeenCalled();
  });
});
