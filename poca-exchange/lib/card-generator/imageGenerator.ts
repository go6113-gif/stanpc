import html2canvas from 'html2canvas';
import { CARD_SIZES, type CardSize } from './cardSizes';

export interface GenerateImageOptions {
  scale?: number;
  backgroundColor?: string;
  logging?: boolean;
}

export const generateCardImage = async (
  element: HTMLElement,
  size: CardSize,
  options: GenerateImageOptions = {}
): Promise<Blob | null> => {
  if (!element) return null;

  const { scale = 2, backgroundColor = '#ffffff', logging = false } = options;

  try {
    const cardSize = CARD_SIZES[size];

    // Clone element to avoid Tailwind CSS parsing issues
    const clonedElement = element.cloneNode(true) as HTMLElement;
    clonedElement.style.position = 'fixed';
    clonedElement.style.left = '-9999px';
    clonedElement.style.top = '-9999px';
    document.body.appendChild(clonedElement);

    const canvas = await html2canvas(clonedElement, {
      scale,
      useCORS: true,
      logging,
      backgroundColor,
      width: cardSize.width,
      height: cardSize.height,
      windowHeight: cardSize.height,
      windowWidth: cardSize.width,
      allowTaint: true,
      removeContainer: false,
      async: true,
      foreignObjectRendering: true,
    }).catch((err) => {
      // If LAB color parsing fails, try without logging
      console.warn('Retrying canvas capture without extended logging...');
      return html2canvas(clonedElement, {
        scale: Math.max(1, scale - 1),
        useCORS: true,
        logging: false,
        backgroundColor,
        width: cardSize.width,
        height: cardSize.height,
        windowHeight: cardSize.height,
        windowWidth: cardSize.width,
        allowTaint: true,
        removeContainer: false,
        async: true,
      });
    });

    document.body.removeChild(clonedElement);

    return new Promise((resolve) => {
      canvas.toBlob((blob) => {
        resolve(blob);
      }, 'image/png');
    });
  } catch (error) {
    console.error('Failed to generate card image:', error);
    return null;
  }
};

export const downloadImage = (blob: Blob, filename: string) => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
