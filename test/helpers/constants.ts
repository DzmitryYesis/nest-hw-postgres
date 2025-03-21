import { SETTINGS } from '../../src/settings';

export const authBasic = Buffer.from(SETTINGS.AUTH_BASIC, 'utf8').toString(
  'base64',
);

export const invalidId = '674c1117e773331c44445554';

export const invalidCode = 'b904fd57-f1d1-4fd9-8c28-8363b1blabla';

export const invalidRefreshToken = 'refreshToken=invalidtoken';
