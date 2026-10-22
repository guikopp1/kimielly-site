-- ============================================================================
--  Dados iniciais da agenda.
--  ATENÇÃO: horários e durações abaixo são PROVISÓRIOS. Ajuste com a
--  profissional antes de abrir o agendamento ao público (ver README).
-- ============================================================================

-- Serviços (mesmos ids de src/config/site.ts). Para manter sincronizado depois:
--   npm run sync:services
insert into public.services (id, name, duration_minutes, buffer_minutes, sort_order) values
  ('maquiagem',           'Maquiagem',              60, 15, 1),
  ('design-sobrancelhas', 'Design de sobrancelhas', 45, 15, 2),
  ('brow-lamination',     'Brow lamination',        60, 15, 3),
  ('cilios',              'Cílios',                 90, 15, 4),
  ('lash-lifting',        'Lash lifting',           60, 15, 5),
  ('hidragloss',          'Hidragloss',             45, 15, 6),
  ('limpeza-de-pele',     'Limpeza de pele',        90, 15, 7),
  ('massagem',            'Massagens',              60, 15, 8),
  ('drenagem',            'Drenagem',               60, 15, 9)
on conflict (id) do update
  set name = excluded.name,
      duration_minutes = excluded.duration_minutes,
      buffer_minutes = excluded.buffer_minutes,
      sort_order = excluded.sort_order;

-- Horário de funcionamento PROVISÓRIO: terça a sábado.
-- 0 = domingo, 1 = segunda, 2 = terça, 3 = quarta, 4 = quinta, 5 = sexta, 6 = sábado
delete from public.business_hours;
insert into public.business_hours (weekday, opens_at, closes_at) values
  (2, '09:00', '12:00'), (2, '13:30', '19:00'),
  (3, '09:00', '12:00'), (3, '13:30', '19:00'),
  (4, '09:00', '12:00'), (4, '13:30', '19:00'),
  (5, '09:00', '12:00'), (5, '13:30', '19:00'),
  (6, '08:00', '14:00');
