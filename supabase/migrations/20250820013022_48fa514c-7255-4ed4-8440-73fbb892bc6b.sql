-- Fix database constraints and change to year-wise payments

-- Remove the problematic check constraints
ALTER TABLE public.fees DROP CONSTRAINT IF EXISTS fees_semester_check;
ALTER TABLE public.fees DROP CONSTRAINT IF EXISTS fees_payment_method_check;

-- Add proper check constraints
ALTER TABLE public.fees ADD CONSTRAINT fees_payment_method_check 
CHECK (payment_method IN ('cash', 'upi', 'bank_transfer'));

-- Change semester field to year for year-wise payments
ALTER TABLE public.fees RENAME COLUMN semester TO fee_year;

-- Add check constraint for status
ALTER TABLE public.fees ADD CONSTRAINT fees_status_check 
CHECK (status IN ('pending', 'partial', 'paid', 'overdue'));

-- Update the due_date constraint to allow future dates
ALTER TABLE public.fees DROP CONSTRAINT IF EXISTS fees_due_date_check;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_fees_academic_year ON public.fees(academic_year);
CREATE INDEX IF NOT EXISTS idx_fees_status ON public.fees(status);
CREATE INDEX IF NOT EXISTS idx_fees_student_id ON public.fees(student_id);