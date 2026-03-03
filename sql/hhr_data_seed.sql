--
-- PostgreSQL database dump
--

\restrict tX1z4kx3C9ddT3fldBzRmFAirjWNCRGJlGldlfQhIceGbr460lBNifXKIiJ4OaK

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
-- Data for Name: builds; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.builds (id, slug, name, subtitle, hero_image, thumb_image, is_published, created_at, updated_at, owner_name, is_completed, thumb_image2) FROM stdin;
22	1970-chevrolet-chevelle-ss	1970 Chevrolet Chevelle SS	Fill this in with real information...	/uploads/builds/22/hero-1771959226267-c6b84d40.jpg	/uploads/builds/22/thumb-1771959152792-f05de644.jpg	t	2026-02-24 11:52:32.790074-07	2026-02-24 11:53:46.257669-07	Dylan Anderson	f	\N
19	1987-chevy-c30-2	1987 Chevy C30		/uploads/builds/19/hero-1771265007082-8829f85d.jpg	/uploads/builds/19/thumb-1771265353336-e06b3005.jpg	t	2026-02-10 08:54:20.385557-07	2026-03-03 08:53:59.250154-07	Hector Gonzalez	t	\N
17	1987-chevy-c30	1987 Chevy C30	Tim brought his 1987 Chevy C30 to us last year with a boat-load (no pun intended) of aftermarket parts. Tim knew exactly what he was looking for with this truck. Over the past year, we've brought his dream to life- with a procharged big block, 10-lug wheels and perfect paint and body work, this truck is miles from where it started (no pun intended). 	/uploads/builds/17/hero.jpg	/uploads/builds/17/thumb.jpg	t	2026-02-09 11:23:20.359403-07	2026-02-09 12:12:49.07702-07	Tim Muehlig	f	\N
26	4-door-nova	4 Door Nova		/uploads/builds/26/hero-1772557936432-6199bc94.jpg	/uploads/builds/26/thumb-1772557935347-0c60ad07.jpg	t	2026-03-03 10:12:15.340059-07	2026-03-03 10:12:15.340059-07	\N	t	\N
9	1969-camaro-rs	1969 Camaro RS		/uploads/builds/9/hero.jpg	/uploads/builds/9/thumb.jpg	t	2025-09-24 09:25:57.365186-06	2025-09-24 09:25:57.365186-06	Austin	t	\N
21	1961-chevrolet-impala	1961 Chevrolet Impala	Fill this in with real information...	/uploads/builds/21/hero-1771958240768-d9272f45.jpg	/uploads/builds/21/thumb-1771958239322-d9044598.jpg	t	2026-02-24 11:37:19.312463-07	2026-02-24 11:37:19.312463-07	Heather Parkinson	f	\N
23	1969-ford-f-100	1969 Ford F-100	This section to be filled in with correct information...	/uploads/builds/23/hero-1772038212116-601e1a95.jpg	/uploads/builds/23/thumb-1772038211467-5a3976ef.jpg	t	2026-02-25 09:50:11.450659-07	2026-03-02 10:24:35.168253-07	Terry Wilcox	f	\N
25	1960-plymouth-wagon	1960 Plymouth Wagon	This section to be filled in with real information...	/uploads/builds/25/hero-1772474310959-6d445f83.jpg	/uploads/builds/25/thumb-1772474309930-df98defb.jpg	t	2026-03-02 10:58:29.91431-07	2026-03-02 10:58:29.91431-07	Kevin Anderson	f	\N
\.


--
-- Data for Name: build_photos; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.build_photos (id, build_id, url, alt, sort_order) FROM stdin;
228	26	/uploads/builds/26/1.jpg	Engine section	1
229	26	/uploads/builds/26/2.jpg	Chassis section	2
230	26	/uploads/builds/26/3.jpg	Interior section	3
231	26	/uploads/builds/26/4.jpg	Body & Paint section	4
52	9	/uploads/builds/9/1.jpg	Engine section	1
53	9	/uploads/builds/9/2.jpg	Chassis section	2
54	9	/uploads/builds/9/3.jpg	Interior section	3
55	9	/uploads/builds/9/4.jpg	Body & Paint section	4
56	9	/uploads/builds/9/5.jpg	\N	5
57	9	/uploads/builds/9/6.jpg	\N	6
58	9	/uploads/builds/9/7.jpg	\N	7
59	9	/uploads/builds/9/8.jpg	\N	8
60	9	/uploads/builds/9/9.jpg	\N	9
61	9	/uploads/builds/9/10.jpg	\N	10
62	9	/uploads/builds/9/11.jpg	\N	11
63	9	/uploads/builds/9/12.jpg	\N	12
115	17	/uploads/builds/17/1.jpg	\N	1
116	17	/uploads/builds/17/2.jpg	\N	2
117	17	/uploads/builds/17/3.jpg	\N	3
118	17	/uploads/builds/17/4.jpg	\N	4
119	17	/uploads/builds/17/5.jpg	\N	5
121	19	/uploads/builds/19/4.jpg	Body & Paint section	4
122	19	/uploads/builds/19/5.jpg	\N	5
123	19	/uploads/builds/19/6.jpg	\N	6
124	19	/uploads/builds/19/7.jpg	\N	7
125	19	/uploads/builds/19/8.jpg	\N	8
126	19	/uploads/builds/19/9.jpg	\N	9
127	19	/uploads/builds/19/10.jpg	\N	10
128	19	/uploads/builds/19/11.jpg	\N	11
129	19	/uploads/builds/19/12.jpg	\N	12
130	19	/uploads/builds/19/13.jpg	\N	13
131	19	/uploads/builds/19/14.jpg	\N	14
132	19	/uploads/builds/19/2.jpg	Chassis section	2
133	19	/uploads/builds/19/3.jpg	Interior section	3
134	19	/uploads/builds/19/15.jpg	\N	15
135	19	/uploads/builds/19/16.jpg	\N	16
146	17	/uploads/builds/17/6.jpg	\N	6
147	17	/uploads/builds/17/7.jpg	\N	7
148	17	/uploads/builds/17/8.jpg	\N	8
149	21	/uploads/builds/21/1.jpg	\N	1
150	21	/uploads/builds/21/2.jpg	\N	2
151	21	/uploads/builds/21/3.jpg	\N	3
152	21	/uploads/builds/21/4.jpg	\N	4
153	21	/uploads/builds/21/5.jpg	\N	5
154	21	/uploads/builds/21/6.jpg	\N	6
155	21	/uploads/builds/21/7.jpg	\N	7
156	21	/uploads/builds/21/8.jpg	\N	8
157	22	/uploads/builds/22/1.jpg	\N	1
158	22	/uploads/builds/22/2.jpg	\N	2
159	22	/uploads/builds/22/3.jpg	\N	3
160	22	/uploads/builds/22/4.jpg	\N	4
161	22	/uploads/builds/22/5.jpg	\N	5
162	22	/uploads/builds/22/6.jpg	\N	6
163	22	/uploads/builds/22/7.jpg	\N	7
164	22	/uploads/builds/22/8.jpg	\N	8
165	22	/uploads/builds/22/9.jpg	\N	9
166	22	/uploads/builds/22/10.jpg	\N	10
167	22	/uploads/builds/22/11.jpg	\N	11
176	23	/uploads/builds/23/1.jpg	\N	1
177	23	/uploads/builds/23/2.jpg	\N	2
178	23	/uploads/builds/23/3.jpg	\N	3
179	23	/uploads/builds/23/4.jpg	\N	4
180	23	/uploads/builds/23/5.jpg	\N	5
181	23	/uploads/builds/23/6.jpg	\N	6
182	23	/uploads/builds/23/7.jpg	\N	7
183	23	/uploads/builds/23/8.jpg	\N	8
184	23	/uploads/builds/23/9.jpg	\N	9
185	23	/uploads/builds/23/10.jpg	\N	10
186	23	/uploads/builds/23/11.jpg	\N	11
187	23	/uploads/builds/23/12.jpg	\N	12
188	23	/uploads/builds/23/13.jpg	\N	13
189	23	/uploads/builds/23/14.jpg	\N	14
190	23	/uploads/builds/23/15.jpg	\N	15
191	23	/uploads/builds/23/16.jpg	\N	16
192	23	/uploads/builds/23/17.jpg	\N	17
193	23	/uploads/builds/23/18.jpg	\N	18
194	23	/uploads/builds/23/19.jpg	\N	19
195	23	/uploads/builds/23/20.jpg	\N	20
196	23	/uploads/builds/23/21.jpg	\N	21
197	23	/uploads/builds/23/22.jpg	\N	22
198	23	/uploads/builds/23/23.jpg	\N	23
199	23	/uploads/builds/23/24.jpg	\N	24
200	23	/uploads/builds/23/25.jpg	\N	25
201	23	/uploads/builds/23/26.jpg	\N	26
202	23	/uploads/builds/23/27.jpg	\N	27
203	23	/uploads/builds/23/28.jpg	\N	28
204	23	/uploads/builds/23/29.jpg	\N	29
205	23	/uploads/builds/23/30.jpg	\N	30
206	23	/uploads/builds/23/31.jpg	\N	31
207	23	/uploads/builds/23/32.jpg	\N	32
\.


--
-- Data for Name: build_sections; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.build_sections (id, build_id, title, sort_order) FROM stdin;
12	9	Engine & Drivetrain	1
13	9	Chassis & Suspension	2
14	9	Interior & Electronics	3
15	9	Body & Paint	4
20	19	Engine & Drivetrain	1
21	19	Chassis & Suspension	2
22	19	Interior & Electronics	3
23	19	Body & Paint	4
24	26	Engine & Drivetrain	1
25	26	Chassis & Suspension	2
26	26	Interior & Electronics	3
27	26	Body & Paint	4
\.


--
-- Data for Name: build_section_items; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.build_section_items (id, section_id, text, sort_order) FROM stdin;
22	12	6.2L LS with mild cam	1
24	14	Dakota Digital RTX Gauges	1
25	15	Glasurit Ruby Red	1
26	13	Coilovers w/ double adjustable dampers	1
30	13	brakes23	2
31	13	got some nice bilsteins under it	3
32	12	gold plated headers	2
34	12	4L80E (so it blows up before the engine)	4
35	12	thick valvetrain springs	5
36	12	Garrett 7160 turbo	6
37	12	Whipple Supercharger	7
38	12	Vortex Procharger	8
39	12	custom engine mounts (cuz race car)	9
40	12	carbon fiber driveshaft	10
41	12	Holley Sniper EFI	11
42	12	6.2 LS with 670hp and 1000 pound feet of torque. faster than anything else out there. Think I'm wrong? $5000 says I'm not. try me.	12
47	20	big ol engine	1
49	22	Dakota Digital RTX Gauges	1
50	23	White and blueeeee	1
51	20	6.2L LS with mild cam	2
48	21	Coilovers with double adjustable dampers	1
52	21	got some nice bilsteins under it	2
56	22	seats	2
57	22	gauge	3
58	20	big ol engine	3
59	20	big ol engine	4
33	12	Chopacabra cam	3
60	24	Rebuilt original motor	1
61	25	Coilover suspension	1
62	26	Vintage Air	1
63	27	LIME Green	1
64	27	Retrosound head unit	2
\.


--
-- Data for Name: for_sale_items; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.for_sale_items (id, slug, title, description, is_active, is_sold, posted_at, updated_at) FROM stdin;
1	1969-camaro-rs	1969 Chevy Camaro RS	Clean body, RS package. Great candidate for resto-mod or period-correct build. Fresh tune-up and brakes.	t	f	2025-09-16 16:07:50.131843-06	2025-09-17 14:08:42.853798-06
2	1970-c10-shop-truck	1970 Chevy C10 “Shop Truck”	Solid driver with LS swap potential. Lowered stance, clean interior, and loads of character.	t	f	2025-09-16 16:07:50.131843-06	2025-09-17 14:08:42.853798-06
\.


--
-- Data for Name: for_sale_photos; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.for_sale_photos (id, item_id, url, alt, sort_order) FROM stdin;
1	1	/images/builds/1969-camaro-rs/1.jpg	\N	1
2	1	/images/builds/1969-camaro-rs/2.jpg	\N	2
3	1	/images/builds/1969-camaro-rs/3.jpg	\N	3
5	1	/images/builds/1969-camaro-rs/5.jpg	\N	5
6	1	/images/builds/1969-camaro-rs/6.jpg	\N	6
7	1	/images/builds/1969-camaro-rs/7.jpg	\N	7
8	1	/images/builds/1969-camaro-rs/8.jpg	\N	8
4	1	/images/builds/1969-camaro-rs/9.jpg	\N	4
13	2	/images/builds/1970-c10/5.jpg	\N	5
14	2	/images/builds/1970-c10/6.jpg	\N	6
15	2	/images/builds/1970-c10/7.jpg	\N	7
16	2	/images/builds/1970-c10/8.jpg	\N	8
9	2	/images/builds/1970-c10/9.jpg	\N	1
10	2	/images/builds/1970-c10/10.jpg	\N	2
11	2	/images/builds/1970-c10/11.jpg	\N	3
12	2	/images/builds/1970-c10/12.jpg	\N	4
44	2	/uploads/for-sale/2/9.jpg	\N	9
45	2	/uploads/for-sale/2/10.jpg	\N	10
46	2	/uploads/for-sale/2/11.jpg	\N	11
47	2	/uploads/for-sale/2/12.jpg	\N	12
48	2	/uploads/for-sale/2/13.jpg	\N	13
49	2	/uploads/for-sale/2/14.jpg	\N	14
52	2	/uploads/for-sale/2/15.jpg	\N	15
53	2	/uploads/for-sale/2/16.jpg	\N	16
\.


--
-- Data for Name: ig_alert_log; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.ig_alert_log (key, last_sent_at) FROM stdin;
ig:no_token	2026-02-19 11:59:01.462024-07
ig_token_invalid	2026-03-03 09:55:01.504303-07
\.


--
-- Data for Name: ig_tokens; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.ig_tokens (id, access_token, expires_at, created_at) FROM stdin;
1	EAARNeepOgC8BQDifdrZCj1JGx9FnZBXYPqa9euYJyBCivTSiIk03HR2CYpYwSwIWtZBu9ZBIKNZCl6s4y50M6K2npq8311I5GEDmPWftt4D8Q9OOQv0enfdm5HkAz8byi6V6pVuvnj42ZBvK4u1iDEBWAZCxhZBA4K1HMmTHPgn8jlg9Mo6aKHFHp9rLBmt0St9WgMf1Fyv4GiQlYtmi	2026-02-08 10:19:44.973182-07	2025-12-10 10:19:44.973182-07
2	EAARNeepOgC8BQEqKcmCDXNol7EyG024z8XnLjsNkQYuZBtOlnSTErPWTJYLwUhjMOBbE2CtCYOfokZCDc1lLNFbq2HNwvXnA518lk8BWw8aRSV1IozL8wat1obzchdsCje7K9RZCClZCpNYPHMXMZAMzCfs2VyJYnuwckZAjitTciWeb6YgqFFKCZCZCYtOuuiE2OLwpNLmo9dxF	2026-02-09 08:49:47.961455-07	2025-12-11 08:49:47.961455-07
3	EAARNeepOgC8BQvbOuStx51EFZA6DWWvXb9CkWwzCH6bZCKgJKjf160noZB7LkcKro83a4JnBtxZCZBouarOTbFJ7ZBMFUWZCZAAr0a5t04P0qZBfwr86CCSFMXNN6n0q1BDwF5T4tbnFDwisWFl2mZA1tNHqisvwkVeGofP8eWbSHStcZCsZAmtBRaiHh6mwUvzKFg3tcaBZCLLsChlc7	2026-04-10 09:28:33.630229-06	2026-02-09 09:28:33.630229-07
4	EAARNeepOgC8BQuHPoJrbXPkE8rgQtMV1aAxhKZAgoj4PtbRCOksO82Ujs4zoDL2g7vgtkWk38kZCMgVrNrQzzalt3iEzwJwnDS0LslLVRWI0wA2M0n1bT5pwihhzqJQHk5phXLC6ZAQXtZBnrRCRbLCd0hSAlRrrXv6KSzpVO7crEjrOgrRi4wwGSLWwxNGmxrvNlt7at8AD	2026-04-10 09:41:16.284558-06	2026-02-09 09:41:16.284558-07
5	EAARNeepOgC8BQuHPoJrbXPkE8rgQtMV1aAxhKZAgoj4PtbRCOksO82Ujs4zoDL2g7vgtkWk38kZCMgVrNrQzzalt3iEzwJwnDS0LslLVRWI0wA2M0n1bT5pwihhzqJQHk5phXLC6ZAQXtZBnrRCRbLCd0hSAlRrrXv6KSzpVO7crEjrOgrRi4wwGSLWwxNGmxrvNlt7at8AD	2026-04-10 09:54:55.425828-06	2026-02-09 09:54:55.425828-07
\.


--
-- Data for Name: session; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.session (sid, sess, expire) FROM stdin;
CC-o8qATynzxiSsAqzglS000N8j5h0tb	{"cookie":{"originalMaxAge":28800000,"expires":"2026-03-04T00:22:53.100Z","secure":false,"httpOnly":true,"path":"/","sameSite":"lax"}}	2026-03-03 17:22:54
7r1RArTXAIJuSMoJ8uv9l8vgDddgmGe-	{"cookie":{"originalMaxAge":28800000,"expires":"2026-03-04T01:38:01.846Z","secure":false,"httpOnly":true,"path":"/","sameSite":"lax"},"flash":{}}	2026-03-03 18:38:43
\.


--
-- Data for Name: team; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.team (id, name, role, photo_url, bio, sort_order) FROM stdin;
23	Amber Hernandez	Office Admin	/uploads/team/23/team-1772477926073-6b883e5a.jpg	Fill in with real information...	2
9	Martin Hernandez	Owner	/uploads/team/9/team-1772476529616-efbc9c04.jpg	Martin has been around here foreverrrr. He walks around like he genuinely owns the place. Which I guess he's entitled to do, seeing as how he does.	1
13	Emily Hernandez	Shop Mom	/uploads/team/13/team-1772476680940-6334f1ee.jpg	Emily boosts shop morale by an exceptional 70% each and every day.	3
11	Diego (Hotrod) Hernandez	Metal & Body	/uploads/team/11/team-1772476537272-213bfe21.jpg	Hotrod is quite literally an embodiment of all that is good and holy in the world of automotive restoration.	4
15	Sonia Hernandez	Metal & Body	/uploads/team/15/team-1772476557735-cca93c04.jpg	Sonia knows how to party. And she does- often. Also exceptional at bodywork.	5
22	Taten Hawkes	Metal Fabrication	/uploads/team/22/team-1772476642917-10983e8d.jpg	Fill in with real information...	6
14	Michael Ledet	Metal & Body	/uploads/team/14/team-1772476576009-d2d6978c.jpg	Michael was born to do the work he performs here. Bro knows metalwork better than the back of his hand.	7
12	Diego Rodriguez	Lead Mechanic	/uploads/team/12/team-1772476567913-d8334a6b.jpg	From Civics to Bugattis and everything in between, Diego is your guy for all things mechanical. Ever heard of a K-swapped CRV? Diego has.	8
8	Shawn Freeman	jack of all trades	/uploads/team/8/team-1772476586937-84caf71c.jpg	Shawn is a cool guy	9
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.users (id, email, password_hash, role, name) FROM stdin;
1	trumanbenjamin27@gmail.com	$2b$12$oXed3G8OILZzUjZ1m1remuUB2iCtZAY2UD2rw1PtrTmBxDe2UUZQ.	owner	Truman
2	juan@gmail.com	$2b$12$m7ydTuMcTDrL.eZ2OBS/o.kRnsb7pJNHttTWc37Pb.hjIyzUnIy1u	admin	Juan
\.


--
-- Name: build_photos_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.build_photos_id_seq', 231, true);


--
-- Name: build_section_items_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.build_section_items_id_seq', 64, true);


--
-- Name: build_sections_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.build_sections_id_seq', 27, true);


--
-- Name: builds_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.builds_id_seq', 26, true);


--
-- Name: for_sale_items_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.for_sale_items_id_seq', 7, true);


--
-- Name: for_sale_photos_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.for_sale_photos_id_seq', 53, true);


--
-- Name: ig_tokens_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.ig_tokens_id_seq', 5, true);


--
-- Name: team_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.team_id_seq', 23, true);


--
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.users_id_seq', 6, true);


--
-- PostgreSQL database dump complete
--

\unrestrict tX1z4kx3C9ddT3fldBzRmFAirjWNCRGJlGldlfQhIceGbr460lBNifXKIiJ4OaK

