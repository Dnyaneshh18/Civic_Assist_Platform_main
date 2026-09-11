import { supabase } from '../config/supabase.js';
import { uploadBuffer } from '../config/cloudinary.js';
import { runAIAnalysis } from '../services/aiRunner.js';
import { extractResolutionProof } from './adminController.js';

function formatForClient(issue, currentUserId) {
  const supporters = Array.isArray(issue.supporters) ? issue.supporters : [];
  const likesCount = supporters.length;
  const isLiked = currentUserId ? supporters.includes(currentUserId) : false;
  const proof = extractResolutionProof(issue);
  return {
    id: issue.id,
    _id: issue.id,
    complaintId: issue.complaint_id || issue.complaintId,
    title: issue.title,
    description: issue.description,
    category: issue.category,
    location: issue.location,
    coordinates: issue.coordinates || null,
    image: issue.image_url || issue.imageUrl || '',
    reporter: {
      name: issue.reporter?.name || 'Anonymous',
      userId: issue.reporter?.userId || '',
      phone: issue.reporter?.phone || '',
    },
    status: issue.status,
    likes: likesCount,
    isLiked,
    shares: issue.shares || 0,
    comments: (issue.comments || []).map((c, idx) => ({
      id: c.id || c._id?.toString() || String(idx),
      user: c.userName || c.user || 'Anonymous',
      text: c.text,
      createdAt: c.createdAt || c.created_at,
    })),
    assignedTo: issue.assigned_to ?? issue.assignedTo ?? null,
    timeline: issue.timeline || [],
    resolutionProof: proof,
    resolvedImage: proof?.imageUrl || null,
    aiAnalysis: issue.ai_analysis || issue.aiAnalysis || null,
    createdAt: issue.created_at || issue.createdAt,
  };
}

export async function getIssues(req, res) {
  try {
    const { data: issues, error } = await supabase
      .from('issues')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    const uid = req.user?.userId || null;
    res.json((issues || []).map(i => formatForClient(i, uid)));
  } catch (err) {
    console.error('GET /issues error:', err);
    res.status(500).json({ error: 'Server error' });
  }
}

export async function createIssue(req, res) {
  try {
    const { title, description, category, location, lat, lng } = req.body;

    if (!title || !description || !category || !location) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'Photo is required' });
    }

    const { data: user } = await supabase
      .from('users')
      .select('*')
      .eq('id', req.user.userId)
      .maybeSingle();

    const reporterName = user?.name || 'Anonymous';

    const now = new Date().toLocaleString('en-IN', {
      hour: '2-digit', minute: '2-digit', hour12: true,
      day: '2-digit', month: 'short', year: 'numeric',
    });

    const complaintId = `#C${Math.random().toString(36).substring(2, 7).toUpperCase()}`;

    const { data: issue, error: insertError } = await supabase
      .from('issues')
      .insert({
        complaint_id: complaintId,
        title: title.trim(),
        description: description.trim(),
        category,
        location: location.trim(),
        coordinates: lat && lng ? { lat: parseFloat(lat), lng: parseFloat(lng) } : null,
        image_url: '',
        reporter: {
          userId: req.user.userId,
          name: reporterName,
          phone: user?.phone ? `+91 ${user.phone}` : '',
        },
        status: 'pending',
        supporters: [],
        timeline: [
          { time: now, event: 'Complaint submitted by citizen', icon: 'fa-circle-plus', color: '#2563eb' },
        ],
        assigned_to: null,
        ai_analysis: { textScore: null, imageScore: null, finalScore: null, authenticity: 'unknown', isSpam: false },
      })
      .select()
      .single();

    if (insertError) throw insertError;

    res.status(201).json(formatForClient(issue, req.user.userId));

    const imageBuffer = Buffer.from(req.file.buffer);
    const imageMimeType = req.file.mimetype;
    const issueId = issue.id;
    const descTrimmed = description.trim();

    Promise.all([
      uploadBuffer(imageBuffer).then(async (result) => {
        await supabase
          .from('issues')
          .update({ image_url: result.secure_url })
          .eq('id', issueId);
        console.log(`Image uploaded for ${issueId}: ${result.secure_url}`);
        return result.secure_url;
      }).catch((err) => {
        console.error(`Background Cloudinary upload failed for ${issueId}:`, err.message);
        return null;
      }),

      runAIAnalysis({ description: descTrimmed, category, imageBuffer, imageMimeType })
        .then(async (aiResult) => {
          const { data: current } = await supabase
            .from('issues')
            .select('timeline')
            .eq('id', issueId)
            .single();

          const timeline = [...(current?.timeline || [])];
          if (aiResult.isSpam) {
            timeline.push({
              time: new Date().toLocaleString('en-IN', {
                hour: '2-digit', minute: '2-digit', hour12: true,
                day: '2-digit', month: 'short', year: 'numeric',
              }),
              event: 'AI moderation flagged this complaint as SPAM',
              icon: 'fa-triangle-exclamation',
              color: '#ef4444',
            });
          }

          await supabase
            .from('issues')
            .update({
              ai_analysis: aiResult,
              timeline,
              ...(aiResult.isSpam && { assigned_to: 'Spam Queue', status: 'rejected' }),
            })
            .eq('id', issueId);

          console.log(`AI analysis complete for ${issueId}: score=${aiResult.finalScore}, spam=${aiResult.isSpam}`);
        })
        .catch((err) => {
          console.error(`Background AI analysis failed for ${issueId}:`, err.message);
        }),
    ]);

  } catch (err) {
    console.error('POST /issues error:', err);
    res.status(500).json({ error: 'Server error' });
  }
}

export async function toggleIssueLike(req, res) {
  try {
    const { data: issue, error: fetchErr } = await supabase
      .from('issues')
      .select('*')
      .eq('id', req.params.id)
      .maybeSingle();

    if (fetchErr || !issue) return res.status(404).json({ error: 'Issue not found' });

    const uid = req.user.userId;
    const supporters = Array.isArray(issue.supporters) ? [...issue.supporters] : [];
    const idx = supporters.indexOf(uid);
    if (idx === -1) {
      supporters.push(uid);
    } else {
      supporters.splice(idx, 1);
    }

    const { error: updateErr } = await supabase
      .from('issues')
      .update({ supporters })
      .eq('id', req.params.id);

    if (updateErr) throw updateErr;

    res.json({ likes: supporters.length, isLiked: idx === -1 });
  } catch (err) {
    console.error('POST /issues/:id/like error:', err);
    res.status(500).json({ error: 'Server error' });
  }
}

export async function addIssueComment(req, res) {
  try {
    const { text } = req.body;
    if (!text?.trim()) return res.status(400).json({ error: 'Comment text required' });

    const { data: user } = await supabase
      .from('users')
      .select('name')
      .eq('id', req.user.userId)
      .maybeSingle();

    const userName = user?.name || 'Anonymous';

    const { data: issue, error: fetchErr } = await supabase
      .from('issues')
      .select('comments')
      .eq('id', req.params.id)
      .maybeSingle();

    if (fetchErr || !issue) return res.status(404).json({ error: 'Issue not found' });

    const newComment = {
      id: Math.random().toString(36).substring(2, 11),
      userId: req.user.userId,
      userName,
      text: text.trim(),
      createdAt: new Date().toISOString(),
    };

    const comments = [...(issue.comments || []), newComment];

    const { error: updateErr } = await supabase
      .from('issues')
      .update({ comments })
      .eq('id', req.params.id);

    if (updateErr) throw updateErr;

    res.status(201).json({
      id: newComment.id,
      user: newComment.userName,
      text: newComment.text,
      createdAt: newComment.createdAt,
    });
  } catch (err) {
    console.error('POST /issues/:id/comments error:', err);
    res.status(500).json({ error: 'Server error' });
  }
}

export async function getIssueById(req, res) {
  try {
    const { data: issue, error } = await supabase
      .from('issues')
      .select('*')
      .eq('id', req.params.id)
      .maybeSingle();

    if (error || !issue) return res.status(404).json({ error: 'Issue not found' });
    res.json(formatForClient(issue, req.user?.userId || null));
  } catch (err) {
    console.error('GET /issues/:id error:', err);
    res.status(500).json({ error: 'Server error' });
  }
}
