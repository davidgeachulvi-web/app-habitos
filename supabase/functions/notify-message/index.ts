import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import * as jose from 'https://deno.land/x/jose@v5.9.6/index.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function json(status: number, body: Record<string, unknown>) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

async function getFcmAccessToken() {
  const projectId = Deno.env.get('FIREBASE_PROJECT_ID');
  const clientEmail = Deno.env.get('FIREBASE_CLIENT_EMAIL');
  const privateKey = (Deno.env.get('FIREBASE_PRIVATE_KEY') || '').replace(/\\n/g, '\n');
  if (!projectId || !clientEmail || !privateKey) return null;

  const now = Math.floor(Date.now() / 1000);
  const jwt = await new jose.SignJWT({
    iss: clientEmail,
    scope: 'https://www.googleapis.com/auth/firebase.messaging',
    aud: 'https://oauth2.googleapis.com/token',
    iat: now,
    exp: now + 3600,
  })
    .setProtectedHeader({ alg: 'RS256', typ: 'JWT' })
    .setIssuer(clientEmail)
    .setAudience('https://oauth2.googleapis.com/token')
    .setIssuedAt(now)
    .setExpirationTime(now + 3600)
    .sign(await jose.importPKCS8(privateKey, 'RS256'));

  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`,
  });
  const tokenJson = await tokenRes.json();
  if (!tokenJson.access_token) return null;
  return { projectId, accessToken: tokenJson.access_token as string };
}

async function sendFcm(token: string, payload: {
  title: string;
  body: string;
  senderId: string;
  senderName: string;
  messageId: string;
}) {
  const auth = await getFcmAccessToken();
  if (!auth) return { ok: false, skipped: true };

  const res = await fetch(`https://fcm.googleapis.com/v1/projects/${auth.projectId}/messages:send`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${auth.accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      message: {
        token,
        notification: {
          title: payload.title,
          body: payload.body,
        },
        data: {
          type: 'message',
          senderId: payload.senderId,
          senderName: payload.senderName,
          messageId: payload.messageId,
        },
        android: {
          priority: 'HIGH',
          collapseKey: payload.messageId || 'awake-message',
          notification: {
            channelId: 'awake-messages',
            sound: 'default',
          },
        },
      },
    }),
  });
  return { ok: res.ok, skipped: false, status: res.status };
}

const lastNotifyByUser = new Map();

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json(405, { error: 'Method not allowed' });

  const authHeader = req.headers.get('Authorization') || '';
  const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
  const supabaseAnon = Deno.env.get('SUPABASE_ANON_KEY') || '';
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

  const userClient = createClient(supabaseUrl, supabaseAnon, {
    global: { headers: { Authorization: authHeader } },
  });
  const { data: userData, error: userError } = await userClient.auth.getUser();
  if (userError || !userData.user) return json(401, { error: 'Unauthorized' });

  const now = Date.now();
  const prev = lastNotifyByUser.get(userData.user.id) || 0;
  if (now - prev < 800) return json(429, { error: 'slow_down' });
  lastNotifyByUser.set(userData.user.id, now);
  if (lastNotifyByUser.size > 4000) {
    for (const [k, t] of lastNotifyByUser) {
      if (now - t > 60000) lastNotifyByUser.delete(k);
    }
  }

  const body = await req.json().catch(() => ({}));
  const messageId = String(body.message_id || '');
  if (!messageId) return json(400, { error: 'message_id required' });

  const admin = createClient(supabaseUrl, serviceKey);
  const { data: message, error: messageError } = await admin
    .from('messages')
    .select('id, sender_id, receiver_id, text, created_at')
    .eq('id', messageId)
    .maybeSingle();
  if (messageError) return json(500, { error: messageError.message });
  if (!message) return json(404, { error: 'message_not_found' });
  if (message.sender_id !== userData.user.id) return json(403, { error: 'sender mismatch' });
  if (message.receiver_id === message.sender_id) return json(200, { sent: 0 });

  const receiverId = String(message.receiver_id);
  const senderId = String(message.sender_id);

  const { data: tokens, error: tokenError } = await admin
    .from('device_tokens')
    .select('token')
    .eq('user_id', receiverId);

  if (tokenError) return json(500, { error: tokenError.message });
  if (!tokens || tokens.length === 0) return json(200, { sent: 0 });

  const { data: profile } = await admin
    .from('profiles')
    .select('username')
    .eq('id', senderId)
    .maybeSingle();
  const senderName = String(profile?.username || 'Usuario').slice(0, 24);
  const preview = String(message.text || 'Nuevo mensaje').slice(0, 140);
  const title = `AWAKE · ${senderName}`;

  let sent = 0;
  for (const row of tokens) {
    const result = await sendFcm(row.token, {
      title,
      body: preview,
      senderId,
      senderName,
      messageId,
    });
    if (result.ok) sent += 1;
  }

  return json(200, { sent, devices: tokens.length });
});
