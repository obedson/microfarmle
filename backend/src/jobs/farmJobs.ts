import cron from 'node-cron';
import { supabase } from '../utils/supabase.js';
import { logger } from '../utils/logger.js';
export const runFarmReminders=async()=>{
 const {data,error}=await supabase.rpc('emit_farm_task_reminders');
 if(error)throw new Error('FARM_REMINDERS_UNAVAILABLE');
 return Number(data);
};
export const startFarmJobs=()=>{
 cron.schedule('0 * * * *',async()=>{
  try{await runFarmReminders();}catch{logger.error('Farm reminder job failed',{failureCode:'FARM_REMINDERS_UNAVAILABLE'});}
 });
};
