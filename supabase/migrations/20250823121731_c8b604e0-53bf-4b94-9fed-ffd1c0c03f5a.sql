-- First, add new fields to students table
ALTER TABLE public.students 
ADD COLUMN IF NOT EXISTS address TEXT,
ADD COLUMN IF NOT EXISTS parent_phone TEXT;

-- Create colleges table
CREATE TABLE IF NOT EXISTS public.colleges (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  code TEXT NOT NULL UNIQUE,
  address TEXT,
  phone TEXT,
  email TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on colleges
ALTER TABLE public.colleges ENABLE ROW LEVEL SECURITY;

-- Create policy for colleges
DROP POLICY IF EXISTS "Allow all operations on colleges" ON public.colleges;
CREATE POLICY "Allow all operations on colleges" 
ON public.colleges 
FOR ALL 
USING (true) 
WITH CHECK (true);

-- Create rooms table
CREATE TABLE IF NOT EXISTS public.rooms (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  room_number TEXT NOT NULL UNIQUE,
  capacity INTEGER NOT NULL DEFAULT 3,
  floor_number INTEGER,
  room_type TEXT DEFAULT 'standard',
  amenities TEXT[],
  status TEXT DEFAULT 'available' CHECK (status IN ('available', 'occupied', 'maintenance', 'blocked')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on rooms
ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;

-- Create policy for rooms
DROP POLICY IF EXISTS "Allow all operations on rooms" ON public.rooms;
CREATE POLICY "Allow all operations on rooms" 
ON public.rooms 
FOR ALL 
USING (true) 
WITH CHECK (true);

-- Create triggers if they don't exist
DROP TRIGGER IF EXISTS update_rooms_updated_at ON public.rooms;
CREATE TRIGGER update_rooms_updated_at
BEFORE UPDATE ON public.rooms
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_colleges_updated_at ON public.colleges;
CREATE TRIGGER update_colleges_updated_at
BEFORE UPDATE ON public.colleges
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Remove duplicate fee records before adding constraint
DELETE FROM public.fees a USING (
  SELECT MIN(ctid) as ctid, student_id, academic_year, fee_year
  FROM public.fees 
  GROUP BY student_id, academic_year, fee_year HAVING COUNT(*) > 1
) b
WHERE a.student_id = b.student_id 
  AND a.academic_year = b.academic_year 
  AND a.fee_year = b.fee_year 
  AND a.ctid <> b.ctid;

-- Add unique constraint to prevent duplicate fee records
ALTER TABLE public.fees 
DROP CONSTRAINT IF EXISTS unique_student_fee_year;
ALTER TABLE public.fees 
ADD CONSTRAINT unique_student_fee_year 
UNIQUE (student_id, academic_year, fee_year);

-- Insert some default rooms if they don't exist
INSERT INTO public.rooms (room_number, capacity, floor_number, room_type, status) 
SELECT * FROM (VALUES
('101', 3, 1, 'standard', 'available'),
('102', 3, 1, 'standard', 'available'),
('103', 3, 1, 'standard', 'available'),
('201', 3, 2, 'standard', 'available'),
('202', 3, 2, 'standard', 'available'),
('203', 3, 2, 'deluxe', 'available'),
('301', 2, 3, 'deluxe', 'available'),
('302', 2, 3, 'deluxe', 'available')
) AS t(room_number, capacity, floor_number, room_type, status)
WHERE NOT EXISTS (SELECT 1 FROM public.rooms WHERE rooms.room_number = t.room_number);