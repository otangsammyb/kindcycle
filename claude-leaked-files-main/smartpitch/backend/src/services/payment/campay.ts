import axios from 'axios';
import { config } from '../../config/env';

// Cache for access token
let accessToken: string | null = null;
let tokenExpiresAt: number = 0;

/**
 * Gets the CamPay API access token
 */
const getAccessToken = async (): Promise<string> => {
  const now = Date.now();
  if (accessToken && now < tokenExpiresAt - 60000) { // Refresh 1 minute before expiry
    return accessToken;
  }

  const response = await axios.post(`${config.campay.baseUrl}/token/`, {
    username: config.campay.username,
    password: config.campay.password,
  });

  accessToken = response.data.token;
  tokenExpiresAt = now + (response.data.expires_in * 1000);
  
  return accessToken!;
};

/**
 * Initiates a request to pay (Mobile Money Prompt)
 */
export const requestToPay = async (
  phoneNumber: string,
  amount: number,
  currency: string,
  externalReference: string,
  description: string
) => {
  const token = await getAccessToken();

  const response = await axios.post(
    `${config.campay.baseUrl}/collect/`,
    {
      amount: amount.toString(),
      currency,
      from: phoneNumber,
      description,
      external_reference: externalReference,
    },
    {
      headers: {
        Authorization: `Token ${token}`,
      },
    }
  );

  return response.data; // Returns reference ID
};

/**
 * Check transaction status manually
 */
export const getTransactionStatus = async (reference: string) => {
  const token = await getAccessToken();

  const response = await axios.get(
    `${config.campay.baseUrl}/transaction/${reference}/`,
    {
      headers: {
        Authorization: `Token ${token}`,
      },
    }
  );

  return response.data;
};
