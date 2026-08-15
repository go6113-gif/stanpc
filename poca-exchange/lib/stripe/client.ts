import Stripe from 'stripe'

const stripeKey = process.env.STRIPE_SECRET_KEY
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET

export const stripe = stripeKey ? new Stripe(stripeKey, {
  apiVersion: '2026-07-29.dahlia',
  typescript: true,
}) : null

export const STRIPE_WEBHOOK_SECRET = webhookSecret || null
