-- Заполните реальные значения name/address и выполните запрос.
-- type для фудкортов используйте 'foodcourt'

insert into public.places (id, name, address, type, created_at, updated_at)
values
  (gen_random_uuid(), 'Фудкорт Центральный', 'Москва, ул. Примерная, 10', 'foodcourt', now(), now()),
  (gen_random_uuid(), 'Гастромаркет Север', 'Санкт-Петербург, Невский проспект, 25', 'foodcourt', now(), now()),
  (gen_random_uuid(), 'Фудхолл Южный', 'Казань, ул. Баумана, 7', 'foodcourt', now(), now())
on conflict do nothing;
