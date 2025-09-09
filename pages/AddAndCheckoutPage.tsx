

import React, { useEffect, useContext } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { ProductContext, CartContext } from '../App';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { useI18n } from '../hooks/useI18n';

export const AddAndCheckoutPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { t } = useI18n(); 

  const productCtx = useContext(ProductContext);
  const cartCtx = useContext(CartContext);

  useEffect(() => {
    // This logic is designed to be as fast as possible. It avoids any heavy computation or API calls.
    // The sequence is: check contexts -> get URL param -> find product in memory -> clear cart -> add to cart -> navigate.
    // This should result in a near-instantaneous redirection to the cart page.
    
    if (!productCtx || !cartCtx) {
      // This is a transient state while contexts are initializing.
      return;
    }

    const productId = searchParams.get('productId');

    if (!productId) {
      console.error("AddAndCheckoutPage: Product ID is missing from the URL.");
      navigate('/', { replace: true });
      return;
    }

    const productToAdd = productCtx.getProductById(productId);

    if (productToAdd && productToAdd.stock > 0) {
      cartCtx.clearCart();
      cartCtx.addToCart(productToAdd, 1);
      navigate('/cart', { replace: true });
    } else {
      // If product is not found or out of stock, redirecting to the product page (if it exists)
      // or the homepage provides the best user feedback.
      navigate(productToAdd ? `/product/${productId}` : '/', { replace: true });
    }
  }, [searchParams, navigate, productCtx, cartCtx]);

  // This loading spinner is a fallback. It will only be visible for a fraction of a second
  // during the initial app load and context initialization. The redirection itself is immediate.
  return (
    <div className="flex justify-center items-center h-full">
        <LoadingSpinner message={t('preparingSpecialOrder')} />
    </div>
  );
};