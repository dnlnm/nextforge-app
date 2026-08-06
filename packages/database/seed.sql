INSERT INTO "ReservedSlug" ("id","slug","reason","createdAt")
SELECT 'rs_'||g, s, 'System reserved', now()
FROM unnest(ARRAY['www','api','app','admin','dashboard','billing','account','settings','support','help','docs','blog','status','mail','ftp','cdn','static','assets','images','uploads','tlas','my','sign-in','sign-up','invite','centres','legal']) WITH ORDINALITY AS t(s,g)
ON CONFLICT (slug) DO NOTHING;