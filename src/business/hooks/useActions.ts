import useSWR, { useSWRConfig } from 'swr';
import { actionService } from '../services/actions';
import type { Action, ActionFormData } from '../../types';

// SWR fetcher function
const fetcher = (catalogId: string) => actionService.getByCatalogId(catalogId);
const isCacheKey = (key: unknown, prefix: string) =>
  Array.isArray(key) && key[0] === prefix;

// Hook for managing actions
export const useActions = (catalogId: string) => {
  const { data: actions = [], error, isLoading, isValidating, mutate } = useSWR(
    catalogId ? ['actions', catalogId] : null,
    () => fetcher(catalogId),
    {
      revalidateOnFocus: false,
      dedupingInterval: 30000, // 30 seconds
    }
  );

  const { mutate: globalMutate } = useSWRConfig();

  const createAction = async (actionData: ActionFormData) => {
    const newAction = await actionService.create(actionData, catalogId);
    
    // Optimistically update the cache
    await mutate(
      (prev: Action[] = []) => [...prev, newAction],
      { revalidate: false }
    );
    
    // Also invalidate related caches
    globalMutate(
      (key: unknown) =>
        Array.isArray(key) && key[0] === 'action' && key[1] === newAction.id
    );
    
    return newAction;
  };

  const updateAction = async (id: string, actionData: Partial<ActionFormData>) => {
    const updatedAction = await actionService.update(id, actionData);
    
    // Update specific action cache
    globalMutate(['action', id], updatedAction, false);
    
    // Update actions list
    await mutate(
      (prev: Action[] = []) => 
        prev.map(action => action.id === id ? updatedAction : action),
      { revalidate: false }
    );
    
    return updatedAction;
  };

  const deleteAction = async (id: string) => {
    await actionService.delete(id);
    
    // Remove from actions list
    await mutate(
      (prev: Action[] = []) => prev.filter(action => action.id !== id),
      { revalidate: false }
    );
    
    // Invalidate specific action cache
    globalMutate(['action', id], undefined, { revalidate: false });
  };

  const toggleAction = async (id: string, isEnabled: boolean) => {
    const updatedAction = await actionService.toggleEnabled(id, isEnabled);
    
    // Update specific action cache
    globalMutate(['action', id], updatedAction, false);
    
    // Update actions list
    await mutate(
      (prev: Action[] = []) => 
        prev.map(action => action.id === id ? updatedAction : action),
      { revalidate: false }
    );
    
    return updatedAction;
  };

  return {
    actions,
    loading: isLoading,
    error: error ? (error instanceof Error ? error.message : 'Failed to fetch actions') : null,
    isValidating,
    refetch: () => mutate(),
    createAction,
    updateAction,
    deleteAction,
    toggleAction
  };
};

// Hook for single action
export const useAction = (id: string) => {
  const { data: action, error, isLoading, isValidating, mutate } = useSWR(
    id ? ['action', id] : null,
    () => actionService.getById(id),
    {
      revalidateOnFocus: false,
      dedupingInterval: 30000, // 30 seconds
    }
  );

  const { mutate: globalMutate } = useSWRConfig();

  const updateAction = async (actionData: Partial<ActionFormData>) => {
    const updatedAction = await actionService.update(id, actionData);
    
    // Update this action cache
    await mutate(updatedAction, { revalidate: false });
    
    // Update actions list
    globalMutate(
      (key: unknown) => isCacheKey(key, 'actions'),
      undefined,
      { revalidate: true }
    );
    
    return updatedAction;
  };

  const deleteAction = async () => {
    await actionService.delete(id);
    
    // Clear this action cache
    await mutate(undefined, { revalidate: false });
    
    // Update actions list
    globalMutate(
      (key: unknown) => isCacheKey(key, 'actions'),
      undefined,
      { revalidate: true }
    );
  };

  const toggleAction = async (isEnabled: boolean) => {
    const updatedAction = await actionService.toggleEnabled(id, isEnabled);
    
    // Update this action cache
    await mutate(updatedAction, { revalidate: false });
    
    // Update actions list
    globalMutate(
      (key: unknown) => isCacheKey(key, 'actions'),
      undefined,
      { revalidate: true }
    );
    
    return updatedAction;
  };

  return {
    action,
    loading: isLoading,
    error: error ? (error instanceof Error ? error.message : 'Failed to fetch action') : null,
    isValidating,
    refetch: () => mutate(),
    updateAction,
    deleteAction,
    toggleAction
  };
};
