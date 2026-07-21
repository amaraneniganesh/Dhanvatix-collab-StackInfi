import CryptoJS from 'crypto-js';

const getSecret = () => import.meta.env.VITE_API_SECRET || 'dhanvatix_secure_api_key_2026';

export const apiFetch = async (url: string, options: RequestInit = {}): Promise<Response> => {
  const apiKey = getSecret();

  // Ensure headers exist
  const headers = new Headers(options.headers || {});
  headers.set('x-api-key', apiKey);

  // Encrypt Body if it exists and is JSON
  if (options.body && typeof options.body === 'string' && options.body.startsWith('{')) {
    const encryptedBody = CryptoJS.AES.encrypt(options.body, getSecret()).toString();
    options.body = JSON.stringify({ payload: encryptedBody });
    headers.set('Content-Type', 'application/json');
  }

  options.headers = headers;

  const res = await fetch(url, options);

  // Clone response to modify json() method
  const resClone = res.clone();
  
  // Override json() to decrypt
  res.json = async () => {
    const data = await resClone.json();
    if (data.payload) {
      try {
        const bytes = CryptoJS.AES.decrypt(data.payload, getSecret());
        const decryptedString = bytes.toString(CryptoJS.enc.Utf8);
        return JSON.parse(decryptedString);
      } catch (e) {
        console.error('Failed to decrypt response payload');
        throw new Error('Encryption error');
      }
    }
    return data;
  };

  return res;
};
