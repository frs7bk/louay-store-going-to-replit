import React, { useContext, useState } from 'react'; // Added useState
import { Link } from 'react-router-dom';
import { CartContext } from '../App';
import { Button } from '../components/Button';
import { CartItem } from '../types';
import { ConfirmationModal } from '../components/ConfirmationModal'; // Import ConfirmationModal
import { toast } from 'react-toastify'; // Import toast
import { useI18n } from '../hooks/useI18n';

export const CartPage: React.FC = () => {
  const cartCtx = useContext(CartContext);
  const { t, getLocalized } = useI18n();

  // State for ConfirmationModal
  const [modalConfig, setModalConfig] = useState<{
      isOpen: boolean;
      title?: string;
      message?: React.ReactNode;
      onConfirmAction?: () => void;
      confirmText?: string;
      confirmVariant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  }>({ isOpen: false });

  if (!cartCtx) {
    return <p className="text-center text-xl text-gumball-pink dark:text-gumball-pink/80">Cart is currently unavailable. Please try again.</p>;
  }

  const { cart, removeFromCart, updateQuantity, getCartSubtotal, clearCart } = cartCtx;

  const handleQuantityChange = (item: CartItem, newQuantity: number) => {
    const localizedName = getLocalized(item.name) as string;
    if (newQuantity <= 0) {
      // Trigger confirmation for removing item when quantity becomes 0 or less
      handleRemoveItemAttempt(item.id, localizedName);
    } else if (newQuantity > item.stock) {
        updateQuantity(item.id, item.stock); 
    }
    else {
      updateQuantity(item.id, newQuantity);
    }
  };

  const handleRemoveItemAttempt = (itemId: string, itemName: string) => {
    setModalConfig({
        isOpen: true,
        title: t('confirmRemoveItemTitle'),
        message: <p dangerouslySetInnerHTML={{ __html: t('confirmRemoveItemMessage', { itemName }) }} />,
        onConfirmAction: () => {
            removeFromCart(itemId);
            toast.info(t('itemRemoved', { itemName }));
        },
        confirmText: t('remove'),
        confirmVariant: "danger"
    });
  };

  const handleClearCartAttempt = () => {
    if (cart.length === 0) {
        toast.info(t('cartAlreadyEmpty'));
        return;
    }
    setModalConfig({
        isOpen: true,
        title: t('confirmClearCartTitle'),
        message: <p>{t('confirmClearCartMessage')}</p>,
        onConfirmAction: () => {
            clearCart();
            toast.info(t('cartCleared'));
        },
        confirmText: t('clearCart'),
        confirmVariant: "danger"
    });
  };


  if (cart.length === 0) {
    return (
      <div className="text-center py-20 animate-fadeIn">
        <img 
            src="https://picsum.photos/seed/emptycart/300/200" 
            alt="Empty Cart" 
            className="mx-auto mb-8 rounded-lg shadow-lg hover:animate-wiggleSoft dark:opacity-80" 
        />
        <h2 className="text-4xl font-display text-gumball-purple dark:text-gumball-purple/80 mb-4">{t('cartIsEmpty')}</h2>
        <p className="text-lg text-gumball-dark dark:text-gumball-light-bg/80 mb-8">{t('browseAndAdd')}</p>
        <Button variant="primary" size="lg" as={Link} to="/">
            {t('shopNow')}
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 md:p-8 animate-fadeIn">
      <h1 className="text-5xl font-display text-gumball-blue dark:text-gumball-blue/90 mb-8 text-center">{t('yourCart')}</h1>
      
      <div className="bg-white dark:bg-gumball-dark-card shadow-xl rounded-lg p-6 mb-8">
        {cart.map((item) => {
          const localizedName = getLocalized(item.name) as string;
          return (
          <div key={item.id} className="flex flex-col md:flex-row items-center justify-between py-4 border-b border-gray-200 dark:border-gray-700 last:border-b-0">
            <div className="flex items-center mb-4 md:mb-0 w-full md:w-auto">
              <img src={item.imageUrl} alt={localizedName} className="w-20 h-20 object-cover rounded-md ltr:me-4 rtl:ml-4 shadow-sm" />
              <div>
                <h3 className="text-lg font-semibold text-gumball-dark dark:text-gumball-light-bg">{localizedName}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">${item.price.toFixed(2)} {t('each')}</p>
              </div>
            </div>
            <div className="flex items-center space-x-3 rtl:space-x-reverse">
              <Button size="sm" variant="ghost" onClick={() => handleQuantityChange(item, item.quantity - 1)} aria-label={t('decreaseQty')} disabled={item.quantity <=1 && cart.length === 1 && item.quantity === 1}> {/* Disable if it's the last item and quantity is 1 to force removal via explicit button */}
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 12h-15" /></svg>
              </Button>
              <input 
                type="number"
                value={item.quantity}
                onChange={(e) => handleQuantityChange(item, parseInt(e.target.value))}
                className="w-16 text-center border border-gray-300 dark:border-gray-600 rounded-md p-1 focus:ring-gumball-pink focus:border-gumball-pink dark:bg-gumball-dark dark:text-gumball-light-bg"
                min="1"
                max={item.stock}
                aria-label={t('quantityFor', {name: localizedName})}
              />
              <Button size="sm" variant="ghost" onClick={() => handleQuantityChange(item, item.quantity + 1)} aria-label={t('increaseQty')} disabled={item.quantity >= item.stock}>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
              </Button>
            </div>
            <p className="font-techno text-lg text-gumball-green md:w-24 text-center md:text-end my-2 md:my-0">${(item.price * item.quantity).toFixed(2)}</p>
            <Button variant="danger" size="sm" onClick={() => handleRemoveItemAttempt(item.id, localizedName)} aria-label={t('removeItem', {name: localizedName})}>
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12.56 0c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
              </svg>
            </Button>
          </div>
          )})}
      </div>

      <div className="flex flex-col md:flex-row justify-between items-center bg-gumball-yellow/20 dark:bg-gumball-yellow/10 p-6 rounded-lg shadow-xl">
        <div>
            <Button variant="ghost" onClick={handleClearCartAttempt} className="text-red-500 hover:bg-red-100/50 dark:hover:bg-red-700/30">
            {t('clearCart')}
            </Button>
        </div>
        <div className="text-end mt-4 md:mt-0">
          <p className="text-2xl font-techno text-gumball-dark dark:text-gumball-light-bg">
            {t('total')} <span className="text-gumball-green">${getCartSubtotal().toFixed(2)}</span>
          </p>
          <Button 
            as={Link}
            to="/checkout"
            variant="secondary" 
            size="lg" 
            className="mt-4 font-display w-full md:w-auto"
            disabled={cart.length === 0}
            >
            {t('proceedToCheckout')}
          </Button>
        </div>
      </div>
      <ConfirmationModal
        isOpen={modalConfig.isOpen}
        title={modalConfig.title || t('confirmAction')}
        message={modalConfig.message || t('areYouSure')}
        onConfirm={() => {
            if (modalConfig.onConfirmAction) {
                modalConfig.onConfirmAction();
            }
            setModalConfig({ isOpen: false }); // Close modal
        }}
        onCancel={() => setModalConfig({ isOpen: false })}
        confirmButtonText={modalConfig.confirmText || t('confirm')}
        confirmButtonVariant={modalConfig.confirmVariant || "danger"}
    />
    </div>
  );
};