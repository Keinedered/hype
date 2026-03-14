import { axiosClient } from './axiosClient';

export function toAbsolutePublicUrl(rawUrl: string | null | undefined): string | null {
  if (!rawUrl) {
    return null;
  }

  if (/^https?:\/\//i.test(rawUrl)) {
    return rawUrl;
  }

  const baseURL = axiosClient.defaults.baseURL ?? '';
  const normalizedBase = baseURL.replace(/\/api\/v1\/?$/, '');
  return `${normalizedBase}${rawUrl}`;
}
