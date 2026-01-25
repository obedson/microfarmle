import { Request, Response } from 'express';
import { supabase } from '../utils/supabase';
import { AuthenticatedRequest } from '../types';

export const createOrder = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { product_id, quantity, delivery_address, phone } = req.body;
    
    // Get product details
    const { data: product, error: productError } = await supabase
      .from('products')
      .select('price, stock_quantity, minimum_order')
      .eq('id', product_id)
      .single();

    if (productError || !product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    if (quantity < product.minimum_order) {
      return res.status(400).json({ error: `Minimum order is ${product.minimum_order}` });
    }

    if (quantity > product.stock_quantity) {
      return res.status(400).json({ error: 'Insufficient stock' });
    }

    const total_amount = product.price * quantity;

    const { data, error } = await supabase
      .from('orders')
      .insert({
        buyer_id: req.user?.id,
        product_id,
        quantity,
        unit_price: product.price,
        total_amount,
        delivery_address,
        phone
      })
      .select()
      .single();

    if (error) throw error;

    // Update stock
    await supabase
      .from('products')
      .update({ stock_quantity: product.stock_quantity - quantity })
      .eq('id', product_id);

    res.status(201).json(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create order' });
  }
};

export const getMyOrders = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { data, error } = await supabase
      .from('orders')
      .select('*, products(name, category, unit), users(name)')
      .eq('buyer_id', req.user?.id)
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
};

export const getMySales = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { data, error } = await supabase
      .from('orders')
      .select('*, products!inner(name, category, unit), users(name)')
      .eq('products.supplier_id', req.user?.id)
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch sales' });
  }
};

export const updateOrderStatus = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    const { data, error } = await supabase
      .from('orders')
      .update({ status })
      .eq('id', id)
      .select('*, products!inner(supplier_id)')
      .single();

    if (error) throw error;

    // Check if user is the supplier
    if (data.products.supplier_id !== req.user?.id) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update order status' });
  }
};
