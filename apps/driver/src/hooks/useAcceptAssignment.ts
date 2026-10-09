import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { AcceptAssignmentDTO } from '@voyyaa/shared';
import { acceptAssignment } from '../api/assignment.api';
import { DRIVER_HOME_QUERY_KEY } from './useDriverHome';

export function useAcceptAssignment(assignmentId: number | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto?: AcceptAssignmentDTO) => {
      if (assignmentId === null) {
        return Promise.reject(new Error('No hay una solicitud activa para aceptar.'));
      }
      return acceptAssignment(assignmentId, dto ?? {});
    },
    retry: false,
    onSuccess: (result) => {
      if (result.result === 'accepted') {
        void queryClient.invalidateQueries({ queryKey: DRIVER_HOME_QUERY_KEY });
      }
    },
  });
}
