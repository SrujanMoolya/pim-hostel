-- Add new fields to students table
ALTER TABLE public.students 
ADD COLUMN address TEXT,
ADD COLUMN parent_phone TEXT;

-- Create colleges table
CREATE TABLE public.colleges (
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
CREATE POLICY "Allow all operations on colleges" 
ON public.colleges 
FOR ALL 
USING (true) 
WITH CHECK (true);

-- Create rooms table
CREATE TABLE public.rooms (
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
CREATE POLICY "Allow all operations on rooms" 
ON public.rooms 
FOR ALL 
USING (true) 
WITH CHECK (true);

-- Create trigger for rooms updated_at
CREATE TRIGGER update_rooms_updated_at
BEFORE UPDATE ON public.rooms
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create trigger for colleges updated_at  
CREATE TRIGGER update_colleges_updated_at
BEFORE UPDATE ON public.colleges
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add unique constraint to prevent duplicate fee records per student per year
ALTER TABLE public.fees 
ADD CONSTRAINT unique_student_fee_year 
UNIQUE (student_id, academic_year, fee_year);

-- Insert some default rooms
INSERT INTO public.rooms (room_number, capacity, floor_number, room_type, status) VALUES
('101', 3, 1, 'standard', 'available'),
('102', 3, 1, 'standard', 'available'),
('103', 3, 1, 'standard', 'available'),
('201', 3, 2, 'standard', 'available'),
('202', 3, 2, 'standard', 'available'),
('203', 3, 2, 'deluxe', 'available'),
('301', 2, 3, 'deluxe', 'available'),
('302', 2, 3, 'deluxe', 'available');