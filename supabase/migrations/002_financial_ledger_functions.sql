-- ==============================================================================
-- PERSONALHUB FINANCIAL LEDGER FUNCTIONS (PostgreSQL / Supabase)
-- Atomic ledger operations ensuring balanced double-entry accounting
-- ==============================================================================

-- Function to record a financial event and maintain account balances atomically
CREATE OR REPLACE FUNCTION public.record_financial_event(
    p_user_id UUID,
    p_event_type TEXT,
    p_amount NUMERIC(14, 2),
    p_event_date DATE,
    p_description TEXT,
    p_account_id UUID,
    p_notes TEXT DEFAULT NULL,
    p_category_id UUID DEFAULT NULL,
    p_to_account_id UUID DEFAULT NULL,
    p_person_id UUID DEFAULT NULL,
    p_loan_id UUID DEFAULT NULL,
    p_original_event_id UUID DEFAULT NULL,
    p_payment_method TEXT DEFAULT 'upi',
    p_client_id TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_event_id UUID;
    v_loan RECORD;
BEGIN
    -- Validation
    IF p_amount <= 0 THEN
        RAISE EXCEPTION 'Financial event amount must be greater than zero';
    END IF;

    -- Create financial event record
    INSERT INTO public.financial_events (
        user_id, event_type, amount, event_date, description, notes,
        category_id, account_id, to_account_id, person_id, loan_id,
        original_event_id, payment_method, client_id
    ) VALUES (
        p_user_id, p_event_type, p_amount, p_event_date, p_description, p_notes,
        p_category_id, p_account_id, p_to_account_id, p_person_id, p_loan_id,
        p_original_event_id, p_payment_method, p_client_id
    ) RETURNING id INTO v_event_id;

    -- Handle ledger entries and account balances based on event type
    CASE p_event_type
        -- 1. INCOME: Increases account balance
        WHEN 'income' THEN
            UPDATE public.financial_accounts
            SET current_balance = current_balance + p_amount, updated_at = now()
            WHERE id = p_account_id AND user_id = p_user_id;

            INSERT INTO public.account_entries (user_id, event_id, account_id, entry_type, amount)
            VALUES (p_user_id, v_event_id, p_account_id, 'credit', p_amount);

        -- 2. EXPENSE: Decreases account balance
        WHEN 'expense' THEN
            UPDATE public.financial_accounts
            SET current_balance = current_balance - p_amount, updated_at = now()
            WHERE id = p_account_id AND user_id = p_user_id;

            INSERT INTO public.account_entries (user_id, event_id, account_id, entry_type, amount)
            VALUES (p_user_id, v_event_id, p_account_id, 'debit', p_amount);

        -- 3. TRANSFER / CASH WITHDRAWAL / CASH DEPOSIT: Decreases source, increases destination
        WHEN 'transfer', 'cash_withdrawal', 'cash_deposit' THEN
            IF p_to_account_id IS NULL OR p_to_account_id = p_account_id THEN
                RAISE EXCEPTION 'Transfer requires a distinct destination account';
            END IF;

            -- Source debit
            UPDATE public.financial_accounts
            SET current_balance = current_balance - p_amount, updated_at = now()
            WHERE id = p_account_id AND user_id = p_user_id;

            INSERT INTO public.account_entries (user_id, event_id, account_id, entry_type, amount)
            VALUES (p_user_id, v_event_id, p_account_id, 'debit', p_amount);

            -- Destination credit
            UPDATE public.financial_accounts
            SET current_balance = current_balance + p_amount, updated_at = now()
            WHERE id = p_to_account_id AND user_id = p_user_id;

            INSERT INTO public.account_entries (user_id, event_id, account_id, entry_type, amount)
            VALUES (p_user_id, v_event_id, p_to_account_id, 'credit', p_amount);

        -- 4. LENDING: Decreases cash, creates/updates receivable loan
        WHEN 'lend' THEN
            UPDATE public.financial_accounts
            SET current_balance = current_balance - p_amount, updated_at = now()
            WHERE id = p_account_id AND user_id = p_user_id;

            INSERT INTO public.account_entries (user_id, event_id, account_id, entry_type, amount)
            VALUES (p_user_id, v_event_id, p_account_id, 'debit', p_amount);

            -- If loan_id is not already provided, create a new loan record
            IF p_loan_id IS NULL THEN
                INSERT INTO public.loans (
                    user_id, person_id, type, amount, repaid_amount, outstanding_amount, status, notes
                ) VALUES (
                    p_user_id, p_person_id, 'lend', p_amount, 0, p_amount, 'active', p_notes
                ) RETURNING id INTO p_loan_id;

                UPDATE public.financial_events SET loan_id = p_loan_id WHERE id = v_event_id;
            END IF;

        -- 5. BORROWING: Increases cash, creates/updates payable loan
        WHEN 'borrow' THEN
            UPDATE public.financial_accounts
            SET current_balance = current_balance + p_amount, updated_at = now()
            WHERE id = p_account_id AND user_id = p_user_id;

            INSERT INTO public.account_entries (user_id, event_id, account_id, entry_type, amount)
            VALUES (p_user_id, v_event_id, p_account_id, 'credit', p_amount);

            IF p_loan_id IS NULL THEN
                INSERT INTO public.loans (
                    user_id, person_id, type, amount, repaid_amount, outstanding_amount, status, notes
                ) VALUES (
                    p_user_id, p_person_id, 'borrow', p_amount, 0, p_amount, 'active', p_notes
                ) RETURNING id INTO p_loan_id;

                UPDATE public.financial_events SET loan_id = p_loan_id WHERE id = v_event_id;
            END IF;

        -- 6. LOAN REPAYMENT
        WHEN 'loan_repayment' THEN
            IF p_loan_id IS NULL THEN
                RAISE EXCEPTION 'Loan repayment must reference an active loan';
            END IF;

            SELECT * INTO v_loan FROM public.loans WHERE id = p_loan_id AND user_id = p_user_id;
            IF NOT FOUND THEN
                RAISE EXCEPTION 'Referenced loan not found';
            END IF;

            IF p_amount > v_loan.outstanding_amount THEN
                RAISE EXCEPTION 'Repayment amount (₹%) exceeds outstanding amount (₹%)', p_amount, v_loan.outstanding_amount;
            END IF;

            IF v_loan.type = 'lend' THEN
                -- Borrower paid us back: cash increases
                UPDATE public.financial_accounts
                SET current_balance = current_balance + p_amount, updated_at = now()
                WHERE id = p_account_id AND user_id = p_user_id;

                INSERT INTO public.account_entries (user_id, event_id, account_id, entry_type, amount)
                VALUES (p_user_id, v_event_id, p_account_id, 'credit', p_amount);
            ELSE
                -- We paid lender back: cash decreases
                UPDATE public.financial_accounts
                SET current_balance = current_balance - p_amount, updated_at = now()
                WHERE id = p_account_id AND user_id = p_user_id;

                INSERT INTO public.account_entries (user_id, event_id, account_id, entry_type, amount)
                VALUES (p_user_id, v_event_id, p_account_id, 'debit', p_amount);
            END IF;

            -- Update loan amounts and status
            UPDATE public.loans
            SET repaid_amount = repaid_amount + p_amount,
                outstanding_amount = outstanding_amount - p_amount,
                status = CASE WHEN (outstanding_amount - p_amount) = 0 THEN 'repaid' ELSE 'active' END,
                updated_at = now()
            WHERE id = p_loan_id;

        -- 7. REFUND: Increases account balance, links to original expense
        WHEN 'refund' THEN
            UPDATE public.financial_accounts
            SET current_balance = current_balance + p_amount, updated_at = now()
            WHERE id = p_account_id AND user_id = p_user_id;

            INSERT INTO public.account_entries (user_id, event_id, account_id, entry_type, amount)
            VALUES (p_user_id, v_event_id, p_account_id, 'credit', p_amount);

        ELSE
            RAISE EXCEPTION 'Unknown financial event type: %', p_event_type;
    END CASE;

    -- Audit log
    INSERT INTO public.audit_events (user_id, entity_type, entity_id, action, after_state)
    VALUES (p_user_id, 'financial_event', v_event_id, 'create', json_build_object(
        'event_type', p_event_type,
        'amount', p_amount,
        'account_id', p_account_id,
        'to_account_id', p_to_account_id,
        'loan_id', p_loan_id
    ));

    RETURN v_event_id;
END;
$$;
