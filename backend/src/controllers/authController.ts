import { Request, Response } from 'express';
import { UserModel } from '../models/User';
import { generateToken } from '../utils/jwt';
import Joi from 'joi';

const registerSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
  name: Joi.string().min(2).required(),
  role: Joi.string().valid('farmer', 'owner').required(),
  phone: Joi.string().optional(),
});

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
});

export const register = async (req: Request, res: Response) => {
  try {
    const { error, value } = registerSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ success: false, error: error.details[0].message });
    }

    const existingUser = await UserModel.findByEmail(value.email);
    if (existingUser) {
      return res.status(400).json({ success: false, error: 'Email already registered' });
    }

    const user = await UserModel.create(value);
    const token = generateToken({ id: user.id, email: user.email, role: user.role });

    const { password, ...userWithoutPassword } = user as any;
    res.status(201).json({
      success: true,
      data: { user: userWithoutPassword, token },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Registration failed' });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { error, value } = loginSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ success: false, error: error.details[0].message });
    }

    const user = await UserModel.findByEmail(value.email);
    if (!user) {
      return res.status(401).json({ success: false, error: 'Invalid credentials' });
    }

    const isValidPassword = await UserModel.verifyPassword(value.password, (user as any).password);
    if (!isValidPassword) {
      return res.status(401).json({ success: false, error: 'Invalid credentials' });
    }

    const token = generateToken({ id: user.id, email: user.email, role: user.role });
    const { password, ...userWithoutPassword } = user as any;

    res.json({
      success: true,
      data: { user: userWithoutPassword, token },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Login failed' });
  }
};
