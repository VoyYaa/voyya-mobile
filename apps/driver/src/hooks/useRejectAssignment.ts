import { useMutation } from '@tanstack/react-query';
import type { RejectAssignmentDTO } from '@voyyaa/shared';
import { rejectAssignment } from '../api/assignment.api';

export function useRejectAssignment(assignmentId: number | null) {
  return useMutation({
    mutationFn: (dto?: RejectAssignmentDTO) => {
      if (assignmentId === null) {
        return Promise.reject(new Error('No hay una solicitud activa para rechazar.'));
      }
      return rejectAssignment(assignmentId, dto ?? {});
    },
    retry: false,
  });
}
