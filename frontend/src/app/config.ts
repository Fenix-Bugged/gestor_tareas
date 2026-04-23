import { isDevMode } from '@angular/core';

export const getApiUrl = () => {
  return isDevMode() ? 'http://localhost:3000' : 'https://easygoing-nature-production.up.railway.app';
};
