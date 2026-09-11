import { supabase } from '../config/supabase.js';
import { runAIAnalysis } from '../services/aiRunner.js';
import { uploadBuffer } from '../config/cloudinary.js';

const MAHARASHTRA_ZONES = [
  // Pune & Pimpri-Chinchwad Region
  { name: 'Alandi / MIT Alandi', region: 'Pune', lat: 18.6750, lng: 73.8920 },
  { name: 'Pimpri-Chinchwad', region: 'Pune', lat: 18.6298, lng: 73.7997 },
  { name: 'Pune Central', region: 'Pune', lat: 18.5314, lng: 73.8446 },
  { name: 'Kothrud', region: 'Pune', lat: 18.5074, lng: 73.8077 },
  { name: 'Hinjawadi', region: 'Pune', lat: 18.5913, lng: 73.7389 },
  { name: 'Viman Nagar', region: 'Pune', lat: 18.5679, lng: 73.9143 },
  { name: 'Hadapsar', region: 'Pune', lat: 18.5089, lng: 73.9259 },
  { name: 'Baner / Wakad', region: 'Pune', lat: 18.5750, lng: 73.7750 },
  { name: 'Swargate', region: 'Pune', lat: 18.5000, lng: 73.8580 },

  // Mumbai & MMR Region
  { name: 'Andheri', region: 'Mumbai', lat: 19.1364, lng: 72.8296 },
  { name: 'Bandra', region: 'Mumbai', lat: 19.0607, lng: 72.8362 },
  { name: 'Dadar', region: 'Mumbai', lat: 19.0270, lng: 72.8381 },
  { name: 'Goregaon', region: 'Mumbai', lat: 19.1666, lng: 72.8506 },
  { name: 'Powai', region: 'Mumbai', lat: 19.1187, lng: 72.9053 },
  { name: 'Chembur', region: 'Mumbai', lat: 19.0600, lng: 72.8970 },
  { name: 'Juhu', region: 'Mumbai', lat: 19.1075, lng: 72.8263 },
  { name: 'Kurla', region: 'Mumbai', lat: 19.0726, lng: 72.8845 },
  { name: 'Borivali', region: 'Mumbai', lat: 19.2290, lng: 72.8560 },
  { name: 'Vashi', region: 'Mumbai', lat: 19.0696, lng: 72.9987 },
  { name: 'Thane', region: 'Mumbai', lat: 19.2183, lng: 72.9781 },
  { name: 'Dharavi', region: 'Mumbai', lat: 19.0390, lng: 72.8542 },
  { name: 'Mankhurd', region: 'Mumbai', lat: 19.0470, lng: 72.9280 },
  { name: 'Ghatkopar', region: 'Mumbai', lat: 19.0862, lng: 72.9088 },
  { name: 'Malad', region: 'Mumbai', lat: 19.1872, lng: 72.8483 },
  { name: 'Vikhroli', region: 'Mumbai', lat: 19.1100, lng: 72.9200 },
  { name: 'Colaba', region: 'Mumbai', lat: 18.9068, lng: 72.8147 },

  // Rest of Maharashtra
  { name: 'Nashik', region: 'Maharashtra', lat: 19.9975, lng: 73.7898 },
  { name: 'Nagpur', region: 'Maharashtra', lat: 21.1458, lng: 79.0882 },
  { name: 'Chhatrapati Sambhajinagar', region: 'Maharashtra', lat: 19.8762, lng: 75.3433 },
];

const MUMBAI_ZONES = MAHARASHTRA_ZONES;

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
  let lat = Number(issue?.coordinates?.lat);
  let lng = Number(issue?.coordinates?.lng);

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    const loc = (issue?.location || '').toLowerCase();
    if (loc.includes('alandi') || loc.includes('mit')) {
      lat = 18.6750; lng = 73.8920;
    } else if (loc.includes('pimpri') || loc.includes('chinchwad') || loc.includes('pcmc')) {
      lat = 18.6298; lng = 73.7997;
    } else if (loc.includes('pune') || loc.includes('kothrud') || loc.includes('shivaji') || loc.includes('swargate')) {
      lat = 18.5314; lng = 73.8446;
    } else if (loc.includes('hinjawadi') || loc.includes('hinjewadi')) {
      lat = 18.5913; lng = 73.7389;
    } else if (loc.includes('andheri')) {
      lat = 19.1364; lng = 72.8296;
    } else if (loc.includes('bandra')) {
      lat = 19.0607; lng = 72.8362;
    } else if (loc.includes('mumbai')) {
      lat = 19.0760; lng = 72.8777;
    }
  }

  if (Number.isFinite(lat) && Number.isFinite(lng)) {
    // Exact vicinity check for Alandi / MIT Alandi
    if (lat >= 18.665 && lat <= 18.705 && lng >= 73.880 && lng <= 73.920) {
      return { name: 'Alandi / MIT Alandi', lat: 18.6750, lng: 73.8920, region: 'Pune' };
    }

    let best = null;
    for (const z of MAHARASHTRA_ZONES) {
      const d = haversineKm({ lat, lng }, z);
      if (!best || d < best.distanceKm) best = { ...z, distanceKm: d };
    }
    if (best && best.distanceKm <= 35) {
      return { name: best.name, lat: best.lat, lng: best.lng, region: best.region };
    }
    const locName = issue?.location?.split(',')[0]?.trim() || 'Maharashtra Zone';
    return { name: locName, lat, lng, region: 'Maharashtra' };
  }

  if (issue?.location) {
    const loc = issue.location.toLowerCase();
    if (loc.includes('alandi') || loc.includes('mit')) return { name: 'Alandi / MIT Alandi', lat: 18.6750, lng: 73.8920, region: 'Pune' };
    if (loc.includes('pimpri') || loc.includes('chinchwad')) return { name: 'Pimpri-Chinchwad', lat: 18.6298, lng: 73.7997, region: 'Pune' };
    if (loc.includes('pune')) return { name: 'Pune Central', lat: 18.5314, lng: 73.8446, region: 'Pune' };
    const locName = issue.location.split(',')[0]?.trim();
    if (locName) return { name: locName, lat: 19.0760, lng: 72.8777, region: 'Maharashtra' };
  }

  return null;
}

function getPriority(likes) {
  if (likes >= 50) return 'High';
  if (likes >= 20) return 'Medium';
  return 'Low';
}

export function extractResolutionProof(issue) {
  if (!issue) return null;
  if (issue.resolution_proof && issue.resolution_proof.imageUrl) {
    return issue.resolution_proof;
  }
  const aiProof = (issue.ai_analysis || issue.aiAnalysis)?.resolution_proof;
  if (aiProof && aiProof.imageUrl) {
    return aiProof;
  }
  const timeline = Array.isArray(issue.timeline) ? issue.timeline : [];
  const proofEvent = [...timeline].reverse().find(t =>
    t?.proof?.imageUrl ||
    (t?.image && (t?.notes || (t?.event && (
      t.event.toLowerCase().includes('proof') ||
      t.event.toLowerCase().includes('resolution') ||
      t.event.toLowerCase().includes('completed')
    ))))
  );
  if (proofEvent) {
    const p = proofEvent.proof || {};
    const isApproved = issue.status === 'resolved';
    const isRejected = issue.status === 'inprogress' && timeline.some(t => t?.event?.toLowerCase().includes('rejected'));
    return {
      imageUrl: p.imageUrl || proofEvent.image,
      notes: p.notes || proofEvent.notes || '',
      submittedBy: p.submittedBy || 'Department Officer',
      department: p.department || issue.assigned_to || 'Department',
      submittedAt: p.submittedAt || proofEvent.time,
      status: isApproved ? 'approved' : isRejected ? 'rejected' : (p.status || 'pending_approval'),
      approvedAt: p.approvedAt || null,
      approvedBy: p.approvedBy || null,
      rejectedAt: p.rejectedAt || null,
      rejectedReason: p.rejectedReason || null,
    };
  }
  return null;
}

function adminStatusLabel(status) {
  const map = {
    pending: 'Pending',
    inprogress: 'In Progress',
    under_review: 'Under Review',
    resolved: 'Resolved',
    rejected: 'Rejected',
  };
  return map[status] || 'Pending';
}

function formatAdminIssue(issue) {
  const supporters = Array.isArray(issue.supporters) ? issue.supporters : [];
  const likesCount = supporters.length;
  const aiAnalysis = issue.ai_analysis || issue.aiAnalysis || {};
  const authenticity = aiAnalysis.authenticity || 'unknown';
  const aiBadge = authenticity === 'fake' ? 'Fake (Spam)' : authenticity === 'real' ? 'Real' : authenticity === 'scanning' ? 'Scanning...' : 'Unknown';
  const proof = extractResolutionProof(issue);
  let coords = issue.coordinates || null;
  if ((!coords || !coords.lat || !coords.lng) && issue.location) {
    const zone = bestZoneForIssue(issue);
    if (zone?.lat && zone?.lng) {
      coords = { lat: zone.lat, lng: zone.lng };
    }
  }
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
    coordinates: coords,
    image: issue.image_url || issue.imageUrl || '',
    description: issue.description,
    assignedTo: issue.assigned_to ?? issue.assignedTo ?? null,
    timeline: issue.timeline || [],
    likes: likesCount,
    resolutionProof: proof,
    resolvedImage: proof?.imageUrl || null,
    aiAnalysis: {
      textScore: aiAnalysis.textScore ?? null,
      imageScore: aiAnalysis.imageScore ?? null,
      finalScore: aiAnalysis.finalScore ?? null,
      authenticity,
      isSpam: !!aiAnalysis.isSpam,
      badge: aiBadge,
      rejectionReason: aiAnalysis.rejectionReason || null,
      dismissedAt: aiAnalysis.dismissedAt || null,
      dismissedBy: aiAnalysis.dismissedBy || null,
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
    let list = issues || [];

    // If department head, filter by allowed categories or assigned_to unless all=true
    const isDeptHead = req.admin?.role === 'dept_head';
    if (isDeptHead && req.query.all !== 'true') {
      const deptName = req.admin.department?.toLowerCase();
      const headName = req.admin.name?.toLowerCase();
      const allowedCats = req.admin.allowedCategories || [];

      list = list.filter(issue => {
        const catMatch = allowedCats.includes(issue.category);
        const assignedMatch = issue.assigned_to && (
          issue.assigned_to.toLowerCase().includes(deptName) ||
          issue.assigned_to.toLowerCase().includes(headName) ||
          (deptName && deptName.includes(issue.assigned_to.toLowerCase()))
        );
        return catMatch || assignedMatch;
      });
    } else if (req.query.department && req.query.department !== 'All') {
      const d = req.query.department.toLowerCase();
      list = list.filter(issue => 
        (issue.assigned_to && issue.assigned_to.toLowerCase().includes(d)) ||
        issue.category?.toLowerCase() === d
      );
    }

    res.json(list.map(formatAdminIssue));
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
    const underReview = all.filter(i => i.status === 'under_review').length;
    const resolved = all.filter(i => i.status === 'resolved').length;
    const rejected = all.filter(i => i.status === 'rejected').length;
    const fake = all.filter(i => (i.ai_analysis?.authenticity || i.aiAnalysis?.authenticity) === 'fake').length;
    const real = all.filter(i => (i.ai_analysis?.authenticity || i.aiAnalysis?.authenticity) === 'real').length;
    const unknown = Math.max(0, total - fake - real);
    res.json({ total, pending, inprogress, underReview, resolved, rejected, fake, real, unknown });
  } catch (err) {
    console.error('getAdminStats error:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
}

export async function updateIssueStatus(req, res) {
  try {
    const { status } = req.body;
    const validStatuses = {
      Pending: 'pending',
      'In Progress': 'inprogress',
      'Under Review': 'under_review',
      Resolved: 'resolved',
      Rejected: 'rejected',
      'Rejected (Spam)': 'rejected',
      Dismissed: 'rejected',
      pending: 'pending',
      inprogress: 'inprogress',
      under_review: 'under_review',
      resolved: 'resolved',
      rejected: 'rejected',
      dismissed: 'rejected',
    };
    let dbStatus = validStatuses[status];
    if (!dbStatus) return res.status(400).json({ error: 'Invalid status' });

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
    let updatedAi = aiAnalysis;
    let assignedTo = existing.assigned_to;

    // Handle spam complaints intelligently
    if (aiAnalysis.isSpam) {
      if (dbStatus === 'pending') {
        // Admin override to genuine
        updatedAi = {
          ...aiAnalysis,
          isSpam: false,
          authenticity: 'real',
          finalScore: Math.max(aiAnalysis.finalScore || 0, 0.75),
          overriddenAt: now,
        };
        assignedTo = null;
      } else if (dbStatus === 'rejected' || dbStatus === 'resolved') {
        // Dismiss / reject spam
        dbStatus = 'rejected';
        updatedAi = {
          ...aiAnalysis,
          isSpam: true,
          authenticity: 'fake',
          rejectionReason: 'Flagged as Fake / Spam by Mumbai Central Administrator',
          dismissedAt: now,
        };
      }
    }

    const timelineEvent = {
      time: now,
      event: dbStatus === 'rejected'
        ? 'Complaint dismissed & rejected: Flagged as Fake / Spam by Mumbai Central Administrator'
        : dbStatus === 'pending' && aiAnalysis.isSpam
        ? 'Admin override: Verified as genuine by Mumbai Central Administrator — Moved to active queue'
        : `Status changed to ${status}`,
      icon: dbStatus === 'rejected' ? 'fa-ban' : dbStatus === 'resolved' ? 'fa-circle-check' : dbStatus === 'inprogress' ? 'fa-arrows-rotate' : 'fa-clock',
      color: dbStatus === 'rejected' ? '#ef4444' : dbStatus === 'resolved' ? '#059669' : dbStatus === 'inprogress' ? '#f59e0b' : '#64748b',
    };

    const timeline = [...(existing.timeline || []), timelineEvent];

    const { data: issue, error: updateErr } = await supabase
      .from('issues')
      .update({
        status: dbStatus,
        timeline,
        ai_analysis: updatedAi,
        assigned_to: assignedTo,
      })
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
          update.status = 'rejected';
          update.timeline = timeline;
        } else {
          update.status = 'pending';
          update.assigned_to = null;
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

    const zoneAgg = new Map(MAHARASHTRA_ZONES.map(z => [z.name, {
      name: z.name,
      region: z.region,
      lat: z.lat,
      lng: z.lng,
      issues: 0,
      resolved: 0,
      top: 'N/A'
    }]));
    const zoneCatCounts = new Map(MAHARASHTRA_ZONES.map(z => [z.name, new Map()]));

    for (const it of issues) {
      const zInfo = bestZoneForIssue(it);
      if (!zInfo) continue;
      const zoneName = zInfo.name;
      if (!zoneAgg.has(zoneName)) {
        zoneAgg.set(zoneName, {
          name: zoneName,
          region: zInfo.region || 'Maharashtra',
          lat: zInfo.lat,
          lng: zInfo.lng,
          issues: 0,
          resolved: 0,
          top: 'N/A'
        });
        zoneCatCounts.set(zoneName, new Map());
      }
      const z = zoneAgg.get(zoneName);
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

export async function submitResolutionProof(req, res) {
  try {
    const { id } = req.params;
    const { notes } = req.body;

    if (!req.file) {
      return res.status(400).json({ error: 'Resolution proof photo is required' });
    }

    const { data: existing, error: findErr } = await supabase
      .from('issues')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (findErr || !existing) return res.status(404).json({ error: 'Issue not found' });

    // Upload to Cloudinary in 'civicassist_resolved' folder
    const uploadResult = await uploadBuffer(req.file.buffer, 'civicassist_resolved');
    const resolvedUrl = uploadResult.secure_url;

    const now = new Date().toLocaleString('en-IN', {
      hour: '2-digit', minute: '2-digit', hour12: true,
      day: '2-digit', month: 'short', year: 'numeric',
    });

    const deptName = req.admin?.department || existing.assigned_to || 'Department';
    const headName = req.admin?.name || 'Department Officer';

    const resolutionProof = {
      imageUrl: resolvedUrl,
      notes: notes?.trim() || '',
      submittedBy: headName,
      department: deptName,
      submittedAt: now,
      status: 'pending_approval',
    };

    const timelineEvent = {
      time: now,
      event: `Work completed by ${deptName} — Resolution proof submitted for Mumbai Admin verification`,
      icon: 'fa-camera',
      color: '#8b5cf6',
      image: resolvedUrl,
      notes: notes?.trim() || 'Work finished on-site by field team',
      proof: resolutionProof,
    };

    const timeline = [...(existing.timeline || []), timelineEvent];
    const existingAi = existing.ai_analysis || existing.aiAnalysis || {};
    const updatedAi = {
      ...existingAi,
      resolution_proof: resolutionProof,
    };

    const { data: updated, error: updateErr } = await supabase
      .from('issues')
      .update({
        status: 'under_review',
        timeline,
        ai_analysis: updatedAi,
      })
      .eq('id', id)
      .select()
      .single();

    if (updateErr) throw updateErr;
    console.log(`Resolution proof submitted for ${id} by ${deptName}: ${resolvedUrl}`);
    res.json(formatAdminIssue(updated));
  } catch (err) {
    console.error('submitResolutionProof error:', err.message);
    res.status(500).json({ error: err.message || 'Failed to submit resolution proof' });
  }
}

export async function approveResolution(req, res) {
  try {
    const { id } = req.params;

    const { data: existing, error: findErr } = await supabase
      .from('issues')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (findErr || !existing) return res.status(404).json({ error: 'Issue not found' });

    const now = new Date().toLocaleString('en-IN', {
      hour: '2-digit', minute: '2-digit', hour12: true,
      day: '2-digit', month: 'short', year: 'numeric',
    });

    const currentProof = extractResolutionProof(existing) || {};

    const resolutionProof = {
      ...currentProof,
      status: 'approved',
      approvedAt: now,
      approvedBy: req.admin?.name || 'Mumbai Central Admin',
    };

    const timelineEvent = {
      time: now,
      event: 'Resolution approved & verified by Mumbai Central Admin — Public ticket resolved',
      icon: 'fa-circle-check',
      color: '#059669',
      image: resolutionProof.imageUrl || null,
      notes: 'Mumbai Central Admin inspected and verified the resolution proof.',
      proof: resolutionProof,
    };

    const timeline = [...(existing.timeline || []), timelineEvent];
    const existingAi = existing.ai_analysis || existing.aiAnalysis || {};
    const updatedAi = {
      ...existingAi,
      resolution_proof: resolutionProof,
    };

    const { data: updated, error: updateErr } = await supabase
      .from('issues')
      .update({
        status: 'resolved',
        timeline,
        ai_analysis: updatedAi,
      })
      .eq('id', id)
      .select()
      .single();

    if (updateErr) throw updateErr;
    console.log(`Resolution approved for ${id} by Mumbai Admin`);
    res.json(formatAdminIssue(updated));
  } catch (err) {
    console.error('approveResolution error:', err.message);
    res.status(500).json({ error: err.message || 'Failed to approve resolution' });
  }
}

export async function rejectResolution(req, res) {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const { data: existing, error: findErr } = await supabase
      .from('issues')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (findErr || !existing) return res.status(404).json({ error: 'Issue not found' });

    const now = new Date().toLocaleString('en-IN', {
      hour: '2-digit', minute: '2-digit', hour12: true,
      day: '2-digit', month: 'short', year: 'numeric',
    });

    const rejectReason = reason?.trim() || 'Work inspection unsatisfied — rework required.';
    const currentProof = extractResolutionProof(existing) || {};

    const resolutionProof = {
      ...currentProof,
      status: 'rejected',
      rejectedAt: now,
      rejectedReason: rejectReason,
    };

    const timelineEvent = {
      time: now,
      event: `Resolution rejected by Mumbai Central Admin: "${rejectReason}" — Returned for rework`,
      icon: 'fa-rotate-left',
      color: '#ef4444',
      notes: rejectReason,
      proof: resolutionProof,
    };

    const timeline = [...(existing.timeline || []), timelineEvent];
    const existingAi = existing.ai_analysis || existing.aiAnalysis || {};
    const updatedAi = {
      ...existingAi,
      resolution_proof: resolutionProof,
    };

    const { data: updated, error: updateErr } = await supabase
      .from('issues')
      .update({
        status: 'inprogress',
        timeline,
        ai_analysis: updatedAi,
      })
      .eq('id', id)
      .select()
      .single();

    if (updateErr) throw updateErr;
    console.log(`Resolution rejected for ${id} by Mumbai Admin: ${rejectReason}`);
    res.json(formatAdminIssue(updated));
  } catch (err) {
    console.error('rejectResolution error:', err.message);
    res.status(500).json({ error: err.message || 'Failed to reject resolution' });
  }
}

export async function dismissSpamIssue(req, res) {
  try {
    const { id } = req.params;
    const { reason } = req.body || {};

    const { data: existing, error: findErr } = await supabase
      .from('issues')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (findErr || !existing) return res.status(404).json({ error: 'Issue not found' });

    const now = new Date().toLocaleString('en-IN', {
      hour: '2-digit', minute: '2-digit', hour12: true,
      day: '2-digit', month: 'short', year: 'numeric',
    });

    const dismissReason = reason?.trim() || 'Photo or description verified as fake / spam. Does not match a legitimate civic issue.';

    const timelineEvent = {
      time: now,
      event: `Complaint dismissed & rejected: "${dismissReason}" — Flagged as Fake / Spam by Mumbai Central Administrator`,
      icon: 'fa-ban',
      color: '#ef4444',
      notes: dismissReason,
    };

    const timeline = [...(existing.timeline || []), timelineEvent];
    const existingAi = existing.ai_analysis || existing.aiAnalysis || {};
    const updatedAi = {
      ...existingAi,
      isSpam: true,
      authenticity: 'fake',
      rejectionReason: dismissReason,
      dismissedAt: now,
      dismissedBy: req.admin?.name || 'Mumbai Central Administrator',
    };

    const { data: updated, error: updateErr } = await supabase
      .from('issues')
      .update({
        status: 'rejected',
        timeline,
        ai_analysis: updatedAi,
        assigned_to: 'Spam Queue',
      })
      .eq('id', id)
      .select()
      .single();

    if (updateErr) throw updateErr;
    console.log(`Spam complaint ${id} dismissed & rejected by ${req.admin?.name}`);
    res.json(formatAdminIssue(updated));
  } catch (err) {
    console.error('dismissSpamIssue error:', err.message);
    res.status(500).json({ error: err.message || 'Failed to dismiss spam complaint' });
  }
}

export async function overrideSpamIssue(req, res) {
  try {
    const { id } = req.params;

    const { data: existing, error: findErr } = await supabase
      .from('issues')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (findErr || !existing) return res.status(404).json({ error: 'Issue not found' });

    const now = new Date().toLocaleString('en-IN', {
      hour: '2-digit', minute: '2-digit', hour12: true,
      day: '2-digit', month: 'short', year: 'numeric',
    });

    const timelineEvent = {
      time: now,
      event: 'Admin Override: Verified as genuine by Mumbai Central Administrator — Moved to active queue',
      icon: 'fa-user-shield',
      color: '#059669',
      notes: 'Manually cleared from spam queue by administrator inspection.',
    };

    const timeline = [...(existing.timeline || []), timelineEvent];
    const existingAi = existing.ai_analysis || existing.aiAnalysis || {};
    const updatedAi = {
      ...existingAi,
      isSpam: false,
      authenticity: 'real',
      finalScore: Math.max(existingAi.finalScore || 0, 0.85),
      overriddenAt: now,
      overriddenBy: req.admin?.name || 'Mumbai Central Administrator',
    };

    const { data: updated, error: updateErr } = await supabase
      .from('issues')
      .update({
        status: 'pending',
        timeline,
        ai_analysis: updatedAi,
        assigned_to: null,
      })
      .eq('id', id)
      .select()
      .single();

    if (updateErr) throw updateErr;
    console.log(`Spam complaint ${id} overridden and marked as genuine by ${req.admin?.name}`);
    res.json(formatAdminIssue(updated));
  } catch (err) {
    console.error('overrideSpamIssue error:', err.message);
    res.status(500).json({ error: err.message || 'Failed to override spam complaint' });
  }
}
