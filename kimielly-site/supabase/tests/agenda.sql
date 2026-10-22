-- Testes de comportamento da agenda. Rode em um banco de TESTE após a migration e o seed:
--   psql "$DATABASE_URL" -f supabase/tests/agenda.sql
-- (Cria reservas e bloqueios de exemplo — não use em produção.)

\set ON_ERROR_STOP 0
\pset footer off
\echo '== 1. anon não acessa nada'
set role anon;
select count(*) from public.bookings;
select count(*) from public.services;
select * from public.get_available_slots('maquiagem', current_date + 1);
reset role;
set role authenticated;
select * from public.agenda_proxima;
reset role;

set role service_role;
create temp table t as select (current_date + ((2 - extract(dow from current_date)::int + 7) % 7 + 7))::date as terca;  -- terça daqui 1-2 semanas
\echo '== 2. slots terça (maquiagem 60+15):'
select count(*) as total, min(to_char(slot_start at time zone 'America/Sao_Paulo','HH24:MI')) primeiro, max(to_char(slot_start at time zone 'America/Sao_Paulo','HH24:MI')) ultimo from public.get_available_slots('maquiagem', (select terca from t));
\echo '== domingo / passado / > 60 dias / serviço inexistente (todos 0):'
select (select count(*) from public.get_available_slots('maquiagem', (select terca from t) - 2)) dom,
       (select count(*) from public.get_available_slots('maquiagem', current_date - 1)) passado,
       (select count(*) from public.get_available_slots('maquiagem', current_date + 90)) longe,
       (select count(*) from public.get_available_slots('xx', (select terca from t))) inexistente;

\echo '== 3. cria reserva 10:00'
select code ~ '^KW-[A-Z0-9]{6}$' formato_ok, status, service_name from public.create_booking('maquiagem', ((select terca from t) + time '10:00') at time zone 'America/Sao_Paulo', 'Maria Teste', '51987654321', 'obs');
\echo '== 4. mesmo horário de novo (espera SLOT_UNAVAILABLE)'
select * from public.create_booking('maquiagem', ((select terca from t) + time '10:00') at time zone 'America/Sao_Paulo', 'Ana Teste', '51911112222', null);
\echo '== 5. sobreposição 10:30 e 09:30 (espera erro), 11:15 ok? (fim 10:00+60+15=11:15)'
select * from public.create_booking('maquiagem', ((select terca from t) + time '10:30') at time zone 'America/Sao_Paulo', 'Ana Teste', '51911112222', null);
select * from public.create_booking('maquiagem', ((select terca from t) + time '09:30') at time zone 'America/Sao_Paulo', 'Ana Teste', '51911112222', null);
select to_char(slot_start at time zone 'America/Sao_Paulo','HH24:MI') manha_livre from public.get_available_slots('maquiagem', (select terca from t)) where slot_start < ((select terca from t) + time '12:00') at time zone 'America/Sao_Paulo';
\echo '== horário fora da grade (10:10) e horário que estoura o fechamento (11:30 com 60min -> 12:30) => erro'
select * from public.create_booking('maquiagem', ((select terca from t) + time '10:10') at time zone 'America/Sao_Paulo', 'Ana Teste', '51911112222', null);
select * from public.create_booking('maquiagem', ((select terca from t) + time '11:30') at time zone 'America/Sao_Paulo', 'Ana Teste', '51911112222', null);

\echo '== 6. bloqueio de agenda à tarde'
insert into public.time_off (starts_at, ends_at, reason) values (((select terca from t) + time '13:00') at time zone 'America/Sao_Paulo', ((select terca from t) + time '20:00') at time zone 'America/Sao_Paulo', 'curso');
select count(*) tarde_livre from public.get_available_slots('maquiagem', (select terca from t)) where slot_start >= ((select terca from t) + time '13:00') at time zone 'America/Sao_Paulo';

\echo '== 7. limite de pendentes por telefone (3): mais 2 ok, a 4ª falha'
select status from public.create_booking('hidragloss', ((select terca from t) + 1 + time '09:00') at time zone 'America/Sao_Paulo', 'Maria Teste', '51987654321', null);
select status from public.create_booking('hidragloss', ((select terca from t) + 1 + time '10:00') at time zone 'America/Sao_Paulo', 'Maria Teste', '51987654321', null);
select status from public.create_booking('hidragloss', ((select terca from t) + 1 + time '14:00') at time zone 'America/Sao_Paulo', 'Maria Teste', '51987654321', null);

\echo '== 8. consulta de status (certo / telefone errado)'
select status, service_name, client_first_name from public.get_booking_status((select code from public.bookings order by created_at limit 1), '51987654321');
select count(*) telefone_errado from public.get_booking_status((select code from public.bookings order by created_at limit 1), '51900000000');

\echo '== 9. dia lotado: bloqueia a quarta inteira e verifica resumo do mês'
insert into public.time_off (starts_at, ends_at) values (((select terca from t) + 2 + time '00:00') at time zone 'America/Sao_Paulo', ((select terca from t) + 3) at time zone 'America/Sao_Paulo');
select day, free_slots from public.get_month_availability('maquiagem', (select terca from t)) where day between (select terca from t) - 2 and (select terca from t) + 3;
\echo '== 10. confirmação pela profissional some da lista? (não: confirmada continua bloqueando)'
update public.bookings set status='confirmed' where client_name='Maria Teste' and service_id='maquiagem';
select count(*) ainda_bloqueia from public.get_available_slots('maquiagem', (select terca from t)) where slot_start = ((select terca from t) + time '10:00') at time zone 'America/Sao_Paulo';
update public.bookings set status='cancelled' where client_name='Maria Teste' and service_id='maquiagem';
select count(*) liberou_apos_cancelar from public.get_available_slots('maquiagem', (select terca from t)) where slot_start = ((select terca from t) + time '10:00') at time zone 'America/Sao_Paulo';
select * from public.agenda_proxima limit 3;
