const DARAJA_BASE =
  process.env.DARAJA_ENV === "production"
    ? "https://api.safaricom.co.ke"
    : "https://sandbox.safaricom.co.ke";

async function getDarajaToken(): Promise<string> {
  const credentials = Buffer.from(
    `${process.env.DARAJA_CONSUMER_KEY}:${process.env.DARAJA_CONSUMER_SECRET}`
  ).toString("base64");

  const res = await fetch(
    `${DARAJA_BASE}/oauth/v1/generate?grant_type=client_credentials`,
    { headers: { Authorization: `Basic ${credentials}` } }
  );
  const data = await res.json();
  return data.access_token;
}

function getTimestamp(): string {
  return new Date()
    .toISOString()
    .replace(/[-T:.Z]/g, "")
    .slice(0, 14);
}

function getPassword(timestamp: string): string {
  return Buffer.from(
    `${process.env.DARAJA_SHORTCODE}${process.env.DARAJA_PASSKEY}${timestamp}`
  ).toString("base64");
}

export interface STKPushParams {
  phone: string;       // Format: 2547XXXXXXXX
  amount: number;      // KES
  accountRef: string;  // e.g. subscription ID
  description: string;
}

export interface STKPushResult {
  success: boolean;
  checkoutRequestId?: string;
  merchantRequestId?: string;
  error?: string;
}

export async function initiateStkPush(params: STKPushParams): Promise<STKPushResult> {
  try {
    const token = await getDarajaToken();
    const timestamp = getTimestamp();
    const password = getPassword(timestamp);

    const res = await fetch(`${DARAJA_BASE}/mpesa/stkpush/v1/processrequest`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        BusinessShortCode: process.env.DARAJA_SHORTCODE,
        Password: password,
        Timestamp: timestamp,
        TransactionType: "CustomerPayBillOnline",
        Amount: Math.ceil(params.amount),
        PartyA: params.phone,
        PartyB: process.env.DARAJA_SHORTCODE,
        PhoneNumber: params.phone,
        CallBackURL: process.env.DARAJA_CALLBACK_URL,
        AccountReference: params.accountRef,
        TransactionDesc: params.description,
      }),
    });

    const data = await res.json();

    if (data.ResponseCode === "0") {
      return {
        success: true,
        checkoutRequestId: data.CheckoutRequestID,
        merchantRequestId: data.MerchantRequestID,
      };
    }

    return { success: false, error: data.errorMessage ?? "STK Push failed" };
  } catch (err) {
    console.error("Daraja error:", err);
    return { success: false, error: "M-Pesa service unavailable" };
  }
}
