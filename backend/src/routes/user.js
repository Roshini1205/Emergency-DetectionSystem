import express from 'express';
import Joi from 'joi';
import User from '../models/User.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

const updateMeSchema = Joi.object({
  name: Joi.string().min(2).max(100).required(),
  email: Joi.string().email().required(),
  phone: Joi.string().trim().min(5).max(40).required(),
});

const contactsSchema = Joi.array()
  .items(
    Joi.object({
      name: Joi.string().max(100).allow('', null),
      email: Joi.string().email().required(),
      phone: Joi.string().trim().min(5).max(40).required(),
    })
  )
  .min(1)
  .max(10)
  .required();

router.get('/me', requireAuth, async (req, res) => {
  try {
    const user = await User.findById(req.auth.userId);
    if (!user) return res.status(404).json({ message: 'User not found' });
    return res.json({ user: user.toJSON() });
  } catch (e) {
    console.error('GET /user/me error:', e);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

router.put('/me', requireAuth, async (req, res) => {
  try {
    const { value, error } = updateMeSchema.validate(req.body);
    if (error) return res.status(400).json({ message: error.details[0].message });

    const email = value.email.toLowerCase().trim();

    const existing = await User.findOne({ email, _id: { $ne: req.auth.userId } });
    if (existing) return res.status(409).json({ message: 'Email already registered' });

    const user = await User.findByIdAndUpdate(
      req.auth.userId,
      {
        name: value.name.trim(),
        email,
        phone: value.phone.trim(),
      },
      { new: true }
    );

    if (!user) return res.status(404).json({ message: 'User not found' });
    return res.json({ user: user.toJSON() });
  } catch (e) {
    console.error('PUT /user/me error:', e);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

router.get('/emergency-contacts', requireAuth, async (req, res) => {
  try {
    const user = await User.findById(req.auth.userId);
    if (!user) return res.status(404).json({ message: 'User not found' });
    return res.json({ emergencyContacts: user.emergencyContacts || [] });
  } catch (e) {
    console.error('GET /user/emergency-contacts error:', e);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

router.put('/emergency-contacts', requireAuth, async (req, res) => {
  try {
    const { value, error } = contactsSchema.validate(req.body?.emergencyContacts);
    if (error) return res.status(400).json({ message: error.details[0].message });

    const normalized = value
      .map((c) => ({
        name: (c.name || '').trim(),
        email: c.email.toLowerCase().trim(),
        phone: c.phone.trim(),
      }))
      .filter((c) => c.email && c.phone);

    const user = await User.findByIdAndUpdate(
      req.auth.userId,
      { emergencyContacts: normalized },
      { new: true }
    );

    if (!user) return res.status(404).json({ message: 'User not found' });
    return res.json({ emergencyContacts: user.emergencyContacts || [] });
  } catch (e) {
    console.error('PUT /user/emergency-contacts error:', e);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

export default router;
