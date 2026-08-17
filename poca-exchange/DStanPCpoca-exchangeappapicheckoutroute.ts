import { auth } from '@/auth';
import { NextRequest, NextResponse } from 'next/server';

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;
const STRIPE_API_URL = 'https://api.stripe.com/v1';

export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    if (!STRIPE_SECRET_KEY) {
      return NextResponse.json(
        { error: 'Stripe configuration missing' },
        { status: 500 }
      );
    }

    const body = await request.json();
    const { priceUSD = 18 } = body;

    // Create Stripe Checkout Session
    const checkoutResponse = await fetch(`${STRIPE_API_URL}/checkout/sessions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${STRIPE_SECRET_KEY}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        'payment_method_types[]': 'card',
        'mode': 'payment',
        'customer_email': session.user.email || '',
        'client_reference_id': session.user.id,
        'success_url': `${process.env.NEXT_PUBLIC_SITE_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
        'cancel_url': `${process.env.NEXT_PUBLIC_SITE_URL}/`,
        'line_items[0][price_data][currency]': 'usd',
        'line_items[0][price_data][unit_amount]': Math.round(priceUSD * 100).toString(),
        'line_items[0][price_data][product_data][name]': 'StanPC Founder Lifetime Pass',
        'line_items[0][price_data][product_data][description]': 'Lifetime access to all StanPC features for early supporters',
        'line_items[0][quantity]': '1',
      }).toString(),
    });

    if (!checkoutResponse.ok) {
      const error = await checkoutResponse.json();
      console.error('Stripe API error:', error);
      return NextResponse.json(
        { error: 'Failed to create checkout session' },
        { status: 500 }
      );
    }

    const checkoutSession = await checkoutResponse.json();

    return NextResponse.json({
      sessionId: checkoutSession.id,
      url: checkoutSession.url,
    });
  } catch (error) {
    console.error('Checkout error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
