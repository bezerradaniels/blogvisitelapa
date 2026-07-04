-- =====================================================================
-- Visite Lapa — 0012 — Política de INSERT em audit_logs (admins)
-- Permite que ações administrativas registrem a trilha de auditoria
-- usando o cliente autenticado (sem precisar da service role).
-- =====================================================================

create policy audit_logs_admin_insert on public.audit_logs
  for insert with check (public.is_admin());
