import { Request, Response } from 'express';
import { PropertyModel } from '../models/Property';
import { uploadToSupabase } from '../utils/upload';
import Joi from 'joi';

const propertySchema = Joi.object({
  title: Joi.string().min(3).required(),
  description: Joi.string().required(),
  livestock_type: Joi.string().valid('poultry', 'pig', 'cattle', 'fishery', 'goat', 'rabbit', 'other').required(),
  space_type: Joi.string().valid('empty_land', 'equipped_house', 'empty_house').required(),
  size: Joi.number().positive().required(),
  size_unit: Joi.string().valid('m2', 'units').required(),
  city: Joi.string().required(),
  lga: Joi.string().required(),
  price_per_month: Joi.number().positive().required(),
  available_from: Joi.date().required(),
  available_to: Joi.date().greater(Joi.ref('available_from')).required(),
  amenities: Joi.array().items(Joi.string()).default([]),
  images: Joi.array().items(Joi.string()).default([])
});

export const createProperty = async (req: Request, res: Response) => {
  try {
    const { error, value } = propertySchema.validate(req.body);
    if (error) {
      return res.status(400).json({ success: false, error: error.details[0].message });
    }

    const property = await PropertyModel.create({
      ...value,
      owner_id: (req as any).user.id,
      is_active: true
    });

    res.status(201).json({ success: true, data: property });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to create property' });
  }
};

export const getProperties = async (req: Request, res: Response) => {
  try {
    const filters = {
      livestock_type: req.query.livestock_type as string,
      city: req.query.city as string,
      min_price: req.query.min_price ? Number(req.query.min_price) : undefined,
      max_price: req.query.max_price ? Number(req.query.max_price) : undefined,
    };

    const properties = await PropertyModel.findAll(filters);
    res.json({ success: true, data: properties });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch properties' });
  }
};

export const getProperty = async (req: Request, res: Response) => {
  try {
    const property = await PropertyModel.findById(req.params.id);
    if (!property) {
      return res.status(404).json({ success: false, error: 'Property not found' });
    }
    res.json({ success: true, data: property });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch property' });
  }
};

export const updateProperty = async (req: Request, res: Response) => {
  try {
    const property = await PropertyModel.update(req.params.id, req.body);
    if (!property) {
      return res.status(404).json({ success: false, error: 'Property not found' });
    }
    res.json({ success: true, data: property });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to update property' });
  }
};

export const deleteProperty = async (req: Request, res: Response) => {
  try {
    const success = await PropertyModel.delete(req.params.id);
    if (!success) {
      return res.status(404).json({ success: false, error: 'Property not found' });
    }
    res.json({ success: true, message: 'Property deleted' });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to delete property' });
  }
};

export const uploadImages = async (req: Request, res: Response) => {
  try {
    const files = req.files as Express.Multer.File[];
    if (!files || files.length === 0) {
      return res.status(400).json({ success: false, error: 'No images provided' });
    }

    const property = await PropertyModel.findById(req.params.id);
    if (!property) {
      return res.status(404).json({ success: false, error: 'Property not found' });
    }

    const imageUrls = await Promise.all(
      files.map(file => uploadToSupabase(file, 'properties'))
    );

    const updatedProperty = await PropertyModel.update(req.params.id, {
      images: [...property.images, ...imageUrls]
    });

    res.json({ success: true, data: { images: imageUrls, property: updatedProperty } });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to upload images' });
  }
};
