-- Marca um usuário do Supabase Auth como admin do painel /admin.
-- 1) Crie o usuário em Authentication -> Users -> Add user (marque "Auto Confirm User").
-- 2) Troque o e-mail abaixo pelo dele e rode no SQL Editor.
-- app_metadata só pode ser alterado pela service role / SQL: o usuário não edita isso sozinho.
update auth.users
   set raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb) || '{"role": "admin"}'::jsonb
 where email = 'SEU-EMAIL@exemplo.com';
