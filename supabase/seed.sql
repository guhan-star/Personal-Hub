-- ==============================================================================
-- PERSONALHUB SEED DATA (For Demo and Local Development)
-- All values in INR (₹)
-- ==============================================================================

-- Demo User ID: 00000000-0000-0000-0000-000000000001
DO $$
DECLARE
    v_user_id UUID := '00000000-0000-0000-0000-000000000001';
    v_acc_hdfc UUID := '10000000-0000-0000-0000-000000000001';
    v_acc_sbi UUID := '10000000-0000-0000-0000-000000000002';
    v_acc_cash UUID := '10000000-0000-0000-0000-000000000003';
    v_acc_paytm UUID := '10000000-0000-0000-0000-000000000004';

    v_cat_food UUID := '20000000-0000-0000-0000-000000000001';
    v_cat_shop UUID := '20000000-0000-0000-0000-000000000002';
    v_cat_travel UUID := '20000000-0000-0000-0000-000000000003';
    v_cat_salary UUID := '20000000-0000-0000-0000-000000000004';
    v_cat_bills UUID := '20000000-0000-0000-0000-000000000005';
    v_cat_edu UUID := '20000000-0000-0000-0000-000000000006';

    v_person_rahul UUID := '30000000-0000-0000-0000-000000000001';
    v_person_arun UUID := '30000000-0000-0000-0000-000000000002';

    v_folder_tech UUID := '40000000-0000-0000-0000-000000000001';
    v_folder_fin UUID := '40000000-0000-0000-0000-000000000002';
    v_folder_edu UUID := '40000000-0000-0000-0000-000000000003';

    v_sub_python UUID := '50000000-0000-0000-0000-000000000001';
    v_sub_finance UUID := '50000000-0000-0000-0000-000000000002';

    v_goal_laptop UUID := '60000000-0000-0000-0000-000000000001';
BEGIN
    -- Profile & Settings
    INSERT INTO public.profiles (id, display_name, email, currency, timezone)
    VALUES (v_user_id, 'Aarav Sharma', 'aarav@example.com', 'INR', 'Asia/Kolkata')
    ON CONFLICT (id) DO NOTHING;

    INSERT INTO public.user_settings (user_id, default_account_id, demo_mode_enabled)
    VALUES (v_user_id, v_acc_hdfc, true)
    ON CONFLICT (user_id) DO NOTHING;

    -- Financial Accounts
    INSERT INTO public.financial_accounts (id, user_id, name, account_type, opening_balance, current_balance, institution)
    VALUES 
        (v_acc_hdfc, v_user_id, 'HDFC Salary Account', 'savings_bank', 45000.00, 72500.00, 'HDFC Bank'),
        (v_acc_sbi, v_user_id, 'SBI Savings & UPI', 'upi_linked', 12000.00, 18200.00, 'State Bank of India'),
        (v_acc_cash, v_user_id, 'Cash in Hand', 'cash', 5000.00, 3400.00, 'Physical Cash'),
        (v_acc_paytm, v_user_id, 'Paytm Wallet', 'digital_wallet', 1500.00, 850.00, 'Paytm')
    ON CONFLICT (id) DO NOTHING;

    -- Categories
    INSERT INTO public.transaction_categories (id, user_id, name, type, icon, color, is_default)
    VALUES 
        (v_cat_food, v_user_id, 'Food & Dining', 'expense', 'Utensils', '#E56B73', true),
        (v_cat_shop, v_user_id, 'Shopping', 'expense', 'ShoppingBag', '#8E83F5', true),
        (v_cat_travel, v_user_id, 'Travel & Commute', 'expense', 'Car', '#5599E8', true),
        (v_cat_salary, v_user_id, 'Monthly Salary', 'income', 'Briefcase', '#22A879', true),
        (v_cat_bills, v_user_id, 'Utilities & Bills', 'expense', 'Receipt', '#F59E0B', true),
        (v_cat_edu, v_user_id, 'Education & Books', 'expense', 'GraduationCap', '#7167E8', true)
    ON CONFLICT (id) DO NOTHING;

    -- People
    INSERT INTO public.people (id, user_id, name, phone, email)
    VALUES 
        (v_person_rahul, v_user_id, 'Rahul Verma', '+91 98765 43210', 'rahul@example.com'),
        (v_person_arun, v_user_id, 'Arun Kumar', '+91 98765 12345', 'arun@example.com')
    ON CONFLICT (id) DO NOTHING;

    -- BrainVault Folders
    INSERT INTO public.folders (id, user_id, name, color, icon, is_default)
    VALUES 
        (v_folder_tech, v_user_id, 'Technology', '#7167E8', 'Code', true),
        (v_folder_fin, v_user_id, 'Finance & Investing', '#22A879', 'TrendingUp', true),
        (v_folder_edu, v_user_id, 'Education & Study', '#5599E8', 'BookOpen', true)
    ON CONFLICT (id) DO NOTHING;

    -- Tasks
    INSERT INTO public.tasks (user_id, title, description, due_date, priority, status, category)
    VALUES 
        (v_user_id, 'Pay Electricity Bill', 'BESCOM bill via UPI before due date', CURRENT_DATE, 'high', 'todo', 'Bills'),
        (v_user_id, 'Review Investment Portfolio', 'Check quarterly mutual fund SIPs and rebalance', CURRENT_DATE + 2, 'medium', 'todo', 'Finance'),
        (v_user_id, 'Complete Python Async Chapter', 'Finish practical exercises on asyncio and aiohttp', CURRENT_DATE + 4, 'medium', 'todo', 'StudySpace');

    -- StudySpace
    INSERT INTO public.subjects (id, user_id, name, description, accent_color)
    VALUES 
        (v_sub_python, v_user_id, 'Python & Distributed Systems', 'Backend engineering & asynchronous pipelines', '#7167E8'),
        (v_sub_finance, v_user_id, 'Personal Financial Literacy', 'Tax planning, index funds & wealth building', '#22A879')
    ON CONFLICT (id) DO NOTHING;

    -- Goals
    INSERT INTO public.goals (id, user_id, title, description, category, target_value, current_value, unit, target_date, is_financial)
    VALUES 
        (v_goal_laptop, v_user_id, 'M3 MacBook Air Fund', 'Save ₹1,15,000 for development machine', 'Gadgets', 115000.00, 75000.00, '₹', CURRENT_DATE + 60, true)
    ON CONFLICT (id) DO NOTHING;

    -- Wishlist
    INSERT INTO public.wishlist_items (user_id, title, description, expected_price, priority, status, linked_goal_id)
    VALUES 
        (v_user_id, 'Sony WH-1000XM5 Headphones', 'Active noise cancelling headphones for deep focus work', 26990.00, 'high', 'planning', NULL),
        (v_user_id, 'Ergonomic Mesh Chair', 'High-back ergonomic chair with lumbar support', 14500.00, 'medium', 'want', NULL);

    -- Calendar
    INSERT INTO public.calendar_events (user_id, title, description, event_date, start_time, end_time, category)
    VALUES 
        (v_user_id, 'Quarterly Tax Review', 'Discuss 80C deductions and advance tax', CURRENT_DATE + 1, '10:00', '11:00', 'finance'),
        (v_user_id, 'Python Study Circle', 'Discuss GIL removal in Python 3.13', CURRENT_DATE + 3, '18:00', '19:30', 'study');
END $$;
