-- Create departments table
CREATE TABLE public.departments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  code TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create students table
CREATE TABLE public.students (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  email TEXT UNIQUE,
  phone TEXT,
  department_id UUID NOT NULL REFERENCES public.departments(id),
  year INTEGER NOT NULL CHECK (year > 0 AND year <= 4),
  room_number TEXT,
  admission_date DATE DEFAULT CURRENT_DATE,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'graduated')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create fees table
CREATE TABLE public.fees (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  academic_year TEXT NOT NULL,
  semester TEXT NOT NULL CHECK (semester IN ('1', '2', 'annual')),
  amount DECIMAL(10,2) NOT NULL CHECK (amount >= 0),
  paid_amount DECIMAL(10,2) DEFAULT 0 CHECK (paid_amount >= 0),
  due_date DATE NOT NULL,
  payment_date DATE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'partial', 'overdue')),
  payment_method TEXT CHECK (payment_method IN ('cash', 'online', 'cheque', 'dd')),
  transaction_id TEXT,
  remarks TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fees ENABLE ROW LEVEL SECURITY;

-- Create policies (public access for now, can be restricted later with auth)
CREATE POLICY "Allow all operations on departments" ON public.departments FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on students" ON public.students FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on fees" ON public.fees FOR ALL USING (true) WITH CHECK (true);

-- Create indexes for better performance
CREATE INDEX idx_students_department_id ON public.students(department_id);
CREATE INDEX idx_students_year ON public.students(year);
CREATE INDEX idx_students_status ON public.students(status);
CREATE INDEX idx_fees_student_id ON public.fees(student_id);
CREATE INDEX idx_fees_status ON public.fees(status);
CREATE INDEX idx_fees_academic_year ON public.fees(academic_year);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_students_updated_at
  BEFORE UPDATE ON public.students
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_fees_updated_at
  BEFORE UPDATE ON public.fees
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert sample departments
INSERT INTO public.departments (name, code) VALUES
  ('Computer Science', 'CS'),
  ('Electrical Engineering', 'EE'),
  ('Mechanical Engineering', 'ME'),
  ('Civil Engineering', 'CE'),
  ('Information Technology', 'IT'),
  ('Electronics & Communication', 'ECE');

-- Insert sample students
INSERT INTO public.students (student_id, name, email, phone, department_id, year, room_number) 
SELECT 
  'STU' || LPAD((row_number() OVER())::text, 4, '0'),
  CASE (row_number() OVER() % 10)
    WHEN 1 THEN 'John Doe'
    WHEN 2 THEN 'Jane Smith'
    WHEN 3 THEN 'Mike Wilson'
    WHEN 4 THEN 'Sarah Johnson'
    WHEN 5 THEN 'David Brown'
    WHEN 6 THEN 'Lisa Anderson'
    WHEN 7 THEN 'Tom Garcia'
    WHEN 8 THEN 'Emily Davis'
    WHEN 9 THEN 'Chris Martinez'
    ELSE 'Alex Taylor'
  END || ' ' || (row_number() OVER()),
  'student' || (row_number() OVER()) || '@college.edu',
  '+91' || LPAD((9000000000 + row_number() OVER())::text, 10, '0'),
  d.id,
  ((row_number() OVER() % 4) + 1),
  CASE ((row_number() OVER() % 3) + 1)
    WHEN 1 THEN 'A-'
    WHEN 2 THEN 'B-'
    ELSE 'C-'
  END || LPAD(((row_number() OVER() % 50) + 101)::text, 3, '0')
FROM public.departments d
CROSS JOIN generate_series(1, 50);

-- Insert sample fees
INSERT INTO public.fees (student_id, academic_year, semester, amount, paid_amount, due_date, status, payment_date, payment_method)
SELECT 
  s.id,
  '2024-25',
  CASE (row_number() OVER() % 2) + 1 WHEN 1 THEN '1' ELSE '2' END,
  45000.00,
  CASE 
    WHEN random() < 0.7 THEN 45000.00
    WHEN random() < 0.9 THEN 25000.00
    ELSE 0.00
  END,
  CURRENT_DATE + INTERVAL '30 days' * ((row_number() OVER() % 6) + 1),
  CASE 
    WHEN random() < 0.7 THEN 'paid'
    WHEN random() < 0.9 THEN 'partial'
    ELSE 'pending'
  END,
  CASE 
    WHEN random() < 0.7 THEN CURRENT_DATE - INTERVAL '10 days' * random()
    ELSE NULL
  END,
  CASE 
    WHEN random() < 0.7 THEN 
      CASE (random() * 4)::int
        WHEN 0 THEN 'online'
        WHEN 1 THEN 'cash'
        WHEN 2 THEN 'cheque'
        ELSE 'dd'
      END
    ELSE NULL
  END
FROM public.students s;