-- Subcategorias: uma subcategoria é uma categoria com parent_id.
alter table public.categories
  add column if not exists parent_id uuid references public.categories(id) on delete set null;

create index if not exists categories_parent_idx on public.categories (parent_id);

-- Publishers podem criar categorias/subcategorias direto no editor de post
-- (mesma lógica de tags_publisher_insert). A gestão completa segue admin.
drop policy if exists categories_publisher_insert on public.categories;
create policy categories_publisher_insert on public.categories
  for insert with check (public.is_publisher_or_admin());
