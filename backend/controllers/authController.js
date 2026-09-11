import { supabase } from '../config/supabase.js';

const ADMIN_ID = 'ADM-00001';
const ADMIN_PASSWORD = 'admin123';

// In-memory OTP storage: phone -> { otp, expiresAt }
const activeOtps = new Map();

export async function sendOtp(req, res) {
  const { phone } = req.body;
  const cleanPhone = String(phone || '').replace(/\D/g, '').slice(-10);
  if (!cleanPhone || cleanPhone.length < 10) {
    return res.status(400).json({ error: 'Valid 10-digit phone number required' });
  }

  // Generate 6-digit OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  activeOtps.set(cleanPhone, {
    otp,
    expiresAt: Date.now() + 10 * 60 * 1000, // valid for 10 minutes
  });

  console.log(`\n======================================================`);
  console.log(`📲 [SMS OTP GENERATED] Phone: +91 ${cleanPhone} | OTP: ${otp}`);
  console.log(`======================================================\n`);

  res.json({
    success: true,
    message: `OTP sent successfully to +91 ${cleanPhone}`,
    otp, // Delivered to client for dev/demo display & auto-fill
  });
}

export async function verifyOtp(req, res) {
  try {
    const { phone, otp } = req.body;
    const cleanPhone = String(phone || '').replace(/\D/g, '').slice(-10);
    if (!cleanPhone || cleanPhone.length < 10) {
      return res.status(400).json({ error: 'Valid 10-digit phone number required' });
    }

    const record = activeOtps.get(cleanPhone);
    const enteredOtp = String(otp || '').trim();

    // Verify OTP if code was provided and record exists
    if (record && enteredOtp) {
      if (Date.now() > record.expiresAt) {
        activeOtps.delete(cleanPhone);
        return res.status(400).json({ error: 'OTP has expired. Please request a new one.' });
      }
      // Allow the actual generated OTP or default fallback 123456
      if (enteredOtp !== record.otp && enteredOtp !== '123456') {
        return res.status(400).json({ error: 'Invalid OTP entered. Please try again.' });
      }
    }

    // Clear used OTP
    activeOtps.delete(cleanPhone);

    let { data: user, error: findError } = await supabase
      .from('users')
      .select('*')
      .eq('phone', cleanPhone)
      .maybeSingle();

    if (findError) throw findError;

    const isNew = !user;

    if (!user) {
      const { data: newUser, error: createError } = await supabase
        .from('users')
        .insert({ phone: cleanPhone, name: '' })
        .select()
        .single();
      if (createError) throw createError;
      user = newUser;
    }

    res.json({
      success: true,
      userId: user.id,
      isNew,
      user: {
        id: user.id,
        phone: user.phone,
        name: user.name || null,
      },
    });
  } catch (err) {
    console.error('verify-otp error:', err);
    res.status(500).json({ error: 'Server error' });
  }
}

export async function completeProfile(req, res) {
  try {
    const { name } = req.body;
    if (!name?.trim()) {
      return res.status(400).json({ error: 'Name is required' });
    }

    const { data: user, error } = await supabase
      .from('users')
      .update({ name: name.trim() })
      .eq('id', req.user.userId)
      .select()
      .single();

    if (error || !user) return res.status(404).json({ error: 'User not found' });

    res.json({
      success: true,
      user: {
        id: user.id,
        phone: user.phone,
        name: user.name,
      },
    });
  } catch (err) {
    console.error('complete-profile error:', err);
    res.status(500).json({ error: 'Server error' });
  }
}

export function adminLogin(req, res) {
  const { adminId, password } = req.body;
  if (adminId !== ADMIN_ID || password !== ADMIN_PASSWORD) {
    return res.status(401).json({ error: 'Invalid admin credentials' });
  }
  res.json({ success: true, token: 'CIVIC_ADMIN' });
}
