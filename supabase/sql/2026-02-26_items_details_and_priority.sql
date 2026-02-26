-- Item details and priority management

alter table public.items
  add column if not exists detailed_description text;

-- Keep item positions unique inside category by shifting neighbors.
create or replace function public.shift_item_positions_on_insert()
returns trigger as $$
begin
  if new.position is null or new.position < 1 then
    new.position := 1;
  end if;

  update public.items
  set position = position + 1,
      updated_at = now()
  where category_id = new.category_id
    and position >= new.position;

  return new;
end;
$$ language plpgsql;

create or replace function public.shift_item_positions_on_update()
returns trigger as $$
begin
  if new.position is null or new.position < 1 then
    new.position := 1;
  end if;

  if new.category_id = old.category_id then
    if new.position < old.position then
      update public.items
      set position = position + 1,
          updated_at = now()
      where category_id = new.category_id
        and id <> old.id
        and position >= new.position
        and position < old.position;
    elsif new.position > old.position then
      update public.items
      set position = position - 1,
          updated_at = now()
      where category_id = new.category_id
        and id <> old.id
        and position > old.position
        and position <= new.position;
    end if;
  else
    update public.items
    set position = position - 1,
        updated_at = now()
    where category_id = old.category_id
      and position > old.position;

    update public.items
    set position = position + 1,
        updated_at = now()
    where category_id = new.category_id
      and position >= new.position;
  end if;

  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_items_shift_insert on public.items;
create trigger trg_items_shift_insert
before insert on public.items
for each row
execute function public.shift_item_positions_on_insert();

drop trigger if exists trg_items_shift_update on public.items;
create trigger trg_items_shift_update
before update of position, category_id on public.items
for each row
execute function public.shift_item_positions_on_update();
