const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// JWT Secret
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// =====================================================
// API Endpoints
// =====================================================

/**
 * POST /api/auth/phone
 * Authenticate user by phone number
 * Request: { phoneNumber: "998997961877" }
 * Response: { token: "...", userId: "..." }
 */
app.post('/api/auth/phone', async (req, res) => {
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
    const token = jwt.sign(
      { userId, phoneNumber: cleanPhoneNumber },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    console.log('✅ Token generated');
    res.json({ token, userId });
  } catch (error) {
    console.error('❌ Error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/auth/verify
 * Verify JWT token
 * Request: { token: "..." }
 * Response: { valid: true, userId: "..." }
 */
app.post('/api/auth/verify', async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({ error: 'Token is required' });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    console.log('✅ Token verified:', decoded.userId);
    
    res.json({ valid: true, userId: decoded.userId });
  } catch (error) {
    console.error('❌ Token verification failed:', error.message);
    res.status(401).json({ valid: false, error: 'Invalid token' });
  }
});

/**
 * GET /api/health
 * Health check
 */
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// =====================================================
// Start server
// =====================================================

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
