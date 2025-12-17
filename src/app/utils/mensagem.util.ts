export function extrairMensagemErro(
  err: any,
  fallback = 'Não foi possível completar a operação. Tente novamente.'
): string {
  const candidato = [
    err?.error?.message,
    err?.error?.mensagem,
    err?.error?.error,
    err?.message,
    err?.statusText,
    typeof err === 'string' ? err : null
  ].find(msg => typeof msg === 'string' && msg.trim());

  return candidato ? String(candidato).trim() : fallback;
}
