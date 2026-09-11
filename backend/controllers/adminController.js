import { supabase } from '../config/supabase.js';
import { runAIAnalysis } from '../services/aiRunner.js';

const MUMBAI_ZONES = [
  { name: 'Andheri', lat: 19.1364, lng: 72.8296 },
  { name: 'Bandra', lat: 19.0607, lng: 72.8362 },
  { name: 'Dadar', lat: 19.0270, lng: 72.8381 },
  { name: 'Goregaon', lat: 19.1666, lng: 72.8506 },
  { name: 'Powai', lat: 19.1187, lng: 72.9053 },
  { name: 'Chembur', lat: 19.0600, lng: 72.8970 },
  { name: 'Juhu', lat: 19.1075, lng: 72.8263 },
  { name: 'Kurla', lat: 19.0726, lng: 72.8845 },
  { name: 'Borivali', lat: 19.2290, lng: 72.8560 },
  { name: 'Vashi', lat: 19.0696, lng: 72.9987 },
];

const OFFICER_COLORS = ['#2563eb', '#7c3aed', '#059669', '#d97706', '#0891b2', '#ef4444'];

function timeAgo(date) {
  const diff = (Date.now() - new Date(date).getTime()) / 1000;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

function haversineKm(a, b) {
  const R = 6371;
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
}

function bestZoneForIssue(issue) {
  const lat = Number(issue?.coordinates?.lat);
  const lng = Number(issue?.coordinates?.lng);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;

  let best = null;
  for (const z of MUMBAI_ZONES) {
    const d = haversineKm({ lat, lng }, z);
    if (!best || d < best.distanceKm) best = { ...z, distanceKm: d };
  }
  if (!best || best.distanceKm > 25) return null;
  return best.name;
}

function getPriority(likes) {
  if (likes >= 50) return 'High';
  if (likes >= 20) return 'Medium';
  return 'Low';
}

function adminStatusLabel(status) {
  const map = { pending: 'Pending', inprogress: 'In Progress', resolved: 'Resolved' };
  return map[status] || 'Pending';
}

function formatAdminIssue(issue) {
  const supporters = Array.isArray(issue.supporters) ? issue.supporters : [];
  const likesCount = supporters.length;
  const aiAnalysis = issue.ai_analysis || issue.aiAnalysis || {};
  const authenticity = aiAnalysis.authenticity || 'unknown';
  const aiBadge = authenticity === 'fake' ? 'Fake (Spam)' : authenticity === 'real' ? 'Real' : authenticity === 'scanning' ? 'Scanning...' : 'Unknown';
  return {
    id: issue.complaint_id || issue.complaintId || `#${String(issue.id).slice(-4).toUpperCase()}`,
    _id: String(issue.id),
    title: issue.title,
    category: issue.category,
    status: adminStatusLabel(issue.status),
    date: timeAgo(issue.created_at || issue.createdAt),
    submittedAt: new Date(issue.created_at || issue.createdAt).toLocaleString('en-IN', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit', hour12: true,
    }),
    priority: getPriority(likesCount),
    reporter: issue.reporter?.name || 'Anonymous',
    phone: issue.reporter?.phone || 'N/A',
    location: issue.location,
    image: issue.image_url || issue.imageUrl || '',
    description: issue.description,
    assignedTo: issue.assigned_to ?? issue.assignedTo ?? null,
    timeline: issue.timeline || [],
    likes: likesCount,
    aiAnalysis: {
      textScore: aiAnalysis.textScore ?? null,
      imageScore: aiAnalysis.imageScore ?? null,
      finalScore: aiAnalysis.finalScore ?? null,
      authenticity,
      isSpam: !!aiAnalysis.isSpam,
      badge: aiBadge,
    },
  };
}

export async function getAdminIssues(req, res) {
  try {
    const { data: issues, error } = await supabase
      .from('issues')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json((issues || []).map(formatAdminIssue));
  } catch (err) {
    console.error('getAdminIssues error:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
}

export async function getAdminIssueById(req, res) {
  try {
    const { data: issue, error } = await supabase
      .from('issues')
      .select('*')
      .eq('id', req.params.id)
      .maybeSingle();

    if (error || !issue) return res.status(404).json({ error: 'Issue not found' });
    res.json(formatAdminIssue(issue));
  } catch (err) {
    console.error('GET /admin/issues/:id error:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
}

export async function getAdminStats(req, res) {
  try {
    const { data: issues, error } = await supabase
      .from('issues')
      .select('status, ai_analysis');

    if (error) throw error;
    const all = issues || [];
    const total = all.length;
    const pending = all.filter(i => i.status === 'pending').length;
    const inprogress = all.filter(i => i.status === 'inprogress').length;
    const resolved = all.filter(i => i.status === 'resolved').length;
    const fake = all.filter(i => (i.ai_analysis?.authenticity || i.aiAnalysis?.authenticity) === 'fake').length;
    const real = all.filter(i => (i.ai_analysis?.authenticity || i.aiAnalysis?.authenticity) === 'real').length;
    const unknown = Math.max(0, total - fake - real);
    res.json({ total, pending, inprogress, resolved, fake, real, unknown });
  } catch (err) {
    console.error('getAdminStats error:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
}

export async function updateIssueStatus(req, res) {
  try {
    const { status } = req.body;
    const validStatuses = { Pending: 'pending', 'In Progress': 'inprogress', Resolved: 'resolved' };
    const dbStatus = validStatuses[status];
    if (!dbStatus) return res.status(400).json({ error: 'Invalid status' });

    const now = new Date().toLocaleString('en-IN', {
      hour: '2-digit', minute: '2-digit', hour12: true,
      day: '2-digit', month: 'short',
    });

    const timelineEvent = {
      time: now,
      event: `Status changed to ${status}`,
      icon: status === 'Resolved' ? 'fa-circle-check' : status === 'In Progress' ? 'fa-arrows-rotate' : 'fa-clock',
      color: status === 'Resolved' ? '#059669' : status === 'In Progress' ? '#f59e0b' : '#64748b',
    };

    const { data: existing, error: findErr } = await supabase
      .from('issues')
      .select('*')
      .eq('id', req.params.id)
      .maybeSingle();

    if (findErr || !existing) return res.status(404).json({ error: 'Issue not found' });
    const aiAnalysis = existing.ai_analysis || existing.aiAnalysis || {};
    if (aiAnalysis.isSpam) {
      return res.status(400).json({ error: 'Spam complaint status cannot be changed' });
    }

    const timeline = [...(existing.timeline || []), timelineEvent];

    const { data: issue, error: updateErr } = await supabase
      .from('issues')
      .update({ status: dbStatus, timeline })
      .eq('id', req.params.id)
      .select()
      .single();

    if (updateErr || !issue) return res.status(404).json({ error: 'Issue not found' });
    res.json(formatAdminIssue(issue));
  } catch (err) {
    console.error('updateIssueStatus error:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
}

export async function assignIssue(req, res) {
  try {
    const { department } = req.body;
    if (!department) return res.status(400).json({ error: 'Department required' });

    const now = new Date().toLocaleString('en-IN', {
      hour: '2-digit', minute: '2-digit', hour12: true,
      day: '2-digit', month: 'short',
    });

    const { data: existing, error: findErr } = await supabase
      .from('issues')
      .select('*')
      .eq('id', req.params.id)
      .maybeSingle();

    if (findErr || !existing) return res.status(404).json({ error: 'Issue not found' });
    const aiAnalysis = existing.ai_analysis || existing.aiAnalysis || {};
    if (aiAnalysis.isSpam) {
      return res.status(400).json({ error: 'Spam complaint cannot be assigned' });
    }

    const timeline = [
      ...(existing.timeline || []),
      {
        time: now,
        event: `Assigned to ${department}`,
        icon: 'fa-building',
        color: '#7c3aed',
      },
    ];

    const { data: issue, error: updateErr } = await supabase
      .from('issues')
      .update({
        assigned_to: department,
        status: 'inprogress',
        timeline,
      })
      .eq('id', req.params.id)
      .select()
      .single();

    if (updateErr || !issue) return res.status(404).json({ error: 'Issue not found' });
    res.json(formatAdminIssue(issue));
  } catch (err) {
    console.error('assignIssue error:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
}

export async function reanalyzeIssue(req, res) {
  try {
    const { data: issue, error: findErr } = await supabase
      .from('issues')
      .select('*')
      .eq('id', req.params.id)
      .maybeSingle();

    if (findErr || !issue) return res.status(404).json({ error: 'Issue not found' });

    const currentAi = issue.ai_analysis || issue.aiAnalysis || {};
    const resetAi = {
      textScore: currentAi.textScore ?? null,
      imageScore: currentAi.imageScore ?? null,
      finalScore: currentAi.finalScore ?? null,
      authenticity: 'scanning',
      isSpam: false,
    };

    const { data: updatedIssue } = await supabase
      .from('issues')
      .update({ ai_analysis: resetAi })
      .eq('id', req.params.id)
      .select()
      .single();

    res.json(formatAdminIssue(updatedIssue || issue));

    const issueId = issue.id;
    const description = issue.description;
    const category = issue.category;
    const imageUrl = issue.image_url || issue.imageUrl;

    runAIAnalysis({ description, category, imageUrl: imageUrl || null })
      .then(async (aiAnalysis) => {
        const update = { ai_analysis: aiAnalysis };
        if (aiAnalysis.isSpam) {
          const now = new Date().toLocaleString('en-IN', {
            hour: '2-digit', minute: '2-digit', hour12: true,
            day: '2-digit', month: 'short',
          });
          const { data: cur } = await supabase.from('issues').select('timeline').eq('id', issueId).single();
          const timeline = [
            ...(cur?.timeline || []),
            {
              time: now,
              event: 'AI moderation flagged this complaint as SPAM',
              icon: 'fa-triangle-exclamation',
              color: '#ef4444',
            },
          ];
          update.assigned_to = 'Spam Queue';
          update.timeline = timeline;
        }
        await supabase.from('issues').update(update).eq('id', issueId);
        console.log(`Reanalysis complete for ${issueId}: score=${aiAnalysis.finalScore}, spam=${aiAnalysis.isSpam}`);
      })
      .catch((err) => {
        console.error(`Background reanalysis failed for ${issueId}:`, err.message);
        supabase.from('issues').update({
          ai_analysis: { ...resetAi, authenticity: 'unknown' },
        }).eq('id', issueId).catch(() => {});
      });

  } catch (err) {
    console.error('POST /admin/issues/:id/reanalyze error:', err.message);
    res.status(500).json({ error: 'Failed to re-analyze complaint' });
  }
}

export async function getOfficers(req, res) {
  try {
    const { data: officers, error } = await supabase
      .from('officers')
      .select('*')
      .order('created_at', { ascending: true });

    if (error) throw error;
    res.json(officers || []);
  } catch (err) {
    console.error('getOfficers error:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
}

export async function createOfficer(req, res) {
  try {
    const { name, phone, role, zone } = req.body;
    if (!name?.trim()) return res.status(400).json({ error: 'Name is required' });

    const { count } = await supabase.from('officers').select('*', { count: 'exact', head: true });
    const currentCount = count || 0;
    const initials = name.trim().split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
    const color = OFFICER_COLORS[currentCount % OFFICER_COLORS.length];

    const { data: officer, error } = await supabase
      .from('officers')
      .insert({
        name: name.trim(),
        phone: phone || '',
        role: role || 'Field Officer',
        zone: zone || 'North Zone',
        initials,
        color,
      })
      .select()
      .single();

    if (error) throw error;
    res.status(201).json(officer);
  } catch (err) {
    console.error('createOfficer error:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
}

export async function getAdminAnalysis(req, res) {
  try {
    const { data: allIssues, error } = await supabase
      .from('issues')
      .select('id, category, status, coordinates, created_at, updated_at, supporters, assigned_to, complaint_id, title, location');

    if (error) throw error;
    const issues = allIssues || [];
    const total = issues.length;
    const pending = issues.filter(i => i.status === 'pending').length;
    const inprogress = issues.filter(i => i.status === 'inprogress').length;
    const resolved = issues.filter(i => i.status === 'resolved').length;

    const catCounts = new Map();
    for (const i of issues) {
      catCounts.set(i.category, (catCounts.get(i.category) || 0) + 1);
    }
    const categoryBreakdown = [...catCounts.entries()]
      .map(([category, count]) => ({ category, count }))
      .sort((a, b) => b.count - a.count);

    const resolutionRatePct = total > 0 ? Math.round((resolved / total) * 100) : 0;

    const resolvedIssues = issues.filter(i => i.status === 'resolved');
    let avgResolutionDays = 'N/A';
    if (resolvedIssues.length > 0) {
      const validDiffs = resolvedIssues
        .map(issue => new Date(issue.updated_at || issue.created_at).getTime() - new Date(issue.created_at).getTime())
        .filter(ms => ms > 0);
      if (validDiffs.length > 0) {
        const avg = validDiffs.reduce((s, v) => s + v, 0) / validDiffs.length;
        avgResolutionDays = (avg / (1000 * 60 * 60 * 24)).toFixed(1);
      }
    }

    const peakCategory = categoryBreakdown[0]?.category || 'N/A';

    const zoneAgg = new Map(MUMBAI_ZONES.map(z => [z.name, { name: z.name, lat: z.lat, lng: z.lng, issues: 0, resolved: 0, top: 'N/A' }]));
    const zoneCatCounts = new Map(MUMBAI_ZONES.map(z => [z.name, new Map()]));

    for (const it of issues) {
      const zoneName = bestZoneForIssue(it);
      if (!zoneName) continue;
      const z = zoneAgg.get(zoneName);
      if (!z) continue;
      z.issues += 1;
      if (it.status === 'resolved') z.resolved += 1;
      const cMap = zoneCatCounts.get(zoneName);
      cMap.set(it.category, (cMap.get(it.category) || 0) + 1);
    }

    for (const [zoneName, cMap] of zoneCatCounts.entries()) {
      let best = null;
      for (const [cat, count] of cMap.entries()) {
        if (!best || count > best.count) best = { cat, count };
      }
      if (best) {
        const z = zoneAgg.get(zoneName);
        z.top = best.cat?.charAt(0).toUpperCase() + best.cat?.slice(1);
      }
    }

    const hotspots = [...zoneAgg.values()].sort((a, b) => b.issues - a.issues);

    const nowMs = Date.now();
    const ageDays = (d) => Math.max(0, (nowMs - new Date(d).getTime()) / (1000 * 60 * 60 * 24));
    const likesCount = (it) => it.supporters?.length || 0;
    const isOverdue = (it) => {
      const days = ageDays(it.created_at);
      if (it.status === 'pending') return days >= 2;
      if (it.status === 'inprogress') return days >= 7;
      return false;
    };

    const quickWinCats = new Set(['streetlight', 'garbage', 'noise']);

    const actionable = issues
      .filter(it => it.status !== 'resolved')
      .map(it => {
        const days = ageDays(it.created_at);
        const likes = likesCount(it);
        const unassigned = !it.assigned_to;
        const overdue = isOverdue(it);
        const quickWin = quickWinCats.has(it.category) && it.status === 'pending';

        let score = 0;
        if (unassigned) score += 50;
        if (overdue) score += 35;
        score += Math.min(likes, 150) * 0.4;
        score += Math.min(days, 14) * 1.2;
        if (quickWin) score += 12;

        const reasons = [];
        if (unassigned) reasons.push('Unassigned');
        if (overdue) reasons.push(`Overdue (${days.toFixed(1)}d)`);
        if (likes >= 20) reasons.push(`${likes} supporters`);
        if (quickWin) reasons.push('Fast win');

        return {
          _id: String(it.id),
          complaintId: it.complaint_id || null,
          title: it.title,
          category: it.category,
          location: it.location,
          status: it.status,
          assignedTo: it.assigned_to || null,
          likes,
          ageDays: Number(days.toFixed(1)),
          score: Number(score.toFixed(1)),
          reason: reasons.join(' · ') || 'Review',
        };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, 10);

    res.json({
      insightsVersion: 2,
      total, pending, inprogress, resolved,
      resolutionRatePct,
      avgResolutionDays,
      peakCategory,
      categoryBreakdown,
      hotspots,
      actionQueue: actionable,
    });
  } catch (err) {
    console.error('getAdminAnalysis error:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
}
