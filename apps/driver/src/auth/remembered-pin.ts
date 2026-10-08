let rememberedPin: string | null = null;

export function rememberTemporaryPin(pin: string): void {
  rememberedPin = pin;
}

export function recallTemporaryPin(): string | null {
  return rememberedPin;
}

export function forgetTemporaryPin(): void {
  rememberedPin = null;
}
