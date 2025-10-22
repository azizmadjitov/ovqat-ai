import { VercelRequest, VercelResponse } from '@vercel/node';
import jwt from 'jsonwebtoken';
import { createClient } from '@supabase/supabase-js';

// Get environment variables
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const JWT_SECRET = process.env.JWT_SECRET;

// Validate environment variables
if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !JWT_SECRET) {
  console.error('❌ Missing environment variables:', {
    SUPABASE_URL: !!SUPABASE_URL,
    SUPABASE_SERVICE_ROLE_KEY: !!SUPABASE_SERVICE_ROLE_KEY,
    JWT_SECRET: !!JWT_SECRET,
  });
}

const supabase = createClient(
  SUPABASE_URL || '',
  SUPABASE_SERVICE_ROLE_KEY || ''
);

export default async (req: VercelRequest, res: VercelResponse) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { phoneNumber } = req.body;

    if (!phoneNumber) {
      return res.status(400).json({ error: 'Phone number is required' });
    }

    const cleanPhoneNumber = phoneNumber.replace(/\D/g, '');
    console.log('🔍 Authenticating phone:', cleanPhoneNumber);

    // Check if user exists
    const { data: existingUsers, error: queryError } = await supabase
      .from('users')
      .select('*')
      .eq('phone', cleanPhoneNumber)
      .limit(1);

    if (queryError) {
      console.error('❌ Query error:', queryError);
      return res.status(500).json({ error: 'Database error' });
    }

    let userId;

    if (existingUsers && existingUsers.length > 0) {
      // Existing user
      userId = existingUsers[0].id;
      console.log('✅ Existing user found:', userId);
    } else {
      // Create new user
      console.log('❌ New user, creating...');

      const { data: newUser, error: insertError } = await supabase
        .from('users')
        .insert({
          phone: cleanPhoneNumber,
          onboarding_completed: false,
        })
        .select()
        .single();

      if (insertError) {
        console.error('❌ Insert error:', insertError);
        return res.status(500).json({ error: 'Failed to create user' });
      }

      userId = newUser.id;
      console.log('✅ New user created:', userId);
    }

    // Generate JWT token
    if (!JWT_SECRET) {
      console.error('❌ JWT_SECRET not set');
      return res.status(500).json({ error: 'Server configuration error' });
    }
    
    const token = jwt.sign(
      { userId, phoneNumber: cleanPhoneNumber },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    console.log('✅ Token generated');
    res.json({ token, userId, expiresIn: 604800 });
  } catch (error: any) {
    console.error('❌ Error:', error);
    res.status(500).json({ error: error.message });
  }
};
