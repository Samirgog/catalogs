import useSWR from 'swr';
import { staffService } from '../services/staff';
import { useUserStore } from '@/userStore';
import type { StaffMember } from '../../types';

export const useStaff = (catalogId: string) => {
  const { user } = useUserStore();

  const {
    data: accessCode,
    error: accessCodeError,
    isLoading: accessCodeLoading,
    mutate: mutateAccessCode,
  } = useSWR(
    catalogId ? ['staff-access-code', catalogId] : null,
    () => staffService.getAccessCode(catalogId),
    {
      revalidateOnFocus: false,
      dedupingInterval: 15000,
    }
  );

  const {
    data: members = [],
    error: membersError,
    isLoading: membersLoading,
    mutate: mutateMembers,
  } = useSWR(
    catalogId ? ['staff-members', catalogId] : null,
    () => staffService.getMembers(catalogId),
    {
      revalidateOnFocus: false,
      dedupingInterval: 10000,
    }
  );

  const generateAccessCode = async () => {
    const code = await staffService.upsertAccessCode(catalogId, user?.id);
    await mutateAccessCode(code, { revalidate: false });
    await mutateAccessCode();
    return code;
  };

  const setMemberActive = async (id: string, isActive: boolean) => {
    const updated = await staffService.setMemberActive(id, isActive);
    await mutateMembers(
      (prev: StaffMember[] = []) =>
        prev.map(member => (member.id === id ? updated : member)),
      { revalidate: false }
    );
    return updated;
  };

  return {
    accessCode,
    members,
    isLoading: accessCodeLoading || membersLoading,
    error: accessCodeError?.message || membersError?.message || null,
    refetch: async () => {
      await Promise.all([mutateAccessCode(), mutateMembers()]);
    },
    generateAccessCode,
    setMemberActive,
  };
};
