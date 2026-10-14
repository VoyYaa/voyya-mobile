const SINGULAR_HOUR_PATTERN = /^1:/;

function endWithPunctuation(text: string): string {
  return /[.…!?]$/.test(text) ? text : `${text}.`;
}

export const savedStartCodeCopy = {
  offlineTitle: 'Sin conexión',
  checkingTitle: 'Revisando tu viaje…',
  errorTitle: 'No pudimos actualizar tu viaje',
  openOffline: 'Sin conexión · mostrando el código guardado en tu teléfono.',
  openRefreshFailed: 'No pudimos actualizar tu viaje · mostrando el código guardado.',
  savedAt: (clock: string): string =>
    SINGULAR_HOUR_PATTERN.test(clock)
      ? `Código guardado a la ${clock}`
      : `Código guardado a las ${clock}`,
  spokenStatus: (title: string, detail: string | null): string => {
    const spoken = endWithPunctuation(title.replace(/\s·\s/g, '. '));
    return detail === null ? spoken : `${spoken} ${detail}`;
  },
  accessibility: (digits: string, instruction: string, status: string | null): string =>
    status === null
      ? `Tu código de inicio: ${digits}. ${instruction}`
      : `Tu código de inicio: ${digits}. ${endWithPunctuation(status)} ${instruction}`,
} as const;

export const savedTripCopy = {
  notice: {
    title: 'Este es el último estado que conocemos',
    body: {
      offline: 'Tu conductor pudo cancelar o cambiar desde entonces. Conéctate para confirmar.',
      checking:
        'Tu conductor pudo cancelar o cambiar desde entonces. Estamos confirmando tu viaje.',
      error:
        'Tu conductor pudo cancelar o cambiar desde entonces. Intenta de nuevo para confirmar.',
    },
  },
  retrying: 'Revisando…',
  cancelReason: {
    unconfirmed: 'No se puede cancelar hasta actualizar tu viaje.',
  },
  announce: {
    stillOffline: 'Sigue sin conexión.',
    stillFailing: 'Todavía no pudimos actualizar tu viaje.',
    refreshed: 'Tu viaje está actualizado.',
  },
} as const;
