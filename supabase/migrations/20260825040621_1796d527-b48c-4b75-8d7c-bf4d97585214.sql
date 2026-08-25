
CREATE TYPE public.app_role AS ENUM ('PATIENT','DRIVER','PARAMEDIC','DOCTOR','HOSPITAL','ADMIN');

CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL DEFAULT 'User',
  phone text,
  email text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles readable by authenticated" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "own profile insert" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "own profile update" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT, INSERT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role);
$$;

CREATE OR REPLACE FUNCTION public.is_staff(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id
    AND role IN ('DRIVER','PARAMEDIC','DOCTOR','HOSPITAL','ADMIN'));
$$;

CREATE POLICY "read own roles" ON public.user_roles FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.has_role(auth.uid(),'ADMIN'));
CREATE POLICY "insert own role" ON public.user_roles FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

CREATE TABLE public.patients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  age int,
  gender text,
  blood_group text,
  phone text,
  emergency_contact text,
  medical_history text,
  allergies text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.patients TO authenticated;
GRANT ALL ON public.patients TO service_role;
ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;
CREATE POLICY "patients self or staff read" ON public.patients FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.is_staff(auth.uid()));
CREATE POLICY "patients self write" ON public.patients FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "patients self update" ON public.patients FOR UPDATE TO authenticated USING (user_id = auth.uid() OR public.has_role(auth.uid(),'ADMIN'));

CREATE TABLE public.hospitals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  address text,
  latitude double precision NOT NULL,
  longitude double precision NOT NULL,
  phone text,
  available_beds int NOT NULL DEFAULT 0,
  icu_beds int NOT NULL DEFAULT 0,
  emergency_available boolean NOT NULL DEFAULT true,
  specializations text[] NOT NULL DEFAULT '{}',
  status text NOT NULL DEFAULT 'ACTIVE',
  managed_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.hospitals TO authenticated;
GRANT SELECT ON public.hospitals TO anon;
GRANT ALL ON public.hospitals TO service_role;
ALTER TABLE public.hospitals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "hospitals public read" ON public.hospitals FOR SELECT USING (true);
CREATE POLICY "hospitals staff update" ON public.hospitals FOR UPDATE TO authenticated USING (public.has_role(auth.uid(),'HOSPITAL') OR public.has_role(auth.uid(),'ADMIN'));
CREATE POLICY "hospitals admin insert" ON public.hospitals FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(),'ADMIN'));

CREATE TABLE public.ambulances (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ambulance_number text NOT NULL UNIQUE,
  driver_id uuid,
  paramedic_id uuid,
  driver_name text,
  latitude double precision NOT NULL,
  longitude double precision NOT NULL,
  status text NOT NULL DEFAULT 'AVAILABLE',
  ambulance_type text NOT NULL DEFAULT 'NORMAL',
  equipment text[] NOT NULL DEFAULT '{}',
  traffic_score int NOT NULL DEFAULT 5,
  current_case_id uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.ambulances TO authenticated;
GRANT ALL ON public.ambulances TO service_role;
ALTER TABLE public.ambulances ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ambulances read" ON public.ambulances FOR SELECT TO authenticated USING (true);
CREATE POLICY "ambulances staff update" ON public.ambulances FOR UPDATE TO authenticated USING (public.is_staff(auth.uid()));

CREATE TABLE public.emergencies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid REFERENCES public.patients(id) ON DELETE SET NULL,
  reported_by uuid NOT NULL,
  patient_name text,
  emergency_type text NOT NULL,
  description text,
  severity text NOT NULL DEFAULT 'MEDIUM',
  ai_score int,
  ai_reasons text[] NOT NULL DEFAULT '{}',
  conditions jsonb NOT NULL DEFAULT '{}'::jsonb,
  latitude double precision NOT NULL,
  longitude double precision NOT NULL,
  address text,
  ambulance_id uuid REFERENCES public.ambulances(id) ON DELETE SET NULL,
  hospital_id uuid REFERENCES public.hospitals(id) ON DELETE SET NULL,
  hospital_reasons text[] NOT NULL DEFAULT '{}',
  eta_minutes int,
  status text NOT NULL DEFAULT 'CREATED',
  created_at timestamptz NOT NULL DEFAULT now(),
  accepted_at timestamptz,
  pickup_at timestamptz,
  hospital_arrival_at timestamptz,
  completed_at timestamptz
);
GRANT SELECT, INSERT, UPDATE ON public.emergencies TO authenticated;
GRANT ALL ON public.emergencies TO service_role;
ALTER TABLE public.emergencies ENABLE ROW LEVEL SECURITY;
CREATE POLICY "emergencies read" ON public.emergencies FOR SELECT TO authenticated USING (reported_by = auth.uid() OR public.is_staff(auth.uid()));
CREATE POLICY "emergencies create" ON public.emergencies FOR INSERT TO authenticated WITH CHECK (reported_by = auth.uid());
CREATE POLICY "emergencies update" ON public.emergencies FOR UPDATE TO authenticated USING (reported_by = auth.uid() OR public.is_staff(auth.uid()));

CREATE TABLE public.emergency_timeline (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  emergency_id uuid NOT NULL REFERENCES public.emergencies(id) ON DELETE CASCADE,
  event text NOT NULL,
  description text,
  user_id uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.emergency_timeline TO authenticated;
GRANT ALL ON public.emergency_timeline TO service_role;
ALTER TABLE public.emergency_timeline ENABLE ROW LEVEL SECURITY;
CREATE POLICY "timeline read" ON public.emergency_timeline FOR SELECT TO authenticated USING (
  public.is_staff(auth.uid()) OR EXISTS (SELECT 1 FROM public.emergencies e WHERE e.id = emergency_id AND e.reported_by = auth.uid())
);
CREATE POLICY "timeline insert" ON public.emergency_timeline FOR INSERT TO authenticated WITH CHECK (true);

CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  role public.app_role,
  emergency_id uuid REFERENCES public.emergencies(id) ON DELETE CASCADE,
  title text NOT NULL,
  message text,
  type text NOT NULL DEFAULT 'INFO',
  read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "notifications read" ON public.notifications FOR SELECT TO authenticated USING (
  user_id = auth.uid() OR (role IS NOT NULL AND public.has_role(auth.uid(), role))
);
CREATE POLICY "notifications insert" ON public.notifications FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "notifications update" ON public.notifications FOR UPDATE TO authenticated USING (
  user_id = auth.uid() OR (role IS NOT NULL AND public.has_role(auth.uid(), role))
);

CREATE TABLE public.ambulance_locations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ambulance_id uuid NOT NULL REFERENCES public.ambulances(id) ON DELETE CASCADE,
  latitude double precision NOT NULL,
  longitude double precision NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.ambulance_locations TO authenticated;
GRANT ALL ON public.ambulance_locations TO service_role;
ALTER TABLE public.ambulance_locations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "locations read" ON public.ambulance_locations FOR SELECT TO authenticated USING (true);
CREATE POLICY "locations insert" ON public.ambulance_locations FOR INSERT TO authenticated WITH CHECK (public.is_staff(auth.uid()));

ALTER TABLE public.emergencies REPLICA IDENTITY FULL;
ALTER TABLE public.ambulances REPLICA IDENTITY FULL;
ALTER TABLE public.hospitals REPLICA IDENTITY FULL;
ALTER TABLE public.notifications REPLICA IDENTITY FULL;
ALTER TABLE public.emergency_timeline REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.emergencies;
ALTER PUBLICATION supabase_realtime ADD TABLE public.ambulances;
ALTER PUBLICATION supabase_realtime ADD TABLE public.hospitals;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE public.emergency_timeline;

INSERT INTO public.hospitals (name, address, latitude, longitude, phone, available_beds, icu_beds, emergency_available, specializations) VALUES
('Aravind Multispeciality Hospital','12 Trichy Road, Coimbatore',11.0121,76.9721,'+91 422 100 1001',48,9,true,ARRAY['Trauma','Emergency Medicine','Orthopedics','Cardiology']),
('Sri Ramakrishna Heart Institute','88 Avinashi Road, Coimbatore',11.0245,76.9903,'+91 422 100 1002',22,6,true,ARRAY['Cardiology','Emergency Medicine']),
('KMCH Neuro & Trauma Centre','5 Sathy Road, Coimbatore',11.0402,76.9535,'+91 422 100 1003',35,11,true,ARRAY['Neurology','Trauma','Emergency Medicine']),
('Gandhipuram General Hospital','21 Cross Cut Road, Coimbatore',10.9975,76.9612,'+91 422 100 1004',60,2,true,ARRAY['Emergency Medicine','Orthopedics']),
('Peelamedu Community Hospital','7 Hope College Road, Coimbatore',11.0289,77.0182,'+91 422 100 1005',15,0,false,ARRAY['Orthopedics']);

INSERT INTO public.ambulances (ambulance_number, driver_name, latitude, longitude, status, ambulance_type, equipment, traffic_score) VALUES
('TN38AB1234','Ravi Kumar',11.0180,76.9640,'AVAILABLE','ICU',ARRAY['Ventilator','Oxygen','Cardiac Monitor','Defibrillator'],3),
('TN38AB5678','Suresh Babu',11.0055,76.9490,'AVAILABLE','NORMAL',ARRAY['Oxygen','First Aid Kit'],4),
('TN38CD1234','Manoj Pillai',11.0330,76.9800,'BUSY','NORMAL',ARRAY['Oxygen','Stretcher'],7),
('TN38CD5678','Karthik R',11.0210,76.9420,'AVAILABLE','ADVANCED_LIFE_SUPPORT',ARRAY['Ventilator','Oxygen','Cardiac Monitor','Infusion Pump','Defibrillator'],5),
('TN38EF1234','Vignesh S',10.9920,76.9750,'AVAILABLE','ICU',ARRAY['Ventilator','Oxygen','Cardiac Monitor'],6);
