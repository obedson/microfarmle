import { Request, Response } from 'express';
import { FarmRecordModel } from '../models/FarmRecord.js';
import { FarmRecordService } from '../services/farmRecordService.js';
import { asyncHandler, createError } from '../middleware/errorHandler.js';

export const createRecord = asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user.id;
  const { property_id, booking_id, ...recordData } = req.body;
  
  // Validate required fields
  if (!recordData.livestock_type || !recordData.record_date) {
    throw createError('Livestock type and record date are required', 400);
  }

  const finalData = { 
    ...recordData, 
    farmer_id: userId,
    property_id: property_id || null,
    booking_id: booking_id || null
  };

  const record = await FarmRecordModel.create(finalData);
  res.status(201).json({ success: true, data: record });
});

export const linkToBooking = asyncHandler(async (req: Request, res: Response) => {
  const { id: recordId } = req.params;
  const { booking_id } = req.body;
  
  const record = await FarmRecordService.linkToBooking(recordId, booking_id);
  res.json({ success: true, data: record });
});

export const getPropertyProductivity = asyncHandler(async (req: Request, res: Response) => {
  const { propertyId } = req.params;
  const report = await FarmRecordService.getPropertyProductivityReport(propertyId);
  res.json({ success: true, data: report });
});

export const getFarmerRecommendations = asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user.id;
  const recommendations = await FarmRecordService.getRecommendations(userId);
  res.json({ success: true, data: recommendations });
});

export const getMyRecords = asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user.id;
  const records = await FarmRecordModel.findByFarmer(userId);
  res.json({ success: true, data: records });
});

export const getAnalytics = asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user.id;
  const { startDate, endDate } = req.query;

  if (!startDate || !endDate) {
    throw createError('Start date and end date are required', 400);
  }

  console.log('Analytics request:', { userId, startDate, endDate });

  const records = await FarmRecordModel.getAnalytics(
    userId, 
    startDate as string, 
    endDate as string
  );

  console.log('Records found:', records.length);

  const analytics = {
    totalLivestock: records.reduce((sum: number, r: any) => sum + r.livestock_count, 0),
    totalFeedConsumption: records.reduce((sum: number, r: any) => sum + r.feed_consumption, 0),
    totalMortality: records.reduce((sum: number, r: any) => sum + r.mortality_count, 0),
    totalExpenses: records.reduce((sum: number, r: any) => sum + r.expenses, 0),
    mortalityRate: records.length > 0 ? 
      (records.reduce((sum: number, r: any) => sum + r.mortality_count, 0) / 
       records.reduce((sum: number, r: any) => sum + r.livestock_count, 0)) * 100 : 0,
    recordCount: records.length
  };

  console.log('Analytics calculated:', analytics);

  res.json({ success: true, data: { analytics, records } });
});

export const updateRecord = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const userId = (req as any).user.id;

  const record = await FarmRecordModel.update(id, req.body);
  res.json({ success: true, data: record });
});

export const deleteRecord = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  await FarmRecordModel.delete(id);
  res.json({ success: true, message: 'Record deleted' });
});
