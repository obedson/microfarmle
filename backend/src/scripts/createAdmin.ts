import { supabase } from '../utils/supabase';
import bcrypt from 'bcryptjs';

const createAdmin = async () => {
  try {
    const hashedPassword = await bcrypt.hash('Nob@123.com', 10);
    
    const { data, error } = await supabase
      .from('users')
      .insert({
        email: 'obedsonfield@gmail.com',
        password: hashedPassword,
        name: 'Admin User',
        role: 'admin'
      });

    if (error) throw error;
    console.log('Admin user created successfully');
  } catch (error) {
    console.error('Error creating admin:', error);
  }
};

createAdmin();
