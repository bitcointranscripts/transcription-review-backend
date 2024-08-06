export interface AccessToken {
  access_token: string;
  expires_in: number;
  refresh_token: string;
  scope: string;
  token_type: string;
}

export interface WithdrawalResponse {
  id: string;
  type: string;
  amount: number;
  reference: string;
  fee: number;
  status: string;
  processed_at: number;
}

export interface OpenNodeResponse {
  id: string;
  min_amt: number;
  max_amt: number;
  description: string;
  callback_url: string;
  external_id: string;
  uri: string;
  lnurl: string;
  created_at: string;
  expiry_date: string;
  used: boolean;
}

export interface AlbyTokens {
  access_token: string;
  expires_in: number;
  refresh_token: string;
  scope: string;
  token_type: string;
}

export interface AlbyInvoice {
  payment_hash: string;
  payment_request: string;
  expires_at: string;
}

export type CreateInvoiceResponse = {
  payment_request: string;
  r_hash: string;
  add_index: string;
  payment_addr: string;
};

export type PayInvoiceResponse = {
  payment_hash: string;
  payment_preimage: string;
  payment_request: string;
  payment_index: string;
  status: "SUCCEEDED" | "FAILED" | "IN_FLIGHT";
  fee: string;
  fee_msat: string;
  fee_sat: string;
  value: string;
  value_msat: string;
  value_sat: string;
  htlcs: Array<{}>;
  failure_reason: "FAILURE_REASON_NONE" | string;
  creation_time_ns: string;
  creation_date: string;
};
