-- Consultas úteis para os casal no SQL Editor do Supabase.

-- Convidados que confirmaram presença:
select full_name, confirmed_at
from public.guests
where confirmed = true
order by confirmed_at desc;

-- Presentes escolhidos e seus convidados:
select
  g.name as presente,
  gu.full_name as convidado,
  g.chosen_at
from public.gifts g
left join public.guests gu on gu.id = g.chosen_by
where g.chosen_by is not null
order by g.chosen_at desc;

-- Liberar manualmente um presente:
-- update public.gifts
-- set chosen_by = null, chosen_at = null, notification_sent_at = null
-- where name = 'Air Fryer 5L';
