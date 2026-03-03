--
-- PostgreSQL database dump
--

\restrict 6e8cO9pVDOblzM4h64n9hMdUEPXVMO18MRkj3fhJImnkrzhBj3saMMqkayhnslk

-- Dumped from database version 17.6
-- Dumped by pg_dump version 17.6

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
-- Name: set_updated_at(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.set_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END; $$;


SET default_tablespace = '';

SET default_table_access_method = heap;

--
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
-- Name: build_photos_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.build_photos_id_seq OWNED BY public.build_photos.id;


--
-- Name: build_section_items; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.build_section_items (
    id integer NOT NULL,
    section_id integer NOT NULL,
    text text NOT NULL,
    sort_order integer DEFAULT 0 NOT NULL
);


--
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
-- Name: build_section_items_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.build_section_items_id_seq OWNED BY public.build_section_items.id;


--
-- Name: build_sections; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.build_sections (
    id integer NOT NULL,
    build_id integer NOT NULL,
    title text NOT NULL,
    sort_order integer DEFAULT 0 NOT NULL
);


--
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
-- Name: build_sections_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.build_sections_id_seq OWNED BY public.build_sections.id;


--
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
    owner_name character varying(255),
    is_completed boolean DEFAULT false,
    thumb_image2 text
);


--
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
-- Name: builds_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.builds_id_seq OWNED BY public.builds.id;


--
-- Name: for_sale_items; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.for_sale_items (
    id integer NOT NULL,
    slug text NOT NULL,
    title text NOT NULL,
    description text NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    is_sold boolean DEFAULT false NOT NULL,
    posted_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: for_sale_items_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.for_sale_items_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: for_sale_items_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.for_sale_items_id_seq OWNED BY public.for_sale_items.id;


--
-- Name: for_sale_photos; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.for_sale_photos (
    id integer NOT NULL,
    item_id integer NOT NULL,
    url text NOT NULL,
    alt text,
    sort_order integer NOT NULL
);


--
-- Name: for_sale_photos_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.for_sale_photos_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: for_sale_photos_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.for_sale_photos_id_seq OWNED BY public.for_sale_photos.id;


--
-- Name: ig_alert_log; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.ig_alert_log (
    key text NOT NULL,
    last_sent_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: ig_tokens; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.ig_tokens (
    id integer NOT NULL,
    access_token text NOT NULL,
    expires_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: ig_tokens_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.ig_tokens_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: ig_tokens_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.ig_tokens_id_seq OWNED BY public.ig_tokens.id;


--
-- Name: session; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.session (
    sid character varying NOT NULL,
    sess json NOT NULL,
    expire timestamp(6) without time zone NOT NULL
);


--
-- Name: team; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.team (
    id bigint NOT NULL,
    name text NOT NULL,
    role text NOT NULL,
    photo_url text,
    bio text,
    sort_order integer NOT NULL
);


--
-- Name: team_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.team_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: team_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.team_id_seq OWNED BY public.team.id;


--
-- Name: users; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.users (
    id integer NOT NULL,
    email text NOT NULL,
    password_hash text NOT NULL,
    role text DEFAULT 'admin'::text NOT NULL,
    name text
);


--
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- Name: build_photos id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.build_photos ALTER COLUMN id SET DEFAULT nextval('public.build_photos_id_seq'::regclass);


--
-- Name: build_section_items id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.build_section_items ALTER COLUMN id SET DEFAULT nextval('public.build_section_items_id_seq'::regclass);


--
-- Name: build_sections id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.build_sections ALTER COLUMN id SET DEFAULT nextval('public.build_sections_id_seq'::regclass);


--
-- Name: builds id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.builds ALTER COLUMN id SET DEFAULT nextval('public.builds_id_seq'::regclass);


--
-- Name: for_sale_items id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.for_sale_items ALTER COLUMN id SET DEFAULT nextval('public.for_sale_items_id_seq'::regclass);


--
-- Name: for_sale_photos id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.for_sale_photos ALTER COLUMN id SET DEFAULT nextval('public.for_sale_photos_id_seq'::regclass);


--
-- Name: ig_tokens id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ig_tokens ALTER COLUMN id SET DEFAULT nextval('public.ig_tokens_id_seq'::regclass);


--
-- Name: team id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.team ALTER COLUMN id SET DEFAULT nextval('public.team_id_seq'::regclass);


--
-- Name: users id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- Name: build_photos build_photos_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.build_photos
    ADD CONSTRAINT build_photos_pkey PRIMARY KEY (id);


--
-- Name: build_section_items build_section_items_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.build_section_items
    ADD CONSTRAINT build_section_items_pkey PRIMARY KEY (id);


--
-- Name: build_sections build_sections_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.build_sections
    ADD CONSTRAINT build_sections_pkey PRIMARY KEY (id);


--
-- Name: builds builds_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.builds
    ADD CONSTRAINT builds_pkey PRIMARY KEY (id);


--
-- Name: builds builds_slug_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.builds
    ADD CONSTRAINT builds_slug_key UNIQUE (slug);


--
-- Name: for_sale_items for_sale_items_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.for_sale_items
    ADD CONSTRAINT for_sale_items_pkey PRIMARY KEY (id);


--
-- Name: for_sale_items for_sale_items_slug_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.for_sale_items
    ADD CONSTRAINT for_sale_items_slug_key UNIQUE (slug);


--
-- Name: for_sale_photos for_sale_photos_item_id_sort_order_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.for_sale_photos
    ADD CONSTRAINT for_sale_photos_item_id_sort_order_key UNIQUE (item_id, sort_order);


--
-- Name: for_sale_photos for_sale_photos_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.for_sale_photos
    ADD CONSTRAINT for_sale_photos_pkey PRIMARY KEY (id);


--
-- Name: ig_alert_log ig_alert_log_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ig_alert_log
    ADD CONSTRAINT ig_alert_log_pkey PRIMARY KEY (key);


--
-- Name: ig_tokens ig_tokens_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ig_tokens
    ADD CONSTRAINT ig_tokens_pkey PRIMARY KEY (id);


--
-- Name: session session_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.session
    ADD CONSTRAINT session_pkey PRIMARY KEY (sid);


--
-- Name: team team_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.team
    ADD CONSTRAINT team_pkey PRIMARY KEY (id);


--
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: IDX_session_expire; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_session_expire" ON public.session USING btree (expire);


--
-- Name: idx_builds_published; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_builds_published ON public.builds USING btree (is_published);


--
-- Name: idx_for_sale_photos_item_order; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_for_sale_photos_item_order ON public.for_sale_photos USING btree (item_id, sort_order);


--
-- Name: idx_items_section; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_items_section ON public.build_section_items USING btree (section_id);


--
-- Name: idx_photos_build; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_photos_build ON public.build_photos USING btree (build_id);


--
-- Name: idx_sections_build; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_sections_build ON public.build_sections USING btree (build_id);


--
-- Name: builds trg_builds_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_builds_updated_at BEFORE UPDATE ON public.builds FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: for_sale_items trg_for_sale_items_updated; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_for_sale_items_updated BEFORE UPDATE ON public.for_sale_items FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: build_photos build_photos_build_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.build_photos
    ADD CONSTRAINT build_photos_build_id_fkey FOREIGN KEY (build_id) REFERENCES public.builds(id) ON DELETE CASCADE;


--
-- Name: build_section_items build_section_items_section_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.build_section_items
    ADD CONSTRAINT build_section_items_section_id_fkey FOREIGN KEY (section_id) REFERENCES public.build_sections(id) ON DELETE CASCADE;


--
-- Name: build_sections build_sections_build_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.build_sections
    ADD CONSTRAINT build_sections_build_id_fkey FOREIGN KEY (build_id) REFERENCES public.builds(id) ON DELETE CASCADE;


--
-- Name: for_sale_photos for_sale_photos_item_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.for_sale_photos
    ADD CONSTRAINT for_sale_photos_item_id_fkey FOREIGN KEY (item_id) REFERENCES public.for_sale_items(id) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

\unrestrict 6e8cO9pVDOblzM4h64n9hMdUEPXVMO18MRkj3fhJImnkrzhBj3saMMqkayhnslk

