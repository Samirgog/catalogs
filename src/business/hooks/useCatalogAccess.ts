import useSWR from 'swr';
import { catalogAccessService } from '../services/catalogAccess';

export const useCatalogAccess = (catalogId: string) => {
  const collaborators = useSWR(
    catalogId ? ['catalog-collaborators', catalogId] : null,
    () => catalogAccessService.getCollaborators(catalogId),
    {
      revalidateOnFocus: false,
      dedupingInterval: 30000,
    }
  );

  const invite = useSWR(
    catalogId ? ['catalog-invite', catalogId] : null,
    () => catalogAccessService.getInvite(catalogId),
    {
      revalidateOnFocus: false,
      dedupingInterval: 30000,
    }
  );

  return {
    collaborators: collaborators.data || [],
    invite: invite.data || null,
    loading: collaborators.isLoading || invite.isLoading,
    error:
      (collaborators.error instanceof Error && collaborators.error.message) ||
      (invite.error instanceof Error && invite.error.message) ||
      null,
    refetch: async () => {
      await Promise.all([collaborators.mutate(), invite.mutate()]);
    },
    generateInvite: async (userId: string) => {
      const result = await catalogAccessService.generateInvite(catalogId, userId);
      await Promise.all([collaborators.mutate(), invite.mutate(result, { revalidate: false })]);
      return result;
    },
    acceptInvite: async (code: string, userId: string) => {
      const result = await catalogAccessService.acceptInvite(code, userId);
      await collaborators.mutate();
      return result;
    },
  };
};
