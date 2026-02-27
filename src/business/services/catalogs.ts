import { businessSupabase } from '../../lib/supabase';
import type { Catalog, CatalogFormData } from '../../types';
import type { PostgrestError } from '@supabase/supabase-js';

// Catalog Services
export const catalogService = {
  // Get all catalogs for current user
  async getAll(userId: string): Promise<Catalog[]> {
    const { data, error } = await businessSupabase
      .from('catalogs')
      .select('*')
      .eq('owner_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  // Get catalog by ID
  async getById(id: string): Promise<Catalog | null> {
    const { data, error } = await businessSupabase
      .from('catalogs')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  },

  // Create new catalog
  async create(catalogData: CatalogFormData, ownerId: string): Promise<Catalog> {
    const { data, error } = await businessSupabase
      .from('catalogs')
      .insert({
        ...catalogData,
        owner_id: ownerId,
        settings: {}
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Update catalog
  async update(id: string, catalogData: Partial<CatalogFormData>): Promise<Catalog> {
    const { data, error } = await businessSupabase
      .from('catalogs')
      .update(catalogData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Delete catalog
  async delete(id: string): Promise<void> {
    const assertNoError = (error: PostgrestError | null, context: string) => {
      if (error) {
        throw new Error(`${context}: ${error.message || 'unknown error'}`);
      }
    };

    const tryDeleteCatalog = async () => businessSupabase
      .from('catalogs')
      .delete()
      .eq('id', id)
      .select('id');

    const { data: directDeleted, error: directDeleteError } = await tryDeleteCatalog();
    if (!directDeleteError && (directDeleted?.length ?? 0) > 0) {
      return;
    }

    const isFkError = directDeleteError?.code === '23503';
    if (directDeleteError && !isFkError) {
      throw new Error(`Ошибка удаления каталога: ${directDeleteError.message || 'unknown error'}`);
    }

    const { data: categories, error: categoriesError } = await businessSupabase
      .from('categories')
      .select('id')
      .eq('catalog_id', id);
    assertNoError(categoriesError, 'Ошибка загрузки категорий');

    const categoryIds = (categories ?? []).map((row) => row.id);
    if (categoryIds.length > 0) {
      const { error: itemsDeleteError } = await businessSupabase
        .from('items')
        .delete()
        .in('category_id', categoryIds);
      assertNoError(itemsDeleteError, 'Ошибка удаления товаров');

      const { error: categoriesDeleteError } = await businessSupabase
        .from('categories')
        .delete()
        .in('id', categoryIds);
      assertNoError(categoriesDeleteError, 'Ошибка удаления категорий');
    }

    const [actionsDelete, fulfillmentDelete, qrDelete, placeCatalogDelete, staffMembersDelete, staffCodesDelete, notificationsDelete, ordersDelete] = await Promise.all([
      businessSupabase.from('actions').delete().eq('catalog_id', id),
      businessSupabase.from('catalog_fulfillment_methods').delete().eq('catalog_id', id),
      businessSupabase.from('qr_links').delete().eq('target_type', 'catalog').eq('target_id', id),
      businessSupabase.from('place_catalogs').delete().eq('catalog_id', id),
      businessSupabase.from('catalog_staff_members').delete().eq('catalog_id', id),
      businessSupabase.from('catalog_staff_codes').delete().eq('catalog_id', id),
      businessSupabase.from('order_notifications').delete().eq('catalog_id', id),
      businessSupabase.from('orders').delete().eq('catalog_id', id),
    ]);
    assertNoError(actionsDelete.error, 'Ошибка удаления способов оплаты');
    assertNoError(fulfillmentDelete.error, 'Ошибка удаления способов получения');
    assertNoError(qrDelete.error, 'Ошибка удаления QR-ссылок');
    assertNoError(placeCatalogDelete.error, 'Ошибка удаления связей с фудкортом');
    assertNoError(staffMembersDelete.error, 'Ошибка удаления сотрудников');
    assertNoError(staffCodesDelete.error, 'Ошибка удаления кодов сотрудников');
    assertNoError(notificationsDelete.error, 'Ошибка удаления уведомлений');
    assertNoError(ordersDelete.error, 'Ошибка удаления заказов');

    const { data: deletedAfterCleanup, error: deleteAfterCleanupError } = await tryDeleteCatalog();
    assertNoError(deleteAfterCleanupError, 'Ошибка удаления каталога');
    if (!deletedAfterCleanup || deletedAfterCleanup.length === 0) {
      throw new Error('Каталог не был удален: проверьте политики доступа (RLS) и связи в БД');
    }

    const { data: existingCatalog, error: existingError } = await businessSupabase
      .from('catalogs')
      .select('id')
      .eq('id', id)
      .maybeSingle();
    assertNoError(existingError, 'Ошибка проверки удаления каталога');
    if (existingCatalog) {
      throw new Error('Каталог не был удален из базы данных');
    }
  }
};
