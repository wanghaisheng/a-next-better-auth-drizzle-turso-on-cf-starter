"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  isIOSPWA,
  isStoreKitAvailable,
  initializeStoreKit,
  fetchProducts,
  purchaseProduct,
  verifyPurchase,
  IAPProduct,
  IAPPurchaseResult
} from "@/lib/payment/in-app-purchase";

interface InAppPurchaseButtonProps {
  productId: string;
  fallbackLabel?: string;
  onSuccess: (purchaseResult: IAPPurchaseResult) => void;
  onError: (error: Error) => void;
}

/**
 * iOS In-App Purchase button component
 * This component will render a button that triggers an in-app purchase
 * when the app is running as a PWA on iOS
 */
export default function InAppPurchaseButton({
  productId,
  fallbackLabel = "Buy Now",
  onSuccess,
  onError,
}: InAppPurchaseButtonProps) {
  const [loading, setLoading] = useState(false);
  const [product, setProduct] = useState<IAPProduct | null>(null);
  const [isAvailable, setIsAvailable] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Check if StoreKit is available and fetch product details
  useEffect(() => {
    setMounted(true);
    
    const checkAvailability = async () => {
      try {
        // Check if running as PWA on iOS with StoreKit available
        const available = isIOSPWA() && isStoreKitAvailable();
        setIsAvailable(available);
        
        if (available) {
          // Initialize StoreKit
          await initializeStoreKit();
          
          // Fetch products
          const products = await fetchProducts();
          
          // Find the requested product
          const foundProduct = products.find(p => p.id === productId);
          if (foundProduct) {
            setProduct(foundProduct);
          }
        }
      } catch (error) {
        console.error("Error initializing in-app purchase:", error);
        setIsAvailable(false);
      }
    };
    
    checkAvailability();
  }, [productId]);

  // Handle purchase
  const handlePurchase = async () => {
    if (!isAvailable || !product) {
      onError(new Error("In-app purchase is not available"));
      return;
    }
    
    setLoading(true);
    
    try {
      // Initiate purchase
      const purchaseResult = await purchaseProduct(productId);
      
      if (purchaseResult.success && purchaseResult.receipt) {
        // Verify purchase with server
        const isVerified = await verifyPurchase(purchaseResult.receipt);
        
        if (isVerified) {
          onSuccess(purchaseResult);
        } else {
          onError(new Error("Purchase verification failed"));
        }
      } else {
        onError(new Error(purchaseResult.error || "Purchase failed"));
      }
    } catch (error) {
      onError(error instanceof Error ? error : new Error("Unknown error during purchase"));
    } finally {
      setLoading(false);
    }
  };

  // Only render on client side to prevent hydration mismatch
  if (!mounted) {
    return null;
  }

  // If StoreKit is not available, don't render anything
  if (!isAvailable) {
    return null;
  }

  return (
    <Button
      className="w-full"
      disabled={loading || !product}
      onClick={handlePurchase}
    >
      {loading ? "Processing..." : product ? `Buy ${product.name} (${product.priceFormatted})` : fallbackLabel}
    </Button>
  );
}