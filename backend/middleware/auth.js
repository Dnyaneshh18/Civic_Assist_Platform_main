import { supabase } from '../config/supabase.js';

export async function requireAuth(req, res, next) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  const userId = header.slice(7);
  if (userId === 'CIVIC_ADMIN') {
    return res.status(403).json({ error: 'Admin cannot perform user actions' });
  }
  try {
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (error || !user) return res.status(401).json({ error: 'User not found' });
    req.user = { userId: user.id, phone: user.phone };
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid session' });
  }
}

export async function optionalAuth(req, res, next) {
  const header = req.headers.authorization;
  if (header?.startsWith('Bearer ')) {
    const userId = header.slice(7);
    if (userId !== 'CIVIC_ADMIN') {
      try {
        const { data: user } = await supabase
          .from('users')
          .select('*')
          .eq('id', userId)
          .maybeSingle();
        if (user) req.user = { userId: user.id, phone: user.phone };
      } catch {}
    }
  }
  next();
}

export function requireAdmin(req, res, next) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  if (header.slice(7) === 'CIVIC_ADMIN') {
    req.admin = { role: 'admin' };
    return next();
  }
  return res.status(403).json({ error: 'Admin access required' });
}
