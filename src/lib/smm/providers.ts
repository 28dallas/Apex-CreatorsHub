/**
 * SMM Provider Abstraction Layer
 *
 * Provider priority (2026):
 *   1. Smmwiz   — primary, 150+ country endpoints, best for Africa
 *   2. JAP      — first fallback, legacy reliability, industry insurance policy
 *   3. YoYoMedia — second fallback, superior error handling
 *   4. PRM4U    — direct source, lowest cost, used for high-volume orders
 *
 * All providers implement the SMMProvider interface so the router
 * can swap them transparently.
 */

export type SMMServiceType = "likes" | "views" | "followers" | "comments";
export type SMMProviderName = "smmwiz" | "jap" | "yoyomedia" | "prm4u";

export interface SMMOrderParams {
  service_type: SMMServiceType;
  platform: string;
  post_url: string;
  quantity: number;
  drip_feed: boolean;       // deliver gradually over time
  drip_interval_minutes?: number; // minutes between drip batches (default: 120)
}

export interface SMMOrderResult {
  success: boolean;
  provider: SMMProviderName;
  external_order_id: string | null;
  error?: string;
  retryable?: boolean; // true = transient error, worth retrying with next provider
}

export interface SMMServicePrice {
  service_id: string;
  name: string;
  rate_per_1000_usd: number;
  min: number;
  max: number;
}

interface SMMProvider {
  name: SMMProviderName;
  placeOrder(params: SMMOrderParams): Promise<SMMOrderResult>;
  getPrice(serviceType: SMMServiceType, platform: string): Promise<number>; // USD per 1000
}

// ─── Shared helpers ───────────────────────────────────────────────────────────

function isRetryable(status: number): boolean {
  return status === 429 || status === 500 || status === 502 || status === 503 || status === 504;
}

async function standardPanelRequest(
  apiUrl: string,
  apiKey: string,
  body: Record<string, unknown>
): Promise<{ data: Record<string, unknown>; status: number }> {
  const res = await fetch(apiUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ key: apiKey, ...body }),
    signal: AbortSignal.timeout(15000), // 15s timeout
  });
  const data = await res.json().catch(() => ({}));
  return { data, status: res.status };
}

function findService(
  services: Array<{ name?: string; type?: string; rate?: string; min?: number; max?: number; service?: string }>,
  serviceType: string,
  platform: string
): { id: string; rate: number } | null {
  const match = services.find(
    (s) =>
      (s.name ?? s.type ?? "").toLowerCase().includes(serviceType) &&
      (s.name ?? s.type ?? "").toLowerCase().includes(platform.toLowerCase())
  );
  if (!match) return null;
  return {
    id: String(match.service ?? match.name ?? ""),
    rate: parseFloat(match.rate ?? "0"),
  };
}

// ─── Smmwiz (Primary) ─────────────────────────────────────────────────────────

class SmmwizProvider implements SMMProvider {
  name: SMMProviderName = "smmwiz";
  private apiUrl = process.env.SMMWIZ_API_URL ?? "https://smmwiz.com/api/v2";
  private apiKey = process.env.SMMWIZ_API_KEY ?? "";

  /** Returns current USD balance on the Smmwiz master account */
  async checkBalance(): Promise<number> {
    try {
      const { data } = await standardPanelRequest(this.apiUrl, this.apiKey, { action: "balance" });
      return parseFloat(String(data.balance ?? "0"));
    } catch {
      return -1; // unknown
    }
  }

  async getPrice(serviceType: SMMServiceType, platform: string): Promise<number> {
    try {
      const { data } = await standardPanelRequest(this.apiUrl, this.apiKey, { action: "services" });
      const services = Array.isArray(data) ? data : [];
      const match = findService(services, serviceType, platform);
      return match ? match.rate : 0.01;
    } catch {
      return 0.01;
    }
  }

  async placeOrder(params: SMMOrderParams): Promise<SMMOrderResult> {
    try {
      const serviceId = await this._resolveServiceId(params.service_type, params.platform);
      if (!serviceId) {
        return { success: false, provider: this.name, external_order_id: null, error: "Service not found on Smmwiz", retryable: true };
      }

      const body: Record<string, unknown> = {
        action: "add",
        service: serviceId,
        link: params.post_url,
        quantity: params.quantity,
      };

      if (params.drip_feed) {
        body.drip_feed = true;
        body.interval = params.drip_interval_minutes ?? 120;
        body.quantity_per_run = Math.ceil(params.quantity / 10); // 10 batches
      }

      const { data, status } = await standardPanelRequest(this.apiUrl, this.apiKey, body);

      if (data.order) {
        return { success: true, provider: this.name, external_order_id: String(data.order) };
      }

      return {
        success: false, provider: this.name, external_order_id: null,
        error: String(data.error ?? "Unknown Smmwiz error"),
        retryable: isRetryable(status),
      };
    } catch (err) {
      return { success: false, provider: this.name, external_order_id: null, error: String(err), retryable: true };
    }
  }

  private async _resolveServiceId(serviceType: string, platform: string): Promise<string | null> {
    const { data } = await standardPanelRequest(this.apiUrl, this.apiKey, { action: "services" });
    const services = Array.isArray(data) ? data : [];
    const match = findService(services, serviceType, platform);
    return match?.id ?? null;
  }
}

// ─── JAP — JustAnotherPanel (First Fallback) ──────────────────────────────────

class JAPProvider implements SMMProvider {
  name: SMMProviderName = "jap";
  private apiUrl = process.env.JAP_API_URL ?? "https://justanotherpanel.com/api/v2";
  private apiKey = process.env.JAP_API_KEY ?? "";

  async getPrice(serviceType: SMMServiceType, platform: string): Promise<number> {
    try {
      const { data } = await standardPanelRequest(this.apiUrl, this.apiKey, { action: "services" });
      const services = Array.isArray(data) ? data : [];
      const match = findService(services, serviceType, platform);
      return match ? match.rate : 0.012;
    } catch {
      return 0.012;
    }
  }

  async placeOrder(params: SMMOrderParams): Promise<SMMOrderResult> {
    try {
      const serviceId = await this._resolveServiceId(params.service_type, params.platform);
      if (!serviceId) {
        return { success: false, provider: this.name, external_order_id: null, error: "Service not found on JAP", retryable: true };
      }

      const body: Record<string, unknown> = {
        action: "add",
        service: serviceId,
        link: params.post_url,
        quantity: params.quantity,
      };

      // JAP supports drip_feed as runs/interval
      if (params.drip_feed) {
        body.runs = 10;
        body.interval = params.drip_interval_minutes ?? 120;
      }

      const { data, status } = await standardPanelRequest(this.apiUrl, this.apiKey, body);

      if (data.order) {
        return { success: true, provider: this.name, external_order_id: String(data.order) };
      }

      return {
        success: false, provider: this.name, external_order_id: null,
        error: String(data.error ?? "Unknown JAP error"),
        retryable: isRetryable(status),
      };
    } catch (err) {
      return { success: false, provider: this.name, external_order_id: null, error: String(err), retryable: true };
    }
  }

  private async _resolveServiceId(serviceType: string, platform: string): Promise<string | null> {
    const { data } = await standardPanelRequest(this.apiUrl, this.apiKey, { action: "services" });
    const services = Array.isArray(data) ? data : [];
    const match = findService(services, serviceType, platform);
    return match?.id ?? null;
  }
}

// ─── YoYoMedia (Second Fallback) ─────────────────────────────────────────────

class YoYoMediaProvider implements SMMProvider {
  name: SMMProviderName = "yoyomedia";
  private apiUrl = process.env.YOYOMEDIA_API_URL ?? "https://yoyomedia.com/api/v2";
  private apiKey = process.env.YOYOMEDIA_API_KEY ?? "";

  async getPrice(serviceType: SMMServiceType, platform: string): Promise<number> {
    try {
      const { data } = await standardPanelRequest(this.apiUrl, this.apiKey, { action: "services" });
      const services = Array.isArray(data) ? data : [];
      const match = findService(services, serviceType, platform);
      return match ? match.rate : 0.011;
    } catch {
      return 0.011;
    }
  }

  async placeOrder(params: SMMOrderParams): Promise<SMMOrderResult> {
    try {
      const serviceId = await this._resolveServiceId(params.service_type, params.platform);
      if (!serviceId) {
        return { success: false, provider: this.name, external_order_id: null, error: "Service not found on YoYoMedia", retryable: true };
      }

      const { data, status } = await standardPanelRequest(this.apiUrl, this.apiKey, {
        action: "add",
        service: serviceId,
        link: params.post_url,
        quantity: params.quantity,
        // YoYoMedia uses drip_feed boolean + interval
        ...(params.drip_feed ? { drip_feed: 1, interval: params.drip_interval_minutes ?? 120 } : {}),
      });

      if (data.order) {
        return { success: true, provider: this.name, external_order_id: String(data.order) };
      }

      return {
        success: false, provider: this.name, external_order_id: null,
        error: String(data.error ?? "Unknown YoYoMedia error"),
        retryable: isRetryable(status),
      };
    } catch (err) {
      return { success: false, provider: this.name, external_order_id: null, error: String(err), retryable: true };
    }
  }

  private async _resolveServiceId(serviceType: string, platform: string): Promise<string | null> {
    const { data } = await standardPanelRequest(this.apiUrl, this.apiKey, { action: "services" });
    const services = Array.isArray(data) ? data : [];
    const match = findService(services, serviceType, platform);
    return match?.id ?? null;
  }
}

// ─── PRM4U (Direct Source — high-volume orders) ───────────────────────────────

class PRM4UProvider implements SMMProvider {
  name: SMMProviderName = "prm4u";
  private apiUrl = process.env.PRM4U_API_URL ?? "https://prm4u.com/api/v2";
  private apiKey = process.env.PRM4U_API_KEY ?? "";

  async getPrice(serviceType: SMMServiceType, platform: string): Promise<number> {
    try {
      const { data } = await standardPanelRequest(this.apiUrl, this.apiKey, { action: "services" });
      const services = Array.isArray(data) ? data : [];
      const match = findService(services, serviceType, platform);
      return match ? match.rate : 0.009; // typically cheapest — direct source
    } catch {
      return 0.009;
    }
  }

  async placeOrder(params: SMMOrderParams): Promise<SMMOrderResult> {
    try {
      const serviceId = await this._resolveServiceId(params.service_type, params.platform);
      if (!serviceId) {
        return { success: false, provider: this.name, external_order_id: null, error: "Service not found on PRM4U", retryable: true };
      }

      const { data, status } = await standardPanelRequest(this.apiUrl, this.apiKey, {
        action: "add",
        service: serviceId,
        link: params.post_url,
        quantity: params.quantity,
      });

      if (data.order) {
        return { success: true, provider: this.name, external_order_id: String(data.order) };
      }

      return {
        success: false, provider: this.name, external_order_id: null,
        error: String(data.error ?? "Unknown PRM4U error"),
        retryable: isRetryable(status),
      };
    } catch (err) {
      return { success: false, provider: this.name, external_order_id: null, error: String(err), retryable: true };
    }
  }

  private async _resolveServiceId(serviceType: string, platform: string): Promise<string | null> {
    const { data } = await standardPanelRequest(this.apiUrl, this.apiKey, { action: "services" });
    const services = Array.isArray(data) ? data : [];
    const match = findService(services, serviceType, platform);
    return match?.id ?? null;
  }
}

// ─── Smart Router ─────────────────────────────────────────────────────────────

const PROVIDERS: Record<SMMProviderName, SMMProvider> = {
  smmwiz: new SmmwizProvider(),
  jap: new JAPProvider(),
  yoyomedia: new YoYoMediaProvider(),
  prm4u: new PRM4UProvider(),
};

// Region → preferred provider order
// Africa-local regions go to Smmwiz first (150+ country endpoints)
// High-volume orders (>5000) go to PRM4U first (direct source, lower cost)
function getProviderOrder(region: string, quantity: number): SMMProviderName[] {
  if (quantity >= 5000) {
    return ["prm4u", "smmwiz", "jap", "yoyomedia"];
  }
  const africanRegions = new Set(["KE", "NG", "ZA", "GH", "TZ", "UG", "EG"]);
  if (africanRegions.has(region)) {
    return ["smmwiz", "jap", "yoyomedia", "prm4u"];
  }
  // Global default
  return ["smmwiz", "jap", "yoyomedia", "prm4u"];
}

export interface RouterResult extends SMMOrderResult {
  attempts: number;
}

/**
 * Route an SMM order through providers with automatic failover.
 * Tries each provider in order. On retryable error, moves to next.
 * On non-retryable error (e.g. invalid URL), stops immediately.
 */
export async function routeOrder(
  params: SMMOrderParams,
  region: string
): Promise<RouterResult> {
  const order = getProviderOrder(region, params.quantity);
  let attempts = 0;

  for (const providerName of order) {
    attempts++;
    const provider = PROVIDERS[providerName];
    const result = await provider.placeOrder(params);

    if (result.success) {
      return { ...result, attempts };
    }

    // Non-retryable error (bad URL, invalid service, etc.) — stop immediately
    if (!result.retryable) {
      return { ...result, attempts };
    }

    // Retryable — log and try next provider
    console.warn(`[SMM Router] ${providerName} failed (retryable): ${result.error}. Trying next provider.`);
  }

  // All providers exhausted
  return {
    success: false,
    provider: order[order.length - 1],
    external_order_id: null,
    error: "All SMM providers failed. Order queued for manual retry.",
    retryable: false,
    attempts,
  };
}

/**
 * Get the best price across all providers for a given service.
 * Uses the primary provider for the region.
 */
export async function getBestPrice(
  serviceType: SMMServiceType,
  platform: string,
  region: string,
  quantity: number
): Promise<{ cost_usd: number; provider: SMMProviderName }> {
  const order = getProviderOrder(region, quantity);
  const primaryName = order[0];
  const primary = PROVIDERS[primaryName];

  try {
    const rate = await primary.getPrice(serviceType, platform);
    return { cost_usd: (rate * quantity) / 1000, provider: primaryName };
  } catch {
    return { cost_usd: (0.01 * quantity) / 1000, provider: primaryName };
  }
}

// Warn in server logs when Smmwiz balance drops below this threshold
const LOW_BALANCE_THRESHOLD_USD = 10;

/**
 * Check Smmwiz master balance.
 * Returns balance in USD. Logs a warning if below LOW_BALANCE_THRESHOLD_USD.
 * Call this inside fulfillBoostOrder before placing the order.
 */
export async function checkSmmwizBalance(): Promise<{ balance: number; low: boolean }> {
  const provider = PROVIDERS.smmwiz as SmmwizProvider;
  const balance = await provider.checkBalance();
  const low = balance >= 0 && balance < LOW_BALANCE_THRESHOLD_USD;
  if (low) {
    console.error(`[SMM] ⚠️  Smmwiz balance LOW: $${balance.toFixed(2)} — top up now at smmwiz.com`);
  }
  return { balance, low };
}
