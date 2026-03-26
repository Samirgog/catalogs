export type TutorialStep = {
  id: string;
  target: string;
  title: string;
  description: string;
};

export type TutorialSectionId =
  | 'catalogs'
  | 'catalog_editor'
  | 'categories_editor'
  | 'item_editor'
  | 'staff'
  | 'links'
  | 'categories_first_item_hint';
