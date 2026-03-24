export interface Category {
  id: string;
  code: string;
  name: string;
  parentId?: string | null;
  path?: string;
  level?: number;
  isActive?: boolean;
  createdAt?: string;
}

export type CategoryCreatePayload = {
  name: string;
  parentId?: string | null;
  isActive?: boolean;
};

export type CategoryUpdatePayload = {
  code: string;
  name: string;
  parentId?: string | null;
  path?: string;
  level?: number;
  isActive?: boolean;
};
