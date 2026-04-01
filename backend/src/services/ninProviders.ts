import axios from 'axios';
import { interswitchService } from './interswitchService.js';

export interface NINVerifyResult {
  nin: string;
  status: 'SUCCESS' | 'WAITING_FOR_OTP' | 'FAILED';
  message?: string;
  requestRef?: string;
  fullName?: string;
  dateOfBirth?: string | null;
  gender?: string;
  address?: string | null;
  phone?: string;
  maskedPhone?: string;
  photo?: string;
}

export interface NINProvider {
  verify(nin: string, firstName: string, lastName: string, consent: boolean): Promise<NINVerifyResult>;
}

export class InterswitchNINProvider implements NINProvider {
  async verify(nin: string, firstName: string, lastName: string, consent: boolean): Promise<NINVerifyResult> {
    try {
      const response = await interswitchService.getNINFullDetails(nin, consent);
      console.log('Interswitch NIN Raw Response:', JSON.stringify(response, null, 2));

      // The response structure from the log shows details are inside the 'data' object
      const ninInfo = response.data;

      if (!ninInfo || (!ninInfo.firstName && !ninInfo.firstname)) {
        throw new Error(response.message || 'NIN lookup failed or returned no data');
      }

      // Extract phone: Log shows it's in 'mobile'
      const phone = ninInfo.mobile || ninInfo.phone || ninInfo.mobileNo || '';

      // Mask phone number: 0803****123
      const maskedPhone = phone ? `${phone.slice(0, 4)}****${phone.slice(-3)}` : '';

      return {
        nin: nin,
        status: 'WAITING_FOR_OTP',
        maskedPhone,
        phone, 
        fullName: `${ninInfo.firstName || ninInfo.firstname || ''} ${ninInfo.middleName || ninInfo.middlename || ''} ${ninInfo.lastName || ninInfo.lastname || ''}`.trim().replace(/\s+/g, ' '),
        dateOfBirth: ninInfo.dateOfBirth || ninInfo.dob,
        gender: (ninInfo.gender || 'm').toLowerCase().startsWith('m') ? 'MALE' : 'FEMALE',
        address: typeof ninInfo.address === 'object' ? ninInfo.address.addressLine : (ninInfo.address || null),
        photo: ninInfo.image || ninInfo.photo
      };
    } catch (error: any) {
      console.error('Interswitch NIN Provider Error:', error.message);
      throw error;
    }
  }
}

export class MockNINProvider implements NINProvider {
  async verify(nin: string, firstName: string, lastName: string, consent: boolean): Promise<NINVerifyResult> {
    console.warn(`USING MOCK NIN PROVIDER for ${firstName} ${lastName} (Consent: ${consent})`);
    
    await new Promise(resolve => setTimeout(resolve, 1000));

    return {
      nin: nin,
      status: 'WAITING_FOR_OTP',
      maskedPhone: '0803****123',
      phone: '08031234123',
      fullName: `${firstName} ${lastName} (MOCK)`.toUpperCase(),
      dateOfBirth: '1990-01-01',
      gender: 'MALE',
      address: '123 Sandbox Avenue, Lagos'
    };
  }
}
