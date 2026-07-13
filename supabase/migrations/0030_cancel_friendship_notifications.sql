-- Cancela/remova uma relação de amizade e, quando o pedido foi cancelado por
-- quem o enviou, remove a notificação pendente do destinatário na mesma transação.
create or replace function public.remove_friendship(p_other uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := public.current_profile_id();
  v_friendship public.friendships%rowtype;
begin
  if v_actor is null then
    raise exception 'Autenticação necessária';
  end if;

  if p_other is null or p_other = v_actor then
    return;
  end if;

  select *
  into v_friendship
  from public.friendships
  where (requester_id = v_actor and addressee_id = p_other)
     or (requester_id = p_other and addressee_id = v_actor)
  for update;

  if not found then
    return;
  end if;

  delete from public.friendships where id = v_friendship.id;

  if v_friendship.status = 'pendente' and v_friendship.requester_id = v_actor then
    delete from public.notifications
    where recipient_id = v_friendship.addressee_id
      and actor_id = v_actor
      and type = 'amizade_pedido'
      and (entity_id = v_friendship.id or entity_id is null);
  end if;
end;
$$;

-- SECURITY DEFINER é necessário para apagar a notificação de outro usuário,
-- mas o escopo é limitado ao pedido que o próprio chamador enviou.
revoke execute on function public.remove_friendship(uuid) from public, anon, authenticated;
grant execute on function public.remove_friendship(uuid) to authenticated;
