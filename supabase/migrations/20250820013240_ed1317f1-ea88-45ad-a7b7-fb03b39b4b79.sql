-- Drop the specific constraints that are causing issues
ALTER TABLE public.fees DROP CONSTRAINT fees_payment_method_check;
ALTER TABLE public.fees DROP CONSTRAINT fees_semester_check;

-- Update payment methods to match new values
UPDATE public.fees 
SET payment_method = CASE 
  WHEN payment_method = 'online' THEN 'upi'
  WHEN payment_method = 'dd' THEN 'bank_transfer'
  WHEN payment_method = 'cheque' THEN 'bank_transfer'
  WHEN payment_method IS NULL THEN 'cash'
  ELSE payment_method
END;

-- Update semester values to year values
UPDATE public.fees 
SET semester = CASE 
  WHEN semester = '1' THEN 'Year 1'
  WHEN semester = '2' THEN 'Year 2'  
  WHEN semester = 'annual' THEN 'Annual'
  ELSE COALESCE(semester, 'Year 1')
END;

-- Rename the column
ALTER TABLE public.fees RENAME COLUMN semester TO fee_year;

-- Add new constraints
ALTER TABLE public.fees ADD CONSTRAINT fees_payment_method_check 
CHECK (payment_method IN ('cash', 'upi', 'bank_transfer'));

ALTER TABLE public.fees ADD CONSTRAINT fees_fee_year_check 
CHECK (fee_year IN ('Year 1', 'Year 2', 'Year 3', 'Year 4', 'Annual'));

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_fees_academic_year ON public.fees(academic_year);
CREATE INDEX IF NOT EXISTS idx_fees_status ON public.fees(status);
CREATE INDEX IF NOT EXISTS idx_fees_student_id ON public.fees(student_id);