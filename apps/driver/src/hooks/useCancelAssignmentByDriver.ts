import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { CancelAssignmentByDriverDTO } from '@voyyaa/shared';
import { cancelAssignmentByDriver } from '../api/assignment.api';
import { DRIVER_HOME_QUERY_KEY } from './useDriverHome';

export function useCancelAssignmentByDriver(assignmentId: number | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (dto: CancelAssignmentByDriverDTO) => {
      if (assignmentId === null) {
        return Promise.reject(new Error('No hay una asignación activa para cancelar.'));
      }
      return cancelAssignmentByDriver(assignmentId, dto);
    },
    retry: false,
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: DRIVER_HOME_QUERY_KEY }),
  });
}
