// Card Generator 규격 상수

export const CARD_SIZES = {
  vertical: {
    width: 1080,
    height: 1920,
    aspectRatio: '9/16',
  },
  square: {
    width: 1080,
    height: 1080,
    aspectRatio: '1/1',
  },
} as const;

export const CARD_LAYOUT = {
  header: {
    height: 180,
  },
  footer: {
    height: 200,
  },
  qrCode: {
    size: 128,
  },
  padding: 32,
} as const;

export type CardSize = keyof typeof CARD_SIZES;
