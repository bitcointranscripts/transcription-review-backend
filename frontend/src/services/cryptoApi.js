import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

const createRequest = (url) => ({ url });

export const cryptoApi = createApi({
  reducerPath: 'cryptoApi',
  baseQuery: fetchBaseQuery({ baseUrl: process.env.REACT_APP_CRYPTO_API_URL }),
  endpoints: (builder) => ({
    getCryptos: builder.query({
      query: () => createRequest('/transcripts'),
    }),

    getCryptoDetails: builder.query({
      query: (transcriptId) => createRequest(`/transcripts/${transcriptId}`),
    }),

    // Note: Change the coin price history endpoint from this - `coin/${transcriptId}/history/${timeperiod} to this - `coin/${transcriptId}/history?timeperiod=${timeperiod}`
    getCryptoHistory: builder.query({
      query: ({ transcriptId, timeperiod }) => createRequest(`coin/${transcriptId}/history?timeperiod=${timeperiod}`),
    }),

    // Note: To access this endpoint you need premium plan
    getExchanges: builder.query({
      query: () => createRequest('/exchanges'),
    }),
  }),
});

export const {
  useGetCryptosQuery,
  useGetCryptoDetailsQuery,
  useGetExchangesQuery,
  useGetCryptoHistoryQuery,
} = cryptoApi;
