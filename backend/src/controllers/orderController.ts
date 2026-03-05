import { Request, Response } from 'express';
import { supabase } from '../utils/supabase.js';
import { AuthenticatedRequest } from '../types/index.js';

export const createOrder = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { product_id, quantity, delivery_address, phone } = req.body;
    
    console.log('Creating order:', { product_id, quantity, delivery_address, phone, buyer_id: req.user?.id });
    
    // Get product details
    const { data: product, error: productError } = await supabase
      .from('marketplace_products')
      .select('price, stock_quantity')
      .eq('id', product_id)
      .single();

    if (productError) {
      console.error('Product fetch error:', productError);
      return res.status(404).json({ error: 'Product not found', details: productError.message });
    }

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
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

    if (error) {
      console.error('Order insert error:', error);
      throw error;
    }

    // Update stock
    const { error: updateError } = await supabase
      .from('marketplace_products')
      .update({ stock_quantity: product.stock_quantity - quantity })
      .eq('id', product_id);

    if (updateError) {
      console.error('Stock update error:', updateError);
    }

    res.status(201).json(data);
  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({ error: 'Failed to create order', details: error instanceof Error ? error.message : 'Unknown error' });
  }
};

export const getMyOrders = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { data, error } = await supabase
      .from('orders')
      .select('*, marketplace_products(name, category), users(name)')
      .eq('buyer_id', req.user?.id)
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json(data);
  } catch (error) {
    console.error('Get orders error:', error);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
};

export const getMySales = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { data, error } = await supabase
      .from('orders')
      .select('*, marketplace_products(name, category, supplier_id), users(name)')
      .eq('marketplace_products.supplier_id', req.user?.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Get sales error:', error);
      throw error;
    }
    
    res.json(data || []);
  } catch (error) {
    console.error('Get sales error:', error);
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
      .select('*, marketplace_products!inner(supplier_id)')
      .single();

    if (error) throw error;

    // Check if user is the supplier
    if (data.marketplace_products.supplier_id !== req.user?.id) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    res.json(data);
  } catch (error) {
    console.error('Update order status error:', error);
    res.status(500).json({ error: 'Failed to update order status' });
  }
};
