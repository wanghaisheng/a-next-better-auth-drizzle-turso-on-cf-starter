import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

// Initialize Stripe with the secret key from environment variables
const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: "2023-10-16" })
  : null; // Handle missing API key gracefully

/**
 * POST /api/payment
 * Processes a payment using Stripe
 */
export async function POST(request: NextRequest) {
  try {
    // Check if Stripe is initialized
    if (!stripe) {
      console.error("Stripe API key is not configured");
      return NextResponse.json(
        { success: false, error: "Payment processing is not configured" },
        { status: 500 }
      );
    }

    // Parse the request body
    const { paymentMethodId, amount, currency } = await request.json();

    // Validate required fields
    if (!paymentMethodId || !amount || !currency) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Create a payment intent with Stripe
    const paymentIntent = await stripe.paymentIntents.create({
      amount, // Amount in cents
      currency: currency.toLowerCase(),
      payment_method: paymentMethodId,
      confirm: true, // Confirm the payment intent immediately
      return_url: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3001"}/checkout/success`,
      // In a real application, you might want to store metadata about the purchase
      metadata: {
        product_id: "premium-subscription",
        integration_type: "apple_pay",
      },
    });

    // Return success response with payment intent details
    return NextResponse.json({
      success: true,
      clientSecret: paymentIntent.client_secret,
      paymentIntent: {
        id: paymentIntent.id,
        status: paymentIntent.status,
      },
    });
  } catch (error) {
    // Log the error for debugging
    console.error("Payment processing error:", error);

    let errorMessage = "Payment processing failed";

    // Handle Stripe errors
    if (error instanceof Stripe.StripeError) {
      errorMessage = error.message;
    } else if (error instanceof Error) {
      errorMessage = error.message;
    }

    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 400 }
    );
  }
}
