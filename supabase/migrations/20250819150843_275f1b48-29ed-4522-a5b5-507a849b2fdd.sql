-- Add college field to students table
ALTER TABLE public.students ADD COLUMN college TEXT;

-- Update existing students with sample college data
UPDATE public.students SET college = 'PIM' WHERE id IN (
  SELECT id FROM public.students LIMIT 2
);

UPDATE public.students SET college = 'PPC' WHERE id IN (
  SELECT id FROM public.students WHERE college IS NULL LIMIT 1
);

UPDATE public.students SET college = 'PPC Evening' WHERE id IN (
  SELECT id FROM public.students WHERE college IS NULL LIMIT 1
);