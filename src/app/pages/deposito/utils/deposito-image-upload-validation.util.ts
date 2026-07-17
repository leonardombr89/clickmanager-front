import { HttpErrorResponse } from '@angular/common/http';

export const DEPOSITO_IMAGE_UPLOAD_LIMITS = {
  maxFileSizeMb: 10,
  maxFileSizeBytes: 10 * 1024 * 1024,
  maxWidth: 10000,
  maxHeight: 10000,
  maxMegapixels: 40,
  allowedTypes: [
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/svg+xml',
    'image/x-icon',
    'image/vnd.microsoft.icon',
  ],
  accept: 'image/*,.jpg,.jpeg,.png,.webp,.svg,.ico',
};

export interface DepositoImageValidationResult {
  valid: boolean;
  message?: string;
}

export async function validateDepositoImageFile(file: File): Promise<DepositoImageValidationResult> {
  if (!DEPOSITO_IMAGE_UPLOAD_LIMITS.allowedTypes.includes(file.type)) {
    return {
      valid: false,
      message: 'Formato de imagem não permitido.\nEnvie uma imagem JPG, PNG, WEBP, SVG ou ICO.',
    };
  }

  if (file.size > DEPOSITO_IMAGE_UPLOAD_LIMITS.maxFileSizeBytes) {
    return {
      valid: false,
      message: `Este arquivo tem ${formatDepositoImageSizeMb(file.size)} MB. O limite permitido é ${DEPOSITO_IMAGE_UPLOAD_LIMITS.maxFileSizeMb} MB.\nEscolha uma imagem menor ou comprima o arquivo antes de enviar.`,
    };
  }

  const dimensions = await readImageDimensions(file);
  if (!dimensions) {
    return { valid: true };
  }

  const megapixels = (dimensions.width * dimensions.height) / 1_000_000;
  const excedeResolucao =
    dimensions.width > DEPOSITO_IMAGE_UPLOAD_LIMITS.maxWidth
    || dimensions.height > DEPOSITO_IMAGE_UPLOAD_LIMITS.maxHeight
    || megapixels > DEPOSITO_IMAGE_UPLOAD_LIMITS.maxMegapixels;

  if (excedeResolucao) {
    return {
      valid: false,
      message:
        `Esta imagem não pode ser enviada.\n\n`
        + `Ela possui ${dimensions.width} x ${dimensions.height} px (${formatMegapixels(megapixels)} MP).\n`
        + `O limite é largura até ${DEPOSITO_IMAGE_UPLOAD_LIMITS.maxWidth} px, altura até ${DEPOSITO_IMAGE_UPLOAD_LIMITS.maxHeight} px e até ${DEPOSITO_IMAGE_UPLOAD_LIMITS.maxMegapixels} MP.\n\n`
        + 'Reduza a resolução da imagem ou escolha outro arquivo.',
    };
  }

  return { valid: true };
}

export function extractDepositoImageUploadError(error: unknown): string {
  if (error instanceof HttpErrorResponse) {
    const backendMessage =
      error.error?.message
      || error.error?.mensagem
      || error.error?.error
      || error.message;

    if (typeof backendMessage === 'string' && backendMessage.trim()) {
      return backendMessage.trim();
    }
  }

  return 'Falha ao enviar a imagem. Tente novamente.';
}

export function formatDepositoImageSize(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) {
    return '';
  }

  if (bytes < 1024) {
    return `${bytes} B`;
  }

  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }

  return `${formatDepositoImageSizeMb(bytes)} MB`;
}

function formatDepositoImageSizeMb(bytes: number): string {
  return formatDecimal(bytes / (1024 * 1024));
}

function formatMegapixels(value: number): string {
  return formatDecimal(value);
}

function formatDecimal(value: number): string {
  return value.toLocaleString('pt-BR', {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  });
}

function readImageDimensions(file: File): Promise<{ width: number; height: number } | null> {
  return new Promise((resolve) => {
    const objectUrl = URL.createObjectURL(file);
    const image = new Image();

    image.onload = () => {
      URL.revokeObjectURL(objectUrl);
      const width = image.naturalWidth || image.width;
      const height = image.naturalHeight || image.height;
      resolve(width > 0 && height > 0 ? { width, height } : null);
    };

    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(null);
    };

    image.src = objectUrl;
  });
}
