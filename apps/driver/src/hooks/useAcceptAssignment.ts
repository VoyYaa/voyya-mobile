import { useMutation } from '@tanstack/react-query';
import type { AcceptAssignmentDTO } from '@voyyaa/shared';
import { acceptAssignment } from '../api/assignment.api';

export function useAcceptAssignment(assignmentId: number | null) {
  return useMutation({
    mutationFn: (dto?: AcceptAssignmentDTO) => {
      if (assignmentId === null) {
        return Promise.reject(new Error('No hay una solicitud activa para aceptar.'));
      }
      return acceptAssignment(assignmentId, dto ?? {});
    },
    retry: false,
  });
}
