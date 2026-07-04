-- =====================================================================
-- Visite Lapa — Seed inicial
-- Rode no SQL Editor do Supabase APÓS aplicar todas as migrations.
-- =====================================================================

-- Categorias padrão (10). is_fixed_carousel_item = itens do carrossel da home.
insert into public.categories (name, slug, description, type, is_fixed_carousel_item, icon_name, sort_order) values
  ('Notícias',       'noticias',       'As últimas notícias de Bom Jesus da Lapa e região.', 'editorial', false, 'News01Icon', 1),
  ('Eventos',        'eventos',        'Agenda cultural, religiosa e de lazer da cidade.',   'editorial', true,  'Calendar03Icon', 2),
  ('Turismo',        'turismo',        'Pontos turísticos e roteiros em Bom Jesus da Lapa.', 'editorial', false, 'MountainIcon', 3),
  ('Religiosidade',  'religiosidade',  'Fé, romarias e o Santuário do Senhor Bom Jesus.',    'editorial', true,  'ChurchIcon', 4),
  ('Onde Comer',     'onde-comer',     'Restaurantes, bares e gastronomia local.',           'guia',      true,  'Restaurant02Icon', 5),
  ('Onde Malhar',    'onde-malhar',    'Academias, estúdios e atividades físicas na cidade.','guia',      true,  'Dumbbell01Icon', 6),
  ('Hospedagem',     'hospedagem',     'Hotéis, pousadas e onde ficar em Bom Jesus da Lapa.','guia',      true,  'Hotel01Icon', 7),
  ('Guia Local',     'guia-local',     'Serviços e comércio para moradores e visitantes.',   'guia',      false, 'MapsLocation01Icon', 8),
  ('Comunidade',     'comunidade',     'Histórias, pessoas e o dia a dia da nossa gente.',   'editorial', false, 'UserGroupIcon', 9),
  ('Publieditorial', 'publieditorial', 'Conteúdos patrocinados e publieditoriais.',          'editorial', false, 'Megaphone01Icon', 10)
on conflict (slug) do nothing;

-- Configurações iniciais do site.
insert into public.settings (key, value, description) values
  ('site_identity', '{"name":"Visite Lapa","slogan":"Tudo sobre Bom Jesus da Lapa"}', 'Identidade do site'),
  ('adsense', '{"enabled":false,"intensity":"conservadora"}', 'Configuração do Google AdSense'),
  ('comments', '{"moderation":"all_require_approval"}', 'Política de moderação de comentários'),
  ('publishers', '{"approved_publish_directly":true}', 'Política de publicação de publishers'),
  ('newsletter', '{"enabled":false}', 'Newsletter (preparada para o futuro)')
on conflict (key) do nothing;

-- =====================================================================
-- ADMIN INICIAL
-- 1) Cadastre-se normalmente pelo site (/cadastro) com o seu e-mail.
-- 2) Rode a linha abaixo no SQL Editor, trocando pelo seu e-mail:
--
--    select public.promote_to_admin('seu-email@exemplo.com');
--
-- =====================================================================
