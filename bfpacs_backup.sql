--
-- PostgreSQL database dump
--


-- Dumped from database version 17.7 (Ubuntu 17.7-0ubuntu0.25.10.1)
-- Dumped by pg_dump version 17.7 (Ubuntu 17.7-0ubuntu0.25.10.1)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: postgis; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS postgis WITH SCHEMA public;


--
-- Name: EXTENSION postgis; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION postgis IS 'PostGIS geometry and geography spatial types and functions';


--
-- Name: uuid-ossp; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA public;


--
-- Name: EXTENSION "uuid-ossp"; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION "uuid-ossp" IS 'generate universally unique identifiers (UUIDs)';


--
-- Name: rank_enum; Type: TYPE; Schema: public; Owner: bfp_admin
--

CREATE TYPE public.rank_enum AS ENUM (
    'FO1',
    'FO2',
    'FO3',
    'SFO1',
    'SFO2',
    'SFO3',
    'SFO4',
    'FINSP',
    'FSINSP',
    'FCINSP',
    'FSUPT',
    'FSSUPT',
    'FCSUPT'
);


ALTER TYPE public.rank_enum OWNER TO bfp_admin;

--
-- Name: vehicle_capacity; Type: TYPE; Schema: public; Owner: bfp_admin
--

CREATE TYPE public.vehicle_capacity AS ENUM (
    '250 GAL',
    '500 GAL',
    '1000 GAL',
    '1500 GAL',
    '3000 GAL',
    '3500 GAL',
    '4000 GAL',
    'Others'
);


ALTER TYPE public.vehicle_capacity OWNER TO bfp_admin;

--
-- Name: notify_new_incident(); Type: FUNCTION; Schema: public; Owner: bfp_admin
--

CREATE FUNCTION public.notify_new_incident() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    -- This inserts a notification for the Station Commander (Admin role)
    INSERT INTO notifications (user_id, title, message)
    SELECT id, '🚨 NEW FIRE ALARM', 'A 10-70 has been reported at: ' || NEW.location_text
    FROM users 
    WHERE role = 'Station Commander' OR role = 'Admin';
    
    RETURN NEW;
END;
$$;


ALTER FUNCTION public.notify_new_incident() OWNER TO bfp_admin;

--
-- Name: notify_situational_update(); Type: FUNCTION; Schema: public; Owner: bfp_admin
--

CREATE FUNCTION public.notify_situational_update() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    INSERT INTO notifications (user_id, title, message)
    SELECT id, '📝 FIELD UPDATE', 'New situational report received for Incident/Deployment.'
    FROM users 
    WHERE role = 'City Fire Marshal' OR role = 'Admin';
    
    RETURN NEW;
END;
$$;


ALTER FUNCTION public.notify_situational_update() OWNER TO bfp_admin;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: certifications; Type: TABLE; Schema: public; Owner: bfp_admin
--

CREATE TABLE public.certifications (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    name character varying(100) NOT NULL
);


ALTER TABLE public.certifications OWNER TO bfp_admin;

--
-- Name: deployment_assignments; Type: TABLE; Schema: public; Owner: bfp_admin
--

CREATE TABLE public.deployment_assignments (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    deployment_id uuid,
    fleet_id uuid,
    check_in_time timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    check_out_time timestamp with time zone,
    situation_update text,
    photo_url text
);


ALTER TABLE public.deployment_assignments OWNER TO bfp_admin;

--
-- Name: deployments; Type: TABLE; Schema: public; Owner: bfp_admin
--

CREATE TABLE public.deployments (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    name_of_deployment character varying(255) NOT NULL,
    location_text text NOT NULL,
    geo_location public.geography(Point,4326),
    lat double precision,
    lng double precision,
    status character varying(20) DEFAULT 'Active'::character varying,
    team_leader character varying(255),
    remarks text,
    start_time timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    end_time timestamp with time zone,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.deployments OWNER TO bfp_admin;

--
-- Name: duty_personnel; Type: TABLE; Schema: public; Owner: bfp_admin
--

CREATE TABLE public.duty_personnel (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    station_id uuid,
    fleet_id uuid,
    full_name character varying(255) NOT NULL,
    rank character varying(20) NOT NULL,
    designation text,
    shift character varying(10),
    duty_status character varying(20) DEFAULT 'Off Duty'::character varying,
    is_station_commander boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    nfc_tag_id character varying(50),
    pin_code character varying(4),
    certification text,
    CONSTRAINT check_bfp_rank CHECK (((rank)::text = ANY ((ARRAY['FO1'::character varying, 'FO2'::character varying, 'FO3'::character varying, 'SFO1'::character varying, 'SFO2'::character varying, 'SFO3'::character varying, 'SFO4'::character varying, 'FINSP'::character varying, 'FSINSP'::character varying, 'FCINSP'::character varying, 'FSUPT'::character varying, 'FSSUPT'::character varying, 'FCSUPT'::character varying])::text[])))
);


ALTER TABLE public.duty_personnel OWNER TO bfp_admin;

--
-- Name: equipment_incident_logs; Type: TABLE; Schema: public; Owner: bfp_admin
--

CREATE TABLE public.equipment_incident_logs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    incident_id uuid,
    equipment_id uuid,
    checked_in_at timestamp with time zone DEFAULT now(),
    checked_out_at timestamp with time zone,
    status_at_incident text
);


ALTER TABLE public.equipment_incident_logs OWNER TO bfp_admin;

--
-- Name: fire_incidents; Type: TABLE; Schema: public; Owner: bfp_admin
--

CREATE TABLE public.fire_incidents (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    reported_by uuid,
    location_text text NOT NULL,
    geo_location public.geography(Point,4326),
    lat double precision,
    lng double precision,
    date_time_reported timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    occupancy_type character varying(100),
    involved_type character varying(100),
    alarm_status character varying(50) DEFAULT '1st Alarm'::character varying,
    incident_status character varying(20) DEFAULT 'Active'::character varying,
    ground_commander character varying(255),
    ics_commander character varying(255),
    total_injured integer DEFAULT 0,
    total_rescued integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    occupancy_category text,
    involves_hazardous_materials boolean DEFAULT false,
    response_type character varying(50) DEFAULT 'Fire Incident'::character varying,
    CONSTRAINT check_occupancy_category CHECK ((occupancy_category = ANY (ARRAY['Assembly'::text, 'Business'::text, 'Day Care'::text, 'Detention and Correctional'::text, 'Educational'::text, 'Healthcare'::text, 'Industrial'::text, 'Mercantile'::text, 'Mixed Occupancy'::text, 'Residential'::text, 'Storage'::text, 'Special Structure'::text]))),
    CONSTRAINT check_response_type CHECK (((response_type)::text = ANY ((ARRAY['Fire Incident'::character varying, 'Emergency Response'::character varying, 'Rescue Operation'::character varying])::text[])))
);


ALTER TABLE public.fire_incidents OWNER TO bfp_admin;

--
-- Name: fleet_movement_logs; Type: TABLE; Schema: public; Owner: bfp_admin
--

CREATE TABLE public.fleet_movement_logs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    dispatch_id uuid,
    fleet_id uuid,
    status_code character varying(10) NOT NULL,
    location_point public.geography(Point,4326),
    lat double precision,
    lng double precision,
    recorded_at timestamp with time zone DEFAULT now(),
    battery_level integer,
    heading double precision,
    purpose text,
    destination_text text,
    odometer_reading integer
);


ALTER TABLE public.fleet_movement_logs OWNER TO bfp_admin;

--
-- Name: fleets; Type: TABLE; Schema: public; Owner: bfp_admin
--

CREATE TABLE public.fleets (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    station_id uuid,
    user_id uuid,
    engine_code character varying(100) NOT NULL,
    plate_number character varying(20) NOT NULL,
    vehicle_type character varying(50) NOT NULL,
    ft_capacity character varying(20),
    status character varying(50) DEFAULT 'Serviceable'::character varying,
    acs_status character varying(20) DEFAULT 'Inactive'::character varying,
    current_location public.geography(Point,4326),
    lat double precision,
    lng double precision,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    current_assignment_status text,
    CONSTRAINT check_ft_capacity CHECK (((ft_capacity)::text = ANY ((ARRAY['250 GAL'::character varying, '500 GAL'::character varying, '1000 GAL'::character varying, '1500 GAL'::character varying, '3000 GAL'::character varying, '3500 GAL'::character varying, '4000 GAL'::character varying, 'Others'::character varying])::text[])))
);


ALTER TABLE public.fleets OWNER TO bfp_admin;

--
-- Name: hydrants; Type: TABLE; Schema: public; Owner: bfp_admin
--

CREATE TABLE public.hydrants (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    station_id uuid,
    hydrant_code character varying(50),
    address_text text,
    city character varying(100),
    status character varying(50) DEFAULT 'Serviceable'::character varying,
    location public.geography(Point,4326),
    lat double precision,
    lng double precision,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    geo_location public.geography(Point,4326),
    district character varying(100),
    region character varying(100),
    hydrant_type text,
    psi integer,
    last_inspection_date text
);


ALTER TABLE public.hydrants OWNER TO bfp_admin;

--
-- Name: incident_dispatches; Type: TABLE; Schema: public; Owner: bfp_admin
--

CREATE TABLE public.incident_dispatches (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    incident_id uuid,
    fleet_id uuid,
    dispatch_status character varying(50),
    check_in_time timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    check_out_time timestamp with time zone,
    situational_report text
);


ALTER TABLE public.incident_dispatches OWNER TO bfp_admin;

--
-- Name: logistical_equipment; Type: TABLE; Schema: public; Owner: bfp_admin
--

CREATE TABLE public.logistical_equipment (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    station_id uuid,
    fleet_id uuid,
    equipment_name character varying(255) NOT NULL,
    quantity integer DEFAULT 1,
    status character varying(50) DEFAULT 'Serviceable'::character varying,
    borrower_name character varying(255),
    borrowed_at timestamp with time zone,
    returned_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.logistical_equipment OWNER TO bfp_admin;

--
-- Name: notifications; Type: TABLE; Schema: public; Owner: bfp_admin
--

CREATE TABLE public.notifications (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    user_id uuid,
    title character varying(255) NOT NULL,
    message text NOT NULL,
    is_read boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.notifications OWNER TO bfp_admin;

--
-- Name: personnel_certifications; Type: TABLE; Schema: public; Owner: bfp_admin
--

CREATE TABLE public.personnel_certifications (
    personnel_id uuid NOT NULL,
    certification_id uuid NOT NULL
);


ALTER TABLE public.personnel_certifications OWNER TO bfp_admin;

--
-- Name: personnel_incident_logs; Type: TABLE; Schema: public; Owner: bfp_admin
--

CREATE TABLE public.personnel_incident_logs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    incident_id uuid,
    personnel_id uuid,
    check_in_method character varying(20) DEFAULT 'NFC'::character varying,
    check_in_time timestamp with time zone DEFAULT now(),
    check_out_time timestamp with time zone,
    entry_type text DEFAULT 'NFC'::text
);


ALTER TABLE public.personnel_incident_logs OWNER TO bfp_admin;

--
-- Name: situational_reports; Type: TABLE; Schema: public; Owner: bfp_admin
--

CREATE TABLE public.situational_reports (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    incident_id uuid,
    deployment_id uuid,
    reporter_id uuid,
    situation_text text NOT NULL,
    remarks text,
    photo_url text,
    personnel_count integer,
    equipment_count integer,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    report_type character varying(50) DEFAULT 'Situational'::character varying,
    subject_text text,
    involved_occupancy_type character varying(100),
    team_leader_id uuid,
    area_of_deployment_text text,
    CONSTRAINT chk_report_type CHECK (((report_type)::text = ANY ((ARRAY['Situational'::character varying, 'Incident'::character varying, 'Inspection'::character varying])::text[]))),
    CONSTRAINT situational_reports_report_type_check CHECK (((report_type)::text = ANY ((ARRAY['Situational'::character varying, 'Incident'::character varying, 'Inspection'::character varying])::text[])))
);


ALTER TABLE public.situational_reports OWNER TO bfp_admin;

--
-- Name: stations; Type: TABLE; Schema: public; Owner: bfp_admin
--

CREATE TABLE public.stations (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    station_name character varying(255) NOT NULL,
    contact_number character varying(20),
    team_leader_contact character varying(20),
    address_text text,
    city character varying(100) NOT NULL,
    district character varying(100) NOT NULL,
    region character varying(100) NOT NULL,
    location public.geography(Point,4326),
    lat double precision,
    lng double precision,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.stations OWNER TO bfp_admin;

--
-- Name: users; Type: TABLE; Schema: public; Owner: bfp_admin
--

CREATE TABLE public.users (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    email character varying(255) NOT NULL,
    password_hash text NOT NULL,
    full_name character varying(255) NOT NULL,
    station_id uuid,
    role character varying(50) NOT NULL,
    approved boolean DEFAULT false,
    is_active boolean DEFAULT true,
    user_type text,
    sub_role text,
    personnel_type text,
    type_of_vehicle text,
    engine_number text,
    plate_number text,
    fire_truck_capacity bigint,
    city_fire_marshal text,
    station_commander text,
    station_contact_number text,
    acs_status text,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.users OWNER TO bfp_admin;

--
-- Name: view_initial_incident_report; Type: VIEW; Schema: public; Owner: bfp_admin
--

CREATE VIEW public.view_initial_incident_report AS
 SELECT i.id AS incident_id,
    i.location_text,
    i.date_time_reported,
    i.occupancy_type,
    i.involved_type,
    i.alarm_status,
    i.ground_commander,
    f.engine_code,
    f.plate_number,
    (( SELECT min(fleet_movement_logs.recorded_at) AS min
           FROM public.fleet_movement_logs
          WHERE ((fleet_movement_logs.dispatch_id = d.id) AND ((fleet_movement_logs.status_code)::text = '10-23'::text))) - i.date_time_reported) AS response_duration,
    ( SELECT count(*) AS count
           FROM public.personnel_incident_logs
          WHERE (personnel_incident_logs.incident_id = i.id)) AS actual_personnel_on_scene,
    ( SELECT string_agg((logistical_equipment.equipment_name)::text, ', '::text) AS string_agg
           FROM public.logistical_equipment
          WHERE (logistical_equipment.fleet_id = f.id)) AS deployed_equipment
   FROM ((public.fire_incidents i
     JOIN public.incident_dispatches d ON ((i.id = d.incident_id)))
     JOIN public.fleets f ON ((d.fleet_id = f.id)));


ALTER VIEW public.view_initial_incident_report OWNER TO bfp_admin;

--
-- Data for Name: certifications; Type: TABLE DATA; Schema: public; Owner: bfp_admin
--

COPY public.certifications (id, name) FROM stdin;
080f460e-864a-412e-8538-3f12f4beffea	HAZMAT
3a352b9f-5e6f-4430-9be1-99bb47eee880	CBRN
22377663-f563-4b44-9901-bcd7f78681b3	EMT
eb741348-a1e2-4d52-990b-0ffc99864698	BRRT
\.


--
-- Data for Name: deployment_assignments; Type: TABLE DATA; Schema: public; Owner: bfp_admin
--

COPY public.deployment_assignments (id, deployment_id, fleet_id, check_in_time, check_out_time, situation_update, photo_url) FROM stdin;
19a3861a-9d56-43b1-8106-66a79854fbea	e4e49f98-4fad-4fc6-97a9-1b39cf8bdfdc	a23e6432-0822-4957-8418-8acae9621c53	2026-03-02 15:17:14.893472+08	\N	Hydrant HQ-HYD-01 inspected. Pressure is optimal.	\N
\.


--
-- Data for Name: deployments; Type: TABLE DATA; Schema: public; Owner: bfp_admin
--

COPY public.deployments (id, name_of_deployment, location_text, geo_location, status, team_leader, remarks, start_time, end_time, created_at, updated_at) FROM stdin;
e4e49f98-4fad-4fc6-97a9-1b39cf8bdfdc	District 4 Hydrant Mapping	Agham Road Area	\N	Active	SFO1 Ricardo Dalisay	Routine inspection of water sources	2026-03-02 15:16:59.478575+08	\N	2026-03-02 15:16:59.478575+08	2026-03-02 15:16:59.478575+08
a1abe702-c3a0-4cb0-9260-62587d933586	Quarterly Hydrant Spotting - District 4	Agham Road Corner North Ave	\N	Active	SFO1 Ricardo Dalisay	Testing water pressure and accessibility	2026-03-02 15:24:56.485469+08	\N	2026-03-02 15:24:56.485469+08	2026-03-02 15:24:56.485469+08
8807e00a-e521-47fa-8cee-1e8cc319c7b9	Quarterly Hydrant Spotting - District 4	Agham Road Corner North Ave	\N	Active	SFO1 Ricardo Dalisay	Testing water pressure and accessibility	2026-03-02 15:25:43.372997+08	\N	2026-03-02 15:25:43.372997+08	2026-03-02 15:25:43.372997+08
\.


--
-- Data for Name: duty_personnel; Type: TABLE DATA; Schema: public; Owner: bfp_admin
--

COPY public.duty_personnel (id, station_id, fleet_id, full_name, rank, designation, shift, duty_status, is_station_commander, created_at, updated_at, nfc_tag_id, pin_code) FROM stdin;
6f23f8c3-aa6a-4aa5-b22a-069020d7f011	1e9d8412-683d-4fcd-babb-a7062105e924	a23e6432-0822-4957-8418-8acae9621c53	FO1 Hesus Nazareno	FO1	\N	Shift A	On Duty	f	2026-03-02 15:15:00.001888+08	2026-03-02 15:15:00.001888+08	\N	\N
f67a6381-9b2f-418f-8ebf-723834e9bb45	1e9d8412-683d-4fcd-babb-a7062105e924	a23e6432-0822-4957-8418-8acae9621c53	SFO1 Ricardo Dalisay	SFO1	\N	Shift A	On Duty	f	2026-03-02 15:00:49.890636+08	2026-03-02 15:00:49.890636+08	\N	\N
52e42ecb-eea4-4cf6-aa43-bfe5992d1eca	1e9d8412-683d-4fcd-babb-a7062105e924	\N	Juan Dela Cruz	SFO2	Nozzleman	\N	Off Duty	f	2026-03-02 16:27:58.722106+08	2026-03-02 16:27:58.722106+08	NFC-BFP-2026-001	\N
\.


--
-- Data for Name: equipment_incident_logs; Type: TABLE DATA; Schema: public; Owner: bfp_admin
--

COPY public.equipment_incident_logs (id, incident_id, equipment_id, checked_in_at, checked_out_at, status_at_incident) FROM stdin;
\.


--
-- Data for Name: fire_incidents; Type: TABLE DATA; Schema: public; Owner: bfp_admin
--

COPY public.fire_incidents (id, reported_by, location_text, geo_location, date_time_reported, occupancy_type, involved_type, alarm_status, incident_status, ground_commander, ics_commander, total_injured, total_rescued, created_at, updated_at, occupancy_category, involves_hazardous_materials, response_type) FROM stdin;
b5f52714-9015-40d7-a4d1-d41fe3bad4de	\N	123 BFP Lane, Brgy. Central, Quezon City	0101000020E61000007B14AE47E1425E403D0AD7A3703D2D40	2026-03-02 15:07:19.386479+08	Residential	Single and Two Family Dwelling	1st Alarm	Active	SFO1 Ricardo Dalisay	\N	0	0	2026-03-02 15:07:19.386479+08	2026-03-02 15:07:19.386479+08	\N	f	Fire Incident
25ea554a-d243-4edb-b491-926f78cac4cc	\N	456 Agham Road, Quezon City	0101000020E6100000894160E5D0425E40B0726891ED3C2D40	2026-03-02 15:10:46.124253+08	Residential	\N	1st Alarm	Active	\N	\N	0	0	2026-03-02 15:10:46.124253+08	2026-03-02 15:10:46.124253+08	\N	f	Fire Incident
73c2f5a2-4f13-4bc9-a503-3c1d93017c46	\N	789 Quezon Ave, QC	\N	2026-03-02 15:15:52.389332+08	Commercial	\N	Fire Out	Done	SFO1 Ricardo Dalisay	\N	0	0	2026-03-02 15:15:52.389332+08	2026-03-02 15:15:52.389332+08	\N	f	Fire Incident
fe0e9af6-9aa8-481a-bff9-7f194b7b4c40	\N	789 Quezon Ave, QC	\N	2026-03-02 15:20:22.487548+08	Commercial	\N	1st Alarm	Active	\N	\N	0	0	2026-03-02 15:20:22.487548+08	2026-03-02 15:20:22.487548+08	\N	f	Fire Incident
cb9bbba4-6be8-4d5f-b61a-bcfa4fe5c152	\N	Test Notification Fire	\N	2026-03-02 15:32:25.539111+08	Residential	\N	1st Alarm	Active	\N	\N	0	0	2026-03-02 15:32:25.539111+08	2026-03-02 15:32:25.539111+08	\N	f	Fire Incident
14afa4e4-3598-42c0-92b4-14adca5af08a	\N	999 BFP St, Manila	0101000020E6100000492EFF21FD3E5E406DE7FBA9F1322D40	2026-03-02 15:33:45.465265+08	Commercial	\N	1st Alarm	Active	\N	\N	0	0	2026-03-02 15:33:45.465265+08	2026-03-02 15:33:45.465265+08	\N	f	Fire Incident
844c10a6-bce1-41aa-b33c-d0912c10fd85	\N	123 Rizal Ave, Manila	\N	2026-03-02 16:29:02.648514+08	\N	Apartment Building	1st Alarm	Done	\N	\N	0	0	2026-03-02 16:29:02.648514+08	2026-03-02 16:31:27.717326+08	Residential	f	Fire Incident
\.


--
-- Data for Name: fleet_movement_logs; Type: TABLE DATA; Schema: public; Owner: bfp_admin
--

COPY public.fleet_movement_logs (id, dispatch_id, fleet_id, status_code, location_point, recorded_at, battery_level, heading, purpose, destination_text, odometer_reading) FROM stdin;
\.


--
-- Data for Name: fleets; Type: TABLE DATA; Schema: public; Owner: bfp_admin
--

COPY public.fleets (id, station_id, user_id, engine_code, plate_number, vehicle_type, ft_capacity, status, acs_status, current_location, created_at, updated_at, current_assignment_status) FROM stdin;
a23e6432-0822-4957-8418-8acae9621c53	1e9d8412-683d-4fcd-babb-a7062105e924	c4a0d762-5ccc-406f-bce2-2f22c9ca2ea0	E-101	ABC-1234	Engine	1000 GAL	Serviceable	Active	\N	2026-03-02 15:09:10.125452+08	2026-03-02 15:09:10.125452+08	\N
\.


--
-- Data for Name: hydrants; Type: TABLE DATA; Schema: public; Owner: bfp_admin
--

COPY public.hydrants (id, station_id, hydrant_code, address_text, city, status, location, created_at, updated_at, geo_location, district, region) FROM stdin;
c7473021-b0e4-436d-8de6-269d8cf944fd	1e9d8412-683d-4fcd-babb-a7062105e924	HQ-HYD-01	Agham Road, near Gate 1	Quezon City	Serviceable	0101000020E61000001F85EB51B8425E40E9263108AC3C2D40	2026-03-02 15:05:02.221445+08	2026-03-02 15:05:02.221445+08	\N	\N	\N
\.


--
-- Data for Name: incident_dispatches; Type: TABLE DATA; Schema: public; Owner: bfp_admin
--

COPY public.incident_dispatches (id, incident_id, fleet_id, dispatch_status, check_in_time, check_out_time, situational_report) FROM stdin;
db5fd946-33f1-4ef4-bc6b-9e476fbe6f33	25ea554a-d243-4edb-b491-926f78cac4cc	a23e6432-0822-4957-8418-8acae9621c53	10-23 Arrived at Scene	2026-03-02 15:11:17.084759+08	\N	\N
0fb16c18-41e4-4d6d-b403-fadf0763a69e	73c2f5a2-4f13-4bc9-a503-3c1d93017c46	a23e6432-0822-4957-8418-8acae9621c53	10-23 Arrived at Scene	2026-03-02 15:16:19.999096+08	\N	\N
aa9e75a7-2e7a-4ab7-b3ee-d88c10ac8d3b	73c2f5a2-4f13-4bc9-a503-3c1d93017c46	a23e6432-0822-4957-8418-8acae9621c53	10-23 Arrived at Scene	2026-03-02 15:16:32.950946+08	\N	\N
efc935cf-3575-4447-8bfe-4c4ff0393b79	fe0e9af6-9aa8-481a-bff9-7f194b7b4c40	a23e6432-0822-4957-8418-8acae9621c53	10-23 Arrived at Scene	2026-03-02 15:20:27.304358+08	\N	\N
dd570f2f-8a31-4e40-acae-89e710c64d70	14afa4e4-3598-42c0-92b4-14adca5af08a	a23e6432-0822-4957-8418-8acae9621c53	10-23 Arrived at Scene	2026-03-02 15:33:51.799073+08	\N	\N
2a03b3a1-d3a7-46c0-abed-0465d95b6e93	844c10a6-bce1-41aa-b33c-d0912c10fd85	a23e6432-0822-4957-8418-8acae9621c53	En Route	2026-03-02 16:29:07.172101+08	\N	\N
\.


--
-- Data for Name: logistical_equipment; Type: TABLE DATA; Schema: public; Owner: bfp_admin
--

COPY public.logistical_equipment (id, station_id, fleet_id, equipment_name, quantity, status, borrower_name, borrowed_at, returned_at, created_at, updated_at) FROM stdin;
f0ffd4eb-52f8-4f4b-b36d-98691c739760	1e9d8412-683d-4fcd-babb-a7062105e924	\N	Fire Hose 50ft	10	Serviceable	\N	\N	\N	2026-03-02 15:04:04.719178+08	2026-03-02 15:04:04.719178+08
bc533e65-314e-45e0-b6b2-82fc8b6ee1e7	1e9d8412-683d-4fcd-babb-a7062105e924	a23e6432-0822-4957-8418-8acae9621c53	SCBA Tank	4	Serviceable	\N	\N	\N	2026-03-02 15:15:00.001888+08	2026-03-02 15:15:00.001888+08
04c2a995-10b1-45ff-8154-867f41f98a04	1e9d8412-683d-4fcd-babb-a7062105e924	a23e6432-0822-4957-8418-8acae9621c53	1.5" Fog Nozzle	2	Serviceable	SFO1 Ricardo Dalisay	2026-03-02 15:04:04.719178+08	\N	2026-03-02 15:04:04.719178+08	2026-03-02 15:04:04.719178+08
\.


--
-- Data for Name: notifications; Type: TABLE DATA; Schema: public; Owner: bfp_admin
--

COPY public.notifications (id, user_id, title, message, is_read, created_at) FROM stdin;
d2a17442-cc29-40b0-b4ec-4ca3e67eb36d	c4a0d762-5ccc-406f-bce2-2f22c9ca2ea0	🚨 NEW FIRE ALARM	A 10-70 has been reported at: Test Notification Fire	f	2026-03-02 15:32:25.539111+08
d830d588-3d29-4944-8f1c-1dc12945af3c	c4a0d762-5ccc-406f-bce2-2f22c9ca2ea0	🚨 NEW FIRE ALARM	A 10-70 has been reported at: 999 BFP St, Manila	f	2026-03-02 15:33:45.465265+08
957acddc-8ff3-4262-be8f-02303c9eaea4	c4a0d762-5ccc-406f-bce2-2f22c9ca2ea0	🚨 NEW FIRE ALARM	A 10-70 has been reported at: 123 Rizal Ave, Manila	f	2026-03-02 16:29:02.648514+08
\.


--
-- Data for Name: personnel_certifications; Type: TABLE DATA; Schema: public; Owner: bfp_admin
--

COPY public.personnel_certifications (personnel_id, certification_id) FROM stdin;
f67a6381-9b2f-418f-8ebf-723834e9bb45	080f460e-864a-412e-8538-3f12f4beffea
\.


--
-- Data for Name: personnel_incident_logs; Type: TABLE DATA; Schema: public; Owner: bfp_admin
--

COPY public.personnel_incident_logs (id, incident_id, personnel_id, check_in_method, check_in_time, check_out_time, entry_type) FROM stdin;
e84ebb78-50c7-44eb-97c5-17ae3b8d10f8	b5f52714-9015-40d7-a4d1-d41fe3bad4de	52e42ecb-eea4-4cf6-aa43-bfe5992d1eca	NFC	2026-03-02 16:28:05.590649+08	\N	NFC
91887ed6-1918-407c-a444-481db7782446	844c10a6-bce1-41aa-b33c-d0912c10fd85	f67a6381-9b2f-418f-8ebf-723834e9bb45	NFC	2026-03-02 16:29:11.171081+08	\N	NFC
3f56c9b0-4683-4152-bafe-7e1924acba2c	844c10a6-bce1-41aa-b33c-d0912c10fd85	6f23f8c3-aa6a-4aa5-b22a-069020d7f011	NFC	2026-03-02 16:29:11.171081+08	\N	NFC
\.


--
-- Data for Name: situational_reports; Type: TABLE DATA; Schema: public; Owner: bfp_admin
--

COPY public.situational_reports (id, incident_id, deployment_id, reporter_id, situation_text, remarks, photo_url, personnel_count, equipment_count, created_at, report_type, subject_text, involved_occupancy_type, team_leader_id, area_of_deployment_text) FROM stdin;
088c25b6-b36f-4a79-a1a1-450111552350	fe0e9af6-9aa8-481a-bff9-7f194b7b4c40	\N	\N	Fire is 70% contained. Moving to the north sector.	\N	https://bfp-storage.gov.ph/reports/img_001.jpg	2	\N	2026-03-02 15:22:53.766617+08	\N	\N	\N	\N	\N
b2e63e5e-c9b6-4db3-a141-7bf3a63d71a4	73c2f5a2-4f13-4bc9-a503-3c1d93017c46	\N	\N	Initial fire suppression in progress.	Heavy smoke observed on the 2nd floor.	https://bfpacs.gov.ph/storage/reports/incident_001.jpg	2	\N	2026-03-02 15:23:41.998988+08	\N	\N	\N	\N	\N
acc7eb28-1c71-4de0-93e0-a0d18e02990c	73c2f5a2-4f13-4bc9-a503-3c1d93017c46	\N	\N	Initial fire suppression in progress.	Heavy smoke observed on the 2nd floor.	https://bfpacs.gov.ph/storage/reports/incident_001.jpg	2	\N	2026-03-02 15:23:49.88735+08	\N	\N	\N	\N	\N
a6dcc470-b654-4efe-9139-afb22b600fd9	\N	a1abe702-c3a0-4cb0-9260-62587d933586	\N	a1abe702-c3a0-4cb0-9260-62587d933586	Status: Serviceable. Pressure is optimal at 60 PSI.	\N	\N	\N	2026-03-02 15:25:10.295278+08	\N	\N	\N	\N	\N
25732bf8-606d-4905-afc9-bb929d106198	\N	8807e00a-e521-47fa-8cee-1e8cc319c7b9	\N	Inspection of Hydrant HQ-HYD-01	Status: Serviceable. Pressure is optimal at 60 PSI.	https://bfpacs.gov.ph/storage/inspections/hydrant_001.jpg	\N	\N	2026-03-02 15:25:49.495679+08	\N	\N	\N	\N	\N
eb53df1e-f0cf-42f2-a784-80bffbc37d3c	14afa4e4-3598-42c0-92b4-14adca5af08a	\N	\N	Fire is spreading to the attic.	Requesting additional water tanker.	\N	\N	\N	2026-03-02 15:34:16.208731+08	\N	\N	\N	\N	\N
c09a5057-0ab0-4a8e-93a1-3ed7f86ebfd4	844c10a6-bce1-41aa-b33c-d0912c10fd85	\N	c4a0d762-5ccc-406f-bce2-2f22c9ca2ea0	Fire is currently spreading to the second floor. Requesting additional water supply.	High wind speeds are making suppression difficult.	\N	2	1	2026-03-02 16:30:11.373183+08	Situational	\N	\N	\N	Sector Alpha - Front of Building
\.


--
-- Data for Name: spatial_ref_sys; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.spatial_ref_sys (srid, auth_name, auth_srid, srtext, proj4text) FROM stdin;
\.


--
-- Data for Name: stations; Type: TABLE DATA; Schema: public; Owner: bfp_admin
--

COPY public.stations (id, station_name, contact_number, team_leader_contact, address_text, city, district, region, location, created_at, updated_at) FROM stdin;
1e9d8412-683d-4fcd-babb-a7062105e924	BFP National Headquarters	02-8426-0219	\N	\N	Quezon City	District 4	NCR	0101000020E6100000D712F241CF425E4007F01648503C2D40	2026-03-02 14:36:18.450246+08	2026-03-02 14:36:18.450246+08
e8265efd-e401-4aef-9633-8517a6350997	Manila Fire District HQ	02-8527-3627	\N	\N	Manila	District 1	NCR	\N	2026-03-02 16:27:01.878872+08	2026-03-02 16:27:01.878872+08
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: bfp_admin
--

COPY public.users (id, email, password_hash, full_name, station_id, role, is_active, created_at, updated_at) FROM stdin;
c4a0d762-5ccc-406f-bce2-2f22c9ca2ea0	marshal@bfp.gov.ph	temporary_hash_here	Juan Dela Cruz	1e9d8412-683d-4fcd-babb-a7062105e924	Station Commander	t	2026-03-02 14:45:22.853336+08	2026-03-02 14:45:22.853336+08
\.


--
-- Name: certifications certifications_name_key; Type: CONSTRAINT; Schema: public; Owner: bfp_admin
--

ALTER TABLE ONLY public.certifications
    ADD CONSTRAINT certifications_name_key UNIQUE (name);


--
-- Name: certifications certifications_pkey; Type: CONSTRAINT; Schema: public; Owner: bfp_admin
--

ALTER TABLE ONLY public.certifications
    ADD CONSTRAINT certifications_pkey PRIMARY KEY (id);


--
-- Name: deployment_assignments deployment_assignments_pkey; Type: CONSTRAINT; Schema: public; Owner: bfp_admin
--

ALTER TABLE ONLY public.deployment_assignments
    ADD CONSTRAINT deployment_assignments_pkey PRIMARY KEY (id);


--
-- Name: deployments deployments_pkey; Type: CONSTRAINT; Schema: public; Owner: bfp_admin
--

ALTER TABLE ONLY public.deployments
    ADD CONSTRAINT deployments_pkey PRIMARY KEY (id);


--
-- Name: duty_personnel duty_personnel_nfc_tag_id_key; Type: CONSTRAINT; Schema: public; Owner: bfp_admin
--

ALTER TABLE ONLY public.duty_personnel
    ADD CONSTRAINT duty_personnel_nfc_tag_id_key UNIQUE (nfc_tag_id);


--
-- Name: duty_personnel duty_personnel_pkey; Type: CONSTRAINT; Schema: public; Owner: bfp_admin
--

ALTER TABLE ONLY public.duty_personnel
    ADD CONSTRAINT duty_personnel_pkey PRIMARY KEY (id);


--
-- Name: equipment_incident_logs equipment_incident_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: bfp_admin
--

ALTER TABLE ONLY public.equipment_incident_logs
    ADD CONSTRAINT equipment_incident_logs_pkey PRIMARY KEY (id);


--
-- Name: fire_incidents fire_incidents_pkey; Type: CONSTRAINT; Schema: public; Owner: bfp_admin
--

ALTER TABLE ONLY public.fire_incidents
    ADD CONSTRAINT fire_incidents_pkey PRIMARY KEY (id);


--
-- Name: fleet_movement_logs fleet_movement_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: bfp_admin
--

ALTER TABLE ONLY public.fleet_movement_logs
    ADD CONSTRAINT fleet_movement_logs_pkey PRIMARY KEY (id);


--
-- Name: fleets fleets_engine_code_key; Type: CONSTRAINT; Schema: public; Owner: bfp_admin
--

ALTER TABLE ONLY public.fleets
    ADD CONSTRAINT fleets_engine_code_key UNIQUE (engine_code);


--
-- Name: fleets fleets_pkey; Type: CONSTRAINT; Schema: public; Owner: bfp_admin
--

ALTER TABLE ONLY public.fleets
    ADD CONSTRAINT fleets_pkey PRIMARY KEY (id);


--
-- Name: fleets fleets_plate_number_key; Type: CONSTRAINT; Schema: public; Owner: bfp_admin
--

ALTER TABLE ONLY public.fleets
    ADD CONSTRAINT fleets_plate_number_key UNIQUE (plate_number);


--
-- Name: hydrants hydrants_hydrant_code_key; Type: CONSTRAINT; Schema: public; Owner: bfp_admin
--

ALTER TABLE ONLY public.hydrants
    ADD CONSTRAINT hydrants_hydrant_code_key UNIQUE (hydrant_code);


--
-- Name: hydrants hydrants_pkey; Type: CONSTRAINT; Schema: public; Owner: bfp_admin
--

ALTER TABLE ONLY public.hydrants
    ADD CONSTRAINT hydrants_pkey PRIMARY KEY (id);


--
-- Name: incident_dispatches incident_dispatches_pkey; Type: CONSTRAINT; Schema: public; Owner: bfp_admin
--

ALTER TABLE ONLY public.incident_dispatches
    ADD CONSTRAINT incident_dispatches_pkey PRIMARY KEY (id);


--
-- Name: logistical_equipment logistical_equipment_pkey; Type: CONSTRAINT; Schema: public; Owner: bfp_admin
--

ALTER TABLE ONLY public.logistical_equipment
    ADD CONSTRAINT logistical_equipment_pkey PRIMARY KEY (id);


--
-- Name: notifications notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: bfp_admin
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_pkey PRIMARY KEY (id);


--
-- Name: personnel_certifications personnel_certifications_pkey; Type: CONSTRAINT; Schema: public; Owner: bfp_admin
--

ALTER TABLE ONLY public.personnel_certifications
    ADD CONSTRAINT personnel_certifications_pkey PRIMARY KEY (personnel_id, certification_id);


--
-- Name: personnel_incident_logs personnel_incident_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: bfp_admin
--

ALTER TABLE ONLY public.personnel_incident_logs
    ADD CONSTRAINT personnel_incident_logs_pkey PRIMARY KEY (id);


--
-- Name: situational_reports situational_reports_pkey; Type: CONSTRAINT; Schema: public; Owner: bfp_admin
--

ALTER TABLE ONLY public.situational_reports
    ADD CONSTRAINT situational_reports_pkey PRIMARY KEY (id);


--
-- Name: stations stations_pkey; Type: CONSTRAINT; Schema: public; Owner: bfp_admin
--

ALTER TABLE ONLY public.stations
    ADD CONSTRAINT stations_pkey PRIMARY KEY (id);


--
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: bfp_admin
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: bfp_admin
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: idx_deployments_location; Type: INDEX; Schema: public; Owner: bfp_admin
--

CREATE INDEX idx_deployments_location ON public.deployments USING gist (geo_location);


--
-- Name: idx_equipment_station; Type: INDEX; Schema: public; Owner: bfp_admin
--

CREATE INDEX idx_equipment_station ON public.logistical_equipment USING btree (station_id);


--
-- Name: idx_fleet_logs_geom; Type: INDEX; Schema: public; Owner: bfp_admin
--

CREATE INDEX idx_fleet_logs_geom ON public.fleet_movement_logs USING gist (location_point);


--
-- Name: idx_fleets_current_location; Type: INDEX; Schema: public; Owner: bfp_admin
--

CREATE INDEX idx_fleets_current_location ON public.fleets USING gist (current_location);


--
-- Name: idx_hydrants_final_geom; Type: INDEX; Schema: public; Owner: bfp_admin
--

CREATE INDEX idx_hydrants_final_geom ON public.hydrants USING gist (location);


--
-- Name: idx_hydrants_geoloc; Type: INDEX; Schema: public; Owner: bfp_admin
--

CREATE INDEX idx_hydrants_geoloc ON public.hydrants USING gist (location);


--
-- Name: idx_hydrants_location; Type: INDEX; Schema: public; Owner: bfp_admin
--

CREATE INDEX idx_hydrants_location ON public.hydrants USING gist (location);


--
-- Name: idx_incidents_location; Type: INDEX; Schema: public; Owner: bfp_admin
--

CREATE INDEX idx_incidents_location ON public.fire_incidents USING gist (geo_location);


--
-- Name: idx_personnel_name; Type: INDEX; Schema: public; Owner: bfp_admin
--

CREATE INDEX idx_personnel_name ON public.duty_personnel USING btree (full_name);


--
-- Name: idx_stations_location; Type: INDEX; Schema: public; Owner: bfp_admin
--

CREATE INDEX idx_stations_location ON public.stations USING gist (location);


--
-- Name: idx_users_email; Type: INDEX; Schema: public; Owner: bfp_admin
--

CREATE INDEX idx_users_email ON public.users USING btree (email);


--
-- Name: fire_incidents trg_new_incident_alert; Type: TRIGGER; Schema: public; Owner: bfp_admin
--

CREATE TRIGGER trg_new_incident_alert AFTER INSERT ON public.fire_incidents FOR EACH ROW EXECUTE FUNCTION public.notify_new_incident();


--
-- Name: situational_reports trg_situational_report_alert; Type: TRIGGER; Schema: public; Owner: bfp_admin
--

CREATE TRIGGER trg_situational_report_alert AFTER INSERT ON public.situational_reports FOR EACH ROW EXECUTE FUNCTION public.notify_situational_update();


--
-- Name: deployment_assignments deployment_assignments_deployment_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: bfp_admin
--

ALTER TABLE ONLY public.deployment_assignments
    ADD CONSTRAINT deployment_assignments_deployment_id_fkey FOREIGN KEY (deployment_id) REFERENCES public.deployments(id) ON DELETE CASCADE;


--
-- Name: deployment_assignments deployment_assignments_fleet_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: bfp_admin
--

ALTER TABLE ONLY public.deployment_assignments
    ADD CONSTRAINT deployment_assignments_fleet_id_fkey FOREIGN KEY (fleet_id) REFERENCES public.fleets(id);


--
-- Name: duty_personnel duty_personnel_fleet_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: bfp_admin
--

ALTER TABLE ONLY public.duty_personnel
    ADD CONSTRAINT duty_personnel_fleet_id_fkey FOREIGN KEY (fleet_id) REFERENCES public.fleets(id) ON DELETE SET NULL;


--
-- Name: duty_personnel duty_personnel_station_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: bfp_admin
--

ALTER TABLE ONLY public.duty_personnel
    ADD CONSTRAINT duty_personnel_station_id_fkey FOREIGN KEY (station_id) REFERENCES public.stations(id) ON DELETE CASCADE;


--
-- Name: equipment_incident_logs equipment_incident_logs_equipment_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: bfp_admin
--

ALTER TABLE ONLY public.equipment_incident_logs
    ADD CONSTRAINT equipment_incident_logs_equipment_id_fkey FOREIGN KEY (equipment_id) REFERENCES public.logistical_equipment(id);


--
-- Name: equipment_incident_logs equipment_incident_logs_incident_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: bfp_admin
--

ALTER TABLE ONLY public.equipment_incident_logs
    ADD CONSTRAINT equipment_incident_logs_incident_id_fkey FOREIGN KEY (incident_id) REFERENCES public.fire_incidents(id) ON DELETE CASCADE;


--
-- Name: fire_incidents fire_incidents_reported_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: bfp_admin
--

ALTER TABLE ONLY public.fire_incidents
    ADD CONSTRAINT fire_incidents_reported_by_fkey FOREIGN KEY (reported_by) REFERENCES public.users(id);


--
-- Name: fleet_movement_logs fleet_movement_logs_dispatch_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: bfp_admin
--

ALTER TABLE ONLY public.fleet_movement_logs
    ADD CONSTRAINT fleet_movement_logs_dispatch_id_fkey FOREIGN KEY (dispatch_id) REFERENCES public.incident_dispatches(id) ON DELETE CASCADE;


--
-- Name: fleet_movement_logs fleet_movement_logs_fleet_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: bfp_admin
--

ALTER TABLE ONLY public.fleet_movement_logs
    ADD CONSTRAINT fleet_movement_logs_fleet_id_fkey FOREIGN KEY (fleet_id) REFERENCES public.fleets(id);


--
-- Name: fleets fleets_station_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: bfp_admin
--

ALTER TABLE ONLY public.fleets
    ADD CONSTRAINT fleets_station_id_fkey FOREIGN KEY (station_id) REFERENCES public.stations(id) ON DELETE SET NULL;


--
-- Name: fleets fleets_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: bfp_admin
--

ALTER TABLE ONLY public.fleets
    ADD CONSTRAINT fleets_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: hydrants hydrants_station_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: bfp_admin
--

ALTER TABLE ONLY public.hydrants
    ADD CONSTRAINT hydrants_station_id_fkey FOREIGN KEY (station_id) REFERENCES public.stations(id) ON DELETE CASCADE;


--
-- Name: incident_dispatches incident_dispatches_fleet_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: bfp_admin
--

ALTER TABLE ONLY public.incident_dispatches
    ADD CONSTRAINT incident_dispatches_fleet_id_fkey FOREIGN KEY (fleet_id) REFERENCES public.fleets(id);


--
-- Name: incident_dispatches incident_dispatches_incident_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: bfp_admin
--

ALTER TABLE ONLY public.incident_dispatches
    ADD CONSTRAINT incident_dispatches_incident_id_fkey FOREIGN KEY (incident_id) REFERENCES public.fire_incidents(id) ON DELETE CASCADE;


--
-- Name: logistical_equipment logistical_equipment_fleet_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: bfp_admin
--

ALTER TABLE ONLY public.logistical_equipment
    ADD CONSTRAINT logistical_equipment_fleet_id_fkey FOREIGN KEY (fleet_id) REFERENCES public.fleets(id) ON DELETE SET NULL;


--
-- Name: logistical_equipment logistical_equipment_station_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: bfp_admin
--

ALTER TABLE ONLY public.logistical_equipment
    ADD CONSTRAINT logistical_equipment_station_id_fkey FOREIGN KEY (station_id) REFERENCES public.stations(id) ON DELETE CASCADE;


--
-- Name: notifications notifications_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: bfp_admin
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: personnel_certifications personnel_certifications_certification_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: bfp_admin
--

ALTER TABLE ONLY public.personnel_certifications
    ADD CONSTRAINT personnel_certifications_certification_id_fkey FOREIGN KEY (certification_id) REFERENCES public.certifications(id) ON DELETE CASCADE;


--
-- Name: personnel_certifications personnel_certifications_personnel_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: bfp_admin
--

ALTER TABLE ONLY public.personnel_certifications
    ADD CONSTRAINT personnel_certifications_personnel_id_fkey FOREIGN KEY (personnel_id) REFERENCES public.duty_personnel(id) ON DELETE CASCADE;


--
-- Name: personnel_incident_logs personnel_incident_logs_incident_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: bfp_admin
--

ALTER TABLE ONLY public.personnel_incident_logs
    ADD CONSTRAINT personnel_incident_logs_incident_id_fkey FOREIGN KEY (incident_id) REFERENCES public.fire_incidents(id) ON DELETE CASCADE;


--
-- Name: personnel_incident_logs personnel_incident_logs_personnel_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: bfp_admin
--

ALTER TABLE ONLY public.personnel_incident_logs
    ADD CONSTRAINT personnel_incident_logs_personnel_id_fkey FOREIGN KEY (personnel_id) REFERENCES public.duty_personnel(id);


--
-- Name: situational_reports situational_reports_deployment_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: bfp_admin
--

ALTER TABLE ONLY public.situational_reports
    ADD CONSTRAINT situational_reports_deployment_id_fkey FOREIGN KEY (deployment_id) REFERENCES public.deployments(id) ON DELETE CASCADE;


--
-- Name: situational_reports situational_reports_incident_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: bfp_admin
--

ALTER TABLE ONLY public.situational_reports
    ADD CONSTRAINT situational_reports_incident_id_fkey FOREIGN KEY (incident_id) REFERENCES public.fire_incidents(id) ON DELETE CASCADE;


--
-- Name: situational_reports situational_reports_reporter_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: bfp_admin
--

ALTER TABLE ONLY public.situational_reports
    ADD CONSTRAINT situational_reports_reporter_id_fkey FOREIGN KEY (reporter_id) REFERENCES public.users(id);


--
-- Name: situational_reports situational_reports_team_leader_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: bfp_admin
--

ALTER TABLE ONLY public.situational_reports
    ADD CONSTRAINT situational_reports_team_leader_id_fkey FOREIGN KEY (team_leader_id) REFERENCES public.duty_personnel(id);


--
-- Name: users users_station_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: bfp_admin
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_station_id_fkey FOREIGN KEY (station_id) REFERENCES public.stations(id) ON DELETE SET NULL;


--
-- PostgreSQL database dump complete
--


