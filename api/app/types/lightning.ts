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