import Stripe from "stripe";

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error("STRIPE_SECRET_KEY is not set");
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2024-11-20.acacia",
  typescript: true,
});

export const STRIPE_PRICES = {
  growth: process.env.STRIPE_PRICE_GROWTH ?? "",
  agency: process.env.STRIPE_PRICE_AGENCY ?? "",
} as const;

export type StripeTier = keyof typeof STRIPE_PRICES;
