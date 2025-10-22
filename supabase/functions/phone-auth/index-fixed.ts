import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PhoneAuthRequest {
  phone: string;
}

interface PhoneAuthResponse {
  access_token: string;
  refresh_token: string;
  user: {
    id: string;
    phone: string;
    onboarding_completed: boolean;
  };
}

Deno.serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Parse request body
    const { phone }: PhoneAuthRequest = await req.json();

    if (!phone) {
      return new Response(
        JSON.stringify({ error: 'Phone number is required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Clean phone number (remove all non-digits)
    const cleanPhone = phone.replace(/\D/g, '');

    if (!cleanPhone || cleanPhone.length < 10) {
      return new Response(
        JSON.stringify({ error: 'Invalid phone number format' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log('📞 Phone auth request for:', cleanPhone);

    // Get environment variables
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseServiceRoleKey) {
      console.error('Missing environment variables');
      return new Response(
        JSON.stringify({ error: 'Server configuration error' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Initialize Supabase client with service role key for admin operations
    const supabaseAdmin = createClient(
      supabaseUrl,
      supabaseServiceRoleKey,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    // Check if user exists with this phone number
    const { data: existingUsers, error: checkError } = await supabaseAdmin
      .from('users')
      .select('id, phone, onboarding_completed')
      .eq('phone', cleanPhone)
      .limit(1);

    if (checkError) {
      console.error('Error checking phone:', checkError);
      return new Response(
        JSON.stringify({ error: 'Database error: ' + checkError.message }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    let userId: string;
    let onboardingCompleted: boolean;

    // User exists - sign in
    if (existingUsers && existingUsers.length > 0) {
      const existingUser = existingUsers[0];
      userId = existingUser.id;
      onboardingCompleted = existingUser.onboarding_completed;
      
      console.log('✅ User exists, signing in:', userId);
    } 
    // User doesn't exist - sign up
    else {
      console.log('❌ User not found, creating new user');

      // Create auth user via admin API
      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email: `${cleanPhone}@ovqat.ai`,
        email_confirm: true,
        user_metadata: {
          phone: cleanPhone,
        },
      });

      if (authError || !authData.user) {
        console.error('Error creating auth user:', authError);
        return new Response(
          JSON.stringify({ error: 'Failed to create user: ' + (authError?.message || 'Unknown error') }),
          { 
            status: 500, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }

      userId = authData.user.id;
      onboardingCompleted = false;

      // Create user profile in database
      const { error: insertError } = await supabaseAdmin
        .from('users')
        .insert({
          id: userId,
          phone: cleanPhone,
          onboarding_completed: false,
        });

      if (insertError) {
        console.error('Error creating user profile:', insertError);
        // Try to clean up the auth user
        try {
          await supabaseAdmin.auth.admin.deleteUser(userId);
        } catch (e) {
          console.error('Error cleaning up auth user:', e);
        }
        
        return new Response(
          JSON.stringify({ error: 'Failed to create user profile: ' + insertError.message }),
          { 
            status: 500, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }

      console.log('✅ Created new user:', userId);
    }

    // Create a session using the admin API
    const { data: tokenData, error: tokenError } = await supabaseAdmin.auth.admin.createSession({
      user_id: userId,
    });

    if (tokenError || !tokenData) {
      console.error('Error creating session:', tokenError);
      return new Response(
        JSON.stringify({ error: 'Failed to create session: ' + (tokenError?.message || 'Unknown error') }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Return success response with tokens
    const response: PhoneAuthResponse = {
      access_token: tokenData.session.access_token,
      refresh_token: tokenData.session.refresh_token,
      user: {
        id: userId,
        phone: cleanPhone,
        onboarding_completed: onboardingCompleted,
      },
    };

    console.log('✅ Auth successful for user:', userId);

    return new Response(
      JSON.stringify(response),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error: ' + String(error) }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
