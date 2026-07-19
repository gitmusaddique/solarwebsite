// netlify/functions/submit-lead.js
//
// Receives the contact form submission as JSON, then in parallel:
//   1. Appends a row to a Google Sheet (via a Google service account)
//   2. Emails contact@solarelites.in the query details (via Resend)
//
// Required environment variables (set in Netlify: Site settings ->
// Environment variables):
//   GOOGLE_SERVICE_ACCOUNT_EMAIL   e.g. leads-writer@my-project.iam.gserviceaccount.com
//   GOOGLE_PRIVATE_KEY             the service account's private key (keep the \n escapes)
//   GOOGLE_SHEET_ID                the long id in the sheet's URL
//   GOOGLE_SHEET_TAB               tab/sheet name to append to, e.g. "Leads"
//   RESEND_API_KEY                 from resend.com
//   RESEND_FROM_EMAIL              a verified sender on your domain, e.g. leads@solarelites.in
//   NOTIFY_EMAIL                   optional, defaults to contact@solarelites.in

import { GoogleAuth } from 'google-auth-library';

const SHEET_ID = process.env.GOOGLE_SHEET_ID;
const SHEET_TAB = process.env.GOOGLE_SHEET_TAB || 'Leads';
const SERVICE_ACCOUNT_EMAIL = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
const PRIVATE_KEY = (process.env.GOOGLE_PRIVATE_KEY || '').replace(/\\n/g, '\n');

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'leads@solarelites.in';
const NOTIFY_EMAIL = process.env.NOTIFY_EMAIL || 'contact@solarelites.in';

async function getSheetsAccessToken() {
  const auth = new GoogleAuth({
    credentials: {
      client_email: SERVICE_ACCOUNT_EMAIL,
      private_key: PRIVATE_KEY,
    },
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });
  const client = await auth.getClient();
  const token = await client.getAccessToken();
  return token?.token || token;
}

async function appendToSheet(row) {
  if (!SHEET_ID || !SERVICE_ACCOUNT_EMAIL || !PRIVATE_KEY) {
    throw new Error('Google Sheets is not configured (missing env vars)');
  }
  const accessToken = await getSheetsAccessToken();
  const range = `${SHEET_TAB}!A:M`;
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${encodeURIComponent(
    range
  )}:append?valueInputOption=USER_ENTERED`;

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ values: [row] }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Sheets append failed (${res.status}): ${text}`);
  }
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

async function sendNotificationEmail(fields) {
  if (!RESEND_API_KEY) {
    throw new Error('Resend is not configured (missing RESEND_API_KEY)');
  }

  const rows = Object.entries(fields)
    .filter(([, v]) => v)
    .map(
      ([k, v]) =>
        `<tr><td style="padding:6px 16px 6px 0;color:#666;font-size:13px;white-space:nowrap;vertical-align:top;">${escapeHtml(
          k
        )}</td><td style="padding:6px 0;font-size:13px;color:#111;">${escapeHtml(v)}</td></tr>`
    )
    .join('');

  const html = `
    <div style="font-family:Arial,Helvetica,sans-serif;max-width:560px;margin:0 auto;">
      <h2 style="margin:0 0 4px;font-size:18px;">New Solar Quote Request</h2>
      <p style="margin:0 0 20px;color:#666;font-size:13px;">Submitted via solarelites.in contact form</p>
      <table style="border-collapse:collapse;width:100%;">${rows}</table>
    </div>`;

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: `Solarelites Website <${FROM_EMAIL}>`,
      to: [NOTIFY_EMAIL],
      subject: `New enquiry: ${fields.Name || 'Unknown'}${fields.City ? ` — ${fields.City}` : ''}`,
      html,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Resend send failed (${res.status}): ${text}`);
  }
}

export const handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  let data;
  try {
    data = JSON.parse(event.body || '{}');
  } catch {
    return { statusCode: 400, body: JSON.stringify({ ok: false, error: 'Invalid JSON body' }) };
  }

  const fields = {
    Timestamp: new Date().toISOString(),
    Name: data.name || '',
    Phone: data.phone ? `+91 ${data.phone}` : '',
    Email: data.email || '',
    State: data.state || '',
    City: data.city || '',
    Address: data.address || '',
    'Property Type': data.propertyType || '',
    'Monthly Bill': data.monthlyBill || '',
    'Roof Area': data.roofArea || '',
    'Subsidy Required': data.subsidyRequired || '',
    'Callback Time': data.callbackTime || '',
    Message: data.message || '',
  };

  const row = Object.values(fields);

  const results = await Promise.allSettled([appendToSheet(row), sendNotificationEmail(fields)]);

  const failures = results
    .map((r, i) => (r.status === 'rejected' ? `${i === 0 ? 'sheet' : 'email'}: ${r.reason.message}` : null))
    .filter(Boolean);

  // Only fail the request outright if BOTH channels failed — a partial
  // success (e.g. sheet write worked but email bounced) still means the
  // lead wasn't lost, so the site should still show success to the visitor.
  if (failures.length === 2) {
    console.error('submit-lead: both channels failed', failures);
    return {
      statusCode: 500,
      body: JSON.stringify({ ok: false, errors: failures }),
    };
  }

  if (failures.length === 1) {
    console.warn('submit-lead: partial failure', failures);
  }

  return {
    statusCode: 200,
    body: JSON.stringify({ ok: true, warnings: failures }),
  };
};
