import supabase from '../utils/supabase';
import bcrypt from 'bcryptjs';
import { User } from '../types';

export class UserModel {
  static async create(userData: {
    email: string;
    password: string;
    name: string;
    role: 'farmer' | 'owner';
    phone?: string;
  }): Promise<User> {
    const hashedPassword = await bcrypt.hash(userData.password, 10);
    
    const { data, error } = await supabase
      .from('users')
      .insert({
        email: userData.email,
        password: hashedPassword,
        name: userData.name,
        role: userData.role,
        phone: userData.phone,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async findByEmail(email: string): Promise<User | null> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();

    if (error) return null;
    return data;
  }

  static async findById(id: string): Promise<User | null> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .single();

    if (error) return null;
    return data;
  }

  static async verifyPassword(plainPassword: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(plainPassword, hashedPassword);
  }
}
