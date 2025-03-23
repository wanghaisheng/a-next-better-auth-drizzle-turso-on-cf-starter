'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import InAppPurchaseButton from "@/components/payment/in-app-purchase-button";
import { isIOSPWA, isStoreKitAvailable, fetchProducts, IAPProduct, IAPPurchaseResult, restorePurchases } from "@/lib/payment/in-app-purchase";

/**
 * iOS In-App Purchase Test Page
 * This page demonstrates the iOS in-app purchase functionality
 * and provides a way to test it in development
 */
export default function InAppPurchasePage() {
  const [products, setProducts] = useState<IAPProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [isStoreKit, setIsStoreKit] = useState(false);
  const [restoredPurchases, setRestoredPurchases] = useState<IAPPurchaseResult[]>([]);
  const [restoringPurchases, setRestoringPurchases] = useState(false);

  // Load products on component mount
  useEffect(() => {
    const loadProducts = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Check if running as PWA on iOS
        const iosPwa = isIOSPWA();
        setIsIOS(iosPwa);
        
        // Check if StoreKit is available
        const storekit = isStoreKitAvailable();
        setIsStoreKit(storekit);
        
        // Fetch products if running on iOS with StoreKit
        if (iosPwa && storekit) {
          const availableProducts = await fetchProducts();
          setProducts(availableProducts);
        } else {
          // Use sample products for demonstration
          const availableProducts = await fetchProducts();
          setProducts(availableProducts);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load products');
      } finally {
        setLoading(false);
      }
    };
    
    loadProducts();
  }, []);

  // Handle successful purchase
  const handlePurchaseSuccess = (result: IAPPurchaseResult) => {
    setSuccess(`Successfully purchased ${result.productId}. Transaction ID: ${result.transactionId}`);
    setTimeout(() => setSuccess(null), 5000); // Clear success message after 5 seconds
  };

  // Handle purchase error
  const handlePurchaseError = (error: Error) => {
    setError(error.message);
    setTimeout(() => setError(null), 5000); // Clear error message after 5 seconds
  };

  // Handle restore purchases
  const handleRestorePurchases = async () => {
    try {
      setRestoringPurchases(true);
      setError(null);
      
      const restored = await restorePurchases();
      setRestoredPurchases(restored);
      
      if (restored.length === 0) {
        setError('No purchases to restore');
      } else {
        setSuccess(`Restored ${restored.length} purchase(s)`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to restore purchases');
    } finally {
      setRestoringPurchases(false);
    }
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-6">iOS In-App Purchase Test</h1>
      
      {/* Environment Information */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Environment</CardTitle>
          <CardDescription>Current runtime environment information</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-2">
            <div className="font-semibold">Running as iOS PWA:</div>
            <div>{isIOS ? 'Yes' : 'No'}</div>
            <div className="font-semibold">StoreKit Available:</div>
            <div>{isStoreKit ? 'Yes' : 'No'}</div>
          </div>
        </CardContent>
        <CardFooter>
          <p className="text-sm text-gray-500">
            {!isIOS && 'This page is designed to work in an iOS PWA environment. Some features may be simulated for testing purposes.'}
            {isIOS && !isStoreKit && 'StoreKit is not available. Make sure your app is properly configured for in-app purchases.'}
            {isIOS && isStoreKit && 'Your environment is properly configured for in-app purchases.'}
          </p>
        </CardFooter>
      </Card>
      
      {/* Error/Success Messages */}
      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      {success && (
        <Alert className="mb-6 bg-green-50 border-green-200">
          <AlertTitle>Success</AlertTitle>
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}
      
      {/* Products List */}
      <h2 className="text-2xl font-semibold mb-4">Available Products</h2>
      
      {loading ? (
        <p>Loading products...</p>
      ) : products.length === 0 ? (
        <p>No products available</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map((product) => (
            <Card key={product.id} className="h-full flex flex-col">
              <CardHeader>
                <CardTitle>{product.name}</CardTitle>
                <CardDescription>{product.description}</CardDescription>
              </CardHeader>
              <CardContent className="flex-grow">
                <div className="text-2xl font-bold mb-2">{product.priceFormatted}</div>
                <div className="text-sm text-gray-500">Type: {product.type}</div>
              </CardContent>
              <CardFooter>
                <InAppPurchaseButton
                  productId={product.id}
                  onSuccess={handlePurchaseSuccess}
                  onError={handlePurchaseError}
                />
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
      
      {/* Restore Purchases */}
      <div className="mt-8">
        <h2 className="text-2xl font-semibold mb-4">Restore Purchases</h2>
        <Button 
          onClick={handleRestorePurchases} 
          disabled={restoringPurchases}
          className="mb-4"
        >
          {restoringPurchases ? 'Restoring...' : 'Restore Purchases'}
        </Button>
        
        {restoredPurchases.length > 0 && (
          <div className="mt-4">
            <h3 className="text-xl font-semibold mb-2">Restored Purchases</h3>
            <div className="border rounded-md p-4">
              {restoredPurchases.map((purchase, index) => (
                <div key={index} className="mb-2 pb-2 border-b last:border-b-0">
                  <div><span className="font-semibold">Product:</span> {purchase.productId}</div>
                  <div><span className="font-semibold">Transaction:</span> {purchase.transactionId}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      
      {/* Implementation Notes */}
      <div className="mt-8 p-4 bg-gray-50 rounded-md">
        <h2 className="text-xl font-semibold mb-2">Implementation Notes</h2>
        <ul className="list-disc pl-5 space-y-2">
          <li>This is a test implementation of iOS in-app purchases for PWA.</li>
          <li>In a production environment, you would need to properly configure your app with Apple and implement server-side receipt validation.</li>
          <li>The current implementation simulates the in-app purchase flow