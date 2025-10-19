-- Test the check_phone_exists function directly
SELECT check_phone_exists('+998997961877') as result;

-- Check if there are any users at all
SELECT COUNT(*) as user_count FROM users;

-- Check if the function logic is working correctly by testing the EXISTS queries directly
SELECT EXISTS (SELECT 1 FROM users WHERE phone = '+998997961877') as exact_match;
SELECT EXISTS (SELECT 1 FROM users WHERE phone = '998997961877') as no_plus_match;
SELECT EXISTS (SELECT 1 FROM users WHERE phone = '+998 99 796 18 77') as formatted_match;