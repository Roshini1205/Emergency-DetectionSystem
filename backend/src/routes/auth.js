import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import Joi from 'joi';
import User from '../models/User.js';

const router = express.Router();

const emergencyContactSchema = Joi.object({
  name: Joi.string().max(100).allow('', null),
  email: Joi.string().email().required(),
  phone: Joi.string().trim().min(5).max(40).required(),
});

const signupSchema = Joi.object({
  name: Joi.string().min(2).max(100).required(),
  email: Joi.string().email().required(),
  phone: Joi.string().trim().min(5).max(40).required(),
  password: Joi.string().min(6).max(128).required(),
  emergencyContacts: Joi.array().items(emergencyContactSchema).min(1).max(10).required(),
});

const signinSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(6).max(128).required(),
});

function signToken(userId) {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error('Missing JWT_SECRET');
  return jwt.sign({ userId }, secret, { expiresIn: '7d' });
}

router.post('/signup', async (req, res) => {
  try {
    const { value, error } = signupSchema.validate(req.body);
    if (error) return res.status(400).json({ message: error.details[0].message });

    const { name, email, phone, password, emergencyContacts } = value;

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) return res.status(409).json({ message: 'Email already registered' });

    const passwordHash = await bcrypt.hash(password, 10);
    const normalizedContacts = (emergencyContacts || []).map((c) => ({
      name: (c.name || '').trim(),
      email: c.email.toLowerCase().trim(),
      phone: c.phone.trim(),
    }));

    const user = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      phone: phone.trim(),
      emergencyContacts: normalizedContacts,
      passwordHash,
    });

    const token = signToken(user.id);
    return res.status(201).json({ token, user: user.toJSON() });
  } catch (err) {
    // Provide clearer error responses for common failure cases
    console.error('Signup error:', err && err.stack ? err.stack : err);
    if (err && err.code === 11000) {
      return res.status(409).json({ message: 'Email already registered' });
    }
    if (err && err.name === 'ValidationError') {
      return res.status(400).json({ message: err.message });
    }
    if (err && err.message && err.message.includes('JWT_SECRET')) {
      return res.status(500).json({ message: 'Server misconfiguration: JWT_SECRET missing' });
    }
    return res.status(500).json({ message: 'Internal server error' });
  }
});

router.post('/signin', async (req, res) => {
  try {
    const { value, error } = signinSchema.validate(req.body);
    if (error) return res.status(400).json({ message: error.details[0].message });

    const { email, password } = value;
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) return res.status(401).json({ message: 'Invalid email or password' });

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) return res.status(401).json({ message: 'Invalid email or password' });

    const token = signToken(user.id);
    return res.json({ token, user: user.toJSON() });
  } catch (err) {
    console.error('Signin error:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

export default router;