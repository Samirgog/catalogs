import { businessSupabase } from '../../lib/supabase';
import type { Catalog, CatalogFormData } from '../../types';

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
    const assertNoError = (error: any, context: string) => {
      if (error) {
        throw new Error(`${context}: ${error.message || 'unknown error'}`);
      }
    };

    const { data: categories, error: categoriesError } = await businessSupabase
      .from('categories')
      .select('id')
      .eq('catalog_id', id);
    assertNoError(categoriesError, 'Ошибка загрузки категорий');

    const categoryIds = (categories ?? []).map(row => row.id);
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

    const { error: actionsDeleteError } = await businessSupabase
      .from('actions')
      .delete()
      .eq('catalog_id', id);
    assertNoError(actionsDeleteError, 'Ошибка удаления способов оплаты');

    const { error: fulfillmentDeleteError } = await businessSupabase
      .from('catalog_fulfillment_methods')
      .delete()
      .eq('catalog_id', id);
    assertNoError(fulfillmentDeleteError, 'Ошибка удаления способов получения');

    const { error: qrDeleteError } = await businessSupabase
      .from('qr_links')
      .delete()
      .eq('target_type', 'catalog')
      .eq('target_id', id);
    assertNoError(qrDeleteError, 'Ошибка удаления QR-ссылок');

    const { error: placeCatalogDeleteError } = await businessSupabase
      .from('place_catalogs')
      .delete()
      .eq('catalog_id', id);
    assertNoError(placeCatalogDeleteError, 'Ошибка удаления связей с фудкортом');

    const { error: staffMembersDeleteError } = await businessSupabase
      .from('catalog_staff_members')
      .delete()
      .eq('catalog_id', id);
    assertNoError(staffMembersDeleteError, 'Ошибка удаления сотрудников');

    const { error: staffCodesDeleteError } = await businessSupabase
      .from('catalog_staff_codes')
      .delete()
      .eq('catalog_id', id);
    assertNoError(staffCodesDeleteError, 'Ошибка удаления кодов сотрудников');

    const { error: notificationsDeleteError } = await businessSupabase
      .from('order_notifications')
      .delete()
      .eq('catalog_id', id);
    assertNoError(notificationsDeleteError, 'Ошибка удаления уведомлений');

    const { error: ordersDeleteError } = await businessSupabase
      .from('orders')
      .delete()
      .eq('catalog_id', id);
    assertNoError(ordersDeleteError, 'Ошибка удаления заказов');

    const { error: catalogDeleteError } = await businessSupabase
      .from('catalogs')
      .delete()
      .eq('id', id);
    assertNoError(catalogDeleteError, 'Ошибка удаления каталога');

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
