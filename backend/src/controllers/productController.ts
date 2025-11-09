import { Request, Response } from 'express';
import { supabase } from '../utils/supabase';
import { uploadToSupabase } from '../utils/upload';
import { AuthenticatedRequest } from '../types';

export const getProducts = async (req: Request, res: Response) => {
  try {
    const { category, location } = req.query;
    
    let query = supabase
      .from('products')
      .select('*, users(name, phone)')
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (category) query = query.eq('category', category);
    if (location) query = query.ilike('location', `%${location}%`);

    const { data, error } = await query;
    if (error) throw error;
    
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch products' });
  }
};

export const getProduct = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { data, error } = await supabase
      .from('products')
      .select('*, users(name, phone)')
      .eq('id', id)
      .single();

    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Product not found' });
  }
};

export const createProduct = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { name, category, description, price, unit, stock_quantity, minimum_order, location } = req.body;
    
    // Handle image uploads to Supabase Storage
    const images: string[] = [];
    if (req.files && Array.isArray(req.files)) {
      for (const file of req.files) {
        const imageUrl = await uploadToSupabase(file, 'products');
        images.push(imageUrl);
      }
    }
    
    const { data, error } = await supabase
      .from('products')
      .insert({
        supplier_id: req.user?.id,
        name,
        category,
        description,
        price: parseFloat(price),
        unit,
        stock_quantity: parseInt(stock_quantity),
        minimum_order: parseInt(minimum_order),
        location,
        images
      })
      .select()
      .single();

    if (error) throw error;
    res.status(201).json(data);
  } catch (error) {
    console.error('Product creation error:', error);
    res.status(500).json({ error: 'Failed to create product' });
  }
};

export const updateProduct = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    const { data, error } = await supabase
      .from('products')
      .update(updates)
      .eq('id', id)
      .eq('supplier_id', req.user?.id)
      .select()
      .single();

    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update product' });
  }
};

export const deleteProduct = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', id)
      .eq('supplier_id', req.user?.id);

    if (error) throw error;
    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete product' });
  }
};
