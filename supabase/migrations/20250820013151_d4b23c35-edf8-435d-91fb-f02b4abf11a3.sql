-- Drop all existing constraints first
ALTER TABLE public.fees DROP CONSTRAINT IF EXISTS fees_payment_method_check;
ALTER TABLE public.fees DROP CONSTRAINT IF EXISTS fees_status_check;

-- Update payment methods to match new constraints (handle NULL values properly)
UPDATE public.fees 
SET payment_method = CASE 
  WHEN payment_method = 'online' THEN 'upi'
  WHEN payment_method = 'dd' THEN 'bank_transfer'
  WHEN payment_method = 'cheque' THEN 'bank_transfer'
  WHEN payment_method IS NULL THEN 'cash'
  ELSE payment_method
END;

-- Update semester values to be year-wise
UPDATE public.fees 
SET semester = CASE 
  WHEN semester = '1' THEN 'Year 1'
  WHEN semester = '2' THEN 'Year 2'  
  WHEN semester = '3' THEN 'Year 3'
  WHEN semester = '4' THEN 'Year 4'
  ELSE COALESCE(semester, 'Year 1')
END;

-- Now rename the column
ALTER TABLE public.fees RENAME COLUMN semester TO fee_year;

-- Add the constraints back
ALTER TABLE public.fees ADD CONSTRAINT fees_payment_method_check 
CHECK (payment_method IN ('cash', 'upi', 'bank_transfer'));

ALTER TABLE public.fees ADD CONSTRAINT fees_status_check 
CHECK (status IN ('pending', 'partial', 'paid', 'overdue'));

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_fees_academic_year ON public.fees(academic_year);
CREATE INDEX IF NOT EXISTS idx_fees_status ON public.fees(status);
CREATE INDEX IF NOT EXISTS idx_fees_student_id ON public.fees(student_id);