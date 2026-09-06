import { FarmRecordService } from '../services/farmRecordService.js';
import { supabase } from '../utils/supabase.js';

jest.mock('../utils/supabase.js', () => ({
  __esModule: true,
  supabase: { from: jest.fn() },
}));

describe('farm record create reference validation', () => {
  beforeEach(() => jest.clearAllMocks());

  it('rejects a booking outside the tenant or farmer scope', async () => {
    const maybeSingle = jest.fn().mockResolvedValue({ data: null, error: null });
    const eqFarmer = jest.fn().mockReturnValue({ maybeSingle });
    const eqOrganization = jest.fn().mockReturnValue({ eq: eqFarmer });
    const eqId = jest.fn().mockReturnValue({ eq: eqOrganization });
    const select = jest.fn().mockReturnValue({ eq: eqId });
    (supabase.from as jest.Mock).mockReturnValue({ select });

    await expect(FarmRecordService.validateCreateReferences(
      'booking-foreign', null, 'organization-1', 'farmer-1'
    )).rejects.toThrow('Booking does not belong');
  });

  it('rejects a property that does not match the linked booking', async () => {
    const maybeSingle = jest.fn().mockResolvedValue({
      data: { id: 'booking-1', property_id: 'property-1' }, error: null,
    });
    const eqFarmer = jest.fn().mockReturnValue({ maybeSingle });
    const eqOrganization = jest.fn().mockReturnValue({ eq: eqFarmer });
    const eqId = jest.fn().mockReturnValue({ eq: eqOrganization });
    const select = jest.fn().mockReturnValue({ eq: eqId });
    (supabase.from as jest.Mock).mockReturnValue({ select });

    await expect(FarmRecordService.validateCreateReferences(
      'booking-1', 'property-foreign', 'organization-1', 'farmer-1'
    )).rejects.toThrow('property must match');
  });
});
it('rejects a standalone foreign property without relying on a booking',async()=>{
 const maybeSingle=jest.fn().mockResolvedValue({data:null,error:null});
 const eqOrg=jest.fn().mockReturnValue({maybeSingle});const eqId=jest.fn().mockReturnValue({eq:eqOrg});
 (supabase.from as jest.Mock).mockReturnValue({select:()=>({eq:eqId})});
 await expect(FarmRecordService.validateCreateReferences(null,'foreign-property','organization-1','farmer-1')).rejects.toThrow('Farm property does not belong');
 expect(supabase.from).toHaveBeenCalledWith('properties');expect(eqOrg).toHaveBeenCalledWith('organization_id','organization-1');
});
