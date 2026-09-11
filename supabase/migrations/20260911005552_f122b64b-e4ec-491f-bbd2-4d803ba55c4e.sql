insert into public.pages (key, slug, title, content, status)
values ('system:footer', null, 'Site footer', '{}'::jsonb, 'published')
on conflict (key) do nothing;