--
-- PostgreSQL database dump
--

-- Dumped from database version 17.6
-- Dumped by pg_dump version 17.1

-- Started on 2025-08-18 23:12:49

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- TOC entry 4897 (class 1262 OID 16389)
-- Name: HernandezHotrods; Type: DATABASE; Schema: -; Owner: -
--


\connect "HernandezHotrods"

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- TOC entry 5 (class 2615 OID 2200)
-- Name: public; Type: SCHEMA; Schema: -; Owner: -
--

-- *not* creating schema, since initdb creates it


--
-- TOC entry 225 (class 1255 OID 16404)
-- Name: set_updated_at(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.set_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- TOC entry 220 (class 1259 OID 16407)
-- Name: build_photos; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.build_photos (
    id integer NOT NULL,
    build_id integer NOT NULL,
    url text NOT NULL,
    alt text,
    sort_order integer DEFAULT 0 NOT NULL
);


--
-- TOC entry 219 (class 1259 OID 16406)
-- Name: build_photos_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.build_photos_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 4898 (class 0 OID 0)
-- Dependencies: 219
-- Name: build_photos_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.build_photos_id_seq OWNED BY public.build_photos.id;


--
-- TOC entry 224 (class 1259 OID 16437)
-- Name: build_section_items; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.build_section_items (
    id integer NOT NULL,
    section_id integer NOT NULL,
    text text NOT NULL,
    sort_order integer DEFAULT 0 NOT NULL
);


--
-- TOC entry 223 (class 1259 OID 16436)
-- Name: build_section_items_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.build_section_items_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 4899 (class 0 OID 0)
-- Dependencies: 223
-- Name: build_section_items_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.build_section_items_id_seq OWNED BY public.build_section_items.id;


--
-- TOC entry 222 (class 1259 OID 16422)
-- Name: build_sections; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.build_sections (
    id integer NOT NULL,
    build_id integer NOT NULL,
    title text NOT NULL,
    sort_order integer DEFAULT 0 NOT NULL
);


--
-- TOC entry 221 (class 1259 OID 16421)
-- Name: build_sections_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.build_sections_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 4900 (class 0 OID 0)
-- Dependencies: 221
-- Name: build_sections_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.build_sections_id_seq OWNED BY public.build_sections.id;


--
-- TOC entry 218 (class 1259 OID 16391)
-- Name: builds; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.builds (
    id integer NOT NULL,
    slug text NOT NULL,
    name text NOT NULL,
    subtitle text,
    hero_image text,
    thumb_image text,
    is_published boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    owner_name character varying(255)
);


--
-- TOC entry 217 (class 1259 OID 16390)
-- Name: builds_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.builds_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 4901 (class 0 OID 0)
-- Dependencies: 217
-- Name: builds_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.builds_id_seq OWNED BY public.builds.id;


--
-- TOC entry 4715 (class 2604 OID 16410)
-- Name: build_photos id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.build_photos ALTER COLUMN id SET DEFAULT nextval('public.build_photos_id_seq'::regclass);


--
-- TOC entry 4719 (class 2604 OID 16440)
-- Name: build_section_items id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.build_section_items ALTER COLUMN id SET DEFAULT nextval('public.build_section_items_id_seq'::regclass);


--
-- TOC entry 4717 (class 2604 OID 16425)
-- Name: build_sections id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.build_sections ALTER COLUMN id SET DEFAULT nextval('public.build_sections_id_seq'::regclass);


--
-- TOC entry 4711 (class 2604 OID 16394)
-- Name: builds id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.builds ALTER COLUMN id SET DEFAULT nextval('public.builds_id_seq'::regclass);


--
-- TOC entry 4887 (class 0 OID 16407)
-- Dependencies: 220
-- Data for Name: build_photos; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.build_photos VALUES (1, 1, '/images/builds/1969-camaro-rs/1.jpg', 'Front three-quarter', 1);
INSERT INTO public.build_photos VALUES (2, 1, '/images/builds/1969-camaro-rs/2.jpg', 'Engine bay', 2);
INSERT INTO public.build_photos VALUES (3, 1, '/images/builds/1969-camaro-rs/3.jpg', 'Interior', 3);
INSERT INTO public.build_photos VALUES (4, 2, '/images/builds/1955-chevy-3100/1.jpg', 'Side profile', 1);
INSERT INTO public.build_photos VALUES (5, 2, '/images/builds/1955-chevy-3100/2.jpg', 'Cab interior', 2);


--
-- TOC entry 4891 (class 0 OID 16437)
-- Dependencies: 224
-- Data for Name: build_section_items; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.build_section_items VALUES (1, 1, '6.2L LS with mild cam & headers', 1);
INSERT INTO public.build_section_items VALUES (2, 1, 'T56 6-speed manual', 2);
INSERT INTO public.build_section_items VALUES (3, 2, 'Coilovers w/ adjustable damping', 1);
INSERT INTO public.build_section_items VALUES (4, 2, 'Wilwood 6-piston fronts', 2);
INSERT INTO public.build_section_items VALUES (5, 3, 'RetroSound head unit + hidden amp', 1);
INSERT INTO public.build_section_items VALUES (6, 3, 'Digital dash cluster', 2);
INSERT INTO public.build_section_items VALUES (7, 4, 'Graphite grey, satin stripes', 1);
INSERT INTO public.build_section_items VALUES (8, 5, 'Fuel-injected small block V8', 1);
INSERT INTO public.build_section_items VALUES (9, 5, '4L60E automatic', 2);
INSERT INTO public.build_section_items VALUES (10, 6, 'Front disc conversion', 1);
INSERT INTO public.build_section_items VALUES (11, 7, 'Vintage Air A/C + heat', 1);
INSERT INTO public.build_section_items VALUES (12, 7, 'Refreshed wiring harness', 2);


--
-- TOC entry 4889 (class 0 OID 16422)
-- Dependencies: 222
-- Data for Name: build_sections; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.build_sections VALUES (1, 1, 'Engine & Driveline', 1);
INSERT INTO public.build_sections VALUES (2, 1, 'Chassis & Suspension', 2);
INSERT INTO public.build_sections VALUES (3, 1, 'Interior & Electronics', 3);
INSERT INTO public.build_sections VALUES (4, 1, 'Body & Paint', 4);
INSERT INTO public.build_sections VALUES (5, 2, 'Powertrain', 1);
INSERT INTO public.build_sections VALUES (6, 2, 'Brakes & Handling', 2);
INSERT INTO public.build_sections VALUES (7, 2, 'Comfort & Finish', 3);


--
-- TOC entry 4885 (class 0 OID 16391)
-- Dependencies: 218
-- Data for Name: builds; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.builds VALUES (1, '1969-camaro-rs', '1969 Camaro RS', 'Pro-touring street build', '/images/builds/1969-camaro-rs/hero.jpg', '/images/builds/1969-camaro-rs/thumb.jpg', true, '2025-08-14 20:08:31.187581-06', '2025-08-18 18:43:05.072638-06', 'Austin Erickson');
INSERT INTO public.builds VALUES (2, '1955-chevy-3100', '1955 Chevy 3100', 'Subtle restomod with modern comforts', '/images/builds/1955-chevy-3100/hero.jpg', '/images/builds/1955-chevy-3100/thumb.jpg', true, '2025-08-14 20:08:31.187581-06', '2025-08-18 18:43:05.072638-06', 'Eric Chandler');
INSERT INTO public.builds VALUES (3, '1970-c10-shop-truck', '1970 C10 “Shop Truck”', 'LS-swapped daily cruiser', '/images/builds/1970-c10/hero.jpg', '/images/builds/1970-c10/thumb.jpg', true, '2025-08-14 20:08:31.187581-06', '2025-08-18 18:43:05.072638-06', 'Tom Smith');
INSERT INTO public.builds VALUES (4, '1968-mustang-fastback', '1968 Mustang Fastback', 'Track-inspired weekend car', '/images/builds/1968-mustang-fastback/hero.jpg', '/images/builds/1968-mustang-fastback/thumb.jpg', true, '2025-08-14 20:08:31.187581-06', '2025-08-18 18:43:05.072638-06', 'Richard Howard');
INSERT INTO public.builds VALUES (5, '1979-trans-am', '1979 Trans Am', 'Street machine with attitude', '/images/builds/1979-trans-am/hero.jpg', '/images/builds/1979-trans-am/thumb.jpg', true, '2025-08-14 20:08:31.187581-06', '2025-08-18 18:43:05.072638-06', 'John King');


--
-- TOC entry 4902 (class 0 OID 0)
-- Dependencies: 219
-- Name: build_photos_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.build_photos_id_seq', 5, true);


--
-- TOC entry 4903 (class 0 OID 0)
-- Dependencies: 223
-- Name: build_section_items_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.build_section_items_id_seq', 12, true);


--
-- TOC entry 4904 (class 0 OID 0)
-- Dependencies: 221
-- Name: build_sections_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.build_sections_id_seq', 7, true);


--
-- TOC entry 4905 (class 0 OID 0)
-- Dependencies: 217
-- Name: builds_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.builds_id_seq', 5, true);


--
-- TOC entry 4727 (class 2606 OID 16415)
-- Name: build_photos build_photos_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.build_photos
    ADD CONSTRAINT build_photos_pkey PRIMARY KEY (id);


--
-- TOC entry 4733 (class 2606 OID 16445)
-- Name: build_section_items build_section_items_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.build_section_items
    ADD CONSTRAINT build_section_items_pkey PRIMARY KEY (id);


--
-- TOC entry 4730 (class 2606 OID 16430)
-- Name: build_sections build_sections_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.build_sections
    ADD CONSTRAINT build_sections_pkey PRIMARY KEY (id);


--
-- TOC entry 4722 (class 2606 OID 16401)
-- Name: builds builds_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.builds
    ADD CONSTRAINT builds_pkey PRIMARY KEY (id);


--
-- TOC entry 4724 (class 2606 OID 16403)
-- Name: builds builds_slug_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.builds
    ADD CONSTRAINT builds_slug_key UNIQUE (slug);


--
-- TOC entry 4725 (class 1259 OID 16451)
-- Name: idx_builds_published; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_builds_published ON public.builds USING btree (is_published);


--
-- TOC entry 4734 (class 1259 OID 16454)
-- Name: idx_items_section; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_items_section ON public.build_section_items USING btree (section_id);


--
-- TOC entry 4728 (class 1259 OID 16452)
-- Name: idx_photos_build; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_photos_build ON public.build_photos USING btree (build_id);


--
-- TOC entry 4731 (class 1259 OID 16453)
-- Name: idx_sections_build; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_sections_build ON public.build_sections USING btree (build_id);


--
-- TOC entry 4738 (class 2620 OID 16405)
-- Name: builds trg_builds_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_builds_updated_at BEFORE UPDATE ON public.builds FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- TOC entry 4735 (class 2606 OID 16416)
-- Name: build_photos build_photos_build_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.build_photos
    ADD CONSTRAINT build_photos_build_id_fkey FOREIGN KEY (build_id) REFERENCES public.builds(id) ON DELETE CASCADE;


--
-- TOC entry 4737 (class 2606 OID 16446)
-- Name: build_section_items build_section_items_section_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.build_section_items
    ADD CONSTRAINT build_section_items_section_id_fkey FOREIGN KEY (section_id) REFERENCES public.build_sections(id) ON DELETE CASCADE;


--
-- TOC entry 4736 (class 2606 OID 16431)
-- Name: build_sections build_sections_build_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.build_sections
    ADD CONSTRAINT build_sections_build_id_fkey FOREIGN KEY (build_id) REFERENCES public.builds(id) ON DELETE CASCADE;


-- Completed on 2025-08-18 23:12:49

--
-- PostgreSQL database dump complete
--

