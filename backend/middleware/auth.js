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

import { DEPARTMENT_ACCOUNTS } from '../controllers/authController.js';

export function requireAdmin(req, res, next) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  const token = header.slice(7);
  if (token === 'CIVIC_ADMIN') {
    req.admin = { role: 'admin', department: 'All', name: 'Mumbai Central Administrator' };
    return next();
  }
  if (token.startsWith('DEPT_HEAD_')) {
    const deptKey = token.replace('DEPT_HEAD_', '');
    const dept = DEPARTMENT_ACCOUNTS[deptKey];
    if (dept) {
      req.admin = { role: 'dept_head', department: dept.department, name: dept.headName, deptKey };
      return next();
    }
  }
  return res.status(403).json({ error: 'Admin or department access required' });
}
