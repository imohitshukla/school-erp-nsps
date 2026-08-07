--
-- PostgreSQL database dump
--

\restrict fsuhhCWVehm1oPVEAFmuoSBcYsAApJ0LCdyeNBWqQXLDILIbzrvkr6BJsfmqJ9d

-- Dumped from database version 15.18
-- Dumped by pg_dump version 15.18

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

ALTER TABLE IF EXISTS ONLY public.users DROP CONSTRAINT IF EXISTS users_school_id_fkey;
ALTER TABLE IF EXISTS ONLY public.students DROP CONSTRAINT IF EXISTS students_school_id_fkey;
ALTER TABLE IF EXISTS ONLY public.marks DROP CONSTRAINT IF EXISTS marks_exam_id_fkey;
ALTER TABLE IF EXISTS ONLY public.fee_ledger DROP CONSTRAINT IF EXISTS fee_ledger_school_id_fkey;
ALTER TABLE IF EXISTS ONLY public.fee_ledger DROP CONSTRAINT IF EXISTS fee_ledger_fee_head_id_fkey;
ALTER TABLE IF EXISTS ONLY public.fee_heads DROP CONSTRAINT IF EXISTS fee_heads_school_id_fkey;
ALTER TABLE IF EXISTS ONLY public.exams DROP CONSTRAINT IF EXISTS exams_session_id_fkey;
ALTER TABLE IF EXISTS ONLY public.users DROP CONSTRAINT IF EXISTS users_username_key;
ALTER TABLE IF EXISTS ONLY public.users DROP CONSTRAINT IF EXISTS users_pkey;
ALTER TABLE IF EXISTS ONLY public.students DROP CONSTRAINT IF EXISTS students_school_adm_year_key;
ALTER TABLE IF EXISTS ONLY public.students DROP CONSTRAINT IF EXISTS students_pkey;
ALTER TABLE IF EXISTS ONLY public.sessions DROP CONSTRAINT IF EXISTS sessions_pkey;
ALTER TABLE IF EXISTS ONLY public.schools DROP CONSTRAINT IF EXISTS schools_subdomain_key;
ALTER TABLE IF EXISTS ONLY public.schools DROP CONSTRAINT IF EXISTS schools_pkey;
ALTER TABLE IF EXISTS ONLY public.marks DROP CONSTRAINT IF EXISTS marks_student_id_exam_id_key;
ALTER TABLE IF EXISTS ONLY public.marks DROP CONSTRAINT IF EXISTS marks_pkey;
ALTER TABLE IF EXISTS ONLY public.fee_ledger DROP CONSTRAINT IF EXISTS fee_ledger_receipt_no_key;
ALTER TABLE IF EXISTS ONLY public.fee_ledger DROP CONSTRAINT IF EXISTS fee_ledger_pkey;
ALTER TABLE IF EXISTS ONLY public.fee_heads DROP CONSTRAINT IF EXISTS fee_heads_pkey;
ALTER TABLE IF EXISTS ONLY public.exams DROP CONSTRAINT IF EXISTS exams_pkey;
ALTER TABLE IF EXISTS ONLY public.classes DROP CONSTRAINT IF EXISTS classes_pkey;
ALTER TABLE IF EXISTS public.students ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.schools ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.fee_ledger ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.fee_heads ALTER COLUMN id DROP DEFAULT;
DROP TABLE IF EXISTS public.users;
DROP SEQUENCE IF EXISTS public.students_id_seq;
DROP TABLE IF EXISTS public.students;
DROP TABLE IF EXISTS public.sessions;
DROP SEQUENCE IF EXISTS public.schools_id_seq;
DROP TABLE IF EXISTS public.schools;
DROP TABLE IF EXISTS public.marks;
DROP SEQUENCE IF EXISTS public.fee_ledger_id_seq;
DROP TABLE IF EXISTS public.fee_ledger;
DROP SEQUENCE IF EXISTS public.fee_heads_id_seq;
DROP TABLE IF EXISTS public.fee_heads;
DROP TABLE IF EXISTS public.exams;
DROP TABLE IF EXISTS public.classes;
DROP EXTENSION IF EXISTS pgcrypto;
--
-- Name: pgcrypto; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA public;


--
-- Name: EXTENSION pgcrypto; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION pgcrypto IS 'cryptographic functions';


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: classes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.classes (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name character varying(50) NOT NULL
);


--
-- Name: exams; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.exams (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    term character varying(50) NOT NULL,
    subject character varying(100) NOT NULL,
    max_marks numeric(5,2) NOT NULL,
    session_id uuid NOT NULL
);


--
-- Name: fee_heads; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.fee_heads (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    school_id integer
);


--
-- Name: fee_heads_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.fee_heads_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: fee_heads_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.fee_heads_id_seq OWNED BY public.fee_heads.id;


--
-- Name: fee_ledger; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.fee_ledger (
    id integer NOT NULL,
    receipt_no character varying(50) NOT NULL,
    student_id character varying(50) NOT NULL,
    amount numeric(10,2) NOT NULL,
    payment_mode character varying(50) NOT NULL,
    transaction_reference character varying(255),
    collected_by character varying(100),
    status character varying(50) DEFAULT 'Success'::character varying,
    notes text,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    school_id integer DEFAULT 1,
    fee_head_id integer,
    concession numeric(10,2) DEFAULT 0
);


--
-- Name: fee_ledger_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.fee_ledger_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: fee_ledger_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.fee_ledger_id_seq OWNED BY public.fee_ledger.id;


--
-- Name: marks; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.marks (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    student_id uuid NOT NULL,
    exam_id uuid NOT NULL,
    score numeric(5,2) NOT NULL
);


--
-- Name: schools; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.schools (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    subdomain character varying(100),
    contact_email character varying(255),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: schools_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.schools_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: schools_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.schools_id_seq OWNED BY public.schools.id;


--
-- Name: sessions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.sessions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name character varying(50) NOT NULL,
    start_date date NOT NULL,
    end_date date NOT NULL
);


--
-- Name: students; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.students (
    id integer NOT NULL,
    adm_no character varying(50) NOT NULL,
    name character varying(100) NOT NULL,
    class_name character varying(50) NOT NULL,
    payable_fee numeric(10,2) DEFAULT 0,
    paid_past numeric(10,2) DEFAULT 0,
    concession numeric(10,2) DEFAULT 0,
    academic_year character varying(20) DEFAULT '2026-2027'::character varying,
    transport_fee numeric(10,2) DEFAULT 0,
    school_id integer DEFAULT 1
);


--
-- Name: students_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.students_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: students_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.students_id_seq OWNED BY public.students.id;


--
-- Name: users; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.users (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    username character varying(100) NOT NULL,
    password_hash character varying(255) NOT NULL,
    role character varying(20) NOT NULL,
    status character varying(20) DEFAULT 'ACTIVE'::character varying,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    school_id integer DEFAULT 1,
    CONSTRAINT users_role_check CHECK (((role)::text = ANY ((ARRAY['SUPER_ADMIN'::character varying, 'TEACHER'::character varying, 'PARENT'::character varying, 'STUDENT'::character varying])::text[])))
);


--
-- Name: fee_heads id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fee_heads ALTER COLUMN id SET DEFAULT nextval('public.fee_heads_id_seq'::regclass);


--
-- Name: fee_ledger id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fee_ledger ALTER COLUMN id SET DEFAULT nextval('public.fee_ledger_id_seq'::regclass);


--
-- Name: schools id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.schools ALTER COLUMN id SET DEFAULT nextval('public.schools_id_seq'::regclass);


--
-- Name: students id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.students ALTER COLUMN id SET DEFAULT nextval('public.students_id_seq'::regclass);


--
-- Data for Name: classes; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.classes (id, name) FROM stdin;
\.


--
-- Data for Name: exams; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.exams (id, term, subject, max_marks, session_id) FROM stdin;
\.


--
-- Data for Name: fee_heads; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.fee_heads (id, name, school_id) FROM stdin;
1	General Fee	1
\.


--
-- Data for Name: fee_ledger; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.fee_ledger (id, receipt_no, student_id, amount, payment_mode, transaction_reference, collected_by, status, notes, created_at, school_id, fee_head_id, concession) FROM stdin;
2449	FEE-IMP-1786103210535-4511	332Ns	6000.00	Cash	\N	Admin	Success	Imported from CSV	2026-08-01 04:45:00+00	1	1	0.00
2450	FEE-IMP-1786103210583-3725	476Ns	6100.00	Cash	\N	Admin	Success	Imported from CSV	2026-08-02 06:00:00+00	1	1	0.00
2451	FEE-IMP-1786103210584-2530	475Ns	6100.00	Cash	\N	Admin	Success	Imported from CSV	2026-08-03 08:50:00+00	1	1	0.00
2452	FEE-IMP-1786103210585-1094	637Ns	4500.00	Cash	\N	Admin	Success	Imported from CSV	2026-08-07 03:18:00+00	1	1	7700.00
2453	3028	461Ns	9000.00	Cash	\N	Admin	Success	Imported from CSV	2026-04-01 03:46:00+00	5	1	0.00
2454	3029	35	5400.00	Cash	\N	Admin	Success	Imported from CSV	2026-04-02 04:39:00+00	5	1	0.00
2455	3030	611Ns	6100.00	Cash	\N	Admin	Success	Imported from CSV	2026-04-03 06:47:00+00	5	1	1000.00
2456	3031	248	5400.00	Cash	\N	Admin	Success	Imported from CSV	2026-04-03 07:03:00+00	5	1	0.00
2457	3032	510Ns	7100.00	Cash	\N	Admin	Success	Imported from CSV	2026-04-03 10:45:00+00	5	1	0.00
2458	3033	613	7700.00	Cash	\N	Admin	Success	Imported from CSV	2026-04-03 12:05:00+00	5	1	0.00
2459	3034	612	3800.00	Cash	\N	Admin	Success	Imported from CSV	2026-04-03 12:16:00+00	5	1	3900.00
2460	3035	614Ns	12300.00	Cash	\N	Admin	Success	Imported from CSV	2026-04-05 07:12:00+00	5	1	1000.00
2461	3036	615Ns	12300.00	Cash	\N	Admin	Success	Imported from CSV	2026-04-05 07:16:00+00	5	1	1000.00
2462	3037	616Ns	6800.00	Cash	\N	Admin	Success	Imported from CSV	2026-04-05 07:18:00+00	5	1	5300.00
2463	3038	617Ns	6500.00	Cash	\N	Admin	Success	Imported from CSV	2026-04-06 04:46:00+00	5	1	0.00
2464	3039	618Ns	6900.00	Cash	\N	Admin	Success	Imported from CSV	2026-04-06 06:34:00+00	5	1	500.00
2465	3040	619Ns	7400.00	Cash	\N	Admin	Success	Imported from CSV	2026-04-06 07:11:00+00	5	1	0.00
2466	3041	620Ns	15700.00	Cash	\N	Admin	Success	Imported from CSV	2026-04-06 07:20:00+00	5	1	0.00
2467	3042	621Ns	12100.00	Cash	\N	Admin	Success	Imported from CSV	2026-04-06 07:42:00+00	5	1	0.00
2468	3043	622Ns	12100.00	Cash	\N	Admin	Success	Imported from CSV	2026-04-06 07:44:00+00	5	1	0.00
2469	3044	509Ns	7700.00	Cash	\N	Admin	Success	Imported from CSV	2026-04-07 04:51:00+00	5	1	0.00
2470	3045	623Ns	4700.00	Cash	\N	Admin	Success	Imported from CSV	2026-04-07 06:33:00+00	5	1	500.00
2471	3046	624Ns	8900.00	Cash	\N	Admin	Success	Imported from CSV	2026-04-07 06:54:00+00	5	1	0.00
2472	3047	243Ns	1400.00	Cash	\N	Admin	Success	Imported from CSV	2026-04-07 11:12:00+00	5	1	0.00
2473	3048	474Ns	700.00	Cash	\N	Admin	Success	Imported from CSV	2026-04-07 11:14:00+00	5	1	0.00
2474	3049	627Ns	7100.00	Cash	\N	Admin	Success	Imported from CSV	2026-04-08 07:09:00+00	5	1	0.00
2475	3050	628Ns	2000.00	Cash	\N	Admin	Success	Imported from CSV	2026-04-09 06:18:00+00	5	1	0.00
2476	3051	629Ns	7600.00	Cash	\N	Admin	Success	Imported from CSV	2026-04-09 07:41:00+00	5	1	100.00
2477	3052	630Ns	7400.00	Cash	\N	Admin	Success	Imported from CSV	2026-04-09 07:53:00+00	5	1	0.00
2478	3053	631Ns	6800.00	Cash	\N	Admin	Success	Imported from CSV	2026-04-10 05:22:00+00	5	1	1500.00
2479	3054	632Ns	6800.00	Cash	\N	Admin	Success	Imported from CSV	2026-04-10 05:27:00+00	5	1	1500.00
2480	3055	633Ns	7800.00	Cash	\N	Admin	Success	Imported from CSV	2026-04-10 06:29:00+00	5	1	800.00
2481	3056	634Ns	7200.00	Cash	\N	Admin	Success	Imported from CSV	2026-04-10 07:21:00+00	5	1	500.00
2482	3057	635Ns	6900.00	Cash	\N	Admin	Success	Imported from CSV	2026-04-10 07:27:00+00	5	1	500.00
2483	3058	636Ns	7200.00	Cash	\N	Admin	Success	Imported from CSV	2026-04-11 07:57:00+00	5	1	1000.00
2484	3059	546Ns	900.00	Cash	\N	Admin	Success	Imported from CSV	2026-04-13 03:17:00+00	5	1	0.00
2485	3060	545Ns	3200.00	Cash	\N	Admin	Success	Imported from CSV	2026-04-13 03:22:00+00	5	1	0.00
2486	3061	639Ns	9000.00	Cash	\N	Admin	Success	Imported from CSV	2026-04-13 08:06:00+00	5	1	500.00
2487	3062	640Ns	9000.00	Cash	\N	Admin	Success	Imported from CSV	2026-04-13 08:07:00+00	5	1	500.00
2488	3063	641Ns	2000.00	Cash	\N	Admin	Success	Imported from CSV	2026-04-13 09:02:00+00	5	1	0.00
2489	3064	642Ns	500.00	Cash	\N	Admin	Success	Imported from CSV	2026-04-14 06:07:00+00	5	1	0.00
2490	3065	643Ns	3000.00	Cash	\N	Admin	Success	Imported from CSV	2026-04-15 04:09:00+00	5	1	0.00
2491	3066	548Ns	2200.00	Cash	\N	Admin	Success	Imported from CSV	2026-04-15 05:49:00+00	5	1	0.00
2492	3067	383Ns	3800.00	Cash	\N	Admin	Success	Imported from CSV	2026-04-15 05:59:00+00	5	1	1600.00
2493	3068	382Ns	3800.00	Cash	\N	Admin	Success	Imported from CSV	2026-04-15 06:02:00+00	5	1	1600.00
2494	3069	384Ns	1100.00	Cash	\N	Admin	Success	Imported from CSV	2026-04-15 06:03:00+00	5	1	3600.00
2495	3070	644Ns	2000.00	Cash	\N	Admin	Success	Imported from CSV	2026-04-16 07:16:00+00	5	1	1000.00
2496	3071	463Ns	2000.00	Cash	\N	Admin	Success	Imported from CSV	2026-04-18 04:56:00+00	5	1	100.00
2497	3072	464Ns	2000.00	Cash	\N	Admin	Success	Imported from CSV	2026-04-18 04:57:00+00	5	1	100.00
2498	3073	364Ns	12000.00	Cash	\N	Admin	Success	Imported from CSV	2026-04-18 04:58:00+00	5	1	0.00
2499	3074	645Ns	1000.00	Cash	\N	Admin	Success	Imported from CSV	2026-04-18 06:16:00+00	5	1	0.00
2500	3075	523Ns	3000.00	Cash	\N	Admin	Success	Imported from CSV	2026-04-20 03:22:00+00	5	1	0.00
2501	3076	331Ns	3300.00	Cash	\N	Admin	Success	Imported from CSV	2026-04-21 04:44:00+00	5	1	0.00
2502	3077	594Ns	5200.00	Cash	\N	Admin	Success	Imported from CSV	2026-04-21 05:10:00+00	5	1	0.00
2503	3078	73	3000.00	Cash	\N	Admin	Success	Imported from CSV	2026-04-21 05:10:00+00	5	1	0.00
2504	3079	153Ns	4600.00	Cash	\N	Admin	Success	Imported from CSV	2026-04-21 05:11:00+00	5	1	0.00
2505	3080	367Ns	1300.00	Cash	\N	Admin	Success	Imported from CSV	2026-04-21 06:37:00+00	5	1	100.00
2506	3081	647Ns	9300.00	Cash	\N	Admin	Success	Imported from CSV	2026-04-23 05:26:00+00	5	1	0.00
2507	3082	646Ns	6300.00	Cash	\N	Admin	Success	Imported from CSV	2026-04-23 05:27:00+00	5	1	0.00
2508	3083	648Ns	9300.00	Cash	\N	Admin	Success	Imported from CSV	2026-04-23 05:28:00+00	5	1	0.00
2509	3084	Nsps2026	9800.00	Cash	\N	Admin	Success	Imported from CSV	2026-04-23 06:04:00+00	5	1	0.00
2510	3085	303Ns	5000.00	Cash	\N	Admin	Success	Imported from CSV	2026-04-24 06:27:00+00	5	1	0.00
2511	3086	650Ns	8900.00	Cash	\N	Admin	Success	Imported from CSV	2026-04-24 07:43:00+00	5	1	0.00
2512	3087	652Ns	7200.00	Cash	\N	Admin	Success	Imported from CSV	2026-04-28 06:05:00+00	5	1	1300.00
2513	3088	649Ns	4000.00	Cash	\N	Admin	Success	Imported from CSV	2026-04-28 07:23:00+00	5	1	0.00
2514	3089	569Ns	700.00	Cash	\N	Admin	Success	Imported from CSV	2026-05-01 07:43:00+00	5	1	0.00
2515	3090	508Ns	1850.00	Cash	\N	Admin	Success	Imported from CSV	2026-05-02 06:05:00+00	5	1	0.00
2516	3091	529Ns	7000.00	Cash	\N	Admin	Success	Imported from CSV	2026-05-04 04:02:00+00	5	1	0.00
2517	3092	654Ns	20000.00	Cash	\N	Admin	Success	Imported from CSV	2026-05-04 06:44:00+00	5	1	500.00
2518	3093	463Ns	1700.00	Cash	\N	Admin	Success	Imported from CSV	2026-05-05 04:48:00+00	5	1	0.00
2519	3094	463Ns	1500.00	Cash	\N	Admin	Success	Imported from CSV	2026-05-05 04:48:00+00	5	1	0.00
2520	3095	332Ns	2100.00	Cash	\N	Admin	Success	Imported from CSV	2026-05-05 05:12:00+00	5	1	0.00
2521	3096	333Ns	2000.00	Cash	\N	Admin	Success	Imported from CSV	2026-05-05 05:18:00+00	5	1	0.00
2522	3097	368Ns	1200.00	Cash	\N	Admin	Success	Imported from CSV	2026-05-05 05:20:00+00	5	1	0.00
2523	3098	597Ns	6800.00	Cash	\N	Admin	Success	Imported from CSV	2026-05-06 02:41:00+00	5	1	0.00
2524	3099	41	2600.00	Cash	\N	Admin	Success	Imported from CSV	2026-05-06 05:08:00+00	5	1	0.00
2525	3100	42	2600.00	Cash	\N	Admin	Success	Imported from CSV	2026-05-06 05:08:00+00	5	1	0.00
2526	3101	41	2400.00	Cash	\N	Admin	Success	Imported from CSV	2026-05-06 05:10:00+00	5	1	0.00
2527	3102	00nsps2	11200.00	Cash	\N	Admin	Success	Imported from CSV	2026-05-07 06:26:00+00	5	1	0.00
2528	3103	367Ns	1300.00	Cash	\N	Admin	Success	Imported from CSV	2026-05-07 16:39:00+00	5	1	0.00
2529	3104	228Ns	10200.00	Cash	\N	Admin	Success	Imported from CSV	2026-05-09 04:01:00+00	5	1	0.00
2530	3105	434Ns	6400.00	Cash	\N	Admin	Success	Imported from CSV	2026-05-09 04:01:00+00	5	1	0.00
2531	3106	555Ns	4200.00	Cash	\N	Admin	Success	Imported from CSV	2026-05-09 04:06:00+00	5	1	0.00
2532	3107	556Ns	4700.00	Cash	\N	Admin	Success	Imported from CSV	2026-05-09 04:07:00+00	5	1	0.00
2533	3108	228Ns	6500.00	Cash	\N	Admin	Success	Imported from CSV	2026-05-09 04:27:00+00	5	1	0.00
2534	3109	303Ns	2300.00	Cash	\N	Admin	Success	Imported from CSV	2026-05-09 04:28:00+00	5	1	100.00
2535	3110	659Ns	8500.00	Cash	\N	Admin	Success	Imported from CSV	2026-05-09 07:27:00+00	5	1	0.00
2536	3111	660Ns	8800.00	Cash	\N	Admin	Success	Imported from CSV	2026-05-09 07:31:00+00	5	1	0.00
2537	3112	388Ns	10100.00	Cash	\N	Admin	Success	Imported from CSV	2026-05-09 09:29:00+00	5	1	0.00
2538	3113	442Ns	5600.00	Cash	\N	Admin	Success	Imported from CSV	2026-05-09 09:30:00+00	5	1	0.00
2539	3114	642Ns	8700.00	Cash	\N	Admin	Success	Imported from CSV	2026-05-09 09:53:00+00	5	1	0.00
2540	3115	580Ns	4300.00	Cash	\N	Admin	Success	Imported from CSV	2026-05-11 04:21:00+00	5	1	1000.00
2541	3116	579Ns	2700.00	Cash	\N	Admin	Success	Imported from CSV	2026-05-11 04:22:00+00	5	1	300.00
2542	3117	661Ns	6200.00	Cash	\N	Admin	Success	Imported from CSV	2026-05-11 04:38:00+00	5	1	0.00
2543	3118	127Ns	5200.00	Cash	\N	Admin	Success	Imported from CSV	2026-05-13 04:08:00+00	5	1	0.00
2544	3119	430Ns	3500.00	Cash	\N	Admin	Success	Imported from CSV	2026-05-13 04:10:00+00	5	1	0.00
2545	3120	604Ns	1200.00	Cash	\N	Admin	Success	Imported from CSV	2026-05-13 04:12:00+00	5	1	0.00
2546	3121	662Ns	2000.00	Cash	\N	Admin	Success	Imported from CSV	2026-05-15 05:33:00+00	5	1	0.00
2547	3122	663Ns	2000.00	Cash	\N	Admin	Success	Imported from CSV	2026-05-15 05:35:00+00	5	1	0.00
2548	3123	664Ns	5000.00	Cash	\N	Admin	Success	Imported from CSV	2026-05-16 07:23:00+00	5	1	0.00
2549	3124	665Ns	4100.00	Cash	\N	Admin	Success	Imported from CSV	2026-05-18 05:03:00+00	5	1	0.00
2550	3125	666Ns	5900.00	Cash	\N	Admin	Success	Imported from CSV	2026-05-18 05:44:00+00	5	1	0.00
2551	3126	667Ns	5900.00	Cash	\N	Admin	Success	Imported from CSV	2026-05-18 05:47:00+00	5	1	0.00
2552	3127	27	5000.00	Cash	\N	Admin	Success	Imported from CSV	2026-05-21 03:34:00+00	5	1	0.00
2553	3128	536Ns	4400.00	Cash	\N	Admin	Success	Imported from CSV	2026-05-26 03:05:00+00	5	1	0.00
2554	3129	414Ns	8800.00	Cash	\N	Admin	Success	Imported from CSV	2026-05-26 03:07:00+00	5	1	0.00
2555	3130	591Ns	1800.00	Cash	\N	Admin	Success	Imported from CSV	2026-06-02 08:21:00+00	5	1	0.00
2556	3131	669Ns	5600.00	Cash	\N	Admin	Success	Imported from CSV	2026-06-12 06:21:00+00	5	1	0.00
2557	3132	668Ns	5900.00	Cash	\N	Admin	Success	Imported from CSV	2026-06-12 06:23:00+00	5	1	0.00
2558	3133	670Ns	5900.00	Cash	\N	Admin	Success	Imported from CSV	2026-06-13 05:02:00+00	5	1	0.00
2559	3134	671Ns	6700.00	Cash	\N	Admin	Success	Imported from CSV	2026-06-13 05:16:00+00	5	1	0.00
2560	3135	463Ns	850.00	Cash	\N	Admin	Success	Imported from CSV	2026-06-15 12:31:00+00	5	1	0.00
2561	3136	464Ns	1800.00	Cash	\N	Admin	Success	Imported from CSV	2026-06-15 12:32:00+00	5	1	0.00
2562	3137	444Ns	4100.00	Cash	\N	Admin	Success	Imported from CSV	2026-06-18 09:59:00+00	5	1	0.00
2563	3138	443Ns	4100.00	Cash	\N	Admin	Success	Imported from CSV	2026-06-18 10:00:00+00	5	1	0.00
2564	3139	664Ns	3900.00	Cash	\N	Admin	Success	Imported from CSV	2026-06-22 05:42:00+00	5	1	1000.00
2565	3140	672Ns	5100.00	Cash	\N	Admin	Success	Imported from CSV	2026-06-22 05:48:00+00	5	1	800.00
2566	3141	665Ns	1800.00	Cash	\N	Admin	Success	Imported from CSV	2026-06-23 03:49:00+00	5	1	0.00
2567	3142	673Ns	3000.00	Cash	\N	Admin	Success	Imported from CSV	2026-06-26 06:37:00+00	5	1	0.00
2568	3143	674Ns	3000.00	Cash	\N	Admin	Success	Imported from CSV	2026-06-26 06:43:00+00	5	1	500.00
2569	3144	675Ns	3200.00	Cash	\N	Admin	Success	Imported from CSV	2026-06-26 06:52:00+00	5	1	0.00
2570	3145	676Ns	4600.00	Cash	\N	Admin	Success	Imported from CSV	2026-06-27 05:33:00+00	5	1	0.00
2571	3146	676Ns	2400.00	Cash	\N	Admin	Success	Imported from CSV	2026-06-27 05:52:00+00	5	1	0.00
2572	3147	405Ns	2600.00	Cash	\N	Admin	Success	Imported from CSV	2026-06-28 13:56:00+00	5	1	0.00
2573	3148	405Ns	5900.00	Cash	\N	Admin	Success	Imported from CSV	2026-06-28 14:01:00+00	5	1	1600.00
2574	3149	677Ns	2000.00	Cash	\N	Admin	Success	Imported from CSV	2026-06-29 05:47:00+00	5	1	1500.00
2575	3150	678Ns	2000.00	Cash	\N	Admin	Success	Imported from CSV	2026-06-29 05:51:00+00	5	1	1500.00
2576	3151	679Ns	5900.00	Cash	\N	Admin	Success	Imported from CSV	2026-06-30 07:29:00+00	5	1	0.00
2577	3152	683Ns	5900.00	Cash	\N	Admin	Success	Imported from CSV	2026-07-01 04:00:00+00	5	1	0.00
2578	3153	684Ns	11800.00	Cash	\N	Admin	Success	Imported from CSV	2026-07-01 05:49:00+00	5	1	0.00
2579	3154	685Ns	8900.00	Cash	\N	Admin	Success	Imported from CSV	2026-07-01 07:18:00+00	5	1	0.00
2580	3155	138Ns	8000.00	Cash	\N	Admin	Success	Imported from CSV	2026-07-01 11:23:00+00	5	1	500.00
2581	3156	576Ns	9700.00	Cash	\N	Admin	Success	Imported from CSV	2026-07-02 03:08:00+00	5	1	0.00
2582	3157	686Ns	3200.00	Cash	\N	Admin	Success	Imported from CSV	2026-07-02 04:21:00+00	5	1	0.00
2583	3158	688Ns	6000.00	Cash	\N	Admin	Success	Imported from CSV	2026-07-02 06:58:00+00	5	1	1400.00
2584	3159	496Ns	6100.00	Cash	\N	Admin	Success	Imported from CSV	2026-07-02 06:59:00+00	5	1	1400.00
2585	3160	497Ns	6100.00	Cash	\N	Admin	Success	Imported from CSV	2026-07-02 07:00:00+00	5	1	1400.00
2586	3161	690Ns	4500.00	Cash	\N	Admin	Success	Imported from CSV	2026-07-02 08:26:00+00	5	1	0.00
2587	3162	691Ns	6700.00	Cash	\N	Admin	Success	Imported from CSV	2026-07-02 08:56:00+00	5	1	0.00
2588	3163	271Ns	4000.00	Cash	\N	Admin	Success	Imported from CSV	2026-07-02 13:25:00+00	5	1	3100.00
2589	3164	272Ns	4000.00	Cash	\N	Admin	Success	Imported from CSV	2026-07-02 13:30:00+00	5	1	0.00
2590	3165	692Ns	4200.00	Cash	\N	Admin	Success	Imported from CSV	2026-07-03 05:38:00+00	5	1	0.00
2591	3166	694Ns	1000.00	Cash	\N	Admin	Success	Imported from CSV	2026-07-03 06:30:00+00	5	1	0.00
2592	3167	303Ns	4600.00	Cash	\N	Admin	Success	Imported from CSV	2026-07-03 07:37:00+00	5	1	800.00
2593	3168	686Ns	4000.00	Cash	\N	Admin	Success	Imported from CSV	2026-07-03 07:40:00+00	5	1	0.00
2594	3169	658Ns	5600.00	Cash	\N	Admin	Success	Imported from CSV	2026-07-03 07:47:00+00	5	1	0.00
2595	3170	658Ns	7100.00	Cash	\N	Admin	Success	Imported from CSV	2026-07-03 08:03:00+00	5	1	0.00
2596	3171	696Ns	5000.00	Cash	\N	Admin	Success	Imported from CSV	2026-07-03 09:01:00+00	5	1	1000.00
2597	3172	695Ns	400.00	Cash	\N	Admin	Success	Imported from CSV	2026-07-03 09:03:00+00	5	1	0.00
2598	3173	244Ns	5100.00	Cash	\N	Admin	Success	Imported from CSV	2026-07-03 09:12:00+00	5	1	0.00
2599	3174	492Ns	4800.00	Cash	\N	Admin	Success	Imported from CSV	2026-07-03 09:17:00+00	5	1	0.00
2600	3175	493Ns	2600.00	Cash	\N	Admin	Success	Imported from CSV	2026-07-03 09:19:00+00	5	1	2400.00
2601	3176	259Ns	2300.00	Cash	\N	Admin	Success	Imported from CSV	2026-07-04 03:16:00+00	5	1	0.00
2602	3177	259Ns	1800.00	Cash	\N	Admin	Success	Imported from CSV	2026-07-04 03:33:00+00	5	1	3000.00
2603	3178	681Ns	6400.00	Cash	\N	Admin	Success	Imported from CSV	2026-07-04 05:37:00+00	5	1	0.00
2604	3180	699Ns	3500.00	Cash	\N	Admin	Success	Imported from CSV	2026-07-04 06:19:00+00	5	1	0.00
2605	3181	639Ns	6800.00	Cash	\N	Admin	Success	Imported from CSV	2026-07-04 06:55:00+00	5	1	0.00
2606	3182	640Ns	6800.00	Cash	\N	Admin	Success	Imported from CSV	2026-07-04 07:02:00+00	5	1	0.00
2607	3183	701Ns	4500.00	Cash	\N	Admin	Success	Imported from CSV	2026-07-05 07:01:00+00	5	1	0.00
2608	3184	700Ns	4500.00	Cash	\N	Admin	Success	Imported from CSV	2026-07-05 07:02:00+00	5	1	0.00
2609	3185	393Ns	2400.00	Cash	\N	Admin	Success	Imported from CSV	2026-07-06 03:42:00+00	5	1	0.00
2610	3186	702Ns	5600.00	Cash	\N	Admin	Success	Imported from CSV	2026-07-06 04:37:00+00	5	1	0.00
2611	3187	691Ns	2200.00	Cash	\N	Admin	Success	Imported from CSV	2026-07-06 04:51:00+00	5	1	0.00
2612	3188	657Ns	3500.00	Cash	\N	Admin	Success	Imported from CSV	2026-07-06 04:52:00+00	5	1	0.00
2613	3189	232	7100.00	Cash	\N	Admin	Success	Imported from CSV	2026-07-06 05:29:00+00	5	1	800.00
2614	3190	412Ns	7100.00	Cash	\N	Admin	Success	Imported from CSV	2026-07-06 05:45:00+00	5	1	800.00
2615	3191	703Ns	7700.00	Cash	\N	Admin	Success	Imported from CSV	2026-07-06 05:57:00+00	5	1	0.00
2616	3192	104	5800.00	Cash	\N	Admin	Success	Imported from CSV	2026-07-06 06:03:00+00	5	1	0.00
2617	3193	103	4800.00	Cash	\N	Admin	Success	Imported from CSV	2026-07-06 06:03:00+00	5	1	0.00
2618	3195	704Ns	4000.00	Cash	\N	Admin	Success	Imported from CSV	2026-07-06 07:20:00+00	5	1	0.00
2619	3196	224Ns	6500.00	Cash	\N	Admin	Success	Imported from CSV	2026-07-06 07:27:00+00	5	1	600.00
2620	3197	225Ns	6500.00	Cash	\N	Admin	Success	Imported from CSV	2026-07-06 07:28:00+00	5	1	600.00
2621	3198	491Ns	9600.00	Cash	\N	Admin	Success	Imported from CSV	2026-07-06 08:02:00+00	5	1	0.00
2622	3199	155Ns	5000.00	Cash	\N	Admin	Success	Imported from CSV	2026-07-06 08:09:00+00	5	1	0.00
2623	3200	707Ns	3200.00	Cash	\N	Admin	Success	Imported from CSV	2026-07-06 09:14:00+00	5	1	0.00
2624	3201	706Ns	3600.00	Cash	\N	Admin	Success	Imported from CSV	2026-07-06 09:15:00+00	5	1	500.00
2625	3202	705Ns	3500.00	Cash	\N	Admin	Success	Imported from CSV	2026-07-06 09:16:00+00	5	1	2000.00
2626	3203	704Ns	2700.00	Cash	\N	Admin	Success	Imported from CSV	2026-07-06 12:02:00+00	5	1	0.00
2627	3204	464Ns	1650.00	Cash	\N	Admin	Success	Imported from CSV	2026-07-07 06:52:00+00	5	1	0.00
2628	3205	464Ns	2150.00	Cash	\N	Admin	Success	Imported from CSV	2026-07-07 06:54:00+00	5	1	0.00
2629	3206	463Ns	2350.00	Cash	\N	Admin	Success	Imported from CSV	2026-07-07 06:54:00+00	5	1	0.00
2630	3207	132Ns	5000.00	Cash	\N	Admin	Success	Imported from CSV	2026-07-07 07:09:00+00	5	1	0.00
2631	3208	392Ns	3400.00	Cash	\N	Admin	Success	Imported from CSV	2026-07-07 07:10:00+00	5	1	0.00
2632	3209	391Ns	2600.00	Cash	\N	Admin	Success	Imported from CSV	2026-07-07 07:10:00+00	5	1	0.00
2633	3210	585Ns	1900.00	Cash	\N	Admin	Success	Imported from CSV	2026-07-08 02:39:00+00	5	1	0.00
2634	3211	585Ns	6200.00	Cash	\N	Admin	Success	Imported from CSV	2026-07-08 02:39:00+00	5	1	0.00
2635	3212	586Ns	6800.00	Cash	\N	Admin	Success	Imported from CSV	2026-07-08 02:40:00+00	5	1	700.00
2636	3213	00046	19200.00	Cash	\N	Admin	Success	Imported from CSV	2026-07-08 04:01:00+00	5	1	0.00
2637	3214	34	13400.00	Cash	\N	Admin	Success	Imported from CSV	2026-07-08 04:11:00+00	5	1	600.00
2638	3215	33	11500.00	Cash	\N	Admin	Success	Imported from CSV	2026-07-08 04:12:00+00	5	1	0.00
2639	3216	603Ns	8000.00	Cash	\N	Admin	Success	Imported from CSV	2026-07-08 04:16:00+00	5	1	0.00
2640	3217	72	8000.00	Cash	\N	Admin	Success	Imported from CSV	2026-07-08 04:19:00+00	5	1	0.00
2641	3218	708Ns	4300.00	Cash	\N	Admin	Success	Imported from CSV	2026-07-08 06:26:00+00	5	1	0.00
2642	3219	709Ns	2000.00	Cash	\N	Admin	Success	Imported from CSV	2026-07-08 07:05:00+00	5	1	1000.00
2643	3220	710Ns	2000.00	Cash	\N	Admin	Success	Imported from CSV	2026-07-08 08:50:00+00	5	1	1000.00
2644	3221	409Ns	7500.00	Cash	\N	Admin	Success	Imported from CSV	2026-07-08 08:55:00+00	5	1	0.00
2645	3222	711Ns	6200.00	Cash	\N	Admin	Success	Imported from CSV	2026-07-08 10:04:00+00	5	1	500.00
2646	3223	712Ns	5400.00	Cash	\N	Admin	Success	Imported from CSV	2026-07-08 10:04:00+00	5	1	500.00
2647	3224	713Ns	5400.00	Cash	\N	Admin	Success	Imported from CSV	2026-07-08 10:05:00+00	5	1	500.00
2648	3225	714Ns	5100.00	Cash	\N	Admin	Success	Imported from CSV	2026-07-08 10:06:00+00	5	1	500.00
2649	3227	715Ns	10300.00	Cash	\N	Admin	Success	Imported from CSV	2026-07-09 03:01:00+00	5	1	0.00
2650	3228	516Ns	11200.00	Cash	\N	Admin	Success	Imported from CSV	2026-07-09 03:15:00+00	5	1	700.00
2651	3229	515Ns	10100.00	Cash	\N	Admin	Success	Imported from CSV	2026-07-09 03:16:00+00	5	1	700.00
2652	3230	205Ns	12000.00	Cash	\N	Admin	Success	Imported from CSV	2026-07-09 03:31:00+00	5	1	0.00
2653	3231	716Ns	5600.00	Cash	\N	Admin	Success	Imported from CSV	2026-07-09 04:04:00+00	5	1	0.00
2654	3232	608Ns	7100.00	Cash	\N	Admin	Success	Imported from CSV	2026-07-09 05:38:00+00	5	1	0.00
2655	3233	545Ns	7000.00	Cash	\N	Admin	Success	Imported from CSV	2026-07-09 05:57:00+00	5	1	0.00
2656	3234	546Ns	9400.00	Cash	\N	Admin	Success	Imported from CSV	2026-07-09 05:58:00+00	5	1	0.00
2657	3235	719Ns	11000.00	Cash	\N	Admin	Success	Imported from CSV	2026-07-09 06:14:00+00	5	1	0.00
2658	3236	697Ns	5000.00	Cash	\N	Admin	Success	Imported from CSV	2026-07-09 06:35:00+00	5	1	0.00
2659	3237	720Ns	500.00	Cash	\N	Admin	Success	Imported from CSV	2026-07-09 06:46:00+00	5	1	0.00
2660	3238	721Ns	2000.00	Cash	\N	Admin	Success	Imported from CSV	2026-07-09 07:11:00+00	5	1	0.00
2661	3239	00/2/07/26	1500.00	Cash	\N	Admin	Success	Imported from CSV	2026-07-09 08:25:00+00	5	1	0.00
2662	3240	724Ns	8300.00	Cash	\N	Admin	Success	Imported from CSV	2026-07-09 09:01:00+00	5	1	0.00
2663	3241	725Ns	6900.00	Cash	\N	Admin	Success	Imported from CSV	2026-07-09 09:02:00+00	5	1	0.00
2664	3242	726Ns	2200.00	Cash	\N	Admin	Success	Imported from CSV	2026-07-10 03:30:00+00	5	1	0.00
2665	3243	226Ns	7500.00	Cash	\N	Admin	Success	Imported from CSV	2026-07-10 04:12:00+00	5	1	0.00
2666	3244	227Ns	7100.00	Cash	\N	Admin	Success	Imported from CSV	2026-07-10 04:13:00+00	5	1	0.00
2667	3245	00/10/26	7700.00	Cash	\N	Admin	Success	Imported from CSV	2026-07-10 05:27:00+00	5	1	0.00
2668	3246	728Ns	3100.00	Cash	\N	Admin	Success	Imported from CSV	2026-07-11 03:14:00+00	5	1	800.00
2669	3247	730Ns	6700.00	Cash	\N	Admin	Success	Imported from CSV	2026-07-11 06:01:00+00	5	1	0.00
2670	3248	729Ns	6700.00	Cash	\N	Admin	Success	Imported from CSV	2026-07-11 06:02:00+00	5	1	0.00
2671	3249	731Ns	2000.00	Cash	\N	Admin	Success	Imported from CSV	2026-07-11 06:15:00+00	5	1	1000.00
2672	3250	732Ns	4000.00	Cash	\N	Admin	Success	Imported from CSV	2026-07-11 06:51:00+00	5	1	500.00
2673	3252	733Ns	10400.00	Cash	\N	Admin	Success	Imported from CSV	2026-07-11 06:58:00+00	5	1	0.00
2674	3253	734Ns	5100.00	Cash	\N	Admin	Success	Imported from CSV	2026-07-11 07:17:00+00	5	1	500.00
2675	3254	678Ns	5500.00	Cash	\N	Admin	Success	Imported from CSV	2026-07-11 07:19:00+00	5	1	0.00
2676	3255	677Ns	5000.00	Cash	\N	Admin	Success	Imported from CSV	2026-07-11 07:21:00+00	5	1	0.00
2677	3256	50TNs	2000.00	Cash	\N	Admin	Success	Imported from CSV	2026-07-11 07:26:00+00	5	1	0.00
2678	3257	633Ns	5300.00	Cash	\N	Admin	Success	Imported from CSV	2026-07-13 02:52:00+00	5	1	0.00
2679	3259	618Ns	8100.00	Cash	\N	Admin	Success	Imported from CSV	2026-07-13 03:15:00+00	5	1	1400.00
2680	3260	735Ns	7800.00	Cash	\N	Admin	Success	Imported from CSV	2026-07-13 03:53:00+00	5	1	0.00
2681	3261	732Ns	7000.00	Cash	\N	Admin	Success	Imported from CSV	2026-07-13 04:48:00+00	5	1	0.00
2682	3262	509Ns	7400.00	Cash	\N	Admin	Success	Imported from CSV	2026-07-13 06:28:00+00	5	1	0.00
2683	3263	726Ns	5800.00	Cash	\N	Admin	Success	Imported from CSV	2026-07-13 07:28:00+00	5	1	0.00
2684	3264	721Ns	11800.00	Cash	\N	Admin	Success	Imported from CSV	2026-07-13 07:33:00+00	5	1	0.00
2685	3265	737Ns	8700.00	Cash	\N	Admin	Success	Imported from CSV	2026-07-13 07:36:00+00	5	1	0.00
2686	3268	739Ns	4500.00	Cash	\N	Admin	Success	Imported from CSV	2026-07-14 04:44:00+00	5	1	0.00
2687	3269	740Ns	5900.00	Cash	\N	Admin	Success	Imported from CSV	2026-07-14 04:56:00+00	5	1	0.00
2688	3270	741Ns	5600.00	Cash	\N	Admin	Success	Imported from CSV	2026-07-14 05:06:00+00	5	1	0.00
2689	3271	371Ns	8500.00	Cash	\N	Admin	Success	Imported from CSV	2026-07-14 05:30:00+00	5	1	500.00
2690	3272	372Ns	7700.00	Cash	\N	Admin	Success	Imported from CSV	2026-07-14 05:31:00+00	5	1	400.00
2691	3273	373Ns	3800.00	Cash	\N	Admin	Success	Imported from CSV	2026-07-14 05:33:00+00	5	1	2400.00
2692	3274	617Ns	3200.00	Cash	\N	Admin	Success	Imported from CSV	2026-07-14 05:44:00+00	5	1	0.00
2693	3275	742Ns	11200.00	Cash	\N	Admin	Success	Imported from CSV	2026-07-14 06:15:00+00	5	1	0.00
2694	3276	744Ns	6700.00	Cash	\N	Admin	Success	Imported from CSV	2026-07-14 06:47:00+00	5	1	0.00
2695	3277	743Ns	15200.00	Cash	\N	Admin	Success	Imported from CSV	2026-07-14 06:49:00+00	5	1	0.00
2696	3278	745Ns	1000.00	Cash	\N	Admin	Success	Imported from CSV	2026-07-14 07:09:00+00	5	1	1000.00
2697	3279	746Ns	6500.00	Cash	\N	Admin	Success	Imported from CSV	2026-07-14 07:37:00+00	5	1	0.00
2698	3281	641Ns	10000.00	Cash	\N	Admin	Success	Imported from CSV	2026-07-16 05:58:00+00	5	1	1900.00
2699	3282	747Ns	9800.00	Cash	\N	Admin	Success	Imported from CSV	2026-07-16 06:41:00+00	5	1	0.00
2700	3283	366Ns	15300.00	Cash	\N	Admin	Success	Imported from CSV	2026-07-16 06:44:00+00	5	1	0.00
2701	3284	365Ns	15300.00	Cash	\N	Admin	Success	Imported from CSV	2026-07-16 06:45:00+00	5	1	0.00
2702	3285	364Ns	2800.00	Cash	\N	Admin	Success	Imported from CSV	2026-07-16 06:46:00+00	5	1	0.00
2703	3286	292Ns	3200.00	Cash	\N	Admin	Success	Imported from CSV	2026-07-16 06:47:00+00	5	1	0.00
2704	3287	643Ns	10000.00	Cash	\N	Admin	Success	Imported from CSV	2026-07-16 06:48:00+00	5	1	0.00
2705	3288	659Ns	2000.00	Cash	\N	Admin	Success	Imported from CSV	2026-07-16 06:50:00+00	5	1	0.00
2706	3289	660Ns	2100.00	Cash	\N	Admin	Success	Imported from CSV	2026-07-16 06:50:00+00	5	1	0.00
2707	3292	157Ns	10000.00	Cash	\N	Admin	Success	Imported from CSV	2026-07-16 06:57:00+00	5	1	1300.00
2708	3294	738Ns	8300.00	Cash	\N	Admin	Success	Imported from CSV	2026-07-17 02:29:00+00	5	1	0.00
2709	3295	135Ns	8500.00	Cash	\N	Admin	Success	Imported from CSV	2026-07-17 02:59:00+00	5	1	0.00
2710	3297	147Ns	7100.00	Cash	\N	Admin	Success	Imported from CSV	2026-07-17 06:32:00+00	5	1	800.00
2711	3298	367Ns	2600.00	Cash	\N	Admin	Success	Imported from CSV	2026-07-18 03:42:00+00	5	1	0.00
2712	3299	748Ns	3000.00	Cash	\N	Admin	Success	Imported from CSV	2026-07-18 03:59:00+00	5	1	0.00
2713	3300	749Ns	3000.00	Cash	\N	Admin	Success	Imported from CSV	2026-07-18 04:00:00+00	5	1	0.00
2714	3301	454Ns	6600.00	Cash	\N	Admin	Success	Imported from CSV	2026-07-18 05:47:00+00	5	1	400.00
2715	3302	530Ns	5000.00	Cash	\N	Admin	Success	Imported from CSV	2026-07-18 06:27:00+00	5	1	300.00
2716	3306	98	7700.00	Cash	\N	Admin	Success	Imported from CSV	2026-07-18 08:04:00+00	5	1	1400.00
2717	3308	717Ns	3500.00	Cash	\N	Admin	Success	Imported from CSV	2026-07-18 08:22:00+00	5	1	1000.00
2718	3309	204Ns	4000.00	Cash	\N	Admin	Success	Imported from CSV	2026-07-20 04:35:00+00	5	1	0.00
2719	3310	694Ns	3000.00	Cash	\N	Admin	Success	Imported from CSV	2026-07-20 04:38:00+00	5	1	0.00
2720	3311	693Ns	2000.00	Cash	\N	Admin	Success	Imported from CSV	2026-07-20 04:39:00+00	5	1	0.00
2721	3312	563Ns	8300.00	Cash	\N	Admin	Success	Imported from CSV	2026-07-20 04:43:00+00	5	1	1600.00
2722	3313	564Ns	8200.00	Cash	\N	Admin	Success	Imported from CSV	2026-07-20 04:47:00+00	5	1	1600.00
2723	3314	655Ns	8600.00	Cash	\N	Admin	Success	Imported from CSV	2026-07-20 05:17:00+00	5	1	0.00
2724	3315	00nsps2	6200.00	Cash	\N	Admin	Success	Imported from CSV	2026-07-20 05:19:00+00	5	1	0.00
2725	3316	753Ns	5600.00	Cash	\N	Admin	Success	Imported from CSV	2026-07-20 05:52:00+00	5	1	0.00
2726	3317	418Ns	4000.00	Cash	\N	Admin	Success	Imported from CSV	2026-07-20 05:58:00+00	5	1	1400.00
2727	3318	469Ns	3500.00	Cash	\N	Admin	Success	Imported from CSV	2026-07-20 07:01:00+00	5	1	0.00
2728	3319	619Ns	10100.00	Cash	\N	Admin	Success	Imported from CSV	2026-07-20 07:25:00+00	5	1	900.00
2729	3321	754Ns	3000.00	Cash	\N	Admin	Success	Imported from CSV	2026-07-20 07:49:00+00	5	1	2000.00
2730	3322	755Ns	3150.00	Cash	\N	Admin	Success	Imported from CSV	2026-07-20 08:19:00+00	5	1	0.00
2731	3323	756Ns	7600.00	Cash	\N	Admin	Success	Imported from CSV	2026-07-20 08:40:00+00	5	1	0.00
2732	3324	652Ns	2100.00	Cash	\N	Admin	Success	Imported from CSV	2026-07-20 11:06:00+00	5	1	0.00
2733	3325	649Ns	10000.00	Cash	\N	Admin	Success	Imported from CSV	2026-07-21 02:53:00+00	5	1	500.00
2734	3326	176Ns	12400.00	Cash	\N	Admin	Success	Imported from CSV	2026-07-21 04:05:00+00	5	1	1900.00
2735	3328	404Ns	12100.00	Cash	\N	Admin	Success	Imported from CSV	2026-07-21 04:12:00+00	5	1	1200.00
2736	3329	128Ns	5600.00	Cash	\N	Admin	Success	Imported from CSV	2026-07-21 06:28:00+00	5	1	100.00
2737	3330	653Ns	6400.00	Cash	\N	Admin	Success	Imported from CSV	2026-07-21 08:02:00+00	5	1	0.00
2738	3331	739Ns	3300.00	Cash	\N	Admin	Success	Imported from CSV	2026-07-21 09:52:00+00	5	1	0.00
2739	3332	501Ns	7000.00	Cash	\N	Admin	Success	Imported from CSV	2026-07-22 04:20:00+00	5	1	3700.00
2740	3333	502Ns	7000.00	Cash	\N	Admin	Success	Imported from CSV	2026-07-22 04:21:00+00	5	1	3700.00
2741	3335	503Ns	5700.00	Cash	\N	Admin	Success	Imported from CSV	2026-07-22 04:28:00+00	5	1	4200.00
2742	3336	732Ns	12200.00	Cash	\N	Admin	Success	Imported from CSV	2026-07-22 04:56:00+00	5	1	0.00
2743	3337	498Ns	2500.00	Cash	\N	Admin	Success	Imported from CSV	2026-07-22 06:17:00+00	5	1	0.00
2744	3338	727Ns	5000.00	Cash	\N	Admin	Success	Imported from CSV	2026-07-22 06:39:00+00	5	1	0.00
2745	3339	237Ns	9900.00	Cash	\N	Admin	Success	Imported from CSV	2026-07-22 06:50:00+00	5	1	1200.00
2746	3340	286Ns	8900.00	Cash	\N	Admin	Success	Imported from CSV	2026-07-22 06:52:00+00	5	1	1200.00
2747	3341	432Ns	4800.00	Cash	\N	Admin	Success	Imported from CSV	2026-07-22 06:53:00+00	5	1	4800.00
2748	3342	00/26/8	16700.00	Cash	\N	Admin	Success	Imported from CSV	2026-07-22 07:25:00+00	5	1	500.00
2749	3343	00/26/7	17200.00	Cash	\N	Admin	Success	Imported from CSV	2026-07-22 07:26:00+00	5	1	0.00
2750	3344	494Ns	8300.00	Cash	\N	Admin	Success	Imported from CSV	2026-07-22 07:30:00+00	5	1	1400.00
2751	3345	544Ns	5000.00	Cash	\N	Admin	Success	Imported from CSV	2026-07-22 07:48:00+00	5	1	0.00
2752	3346	522Ns	1500.00	Cash	\N	Admin	Success	Imported from CSV	2026-07-22 07:52:00+00	5	1	0.00
2753	3347	521Ns	1500.00	Cash	\N	Admin	Success	Imported from CSV	2026-07-22 07:52:00+00	5	1	0.00
2754	3348	335Ns	2000.00	Cash	\N	Admin	Success	Imported from CSV	2026-07-22 10:07:00+00	5	1	0.00
2755	3349	180Ns	7200.00	Cash	\N	Admin	Success	Imported from CSV	2026-07-23 03:03:00+00	5	1	0.00
2756	3350	597Ns	5200.00	Cash	\N	Admin	Success	Imported from CSV	2026-07-23 05:13:00+00	5	1	0.00
2757	3351	332Ns	3100.00	Cash	\N	Admin	Success	Imported from CSV	2026-07-23 07:15:00+00	5	1	0.00
2758	3352	333Ns	2200.00	Cash	\N	Admin	Success	Imported from CSV	2026-07-23 07:16:00+00	5	1	100.00
2759	3353	368Ns	1100.00	Cash	\N	Admin	Success	Imported from CSV	2026-07-23 07:18:00+00	5	1	800.00
2760	3354	548Ns	5900.00	Cash	\N	Admin	Success	Imported from CSV	2026-07-23 11:25:00+00	5	1	0.00
2761	3355	369Ns	5700.00	Cash	\N	Admin	Success	Imported from CSV	2026-07-24 03:49:00+00	5	1	600.00
2762	3356	394Ns	4200.00	Cash	\N	Admin	Success	Imported from CSV	2026-07-24 03:51:00+00	5	1	0.00
2763	3357	395Ns	6300.00	Cash	\N	Admin	Success	Imported from CSV	2026-07-24 03:53:00+00	5	1	0.00
2764	3358	395Ns	2000.00	Cash	\N	Admin	Success	Imported from CSV	2026-07-24 03:54:00+00	5	1	100.00
2765	3359	395Ns	2500.00	Cash	\N	Admin	Success	Imported from CSV	2026-07-24 03:54:00+00	5	1	0.00
2766	3360	394Ns	2000.00	Cash	\N	Admin	Success	Imported from CSV	2026-07-24 03:56:00+00	5	1	100.00
2767	3361	394Ns	2500.00	Cash	\N	Admin	Success	Imported from CSV	2026-07-24 03:57:00+00	5	1	100.00
2768	3362	665Ns	2200.00	Cash	\N	Admin	Success	Imported from CSV	2026-07-24 04:07:00+00	5	1	0.00
2769	3363	220Ns	4000.00	Cash	\N	Admin	Success	Imported from CSV	2026-07-24 06:30:00+00	5	1	0.00
2770	3364	220Ns	7900.00	Cash	\N	Admin	Success	Imported from CSV	2026-07-24 06:34:00+00	5	1	400.00
2771	3365	220Ns	900.00	Cash	\N	Admin	Success	Imported from CSV	2026-07-24 06:50:00+00	5	1	900.00
2772	3366	525Ns	5500.00	Cash	\N	Admin	Success	Imported from CSV	2026-07-24 06:52:00+00	5	1	0.00
2773	3367	579Ns	2400.00	Cash	\N	Admin	Success	Imported from CSV	2026-07-24 07:03:00+00	5	1	0.00
2774	3368	579Ns	2100.00	Cash	\N	Admin	Success	Imported from CSV	2026-07-24 07:05:00+00	5	1	0.00
2775	3369	580Ns	2000.00	Cash	\N	Admin	Success	Imported from CSV	2026-07-24 07:05:00+00	5	1	0.00
2776	3370	396Ns	8300.00	Cash	\N	Admin	Success	Imported from CSV	2026-07-24 07:39:00+00	5	1	1300.00
2777	3371	617Ns	400.00	Cash	\N	Admin	Success	Imported from CSV	2026-07-24 07:51:00+00	5	1	0.00
2778	3372	465Ns	5400.00	Cash	\N	Admin	Success	Imported from CSV	2026-07-25 04:26:00+00	5	1	300.00
2779	3373	466Ns	4600.00	Cash	\N	Admin	Success	Imported from CSV	2026-07-25 04:28:00+00	5	1	0.00
2780	3374	557Ns	5000.00	Cash	\N	Admin	Success	Imported from CSV	2026-07-25 05:48:00+00	5	1	0.00
2781	3375	543Ns	5900.00	Cash	\N	Admin	Success	Imported from CSV	2026-07-25 06:57:00+00	5	1	1000.00
2782	3376	323Ns	4500.00	Cash	\N	Admin	Success	Imported from CSV	2026-07-25 07:34:00+00	5	1	800.00
2783	3377	322Ns	4500.00	Cash	\N	Admin	Success	Imported from CSV	2026-07-25 07:39:00+00	5	1	0.00
2784	3378	723Ns	2500.00	Cash	\N	Admin	Success	Imported from CSV	2026-07-25 08:07:00+00	5	1	2100.00
2785	3379	757Ns	7000.00	Cash	\N	Admin	Success	Imported from CSV	2026-07-25 08:26:00+00	5	1	400.00
2786	3380	134Ns	5700.00	Cash	\N	Admin	Success	Imported from CSV	2026-07-27 06:26:00+00	5	1	0.00
2787	3381	133Ns	4300.00	Cash	\N	Admin	Success	Imported from CSV	2026-07-27 06:29:00+00	5	1	0.00
2788	3382	477Ns	8100.00	Cash	\N	Admin	Success	Imported from CSV	2026-07-27 06:52:00+00	5	1	0.00
2789	3383	214	3000.00	Cash	\N	Admin	Success	Imported from CSV	2026-07-27 07:00:00+00	5	1	0.00
2790	3384	452Ns	2400.00	Cash	\N	Admin	Success	Imported from CSV	2026-07-27 07:10:00+00	5	1	0.00
2791	3386	487Ns	8500.00	Cash	\N	Admin	Success	Imported from CSV	2026-07-27 07:33:00+00	5	1	1500.00
2792	3387	439Ns	10600.00	Cash	\N	Admin	Success	Imported from CSV	2026-07-27 08:01:00+00	5	1	700.00
2793	3388	357Ns	3200.00	Cash	\N	Admin	Success	Imported from CSV	2026-07-27 08:11:00+00	5	1	1100.00
2794	3389	358Ns	5000.00	Cash	\N	Admin	Success	Imported from CSV	2026-07-27 08:12:00+00	5	1	0.00
2795	3390	359Ns	4800.00	Cash	\N	Admin	Success	Imported from CSV	2026-07-27 08:13:00+00	5	1	0.00
2796	3391	110	4800.00	Cash	\N	Admin	Success	Imported from CSV	2026-07-28 04:14:00+00	5	1	0.00
2797	3392	49	5700.00	Cash	\N	Admin	Success	Imported from CSV	2026-07-28 04:15:00+00	5	1	0.00
2798	3393	50	5700.00	Cash	\N	Admin	Success	Imported from CSV	2026-07-28 04:18:00+00	5	1	0.00
2799	3394	59	5700.00	Cash	\N	Admin	Success	Imported from CSV	2026-07-28 04:18:00+00	5	1	0.00
2800	3395	347Ns	5100.00	Cash	\N	Admin	Success	Imported from CSV	2026-07-28 04:18:00+00	5	1	0.00
2801	3396	352	5000.00	Cash	\N	Admin	Success	Imported from CSV	2026-07-28 04:23:00+00	5	1	0.00
2802	3397	574Ns	1300.00	Cash	\N	Admin	Success	Imported from CSV	2026-07-28 05:02:00+00	5	1	0.00
2803	3398	574Ns	4500.00	Cash	\N	Admin	Success	Imported from CSV	2026-07-28 05:03:00+00	5	1	700.00
2804	3399	319Ns	2000.00	Cash	\N	Admin	Success	Imported from CSV	2026-07-28 05:08:00+00	5	1	0.00
2805	3400	161Ns	8000.00	Cash	\N	Admin	Success	Imported from CSV	2026-07-28 05:11:00+00	5	1	0.00
2806	3401	332Ns	2500.00	Cash	\N	Admin	Success	Imported from CSV	2026-07-28 05:12:00+00	5	1	0.00
2807	3402	555Ns	2900.00	Cash	\N	Admin	Success	Imported from CSV	2026-07-28 05:50:00+00	5	1	0.00
2808	3403	556Ns	2100.00	Cash	\N	Admin	Success	Imported from CSV	2026-07-28 05:51:00+00	5	1	0.00
2809	3404	587Ns	10000.00	Cash	\N	Admin	Success	Imported from CSV	2026-07-28 06:18:00+00	5	1	0.00
2810	3405	758Ns	8000.00	Cash	\N	Admin	Success	Imported from CSV	2026-07-28 07:17:00+00	5	1	0.00
2811	3406	556Ns	1100.00	Cash	\N	Admin	Success	Imported from CSV	2026-07-28 07:37:00+00	5	1	0.00
2812	3407	159Ns	5000.00	Cash	\N	Admin	Success	Imported from CSV	2026-07-28 14:19:00+00	5	1	0.00
2813	3408	671Ns	3000.00	Cash	\N	Admin	Success	Imported from CSV	2026-07-29 05:02:00+00	5	1	0.00
2814	3409	593Ns	5000.00	Cash	\N	Admin	Success	Imported from CSV	2026-07-29 05:12:00+00	5	1	0.00
2815	3410	628Ns	5000.00	Cash	\N	Admin	Success	Imported from CSV	2026-07-29 07:55:00+00	5	1	0.00
2816	3411	465Ns	5400.00	Cash	\N	Admin	Success	Imported from CSV	2026-07-30 05:40:00+00	5	1	0.00
2817	3412	466Ns	5900.00	Cash	\N	Admin	Success	Imported from CSV	2026-07-30 05:41:00+00	5	1	0.00
2818	3413	466Ns	2300.00	Cash	\N	Admin	Success	Imported from CSV	2026-07-30 05:53:00+00	5	1	0.00
2819	3414	465Ns	2400.00	Cash	\N	Admin	Success	Imported from CSV	2026-07-30 05:53:00+00	5	1	0.00
2820	3415	644Ns	6900.00	Cash	\N	Admin	Success	Imported from CSV	2026-07-30 06:07:00+00	5	1	1400.00
2821	3416	203Ns	8100.00	Cash	\N	Admin	Success	Imported from CSV	2026-07-30 06:11:00+00	5	1	1400.00
2822	3417	731Ns	4900.00	Cash	\N	Admin	Success	Imported from CSV	2026-07-30 06:13:00+00	5	1	400.00
2823	3418	690Ns	3400.00	Cash	\N	Admin	Success	Imported from CSV	2026-07-30 07:14:00+00	5	1	0.00
2824	3419	689Ns	5600.00	Cash	\N	Admin	Success	Imported from CSV	2026-07-30 07:14:00+00	5	1	0.00
2825	3420	759Ns	5500.00	Cash	\N	Admin	Success	Imported from CSV	2026-07-30 07:51:00+00	5	1	1400.00
2826	3421	629Ns	4000.00	Cash	\N	Admin	Success	Imported from CSV	2026-07-31 04:24:00+00	5	1	0.00
2827	3422	363Ns	4800.00	Cash	\N	Admin	Success	Imported from CSV	2026-07-31 04:28:00+00	5	1	0.00
2828	3423	704Ns	2000.00	Cash	\N	Admin	Success	Imported from CSV	2026-07-31 06:59:00+00	5	1	0.00
2829	3424	591Ns	4000.00	Cash	\N	Admin	Success	Imported from CSV	2026-08-01 03:32:00+00	5	1	0.00
2830	3425	751Ns	4200.00	Cash	\N	Admin	Success	Imported from CSV	2026-08-01 04:28:00+00	5	1	1500.00
2831	3426	588Ns	6800.00	Cash	\N	Admin	Success	Imported from CSV	2026-08-01 05:00:00+00	5	1	0.00
2832	3427	589Ns	3200.00	Cash	\N	Admin	Success	Imported from CSV	2026-08-01 05:01:00+00	5	1	0.00
2833	3430	331Ns	5000.00	Cash	\N	Admin	Success	Imported from CSV	2026-08-01 06:25:00+00	5	1	0.00
2834	3431	486Ns	6300.00	Cash	\N	Admin	Success	Imported from CSV	2026-08-01 06:30:00+00	5	1	1500.00
2835	3432	485Ns	6300.00	Cash	\N	Admin	Success	Imported from CSV	2026-08-01 06:31:00+00	5	1	1500.00
2836	3433	202Ns	7300.00	Cash	\N	Admin	Success	Imported from CSV	2026-08-01 07:24:00+00	5	1	1900.00
2837	3434	201Ns	7600.00	Cash	\N	Admin	Success	Imported from CSV	2026-08-01 07:25:00+00	5	1	2400.00
2838	3435	676Ns	1900.00	Cash	\N	Admin	Success	Imported from CSV	2026-08-01 08:14:00+00	5	1	0.00
2839	3436	504Ns	18600.00	Cash	\N	Admin	Success	Imported from CSV	2026-08-01 09:26:00+00	5	1	0.00
2840	3437	312Ns	12400.00	Cash	\N	Admin	Success	Imported from CSV	2026-08-01 09:26:00+00	5	1	0.00
2841	3438	311Ns	12400.00	Cash	\N	Admin	Success	Imported from CSV	2026-08-01 09:27:00+00	5	1	0.00
2842	3439	416Ns	10400.00	Cash	\N	Admin	Success	Imported from CSV	2026-08-02 10:25:00+00	5	1	1100.00
2843	3440	417Ns	4800.00	Cash	\N	Admin	Success	Imported from CSV	2026-08-02 10:29:00+00	5	1	900.00
2844	3441	464Ns	1650.00	Cash	\N	Admin	Success	Imported from CSV	2026-08-02 10:48:00+00	5	1	0.00
2845	3442	463Ns	1750.00	Cash	\N	Admin	Success	Imported from CSV	2026-08-02 10:49:00+00	5	1	0.00
2846	3443	314Ns	3600.00	Cash	\N	Admin	Success	Imported from CSV	2026-08-03 02:41:00+00	5	1	0.00
2847	3444	127Ns	5300.00	Cash	\N	Admin	Success	Imported from CSV	2026-08-03 04:44:00+00	5	1	0.00
2848	3445	228Ns	9300.00	Cash	\N	Admin	Success	Imported from CSV	2026-08-03 04:49:00+00	5	1	1400.00
2849	3446	434Ns	5700.00	Cash	\N	Admin	Success	Imported from CSV	2026-08-03 04:51:00+00	5	1	0.00
2850	3447	525Ns	5000.00	Cash	\N	Admin	Success	Imported from CSV	2026-08-03 06:03:00+00	5	1	1000.00
2851	3448	584Ns	2500.00	Cash	\N	Admin	Success	Imported from CSV	2026-08-03 06:15:00+00	5	1	0.00
2852	3449	Nsps2026	2800.00	Cash	\N	Admin	Success	Imported from CSV	2026-08-03 06:16:00+00	5	1	0.00
2853	3450	480Ns	12000.00	Cash	\N	Admin	Success	Imported from CSV	2026-08-03 06:33:00+00	5	1	0.00
2854	3451	599Ns	9900.00	Cash	\N	Admin	Success	Imported from CSV	2026-08-03 07:06:00+00	5	1	0.00
2855	3452	628Ns	5000.00	Cash	\N	Admin	Success	Imported from CSV	2026-08-03 07:07:00+00	5	1	500.00
2856	3453	106	5000.00	Cash	\N	Admin	Success	Imported from CSV	2026-08-03 07:09:00+00	5	1	1100.00
2857	3454	379Ns	10500.00	Cash	\N	Admin	Success	Imported from CSV	2026-08-03 07:19:00+00	5	1	600.00
2858	3455	131Ns	10000.00	Cash	\N	Admin	Success	Imported from CSV	2026-08-03 07:45:00+00	5	1	0.00
2859	3456	476Ns	6100.00	Cash	\N	Admin	Success	Imported from CSV	2026-08-04 04:45:00+00	5	1	1000.00
2860	3457	475Ns	6100.00	Cash	\N	Admin	Success	Imported from CSV	2026-08-04 04:47:00+00	5	1	1000.00
2861	3458	00/2/07/26	3500.00	Cash	\N	Admin	Success	Imported from CSV	2026-08-04 05:18:00+00	5	1	0.00
2862	3459	552Ns	6000.00	Cash	\N	Admin	Success	Imported from CSV	2026-08-04 05:23:00+00	5	1	0.00
2863	3460	635Ns	4700.00	Cash	\N	Admin	Success	Imported from CSV	2026-08-04 05:25:00+00	5	1	0.00
2864	3461	634Ns	5000.00	Cash	\N	Admin	Success	Imported from CSV	2026-08-04 05:29:00+00	5	1	0.00
2865	3462	488Ns	5000.00	Cash	\N	Admin	Success	Imported from CSV	2026-08-04 05:31:00+00	5	1	0.00
2866	3463	430Ns	4400.00	Cash	\N	Admin	Success	Imported from CSV	2026-08-04 05:38:00+00	5	1	0.00
2867	3464	604Ns	2600.00	Cash	\N	Admin	Success	Imported from CSV	2026-08-04 05:40:00+00	5	1	0.00
2868	3465	761Ns	2700.00	Cash	\N	Admin	Success	Imported from CSV	2026-08-04 07:06:00+00	5	1	2600.00
2869	3466	23	11800.00	Cash	\N	Admin	Success	Imported from CSV	2026-08-04 07:10:00+00	5	1	1000.00
2870	3467	236Ns	6700.00	Cash	\N	Admin	Success	Imported from CSV	2026-08-04 07:11:00+00	5	1	400.00
2871	3468	332Ns	6000.00	Cash	\N	Admin	Success	Imported from CSV	2026-08-04 07:21:00+00	5	1	0.00
2872	3469	726Ns	1900.00	Cash	\N	Admin	Success	Imported from CSV	2026-08-04 07:52:00+00	5	1	0.00
2873	3470	271Ns	2200.00	Cash	\N	Admin	Success	Imported from CSV	2026-08-04 08:35:00+00	5	1	0.00
2874	3471	272Ns	2100.00	Cash	\N	Admin	Success	Imported from CSV	2026-08-04 08:36:00+00	5	1	0.00
2875	3472	581Ns	25100.00	Cash	\N	Admin	Success	Imported from CSV	2026-08-06 08:02:00+00	5	1	0.00
2876	3473	582Ns	25100.00	Cash	\N	Admin	Success	Imported from CSV	2026-08-06 08:03:00+00	5	1	0.00
2877	3474	50TNs	5100.00	Cash	\N	Admin	Success	Imported from CSV	2026-08-06 08:05:00+00	5	1	1000.00
\.


--
-- Data for Name: marks; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.marks (id, student_id, exam_id, score) FROM stdin;
\.


--
-- Data for Name: schools; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.schools (id, name, subdomain, contact_email, created_at) FROM stdin;
1	Default School	default	admin@school.com	2026-08-07 01:37:27.164796
2	test school 2	testschool2	mohitshukla57662+test@gmail.com	2026-08-07 10:31:12.869152
3	test school	testschool	mohitshukla57662@gmail.com	2026-08-07 10:31:51.402941
5	test 1	testschool1	admin1@school.com	2026-08-07 10:34:58.276376
\.


--
-- Data for Name: sessions; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.sessions (id, name, start_date, end_date) FROM stdin;
\.


--
-- Data for Name: students; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.students (id, adm_no, name, class_name, payable_fee, paid_past, concession, academic_year, transport_fee, school_id) FROM stdin;
3107	332Ns	Priya Sonkar	9th EM B	0.00	0.00	0.00	2026-2027	0.00	1
3108	476Ns	Rajveer Singh	5th A	0.00	0.00	0.00	2026-2027	0.00	1
3109	475Ns	Rishabh Kumar	3rd A	0.00	0.00	0.00	2026-2027	0.00	1
3110	637Ns	Pranav	Nursery A	0.00	0.00	7700.00	2026-2027	0.00	1
3112	682Ns	Abhishek  	LKG A	0.00	0.00	0.00	2026-2027	0.00	5
3114	458Ns	Anaya  	LKG A	0.00	0.00	0.00	2026-2027	0.00	5
3115	592Ns	Anshika  	LKG A	0.00	0.00	0.00	2026-2027	0.00	5
3117	607Ns	Areesa Ruman Siddiqui  	LKG A	0.00	0.00	0.00	2026-2027	0.00	5
3118	495Ns	Arishfa Alim Khan  	LKG A	0.00	0.00	0.00	2026-2027	0.00	5
3119	462Ns	Ayansh  	LKG A	0.00	0.00	0.00	2026-2027	0.00	5
3120	566Ns	Ayush  	LKG A	0.00	0.00	0.00	2026-2027	0.00	5
3122	561Ns	Hamdan Siddiqui  	LKG A	0.00	0.00	0.00	2026-2027	0.00	5
3123	507Ns	Jainab Khatoon  	LKG A	0.00	0.00	0.00	2026-2027	0.00	5
3128	595Ns	Aditya Pratap  	UKG A	0.00	0.00	0.00	2026-2027	0.00	5
3129	471Ns	Akansha Rajput  	UKG A	0.00	0.00	0.00	2026-2027	0.00	5
3134	514Ns	Anabiya  	UKG A	0.00	0.00	0.00	2026-2027	0.00	5
3138	718Ns	Aniket Rawat  	UKG A	0.00	0.00	0.00	2026-2027	0.00	5
3147	626Ns	Ashish  	UKG A	0.00	0.00	0.00	2026-2027	0.00	5
3148	512Ns	ASPHAN HASAN  	UKG A	0.00	0.00	0.00	2026-2027	0.00	5
3149	472Ns	Atharv Soni  	UKG A	0.00	0.00	0.00	2026-2027	0.00	5
3151	473Ns	Ichchha Rajput  	UKG A	0.00	0.00	0.00	2026-2027	0.00	5
3153	451Ns	Krishn Chand Avasthi	UKG A	0.00	0.00	0.00	2026-2027	0.00	5
3155	752Ns	Laxmi  	UKG A	0.00	0.00	0.00	2026-2027	0.00	5
3158	575Ns	Prince  	UKG A	0.00	0.00	0.00	2026-2027	0.00	5
3161	573Ns	Rishika Khanna  	UKG A	0.00	0.00	0.00	2026-2027	0.00	5
3163	527Ns	Salman  	UKG A	0.00	0.00	0.00	2026-2027	0.00	5
3166	460Ns	Shagun  	UKG A	0.00	0.00	0.00	2026-2027	0.00	5
3169	513Ns	Shivanand  	UKG A	0.00	0.00	0.00	2026-2027	0.00	5
3170	609Ns	Shreya Tripathi  	UKG A	0.00	0.00	0.00	2026-2027	0.00	5
3171	570Ns	Subhas  	UKG A	0.00	0.00	0.00	2026-2027	0.00	5
3173	534Ns	Uday Bhan Singh  	UKG A	0.00	0.00	0.00	2026-2027	0.00	5
3174	547Ns	Vanishka Singh 	UKG A	0.00	0.00	0.00	2026-2027	0.00	5
3175	415Ns	Aaradhya Singh 	1st A	0.00	0.00	0.00	2026-2027	0.00	5
3177	455Ns	Abhishek  	1st A	0.00	0.00	0.00	2026-2027	0.00	5
3178	531Ns	Aiman Khatun  	1st A	0.00	0.00	0.00	2026-2027	0.00	5
3181	598Ns	Alok  	1st A	0.00	0.00	0.00	2026-2027	0.00	5
3182	606Ns	Anika  	1st A	0.00	0.00	0.00	2026-2027	0.00	5
3186	361Ns	Anuj Kumar  	1st A	0.00	0.00	0.00	2026-2027	0.00	5
3191	447Ns	Dev Kumar Soni	1st A	0.00	0.00	0.00	2026-2027	0.00	5
3192	470Ns	Devansh Tripathi 	1st A	0.00	0.00	0.00	2026-2027	0.00	5
3193	459Ns	Gauri  	1st A	0.00	0.00	0.00	2026-2027	0.00	5
3194	538Ns	Ikara Bano  	1st A	0.00	0.00	0.00	2026-2027	0.00	5
3150	611Ns	Divya  	UKG A	7100.00	0.00	1000.00	2026-2027	0.00	5
3184	510Ns	Anshika Singh  	1st A	7100.00	0.00	0.00	2026-2027	0.00	5
3172	612	Tarannum  	UKG A	7700.00	0.00	3900.00	2026-2027	0.00	5
3131	742Ns	Akshita  	UKG A	11200.00	0.00	0.00	2026-2027	0.00	5
3179	620Ns	Akash Pal  	1st A	15700.00	0.00	0.00	2026-2027	0.00	5
3183	498Ns	Anish Yadav  	1st A	2600.00	0.00	0.00	2026-2027	0.00	5
3185	474Ns	Antima  	1st A	700.00	0.00	0.00	2026-2027	0.00	5
3135	640Ns	Anand Kumar  	UKG A	6800.00	0.00	0.00	2026-2027	0.00	5
3116	701Ns	Anvi Singh  	LKG A	4800.00	0.00	0.00	2026-2027	0.00	5
3188	617Ns	Arpit Singh  	1st A	400.00	0.00	0.00	2026-2027	0.00	5
3180	384Ns	Akasha Nuri  	1st A	4700.00	0.00	3600.00	2026-2027	0.00	5
3140	645Ns	Anshika  	UKG A	2000.00	0.00	0.00	2026-2027	0.00	5
3160	646Ns	Rajan  	UKG A	6300.00	0.00	0.00	2026-2027	0.00	5
3133	529Ns	Ali Siddiqui  	UKG A	7000.00	0.00	0.00	2026-2027	0.00	5
3141	753Ns	Anshika  	UKG A	5600.00	0.00	0.00	2026-2027	0.00	5
3152	642Ns	Kartik  	UKG A	8700.00	0.00	0.00	2026-2027	0.00	5
3168	761Ns	Shaurya Pratap Rajpoot  	UKG A	5300.00	0.00	2600.00	2026-2027	0.00	5
3156	576Ns	Nishant Mishra  	UKG A	9700.00	0.00	0.00	2026-2027	0.00	5
3139	604Ns	Anmol Verma  	UKG A	4100.00	0.00	0.00	2026-2027	0.00	5
3159	688Ns	Priyal Kasaudhan  	UKG A	7400.00	0.00	1400.00	2026-2027	0.00	5
3146	676Ns	Aryan Verma  	UKG A	1900.00	0.00	0.00	2026-2027	0.00	5
3136	493Ns	Ananya  	UKG A	5000.00	0.00	2400.00	2026-2027	0.00	5
3142	658Ns	Anshika Singh  	UKG A	7100.00	0.00	0.00	2026-2027	0.00	5
3162	699Ns	Rupesh  	UKG A	4000.00	0.00	0.00	2026-2027	0.00	5
3165	639Ns	Satyam Singh  	UKG A	6800.00	0.00	0.00	2026-2027	0.00	5
3144	657Ns	Aradhyaa Tiwari  	UKG A	5100.00	0.00	0.00	2026-2027	0.00	5
3157	703Ns	Prabal Pratap Singh  	UKG A	7700.00	0.00	0.00	2026-2027	0.00	5
3125	707Ns	Yuvraj Singh  	LKG A	3200.00	0.00	0.00	2026-2027	0.00	5
3127	715Ns	Aditi  	UKG A	10300.00	0.00	0.00	2026-2027	0.00	5
3121	716Ns	Azka Siddiqui  	LKG A	5600.00	0.00	0.00	2026-2027	0.00	5
3113	697Ns	Amit Singh  	LKG A	5600.00	0.00	0.00	2026-2027	0.00	5
3154	720Ns	Lalit Rajpoot  	UKG A	3000.00	0.00	0.00	2026-2027	0.00	5
3137	734Ns	Ananya  	UKG A	5600.00	0.00	500.00	2026-2027	0.00	5
3164	735Ns	Sarthak Patel  	UKG A	7800.00	0.00	0.00	2026-2027	0.00	5
3176	509Ns	Abdurrahaman Assudais 	1st A	7400.00	0.00	0.00	2026-2027	0.00	5
3167	452Ns	Shatrudhan Mishra 	UKG A	2400.00	0.00	0.00	2026-2027	0.00	5
3111	746Ns	Aarab Sigh  	LKG A	6900.00	0.00	0.00	2026-2027	0.00	5
3145	659Ns	Arya Singh  	UKG A	2500.00	0.00	0.00	2026-2027	0.00	5
3190	404Ns	Ayanshraj  	1st A	13300.00	0.00	1200.00	2026-2027	0.00	5
3132	653Ns	Alfa Siddiki  	UKG A	6400.00	0.00	0.00	2026-2027	0.00	5
3124	739Ns	Vansh Pratap Singh Bhadauriya  	LKG A	3300.00	0.00	0.00	2026-2027	0.00	5
3189	580Ns	Ashu Tiwari  	1st A	2000.00	0.00	0.00	2026-2027	0.00	5
3187	358Ns	Arpit  	1st A	5000.00	0.00	0.00	2026-2027	0.00	5
3130	690Ns	Akshat Rajpoot  	UKG A	3400.00	0.00	0.00	2026-2027	0.00	5
3126	574Ns	Aadvika  	UKG A	5200.00	0.00	700.00	2026-2027	0.00	5
3143	461Ns	Aradhya Singh  	UKG A	9000.00	9800.00	0.00	2026-2027	0.00	5
3196	420Ns	Ishant Singh  	1st A	0.00	0.00	0.00	2026-2027	0.00	5
3198	519Ns	Khushbu  	1st A	0.00	0.00	0.00	2026-2027	0.00	5
3199	467Ns	Mahetab Rja 	1st A	0.00	0.00	0.00	2026-2027	0.00	5
3200	483Ns	Mariya Fatima  	1st A	0.00	0.00	0.00	2026-2027	0.00	5
3201	562Ns	Mo Gulam Rasul  	1st A	0.00	0.00	0.00	2026-2027	0.00	5
3203	499Ns	Pranshu  	1st A	0.00	0.00	0.00	2026-2027	0.00	5
3205	610Ns	Priya  	1st A	0.00	0.00	0.00	2026-2027	0.00	5
3206	524Ns	Pryans Kumar  	1st A	0.00	0.00	0.00	2026-2027	0.00	5
3207	453Ns	Purvi  	1st A	0.00	0.00	0.00	2026-2027	0.00	5
3208	520Ns	Rabee  	1st A	0.00	0.00	0.00	2026-2027	0.00	5
3210	386Ns	Rounak Soni  	1st A	0.00	0.00	0.00	2026-2027	0.00	5
3211	479Ns	Shalini Singh  	1st A	0.00	0.00	0.00	2026-2027	0.00	5
3212	441Ns	Shikha  	1st A	0.00	0.00	0.00	2026-2027	0.00	5
3213	456Ns	Subhansh Tiwari  	1st A	0.00	0.00	0.00	2026-2027	0.00	5
3214	600Ns	Uday Krishn  	1st A	0.00	0.00	0.00	2026-2027	0.00	5
3217	596Ns	Aashvi  	2nd A	0.00	0.00	0.00	2026-2027	0.00	5
3219	328Ns	Abhishek  	2nd A	0.00	0.00	0.00	2026-2027	0.00	5
3224	337Ns	Anvi Khanna  	2nd A	0.00	0.00	0.00	2026-2027	0.00	5
3227	431Ns	Arpit  	2nd A	0.00	0.00	0.00	2026-2027	0.00	5
3228	330Ns	Arsalan Husain 	2nd A	0.00	0.00	0.00	2026-2027	0.00	5
3231	399Ns	Atal Bihari  	2nd A	0.00	0.00	0.00	2026-2027	0.00	5
3234	450Ns	Devanshi  	2nd A	0.00	0.00	0.00	2026-2027	0.00	5
3237	511Ns	Divyansh Kashyap  	2nd A	0.00	0.00	0.00	2026-2027	0.00	5
3239	601Ns	Harshit Rajpoot  	2nd A	0.00	0.00	0.00	2026-2027	0.00	5
3241	698Ns	Himanshi  	2nd A	0.00	0.00	0.00	2026-2027	0.00	5
3243	342Ns	Khushnuma  Khatoon 	2nd A	0.00	0.00	0.00	2026-2027	0.00	5
3244	680Ns	Kranti  	2nd A	0.00	0.00	0.00	2026-2027	0.00	5
3245	275Ns	Moh Abdussalaam Siddiqui 	2nd A	0.00	0.00	0.00	2026-2027	0.00	5
3246	532Ns	Mohammad Haris  	2nd A	0.00	0.00	0.00	2026-2027	0.00	5
3247	468Ns	Mohammad Sadab Rajja  	2nd A	0.00	0.00	0.00	2026-2027	0.00	5
3249	288Ns	Mohd. Ujair Hussain Siddiqui 	2nd A	0.00	0.00	0.00	2026-2027	0.00	5
3252	322	Naved Khan  	2nd A	0.00	0.00	0.00	2026-2027	0.00	5
3255	279Ns	Noman  	2nd A	0.00	0.00	0.00	2026-2027	0.00	5
3258	321Ns	Paras  	2nd A	0.00	0.00	0.00	2026-2027	0.00	5
3262	297Ns	Pragya Dwivedi 	2nd A	0.00	0.00	0.00	2026-2027	0.00	5
3263	440Ns	Pratigya  	2nd A	0.00	0.00	0.00	2026-2027	0.00	5
3264	565Ns	Preeti  	2nd A	0.00	0.00	0.00	2026-2027	0.00	5
3265	326Ns	Prins  	2nd A	0.00	0.00	0.00	2026-2027	0.00	5
3269	478Ns	Sanvi Soni  	2nd A	0.00	0.00	0.00	2026-2027	0.00	5
3271	533Ns	Shabanam Khatun  	2nd A	0.00	0.00	0.00	2026-2027	0.00	5
3273	309Ns	Shaurya Singh Rajpoot	2nd A	0.00	0.00	0.00	2026-2027	0.00	5
3274	567Ns	Srishti  	2nd A	0.00	0.00	0.00	2026-2027	0.00	5
3275	240Ns	Sufiya Shekh  	2nd A	0.00	0.00	0.00	2026-2027	0.00	5
3277	559Ns	Tanu  	2nd A	0.00	0.00	0.00	2026-2027	0.00	5
3280	542Ns	Vishnu Patel  	2nd A	0.00	0.00	0.00	2026-2027	0.00	5
3281	537Ns	Aaliya Khan  	3rd A	0.00	0.00	0.00	2026-2027	0.00	5
3282	528Ns	Aanvi Shrivastava 	3rd A	0.00	0.00	0.00	2026-2027	0.00	5
3283	345Ns	Aayu  	3rd A	0.00	0.00	0.00	2026-2027	0.00	5
3284	433Ns	Aayush  Kumar Chaurasiya	3rd A	0.00	0.00	0.00	2026-2027	0.00	5
3285	232Ns	Abhi  	3rd A	0.00	0.00	0.00	2026-2027	0.00	5
3222	754Ns	Anam Naz  	2nd A	5000.00	0.00	2000.00	2026-2027	0.00	5
3268	621Ns	Sanskar  	2nd A	12100.00	0.00	0.00	2026-2027	0.00	5
3236	631Ns	Ditya  	2nd A	8300.00	0.00	1500.00	2026-2027	0.00	5
3261	740Ns	Pawan Tiwari  	2nd A	5900.00	0.00	0.00	2026-2027	0.00	5
3251	523Ns	Nainika Devi  	2nd A	3000.00	0.00	0.00	2026-2027	0.00	5
3220	442Ns	Ajay  	2nd A	5600.00	0.00	0.00	2026-2027	0.00	5
3260	650Ns	Pavitra Garg  	2nd A	8900.00	0.00	0.00	2026-2027	0.00	5
3286	396Ns	Abhishek  	3rd A	9900.00	0.00	1300.00	2026-2027	0.00	5
3197	368Ns	Kavya Sonkar  	1st A	2900.00	0.00	800.00	2026-2027	0.00	5
3229	748Ns	Ashok  	2nd A	3000.00	0.00	0.00	2026-2027	0.00	5
3226	667Ns	Aradhya Khangar  	2nd A	5900.00	0.00	0.00	2026-2027	0.00	5
3266	536Ns	Priyanshi  	2nd A	4400.00	0.00	0.00	2026-2027	0.00	5
3256	679Ns	Omprakash  	2nd A	5900.00	0.00	0.00	2026-2027	0.00	5
3276	695Ns	Sundram  	2nd A	3000.00	0.00	0.00	2026-2027	0.00	5
3230	686Ns	Aslaan  	2nd A	4600.00	0.00	0.00	2026-2027	0.00	5
3225	492Ns	Aradhya  	2nd A	4800.00	0.00	0.00	2026-2027	0.00	5
3240	412Ns	Himanshi  	2nd A	7900.00	0.00	800.00	2026-2027	0.00	5
3216	259Ns	Aarju  	2nd A	4800.00	0.00	3000.00	2026-2027	0.00	5
3202	491Ns	Omkar Divy Raikwar  	1st A	9600.00	0.00	0.00	2026-2027	0.00	5
3259	706Ns	Pari  	2nd A	4100.00	0.00	500.00	2026-2027	0.00	5
3253	709Ns	Neelesh  	2nd A	3000.00	0.00	1000.00	2026-2027	0.00	5
3238	227Ns	Divyanshi  	2nd A	7100.00	0.00	0.00	2026-2027	0.00	5
3204	504Ns	Prinsh Rajpoot  	1st A	18600.00	0.00	0.00	2026-2027	0.00	5
3267	733Ns	Ram  	2nd A	10400.00	0.00	0.00	2026-2027	0.00	5
3232	633Ns	Ayush  	2nd A	5900.00	0.00	0.00	2026-2027	0.00	5
3218	745Ns	Abdulla Ahamad  	2nd A	3000.00	0.00	1000.00	2026-2027	0.00	5
3233	747Ns	Chandrabhan  	2nd A	10000.00	0.00	0.00	2026-2027	0.00	5
3195	365Ns	Inaya  	1st A	15300.00	0.00	0.00	2026-2027	0.00	5
3242	292Ns	Kartike  	2nd A	3300.00	0.00	0.00	2026-2027	0.00	5
3209	418Ns	Raj  	1st A	5600.00	0.00	1400.00	2026-2027	0.00	5
3278	619Ns	Than Singh  	2nd A	11000.00	0.00	900.00	2026-2027	0.00	5
3221	503Ns	Amrendra Tiwari  	2nd A	9900.00	0.00	4200.00	2026-2027	0.00	5
3254	286Ns	Neer Srivastava 	2nd A	10100.00	0.00	1200.00	2026-2027	0.00	5
3215	432Ns	Yug Srivastav  	1st A	9600.00	0.00	4800.00	2026-2027	0.00	5
3235	335Ns	Dhananjay  	2nd A	3000.00	0.00	0.00	2026-2027	0.00	5
3250	597Ns	Mohit  	2nd A	5200.00	0.00	0.00	2026-2027	0.00	5
3287	466Ns	Adarsh  	3rd A	2300.00	0.00	0.00	2026-2027	0.00	5
3223	359Ns	Anuradha  	2nd A	4800.00	0.00	0.00	2026-2027	0.00	5
3279	731Ns	Vandana  	2nd A	5300.00	0.00	400.00	2026-2027	0.00	5
3290	362Ns	Aiisa  	3rd A	0.00	0.00	0.00	2026-2027	0.00	5
3295	722Ns	Anshika Devi  	3rd A	0.00	0.00	0.00	2026-2027	0.00	5
3300	154Ns	Arpit Singh 	3rd A	0.00	0.00	0.00	2026-2027	0.00	5
3304	250Ns	Aviral Khanna  	3rd A	0.00	0.00	0.00	2026-2027	0.00	5
3306	421Ns	Ayush  	3rd A	0.00	0.00	0.00	2026-2027	0.00	5
3311	301Ns	Farhan Khan 	3rd A	0.00	0.00	0.00	2026-2027	0.00	5
3312	446Ns	Harun  	3rd A	0.00	0.00	0.00	2026-2027	0.00	5
3315	385Ns	Khushi Verma 	3rd A	0.00	0.00	0.00	2026-2027	0.00	5
3317	413Ns	Mayank Lodh  	3rd A	0.00	0.00	0.00	2026-2027	0.00	5
3319	560Ns	Mohd Umar  	3rd A	0.00	0.00	0.00	2026-2027	0.00	5
3321	540Ns	Mubasra Khatoon  	3rd A	0.00	0.00	0.00	2026-2027	0.00	5
3322	448Ns	Nayashi  	3rd A	0.00	0.00	0.00	2026-2027	0.00	5
3325	687Ns	Pradeep Kumar  	3rd A	0.00	0.00	0.00	2026-2027	0.00	5
3326	554Ns	Pranshi  	3rd A	0.00	0.00	0.00	2026-2027	0.00	5
3327	174Ns	Puneet  	3rd A	0.00	0.00	0.00	2026-2027	0.00	5
3330	360Ns	Rohit  	3rd A	0.00	0.00	0.00	2026-2027	0.00	5
3332	219	Saurabh  	3rd A	0.00	0.00	0.00	2026-2027	0.00	5
3334	374Ns	Shaury Soni 	3rd A	0.00	0.00	0.00	2026-2027	0.00	5
3335	551Ns	Shiv  	3rd A	0.00	0.00	0.00	2026-2027	0.00	5
3338	NsPs	Udaybhan  	3rd A	0.00	0.00	0.00	2026-2027	0.00	5
3340	490Ns	Vaishali  	3rd A	0.00	0.00	0.00	2026-2027	0.00	5
3348	482Ns	Abdul Ahad  	4th A	0.00	0.00	0.00	2026-2027	0.00	5
3350	263Ns	Aditi Rajput 	4th A	0.00	0.00	0.00	2026-2027	0.00	5
3358	245Ns	Anmol Sen  	4th A	0.00	0.00	0.00	2026-2027	0.00	5
3360	370Ns	Anup Singh  	4th A	0.00	0.00	0.00	2026-2027	0.00	5
3361	550Ns	Anurag  	4th A	0.00	0.00	0.00	2026-2027	0.00	5
3363	167Ns	Aradhya  	4th A	0.00	0.00	0.00	2026-2027	0.00	5
3364	457Ns	Araju  	4th A	0.00	0.00	0.00	2026-2027	0.00	5
3365	260Ns	Arbiya  	4th A	0.00	0.00	0.00	2026-2027	0.00	5
3366	109	ARMAN  	4th A	0.00	0.00	0.00	2026-2027	0.00	5
3367	278Ns	Arman Khan  	4th A	0.00	0.00	0.00	2026-2027	0.00	5
3368	310Ns	Arpit Singh  	4th A	0.00	0.00	0.00	2026-2027	0.00	5
3369	505Ns	Ayan  	4th A	0.00	0.00	0.00	2026-2027	0.00	5
3374	107	DHARMENDRA KUMAR TRIPATHI  	4th A	0.00	0.00	0.00	2026-2027	0.00	5
3375	535Ns	Divyanshi  	4th A	0.00	0.00	0.00	2026-2027	0.00	5
3376	605Ns	Ganika  	4th A	0.00	0.00	0.00	2026-2027	0.00	5
3380	398Ns	Indresh Kumar Kewat  	4th A	0.00	0.00	0.00	2026-2027	0.00	5
3381	445Ns	Kadir  	4th A	0.00	0.00	0.00	2026-2027	0.00	5
3353	430Ns	Amul  	4th A	4400.00	0.00	0.00	2026-2027	0.00	5
3354	719Ns	Anas  	4th A	11000.00	0.00	0.00	2026-2027	0.00	5
3308	220Ns	Ayushi  	3rd A	1800.00	0.00	900.00	2026-2027	0.00	5
3370	131Ns	Ayanshi  	4th A	12100.00	0.00	0.00	2026-2027	0.00	5
3357	153Ns	Ankush Kumar 	4th A	4600.00	0.00	0.00	2026-2027	0.00	5
3372	176Ns	Ayushraj  	4th A	14300.00	0.00	1900.00	2026-2027	0.00	5
3320	654Ns	Mohini  	3rd A	20500.00	0.00	500.00	2026-2027	0.00	5
3303	749Ns	Ashish Pal  	3rd A	3000.00	0.00	0.00	2026-2027	0.00	5
3302	579Ns	Ashi  	3rd A	2100.00	0.00	0.00	2026-2027	0.00	5
3296	236Ns	Anshika Rajpoot  	3rd A	7100.00	0.00	400.00	2026-2027	0.00	5
3346	663Ns	Aarti  	4th A	3000.00	0.00	0.00	2026-2027	0.00	5
3349	666Ns	Adarsh  	4th A	5900.00	0.00	0.00	2026-2027	0.00	5
3314	670Ns	Ilma  	3rd A	5900.00	0.00	0.00	2026-2027	0.00	5
3352	444Ns	Akil  	4th A	4100.00	0.00	0.00	2026-2027	0.00	5
3307	672Ns	Ayush  	3rd A	5900.00	0.00	800.00	2026-2027	0.00	5
3336	497Ns	Shivansh Gupta  	3rd A	7500.00	0.00	1400.00	2026-2027	0.00	5
3333	692Ns	Shani  	3rd A	5000.00	0.00	0.00	2026-2027	0.00	5
3316	564Ns	Laxmikant  	3rd A	9800.00	0.00	1600.00	2026-2027	0.00	5
3379	393Ns	Ijara  	4th A	2400.00	0.00	0.00	2026-2027	0.00	5
3362	232	Anushka Singh 	4th A	7900.00	0.00	800.00	2026-2027	0.00	5
3331	224Ns	Sangam  	3rd A	7100.00	0.00	600.00	2026-2027	0.00	5
3337	225Ns	Suneeti  	3rd A	7100.00	0.00	600.00	2026-2027	0.00	5
3344	132Ns	Aakriti  	4th A	7900.00	0.00	0.00	2026-2027	0.00	5
3342	409Ns	Yashi Patel  	3rd A	7500.00	0.00	0.00	2026-2027	0.00	5
3313	712Ns	Himanshi Shivhare  	3rd A	5900.00	0.00	500.00	2026-2027	0.00	5
3341	515Ns	Yash  	3rd A	10800.00	0.00	700.00	2026-2027	0.00	5
3351	608Ns	Aditya Kumar Rawat  	4th A	7100.00	0.00	0.00	2026-2027	0.00	5
3347	546Ns	Aarul Kasaudhan  	4th A	9900.00	0.00	0.00	2026-2027	0.00	5
3378	372Ns	Gunjan  	4th A	8100.00	0.00	400.00	2026-2027	0.00	5
3377	373Ns	Gungun  	4th A	6700.00	0.00	2400.00	2026-2027	0.00	5
3359	660Ns	Anshika Singh  	4th A	2600.00	0.00	0.00	2026-2027	0.00	5
3345	454Ns	Aanya Gupta 	4th A	7000.00	0.00	400.00	2026-2027	0.00	5
3289	204Ns	Aditya Singh 	3rd A	4200.00	0.00	0.00	2026-2027	0.00	5
3324	694Ns	Pankaj Singh  	3rd A	3100.00	0.00	0.00	2026-2027	0.00	5
3343	655Ns	Yuvraj  	3rd A	8600.00	0.00	0.00	2026-2027	0.00	5
3356	652Ns	Ankul Kumar Kushwaha  	4th A	2700.00	0.00	0.00	2026-2027	0.00	5
3355	727Ns	Anju Devi  	4th A	5000.00	0.00	0.00	2026-2027	0.00	5
3305	180Ns	Ayansh  	3rd A	7200.00	0.00	0.00	2026-2027	0.00	5
3323	548Ns	Neeraj Kumar  	3rd A	5900.00	0.00	0.00	2026-2027	0.00	5
3297	323Ns	Aradhya  	3rd A	5700.00	0.00	800.00	2026-2027	0.00	5
3371	214	Ayush Singh 	4th A	3500.00	0.00	0.00	2026-2027	0.00	5
3293	439Ns	Anisha  	3rd A	11300.00	0.00	700.00	2026-2027	0.00	5
3299	347Ns	Arpit  	3rd A	5100.00	0.00	0.00	2026-2027	0.00	5
3339	352	Urmila  	3rd A	5000.00	0.00	0.00	2026-2027	0.00	5
3301	319Ns	Arpit Singh  	3rd A	2000.00	0.00	0.00	2026-2027	0.00	5
3288	689Ns	Adity Rajput  	3rd A	5900.00	0.00	0.00	2026-2027	0.00	5
3328	363Ns	Radha  	3rd A	5000.00	0.00	0.00	2026-2027	0.00	5
3373	589Ns	Bharat Kumar Saini  	4th A	4600.00	0.00	0.00	2026-2027	0.00	5
3298	331Ns	Arman  	3rd A	6000.00	0.00	0.00	2026-2027	0.00	5
3329	475Ns	Rishabh Kumar  	3rd A	7100.00	0.00	1000.00	2026-2027	0.00	5
3310	634Ns	Ekata  	3rd A	5000.00	0.00	0.00	2026-2027	0.00	5
3294	272Ns	Anshika Devi  	3rd A	3200.00	0.00	0.00	2026-2027	0.00	5
3382	375Ns	Kalpana  	4th A	0.00	0.00	0.00	2026-2027	0.00	5
3384	539Ns	Mariya Khatun  	4th A	0.00	0.00	0.00	2026-2027	0.00	5
3385	210	Mohini Soni 	4th A	0.00	0.00	0.00	2026-2027	0.00	5
3388	145Ns	Prakash Singh 	4th A	0.00	0.00	0.00	2026-2027	0.00	5
3389	112	PRANSHI  	4th A	0.00	0.00	0.00	2026-2027	0.00	5
3391	249	Prem Sagar  	4th A	0.00	0.00	0.00	2026-2027	0.00	5
3394	252Ns	Rajiya Khatoon 	4th A	0.00	0.00	0.00	2026-2027	0.00	5
3396	299Ns	Rohan Singh  	4th A	0.00	0.00	0.00	2026-2027	0.00	5
3397	484Ns	Rukmani  	4th A	0.00	0.00	0.00	2026-2027	0.00	5
3398	216Ns	Safreen Bano  	4th A	0.00	0.00	0.00	2026-2027	0.00	5
3402	403Ns	Sarita  	4th A	0.00	0.00	0.00	2026-2027	0.00	5
3403	68	SATYAM  	4th A	0.00	0.00	0.00	2026-2027	0.00	5
3405	173Ns	Shivay  	4th A	0.00	0.00	0.00	2026-2027	0.00	5
3407	287Ns	Tasmiya Ruman 	4th A	0.00	0.00	0.00	2026-2027	0.00	5
3408	192Ns	Udit  	4th A	0.00	0.00	0.00	2026-2027	0.00	5
3409	247	Umesh Kumar  	4th A	0.00	0.00	0.00	2026-2027	0.00	5
3410	267Ns	Umme Sulem Siddiqui	4th A	0.00	0.00	0.00	2026-2027	0.00	5
3413	313Ns	Yashraj Sonkar  	4th A	0.00	0.00	0.00	2026-2027	0.00	5
3414	148Ns	Aashi Dwivedi 	5th A	0.00	0.00	0.00	2026-2027	0.00	5
3416	387Ns	Abhay Kumar  	5th A	0.00	0.00	0.00	2026-2027	0.00	5
3417	54	ABHIYODAY PATEL  	5th A	0.00	0.00	0.00	2026-2027	0.00	5
3419	266	Afiya  	5th A	0.00	0.00	0.00	2026-2027	0.00	5
3421	193Ns	Aniket  	5th A	0.00	0.00	0.00	2026-2027	0.00	5
3423	590Ns	Ansh  	5th A	0.00	0.00	0.00	2026-2027	0.00	5
3425	209Ns	Aradhya Patel 	5th A	0.00	0.00	0.00	2026-2027	0.00	5
3426	489Ns	Aryan Chaurasiya  	5th A	0.00	0.00	0.00	2026-2027	0.00	5
3428	327Ns	Daljeet Singh 	5th A	0.00	0.00	0.00	2026-2027	0.00	5
3430	656Ns	Hasnain Raja  	5th A	0.00	0.00	0.00	2026-2027	0.00	5
3435	00nsps	Lavkesh  	5th A	0.00	0.00	0.00	2026-2027	0.00	5
3439	92	MANISH  	5th A	0.00	0.00	0.00	2026-2027	0.00	5
3444	182Ns	Prakash Patel 	5th A	0.00	0.00	0.00	2026-2027	0.00	5
3445	246	Pranshi  	5th A	0.00	0.00	0.00	2026-2027	0.00	5
3448	402Ns	Rachana  	5th A	0.00	0.00	0.00	2026-2027	0.00	5
3450	146	Raj Soni 	5th A	0.00	0.00	0.00	2026-2027	0.00	5
3453	750Ns	Ritika Tripathi  	5th A	0.00	0.00	0.00	2026-2027	0.00	5
3454	215Ns	Safiya Bano  	5th A	0.00	0.00	0.00	2026-2027	0.00	5
3458	423Ns	Shanu Singh  	5th A	0.00	0.00	0.00	2026-2027	0.00	5
3459	553Ns	Shiv Om  	5th A	0.00	0.00	0.00	2026-2027	0.00	5
3466	251Ns	Abhinav Khanna  	6th A	0.00	0.00	0.00	2026-2027	0.00	5
3467	558Ns	ABHISHEK KUMAR  	6th A	0.00	0.00	0.00	2026-2027	0.00	5
3468	125Ns	Abi Kumar Chaurasiya	6th A	0.00	0.00	0.00	2026-2027	0.00	5
3470	268Ns	Adi  	6th A	0.00	0.00	0.00	2026-2027	0.00	5
3471	276Ns	Afifa  	6th A	0.00	0.00	0.00	2026-2027	0.00	5
3474	188Ns	Anadi Dev Tiwari  	6th A	0.00	0.00	0.00	2026-2027	0.00	5
3427	622Ns	Bhumi  	5th A	12100.00	0.00	0.00	2026-2027	0.00	5
3441	644Ns	Naitik  	5th A	8300.00	0.00	1400.00	2026-2027	0.00	5
3434	632Ns	Kartik Shukla  	5th A	8300.00	0.00	1500.00	2026-2027	0.00	5
3455	591Ns	Sahil  	5th A	4700.00	0.00	0.00	2026-2027	0.00	5
3400	664Ns	Sanjeev  	4th A	4900.00	0.00	1000.00	2026-2027	0.00	5
3432	594Ns	Joya  	5th A	5200.00	0.00	0.00	2026-2027	0.00	5
3456	522Ns	Sameer Rajpoot  	5th A	1500.00	0.00	0.00	2026-2027	0.00	5
3442	556Ns	Palak  	5th A	2300.00	0.00	0.00	2026-2027	0.00	5
3449	388Ns	Radha  	5th A	10100.00	0.00	0.00	2026-2027	0.00	5
3461	723Ns	Srishti Raj  	5th A	4700.00	0.00	2100.00	2026-2027	0.00	5
3440	486Ns	Mohammad Lubaid  	5th A	7800.00	0.00	1500.00	2026-2027	0.00	5
3418	584Ns	Adarsh  	5th A	3900.00	0.00	0.00	2026-2027	0.00	5
3422	683Ns	Ankit  	5th A	5900.00	0.00	0.00	2026-2027	0.00	5
3472	685Ns	Ajay Pal  	6th A	8900.00	0.00	0.00	2026-2027	0.00	5
3424	138Ns	Anshika Patel 	5th A	8600.00	0.00	500.00	2026-2027	0.00	5
3452	496Ns	Ravi Gupta  	5th A	7500.00	0.00	1400.00	2026-2027	0.00	5
3475	582Ns	Ananya  	6th A	25100.00	0.00	0.00	2026-2027	0.00	5
3412	104	YASHI TIWARI  	4th A	5800.00	0.00	0.00	2026-2027	0.00	5
3460	103	SNEHA TIWARI  	5th A	5800.00	0.00	0.00	2026-2027	0.00	5
3446	155Ns	Pushpendra  	5th A	5000.00	0.00	0.00	2026-2027	0.00	5
3415	586Ns	Abbad Husain  	5th A	7500.00	0.00	700.00	2026-2027	0.00	5
3443	713Ns	Parth  	5th A	5900.00	0.00	500.00	2026-2027	0.00	5
3473	678Ns	Amar Garg  	6th A	5500.00	0.00	0.00	2026-2027	0.00	5
3457	737Ns	Satyam Pal  	5th A	8700.00	0.00	0.00	2026-2027	0.00	5
3386	738Ns	Nirbhay Gautam  	4th A	8300.00	0.00	0.00	2026-2027	0.00	5
3436	147Ns	Likhit Raj  	5th A	7900.00	0.00	800.00	2026-2027	0.00	5
3429	717Ns	Harshita  	5th A	5000.00	0.00	1000.00	2026-2027	0.00	5
3447	693Ns	Pushpendra Singh  	5th A	3000.00	0.00	0.00	2026-2027	0.00	5
3411	563Ns	Vijay  	4th A	10000.00	0.00	1600.00	2026-2027	0.00	5
3399	649Ns	Sahil  	4th A	10500.00	0.00	500.00	2026-2027	0.00	5
3395	665Ns	Ranjeet Kumar  	4th A	2200.00	0.00	0.00	2026-2027	0.00	5
3393	133Ns	Radhika  	4th A	5100.00	0.00	0.00	2026-2027	0.00	5
3469	487Ns	Abul Kasim  	6th A	11500.00	0.00	1500.00	2026-2027	0.00	5
3401	110	SARASWATI  	4th A	4800.00	0.00	0.00	2026-2027	0.00	5
3464	49	AADARSH  	6th A	5700.00	0.00	0.00	2026-2027	0.00	5
3463	593Ns	Utkarsh Singh  	5th A	5600.00	0.00	0.00	2026-2027	0.00	5
3438	106	MANI SINGH  	5th A	7500.00	0.00	1100.00	2026-2027	0.00	5
3462	202Ns	Tanishk  	5th A	9900.00	0.00	1900.00	2026-2027	0.00	5
3392	312Ns	Rachna Rajpoot 	4th A	12400.00	0.00	0.00	2026-2027	0.00	5
3387	311Ns	Paridhi Rajpoot  	4th A	12400.00	0.00	0.00	2026-2027	0.00	5
3404	464Ns	Shiva Chaturvedi  	4th A	1650.00	0.00	0.00	2026-2027	0.00	5
3433	628Ns	Kanchan  	5th A	5500.00	0.00	500.00	2026-2027	0.00	5
3451	476Ns	Rajveer Singh 	5th A	7100.00	0.00	1000.00	2026-2027	0.00	5
3420	271Ns	Amit Kumar  	5th A	2700.00	0.00	0.00	2026-2027	0.00	5
3406	50TNs	Shubh Arjariya  	4th A	6200.00	0.00	1000.00	2026-2027	0.00	5
3476	195Ns	Anjali  	6th A	0.00	0.00	0.00	2026-2027	0.00	5
3480	277Ns	Arfa Khatoon  	6th A	0.00	0.00	0.00	2026-2027	0.00	5
3482	158Ns	Asheesh Singh 	6th A	0.00	0.00	0.00	2026-2027	0.00	5
3485	517Ns	Astha Soni  	6th A	0.00	0.00	0.00	2026-2027	0.00	5
3487	198Ns	Ayush Singh Rajpoot	6th A	0.00	0.00	0.00	2026-2027	0.00	5
3491	410Ns	Devi Dayal  	6th A	0.00	0.00	0.00	2026-2027	0.00	5
3492	84	DIVYANSH  	6th A	0.00	0.00	0.00	2026-2027	0.00	5
3493	119Ns	Divyansh  	6th A	0.00	0.00	0.00	2026-2027	0.00	5
3495	95	FARHAN  	6th A	0.00	0.00	0.00	2026-2027	0.00	5
3499	356Ns	Kavya Soni  	6th A	0.00	0.00	0.00	2026-2027	0.00	5
3500	177	Kavyanjali Rajput 	6th A	0.00	0.00	0.00	2026-2027	0.00	5
3506	156Ns	Parveen  	6th A	0.00	0.00	0.00	2026-2027	0.00	5
3509	436Ns	Pratik  	6th A	0.00	0.00	0.00	2026-2027	0.00	5
3510	429Ns	Princs  	6th A	0.00	0.00	0.00	2026-2027	0.00	5
3513	150Ns	Rounak  	6th A	0.00	0.00	0.00	2026-2027	0.00	5
3518	117	SANA  	6th A	0.00	0.00	0.00	2026-2027	0.00	5
3519	518Ns	Sanskar Soni  	6th A	0.00	0.00	0.00	2026-2027	0.00	5
3520	258Ns	Shadab Khan 	6th A	0.00	0.00	0.00	2026-2027	0.00	5
3521	506Ns	Shaif  	6th A	0.00	0.00	0.00	2026-2027	0.00	5
3527	526Ns	Sudha  	6th A	0.00	0.00	0.00	2026-2027	0.00	5
3528	183Ns	Vikash Patel 	6th A	0.00	0.00	0.00	2026-2027	0.00	5
3534	500Ns	Akdas  	7th A	0.00	0.00	0.00	2026-2027	0.00	5
3540	549Ns	Ansh Sharma  	7th A	0.00	0.00	0.00	2026-2027	0.00	5
3544	577Ns	Anuj Kumar  	7th A	0.00	0.00	0.00	2026-2027	0.00	5
3545	66	ARJUN SINGH  	7th A	0.00	0.00	0.00	2026-2027	0.00	5
3549	572Ns	Divyanshi  	7th A	0.00	0.00	0.00	2026-2027	0.00	5
3550	481Ns	Fiza Fatima  	7th A	0.00	0.00	0.00	2026-2027	0.00	5
3551	149Ns	Gauri Devi 	7th A	0.00	0.00	0.00	2026-2027	0.00	5
3555	235Ns	Kavya  	7th A	0.00	0.00	0.00	2026-2027	0.00	5
3557	329Ns	Kuldeep Singh 	7th A	0.00	0.00	0.00	2026-2027	0.00	5
3559	56	NITIKA  	7th A	0.00	0.00	0.00	2026-2027	0.00	5
3561	238Ns	Pranshu  	7th A	0.00	0.00	0.00	2026-2027	0.00	5
3564	94	RYHAN  	7th A	0.00	0.00	0.00	2026-2027	0.00	5
3566	401Ns	Sanju  	7th A	0.00	0.00	0.00	2026-2027	0.00	5
3567	113	SHIVANSH SONI  	7th A	0.00	0.00	0.00	2026-2027	0.00	5
3501	615Ns	Khushi  	6th A	13300.00	0.00	1000.00	2026-2027	0.00	5
3553	636Ns	Jikara Khatoon  	7th A	8200.00	0.00	1000.00	2026-2027	0.00	5
3502	366Ns	Mo Rizvan  	6th A	15300.00	0.00	0.00	2026-2027	0.00	5
3512	157Ns	Rahul  	6th A	13000.00	0.00	1300.00	2026-2027	0.00	5
3523	383Ns	Shidara Khatoon 	6th A	5400.00	0.00	1600.00	2026-2027	0.00	5
3498	443Ns	Irsad  	6th A	4100.00	0.00	0.00	2026-2027	0.00	5
3547	73	ATUL SINGH  	7th A	3000.00	0.00	0.00	2026-2027	0.00	5
3533	647Ns	Aditya Kumar  	7th A	9300.00	0.00	0.00	2026-2027	0.00	5
3479	648Ns	Anshika  	6th A	9300.00	0.00	0.00	2026-2027	0.00	5
3556	599Ns	Khushi Devi  	7th A	9900.00	0.00	0.00	2026-2027	0.00	5
3554	525Ns	Jyoti  	7th A	7800.00	0.00	1000.00	2026-2027	0.00	5
3514	587Ns	Rudra Pratap Singh  	6th A	10200.00	0.00	0.00	2026-2027	0.00	5
3525	661Ns	Shivam  	6th A	6200.00	0.00	0.00	2026-2027	0.00	5
3537	414Ns	Ananya Singh  	7th A	8800.00	0.00	0.00	2026-2027	0.00	5
3560	203Ns	Om Dwivedi  	7th A	9500.00	0.00	1400.00	2026-2027	0.00	5
3494	392Ns	Ehasan Khan  	6th A	3400.00	0.00	0.00	2026-2027	0.00	5
3542	674Ns	Anshika  	7th A	3500.00	0.00	500.00	2026-2027	0.00	5
3563	371Ns	Rudranshi Saini  	7th A	9000.00	0.00	500.00	2026-2027	0.00	5
3526	434Ns	Shivansh  	6th A	5700.00	0.00	0.00	2026-2027	0.00	5
3569	691Ns	Siddharth Kushwaha  	7th A	2200.00	0.00	0.00	2026-2027	0.00	5
3511	751Ns	Purvi  	6th A	5700.00	0.00	1500.00	2026-2027	0.00	5
3516	711Ns	Sakshi Shivhare  	6th A	6700.00	0.00	500.00	2026-2027	0.00	5
3539	516Ns	Ansh Kumar  	7th A	11900.00	0.00	700.00	2026-2027	0.00	5
3535	488Ns	Aman Singh  	7th A	7000.00	0.00	0.00	2026-2027	0.00	5
3489	724Ns	Chhavi Yadav  	6th A	8300.00	0.00	0.00	2026-2027	0.00	5
3478	00/10/26	Ansh Gautam  	6th A	9200.00	0.00	0.00	2026-2027	0.00	5
3504	730Ns	Navneet Kumar  	6th A	6700.00	0.00	0.00	2026-2027	0.00	5
3565	677Ns	Samar  	7th A	5500.00	0.00	0.00	2026-2027	0.00	5
3548	744Ns	Ayush Kumar Pathak  	7th A	6700.00	0.00	0.00	2026-2027	0.00	5
3538	641Ns	Ansh Kashaundhan  	7th A	11900.00	0.00	1900.00	2026-2027	0.00	5
3522	643Ns	Shaory Pathak  	6th A	11800.00	0.00	0.00	2026-2027	0.00	5
3532	530Ns	Adarsh Pandey  	7th A	6450.00	0.00	300.00	2026-2027	0.00	5
3486	469Ns	Ayush Chaturvedi 	6th A	4700.00	0.00	0.00	2026-2027	0.00	5
3552	502Ns	Himanshi Tiwari  	7th A	10700.00	0.00	3700.00	2026-2027	0.00	5
3524	237Ns	Shiksha Srivastava  	6th A	11100.00	0.00	1200.00	2026-2027	0.00	5
3568	494Ns	Shubh  	7th A	9900.00	0.00	1400.00	2026-2027	0.00	5
3505	521Ns	Nidhi Rajpoot  	6th A	1500.00	0.00	0.00	2026-2027	0.00	5
3484	395Ns	Ashish Kumar Sahu  	6th A	3600.00	0.00	0.00	2026-2027	0.00	5
3529	Nsps2026	Vipin  	6th A	2800.00	0.00	0.00	2026-2027	0.00	5
3508	465Ns	Pranshi  	6th A	2400.00	0.00	0.00	2026-2027	0.00	5
3558	557Ns	Lav Singh  	7th A	5700.00	0.00	0.00	2026-2027	0.00	5
3483	322Ns	Ashish  	6th A	4500.00	0.00	0.00	2026-2027	0.00	5
3503	477Ns	Muhammad Humaid  	6th A	8400.00	0.00	0.00	2026-2027	0.00	5
3507	59	PRANSHI  	6th A	5700.00	0.00	0.00	2026-2027	0.00	5
3530	555Ns	Abhi SIngh  	7th A	2900.00	0.00	0.00	2026-2027	0.00	5
3496	758Ns	Gyanendra Kumar  	6th A	8300.00	0.00	0.00	2026-2027	0.00	5
3477	159Ns	Ankit  	6th A	5500.00	0.00	0.00	2026-2027	0.00	5
3515	671Ns	Sachin  	6th A	3000.00	0.00	0.00	2026-2027	0.00	5
3488	588Ns	Chanchal  	6th A	6800.00	0.00	0.00	2026-2027	0.00	5
3546	417Ns	Atharva  Gupta	7th A	5700.00	0.00	900.00	2026-2027	0.00	5
3541	463Ns	Anshika  	7th A	1750.00	0.00	0.00	2026-2027	0.00	5
3481	379Ns	Aryan  	6th A	11100.00	0.00	600.00	2026-2027	0.00	5
3490	00/2/07/26	Chhotu  	6th A	4200.00	0.00	0.00	2026-2027	0.00	5
3536	23	ANANYA RAJPOOT  	7th A	12800.00	0.00	1000.00	2026-2027	0.00	5
3572	437Ns	Umaira Khatun  	7th A	0.00	0.00	0.00	2026-2027	0.00	5
3573	239Ns	Zikra Husain  	7th A	0.00	0.00	0.00	2026-2027	0.00	5
3574	187Ns	Aditya Agnihotri 	8th A	0.00	0.00	0.00	2026-2027	0.00	5
3576	85	ANSHIKA  	8th A	0.00	0.00	0.00	2026-2027	0.00	5
3579	189Ns	Astha Tiwari 	8th A	0.00	0.00	0.00	2026-2027	0.00	5
3581	151	Ayush Shukla 	8th A	0.00	0.00	0.00	2026-2027	0.00	5
3582	65	JANHAVI  	8th A	0.00	0.00	0.00	2026-2027	0.00	5
3586	90	NOUMAN KHAN  	8th A	0.00	0.00	0.00	2026-2027	0.00	5
3587	583Ns	Om Soni  	8th A	0.00	0.00	0.00	2026-2027	0.00	5
3592	110Ns	Rashi  	8th A	0.00	0.00	0.00	2026-2027	0.00	5
3595	334Ns	Saksham Panday  	8th A	0.00	0.00	0.00	2026-2027	0.00	5
3601	419Ns	Sumit Kumar  	8th A	0.00	0.00	0.00	2026-2027	0.00	5
3606	70	YASHI DWIVEDI  	8th A	0.00	0.00	0.00	2026-2027	0.00	5
3607	638Ns	Abhimanyu Singh  	Nursery A	0.00	0.00	0.00	2026-2027	0.00	5
3608	625Ns	Arpit  	Nursery A	0.00	0.00	0.00	2026-2027	0.00	5
3613	637Ns	Pranav  	Nursery A	0.00	0.00	0.00	2026-2027	0.00	5
3616	651Ns	Shivshant  	Nursery A	0.00	0.00	0.00	2026-2027	0.00	5
3618	266Ns	Aiman Siddiqui 	9th EM B	0.00	0.00	0.00	2026-2027	0.00	5
3619	571Ns	Anand Kumar  	9th EM B	0.00	0.00	0.00	2026-2027	0.00	5
3621	78Ns	ANKUR  	9th EM B	0.00	0.00	0.00	2026-2027	0.00	5
3622	78	ANSH  	9th EM B	0.00	0.00	0.00	2026-2027	0.00	5
3625	217Ns	Arfaz Khan  	9th EM B	0.00	0.00	0.00	2026-2027	0.00	5
3627	000/26/8	Atul Singh  	9th EM B	0.00	0.00	0.00	2026-2027	0.00	5
3628	52	BRAMH DIVYA RAIKWAR  	9th EM B	0.00	0.00	0.00	2026-2027	0.00	5
3629	397Ns	Chandra Bhan  	9th EM B	0.00	0.00	0.00	2026-2027	0.00	5
3630	89	DILSHAD KHAN  	9th EM B	0.00	0.00	0.00	2026-2027	0.00	5
3632	229Ns	Krishna  Dwivedi	9th EM B	0.00	0.00	0.00	2026-2027	0.00	5
3633	425Ns	Krishne  	9th EM B	0.00	0.00	0.00	2026-2027	0.00	5
3634	91	LAVKUSH  	9th EM B	0.00	0.00	0.00	2026-2027	0.00	5
3639	568Ns	Piyush Singh  	9th EM B	0.00	0.00	0.00	2026-2027	0.00	5
3642	541Ns	Sadaf Khatoon  	9th EM B	0.00	0.00	0.00	2026-2027	0.00	5
3643	257Ns	Sahid  	9th EM B	0.00	0.00	0.00	2026-2027	0.00	5
3651	736Ns	Kirti Tiwari  	1st B	0.00	0.00	0.00	2026-2027	0.00	5
3571	614Ns	Swati  	7th A	13300.00	0.00	1000.00	2026-2027	0.00	5
3659	623Ns	Sarang Singh  	1st B	5200.00	0.00	500.00	2026-2027	0.00	5
3609	624Ns	Ayansh  	Nursery A	8900.00	0.00	0.00	2026-2027	0.00	5
3660	627Ns	Sarthak  	1st B	7100.00	0.00	0.00	2026-2027	0.00	5
3652	630Ns	Krishna Kushwaha  	1st B	7400.00	0.00	0.00	2026-2027	0.00	5
3615	726Ns	Shivansh Shivhare  	Nursery A	1900.00	0.00	0.00	2026-2027	0.00	5
3644	741Ns	Akhil Pratap Singh Bhadoriya  	1st B	5600.00	0.00	0.00	2026-2027	0.00	5
3575	569Ns	Amit  	8th A	700.00	0.00	0.00	2026-2027	0.00	5
3583	333Ns	Manvi Sonkar  	8th A	3200.00	0.00	100.00	2026-2027	0.00	5
3594	369Ns	Rohit  	8th A	6300.00	0.00	600.00	2026-2027	0.00	5
3648	755Ns	Chiraag Patel  	1st B	4000.00	0.00	0.00	2026-2027	0.00	5
3599	42	SHIVENDRA  	8th A	2600.00	0.00	0.00	2026-2027	0.00	5
3597	41	SATENDRA  	8th A	2400.00	0.00	0.00	2026-2027	0.00	5
3636	480Ns	Manshi  	9th EM B	12000.00	0.00	0.00	2026-2027	0.00	5
3657	662Ns	Pooja  	1st B	3000.00	0.00	0.00	2026-2027	0.00	5
3590	27	POOJA  	8th A	5400.00	0.00	0.00	2026-2027	0.00	5
3661	669Ns	Sayyed Khansa Khatoon  	1st B	5600.00	0.00	0.00	2026-2027	0.00	5
3585	673Ns	Nandni Shivhare  	8th A	3000.00	0.00	0.00	2026-2027	0.00	5
3656	675Ns	Piyush  	1st B	3200.00	0.00	0.00	2026-2027	0.00	5
3611	684Ns	Kartik  	Nursery A	11800.00	0.00	0.00	2026-2027	0.00	5
3649	681Ns	Harshit Rajput  	1st B	7900.00	0.00	0.00	2026-2027	0.00	5
3655	700Ns	Mini Devi  	1st B	4800.00	0.00	0.00	2026-2027	0.00	5
3653	702Ns	Manas  	1st B	5600.00	0.00	0.00	2026-2027	0.00	5
3645	705Ns	Ananya  	1st B	5500.00	0.00	2000.00	2026-2027	0.00	5
3637	00046	Namovashu Dev Shukla  	9th EM B	19200.00	0.00	0.00	2026-2027	0.00	5
3626	34	ASHISH KUMAR  	9th EM B	14000.00	0.00	600.00	2026-2027	0.00	5
3631	603Ns	Indranil Pal  	9th EM B	12600.00	0.00	0.00	2026-2027	0.00	5
3635	72	MANGESH SINGH  	9th EM B	12000.00	0.00	0.00	2026-2027	0.00	5
3617	710Ns	Suryansh Singh  	Nursery A	3000.00	0.00	1000.00	2026-2027	0.00	5
3654	714Ns	Mayara  	1st B	5600.00	0.00	500.00	2026-2027	0.00	5
3589	205Ns	Piyush  	8th A	12000.00	0.00	0.00	2026-2027	0.00	5
3578	545Ns	Aradhy  	8th A	7500.00	0.00	0.00	2026-2027	0.00	5
3647	725Ns	Ayush Yadav  	1st B	6900.00	0.00	0.00	2026-2027	0.00	5
3612	721Ns	Manushree  	Nursery A	11800.00	0.00	0.00	2026-2027	0.00	5
3588	226Ns	Pavani  	8th A	7500.00	0.00	0.00	2026-2027	0.00	5
3580	729Ns	Astosh  	8th A	6700.00	0.00	0.00	2026-2027	0.00	5
3605	581Ns	Vaishnavi  	8th A	25100.00	0.00	0.00	2026-2027	0.00	5
3623	743Ns	Anushka Pathak  	9th EM B	15200.00	0.00	0.00	2026-2027	0.00	5
3620	135Ns	Ankit  	9th EM B	11800.00	0.00	0.00	2026-2027	0.00	5
3603	98	UTKARSH TRIVEDI  	8th A	9100.00	0.00	1400.00	2026-2027	0.00	5
3640	00nsps2	Pradum Sonkar  	9th EM B	7300.00	0.00	0.00	2026-2027	0.00	5
3650	756Ns	Jay Mishra  	1st B	7600.00	0.00	0.00	2026-2027	0.00	5
3624	00/26/8	Aradhya Singh  	9th EM B	17200.00	0.00	500.00	2026-2027	0.00	5
3598	544Ns	Shivam  	8th A	6400.00	0.00	0.00	2026-2027	0.00	5
3614	759Ns	Sarvgya Tripathi  	Nursery A	6900.00	0.00	1400.00	2026-2027	0.00	5
3577	394Ns	Anuj Kumar  	8th A	3600.00	0.00	100.00	2026-2027	0.00	5
3591	543Ns	Prtyush Kumar Tripathi  	8th A	6900.00	0.00	1000.00	2026-2027	0.00	5
3593	134Ns	Ritika  	8th A	5700.00	0.00	0.00	2026-2027	0.00	5
3600	50	SRUTI  	8th A	5700.00	0.00	0.00	2026-2027	0.00	5
3638	161Ns	Neelam Devi 	9th EM B	11200.00	0.00	0.00	2026-2027	0.00	5
3604	201Ns	Vaibhav Kasaudhan 	8th A	10700.00	0.00	2400.00	2026-2027	0.00	5
3596	314Ns	Samir Ahamad  	8th A	4300.00	0.00	0.00	2026-2027	0.00	5
3602	127Ns	Tabbusum  	8th A	5300.00	0.00	0.00	2026-2027	0.00	5
3658	635Ns	Rewati  	1st B	4700.00	0.00	0.00	2026-2027	0.00	5
3668	390Ns	Gufran Khan  	10th A	0.00	0.00	0.00	2026-2027	0.00	5
3669	57	KRITIKA  	10th A	0.00	0.00	0.00	2026-2027	0.00	5
3673	241Ns	Umra Husain  	10th A	0.00	0.00	0.00	2026-2027	0.00	5
3672	35	SAMEER  	10th A	5400.00	0.00	0.00	2026-2027	0.00	5
3543	248	Anshvi  	7th A	5400.00	0.00	0.00	2026-2027	0.00	5
3610	613	Hasnaian  	Nursery A	7700.00	0.00	0.00	2026-2027	0.00	5
3437	616Ns	Mahima  	5th A	12100.00	0.00	5300.00	2026-2027	0.00	5
3291	243Ns	Aman  	3rd A	1400.00	0.00	0.00	2026-2027	0.00	5
3584	382Ns	Mohammad Shan Ahmad 	8th A	5400.00	0.00	1600.00	2026-2027	0.00	5
3562	508Ns	Prinsh Yadav  	7th A	1850.00	0.00	0.00	2026-2027	0.00	5
3318	668Ns	Mohammad Faij Jaid Momin Sayyad  	3rd A	5900.00	0.00	0.00	2026-2027	0.00	5
3272	405Ns	Shanvi Soni  	2nd A	7500.00	0.00	1600.00	2026-2027	0.00	5
3666	303Ns	Aman  	10th A	7400.00	0.00	800.00	2026-2027	0.00	5
3663	696Ns	Srishti  	1st B	6800.00	0.00	1000.00	2026-2027	0.00	5
3383	244Ns	Kishan  Tripathi	4th A	5100.00	0.00	0.00	2026-2027	0.00	5
3570	391Ns	Sufiyan Khan  	7th A	2600.00	0.00	0.00	2026-2027	0.00	5
3497	585Ns	Hammad Husain  	6th A	6200.00	0.00	0.00	2026-2027	0.00	5
3665	33	ABHISHEK KUMAR  	10th A	11500.00	0.00	0.00	2026-2027	0.00	5
3662	708Ns	Shivkanya  	1st B	4800.00	0.00	0.00	2026-2027	0.00	5
3309	728Ns	Dheeraj Kumar Kushwaha  	3rd A	4100.00	0.00	800.00	2026-2027	0.00	5
3270	618Ns	Sapna  	2nd A	9500.00	0.00	1400.00	2026-2027	0.00	5
3670	364Ns	Mo Rehan Raza  	10th A	24100.00	0.00	0.00	2026-2027	0.00	5
3257	367Ns	Pankaj Rao 	2nd A	4400.00	0.00	0.00	2026-2027	0.00	5
3465	128Ns	Abhi Raikwar 	6th A	5700.00	0.00	100.00	2026-2027	0.00	5
3531	501Ns	Abhinendra Tiwari  	7th A	10700.00	0.00	3700.00	2026-2027	0.00	5
3646	732Ns	Ashish Kumar Gautam  	1st B	12200.00	0.00	0.00	2026-2027	0.00	5
3674	00/26/7	Vishal Singh  	10th A	17200.00	0.00	0.00	2026-2027	0.00	5
3664	757Ns	Umme Zainab  	1st B	7400.00	0.00	400.00	2026-2027	0.00	5
3292	357Ns	Aman Nishad  	3rd A	4500.00	0.00	1100.00	2026-2027	0.00	5
3431	629Ns	Himanshu Kushwaha  	5th A	5000.00	0.00	0.00	2026-2027	0.00	5
3517	704Ns	Samar Singh  	6th A	2500.00	0.00	0.00	2026-2027	0.00	5
3248	485Ns	Mohammad Ujaif  	2nd A	7800.00	0.00	1500.00	2026-2027	0.00	5
3667	416Ns	Ananya Gupta  	10th A	11500.00	0.00	1100.00	2026-2027	0.00	5
3671	228Ns	Pavani  	10th A	10700.00	0.00	1400.00	2026-2027	0.00	5
3390	552Ns	Pratik Singh  	4th A	6000.00	0.00	0.00	2026-2027	0.00	5
3641	332Ns	Priya Sonkar  	9th EM B	6400.00	0.00	0.00	2026-2027	0.00	5
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.users (id, username, password_hash, role, status, created_at, school_id) FROM stdin;
41178b40-d9d3-468f-855c-87c12b450c1f	admin	$2b$10$GuvlQ2UrjJmsDH5Mb0k6J.ctuPNQn80rnqcfpW6mEnT4.Swm0oOoq	SUPER_ADMIN	ACTIVE	2026-08-07 01:39:31.864128	1
899f05cc-1c05-4eb0-a7e7-f46d26991f0d	mohitshukla57662+test@gmail.com	$2b$10$jd276iOcPv0aJqAY18Zc4eEFShQGdiuDsV7zmzrL0IB6s5cR0y0be	SUPER_ADMIN	ACTIVE	2026-08-07 10:31:12.869152	2
0cb28fa7-23b9-4c26-84f9-2276d28784b2	mohitshukla57662@gmail.com	$2b$10$vSv13A9SLkony8x4ryyO6uyJQtwMVQtpdMwGVT/LuEl1hxbrESZe2	SUPER_ADMIN	ACTIVE	2026-08-07 10:31:51.402941	3
28105979-0cd2-47a8-9ec9-2e4910b95f40	admin1@school.com	$2b$10$aXjfY7Cm6W6OY5.ojvEJB.g244Zs3W68Vb2HWEOcMjVu7m54ptaPm	SUPER_ADMIN	ACTIVE	2026-08-07 10:34:58.276376	5
\.


--
-- Name: fee_heads_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.fee_heads_id_seq', 1, true);


--
-- Name: fee_ledger_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.fee_ledger_id_seq', 2878, true);


--
-- Name: schools_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.schools_id_seq', 5, true);


--
-- Name: students_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.students_id_seq', 3674, true);


--
-- Name: classes classes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.classes
    ADD CONSTRAINT classes_pkey PRIMARY KEY (id);


--
-- Name: exams exams_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.exams
    ADD CONSTRAINT exams_pkey PRIMARY KEY (id);


--
-- Name: fee_heads fee_heads_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fee_heads
    ADD CONSTRAINT fee_heads_pkey PRIMARY KEY (id);


--
-- Name: fee_ledger fee_ledger_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fee_ledger
    ADD CONSTRAINT fee_ledger_pkey PRIMARY KEY (id);


--
-- Name: fee_ledger fee_ledger_receipt_no_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fee_ledger
    ADD CONSTRAINT fee_ledger_receipt_no_key UNIQUE (receipt_no);


--
-- Name: marks marks_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.marks
    ADD CONSTRAINT marks_pkey PRIMARY KEY (id);


--
-- Name: marks marks_student_id_exam_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.marks
    ADD CONSTRAINT marks_student_id_exam_id_key UNIQUE (student_id, exam_id);


--
-- Name: schools schools_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.schools
    ADD CONSTRAINT schools_pkey PRIMARY KEY (id);


--
-- Name: schools schools_subdomain_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.schools
    ADD CONSTRAINT schools_subdomain_key UNIQUE (subdomain);


--
-- Name: sessions sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sessions
    ADD CONSTRAINT sessions_pkey PRIMARY KEY (id);


--
-- Name: students students_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.students
    ADD CONSTRAINT students_pkey PRIMARY KEY (id);


--
-- Name: students students_school_adm_year_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.students
    ADD CONSTRAINT students_school_adm_year_key UNIQUE (school_id, adm_no, academic_year);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: users users_username_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_username_key UNIQUE (username);


--
-- Name: exams exams_session_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.exams
    ADD CONSTRAINT exams_session_id_fkey FOREIGN KEY (session_id) REFERENCES public.sessions(id);


--
-- Name: fee_heads fee_heads_school_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fee_heads
    ADD CONSTRAINT fee_heads_school_id_fkey FOREIGN KEY (school_id) REFERENCES public.schools(id);


--
-- Name: fee_ledger fee_ledger_fee_head_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fee_ledger
    ADD CONSTRAINT fee_ledger_fee_head_id_fkey FOREIGN KEY (fee_head_id) REFERENCES public.fee_heads(id);


--
-- Name: fee_ledger fee_ledger_school_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fee_ledger
    ADD CONSTRAINT fee_ledger_school_id_fkey FOREIGN KEY (school_id) REFERENCES public.schools(id);


--
-- Name: marks marks_exam_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.marks
    ADD CONSTRAINT marks_exam_id_fkey FOREIGN KEY (exam_id) REFERENCES public.exams(id);


--
-- Name: students students_school_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.students
    ADD CONSTRAINT students_school_id_fkey FOREIGN KEY (school_id) REFERENCES public.schools(id);


--
-- Name: users users_school_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_school_id_fkey FOREIGN KEY (school_id) REFERENCES public.schools(id);


--
-- PostgreSQL database dump complete
--

\unrestrict fsuhhCWVehm1oPVEAFmuoSBcYsAApJ0LCdyeNBWqQXLDILIbzrvkr6BJsfmqJ9d

