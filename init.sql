--
-- PostgreSQL database dump
--

-- Dumped from database version 14.6 (Ubuntu 14.6-0ubuntu0.22.04.1)
-- Dumped by pg_dump version 14.6 (Ubuntu 14.6-0ubuntu0.22.04.1)

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
-- Name: enum_transcripts_status; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.enum_transcripts_status AS ENUM (
    'Q',
    'NQ',
    'RQ'
);


ALTER TYPE public.enum_transcripts_status OWNER TO postgres;

--
-- Name: enum_users_permissions; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.enum_users_permissions AS ENUM (
    'reviewer',
    'admin'
);


ALTER TYPE public.enum_users_permissions OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: reviews; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.reviews (
    id integer NOT NULL,
    "claimedAt" timestamp with time zone,
    "submittedAt" timestamp with time zone,
    "mergedAt" timestamp with time zone,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL,
    "userId" integer,
    "transcriptId" integer
);


ALTER TABLE public.reviews OWNER TO postgres;

--
-- Name: reviews_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.reviews_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.reviews_id_seq OWNER TO postgres;

--
-- Name: reviews_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.reviews_id_seq OWNED BY public.reviews.id;


--
-- Name: transcripts; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.transcripts (
    id integer NOT NULL,
    title character varying(255),
    content json,
    "originalContent" json,
    status public.enum_transcripts_status DEFAULT 'NQ'::public.enum_transcripts_status NOT NULL,
    "archivedAt" timestamp with time zone,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL
);


ALTER TABLE public.transcripts OWNER TO postgres;

--
-- Name: transcripts_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.transcripts_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.transcripts_id_seq OWNER TO postgres;

--
-- Name: transcripts_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.transcripts_id_seq OWNED BY public.transcripts.id;


--
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users (
    id integer NOT NULL,
    "githubUsername" character varying(255) NOT NULL,
    "authToken" character varying(255),
    permissions public.enum_users_permissions DEFAULT 'reviewer'::public.enum_users_permissions NOT NULL,
    "archivedAt" timestamp with time zone,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL
);


ALTER TABLE public.users OWNER TO postgres;

--
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.users_id_seq OWNER TO postgres;

--
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- Name: reviews id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.reviews ALTER COLUMN id SET DEFAULT nextval('public.reviews_id_seq'::regclass);


--
-- Name: transcripts id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.transcripts ALTER COLUMN id SET DEFAULT nextval('public.transcripts_id_seq'::regclass);


--
-- Name: users id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- Data for Name: reviews; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.reviews (id, "claimedAt", "submittedAt", "mergedAt", "createdAt", "updatedAt", "userId", "transcriptId") FROM stdin;
3	\N	\N	\N	2023-03-03 15:55:35.809+03	2023-03-03 15:55:35.809+03	1	\N
4	2023-03-03 16:04:25+03	2023-04-03 03:00:00+03	\N	2023-03-03 15:59:26.393+03	2023-03-03 16:08:44.329+03	1	\N
\.


--
-- Data for Name: transcripts; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.transcripts (id, title, content, "originalContent", status, "archivedAt", "createdAt", "updatedAt") FROM stdin;
1	Activación de Taproot	{"title":"Activación de Taproot y LOT=true vs LOT=false","transcript_by":"Michael Folkson","translation_by":"Blue Moon","categories":["podcast"],"tags":["taproot"],"date":"2021-02-26T00:00:00.000Z","speakers":["Sjors Provoost","Aaron van Wirdum"],"media":"https://www.youtube.com/watch?v=7ouVGgE75zg","body":"Localización: Bitcoin Magazine (en línea)\\n\\nBIP 8: …","iso8601Date":"2021-02-26T03:00:00+03:00"}	\N	NQ	\N	2023-03-03 15:52:00.514+03	2023-03-03 15:52:00.514+03
2	Activación de Taproot	{"title":"Activación de Taproot y LOT=true vs LOT=false","transcript_by":"Michael Folkson","translation_by":"Blue Moon","categories":["podcast"],"tags":["taproot"],"date":"2021-02-26T00:00:00.000Z","speakers":["Sjors Provoost","Aaron van Wirdum"],"media":"https://www.youtube.com/watch?v=7ouVGgE75zg","body":"Localización: Bitcoin Magazine (en línea)\\n\\nBIP 8: …","iso8601Date":"2021-02-26T03:00:00+03:00"}	\N	NQ	\N	2023-03-03 15:52:26.145+03	2023-03-03 15:52:26.145+03
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.users (id, "githubUsername", "authToken", permissions, "archivedAt", "createdAt", "updatedAt") FROM stdin;
1	nasser	\N	reviewer	\N	2023-03-03 15:44:56.45+03	2023-03-03 15:44:56.45+03
\.


--
-- Name: reviews_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.reviews_id_seq', 4, true);


--
-- Name: transcripts_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.transcripts_id_seq', 2, true);


--
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.users_id_seq', 1, true);


--
-- Name: reviews reviews_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.reviews
    ADD CONSTRAINT reviews_pkey PRIMARY KEY (id);


--
-- Name: transcripts transcripts_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.transcripts
    ADD CONSTRAINT transcripts_pkey PRIMARY KEY (id);


--
-- Name: users users_authToken_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT "users_authToken_key" UNIQUE ("authToken");


--
-- Name: users users_githubUsername_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT "users_githubUsername_key" UNIQUE ("githubUsername");


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: reviews reviews_transcriptId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.reviews
    ADD CONSTRAINT "reviews_transcriptId_fkey" FOREIGN KEY ("transcriptId") REFERENCES public.transcripts(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: reviews reviews_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.reviews
    ADD CONSTRAINT "reviews_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- PostgreSQL database dump complete
--

