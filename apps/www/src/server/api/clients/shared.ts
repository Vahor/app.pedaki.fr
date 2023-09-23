import { env } from '~/env.mjs';

const baseUrl = env.NEXT_PUBLIC_API_URL;

export const getUrl = () => {
  return baseUrl + '/t/api';
};
