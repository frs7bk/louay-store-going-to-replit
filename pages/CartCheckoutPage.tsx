
import React, { useContext, useState, ChangeEvent, FormEvent, useMemo, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { CartContext, OrderContext } from '../App';
import { Button } from '../components/Button';
import { Modal } from '../components/Modal';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { toast } from 'react-toastify';
import { useI18n } from '../hooks/useI18n';
import { algerianWilayas } from '../data/algeria-shipping-data';
import { ConfirmationModal } from '../components/ConfirmationModal';
import { CartItem, ShippingMethod } from '../types';


interface CheckoutFormData {
  customerName: string;
  billingAddress: string;
  wilayaCode: string;
  commune: string;
  phoneNumber: string;
  phoneNumberSecondary?: string;
}

const LocationPinIcon: React.FC<{ className?: string }> = ({ className = "w-5 h-5" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
  </svg>
);


export const CartCheckoutPage: React.FC = () => {
  const cartCtx = useContext(CartContext);
  const orderCtx = useContext(OrderContext);
  const navigate = useNavigate();
  const { t, getLocalized, dir } = useI18n();

  const [formData, setFormData] = useState<CheckoutFormData>({
    customerName: '',
    billingAddress: '', 
    wilayaCode: '', 
    commune: '', 
    phoneNumber: '',
    phoneNumberSecondary: '',
  });

  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [showOrderSuccessModal, setShowOrderSuccessModal] = useState(false);
  const [placedOrderId, setPlacedOrderId] = useState<string | null>(null);
  
  const [deliveryMethod, setDeliveryMethod] = useState<ShippingMethod | null>(null);
  const [shippingCost, setShippingCost] = useState<number>(0);


  const [modalConfig, setModalConfig] = useState<{
      isOpen: boolean;
      title?: string;
      message?: React.ReactNode;
      onConfirmAction?: () => void;
      confirmText?: string;
      confirmVariant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  }>({ isOpen: false });

  const wilayasList = useMemo(() => {
    return Object.entries(algerianWilayas).map(([code, data]) => ({
      code: code,
      name: `${code} - ${data.name}`
    })).sort((a, b) => parseInt(a.code, 10) - parseInt(b.code, 10));
  }, []);

  const communesList = useMemo(() => {
      if (!formData.wilayaCode) return [];
      return algerianWilayas[formData.wilayaCode].communes;
  }, [formData.wilayaCode]);
  
  const finalTotal = useMemo(() => {
      if (!cartCtx) return 0;
      return cartCtx.getCartSubtotal() + shippingCost;
  }, [cartCtx, shippingCost]);

  const availableShippingOptions = useMemo(() => {
    if (!formData.wilayaCode || !algerianWilayas[formData.wilayaCode]) return { options: [], unavailable: false };
    const prices = algerianWilayas[formData.wilayaCode].deliveryPrice;
    const options: ShippingMethod[] = [];
    if (prices.domicile > 0) options.push('Domicile');
    if (prices.stopdesk > 0) options.push('Stopdesk');
    return { options, unavailable: options.length === 0 };
  }, [formData.wilayaCode]);

  useEffect(() => {
    if (formData.wilayaCode) {
        setFormData(prev => ({ ...prev, commune: '' }));
    }
  }, [formData.wilayaCode]);

  useEffect(() => {
    if (availableShippingOptions.options.length === 1) {
        setDeliveryMethod(availableShippingOptions.options[0]);
    } else {
        setDeliveryMethod(null);
    }
  }, [availableShippingOptions.options]);
  
  useEffect(() => {
    if (formData.wilayaCode && deliveryMethod && algerianWilayas[formData.wilayaCode]) {
        const price = algerianWilayas[formData.wilayaCode].deliveryPrice[deliveryMethod.toLowerCase() as 'domicile' | 'stopdesk'];
        setShippingCost(price);
    } else {
        setShippingCost(0);
    }
 }, [formData.wilayaCode, deliveryMethod]);


  if (!cartCtx || !orderCtx) {
    return <LoadingSpinner message={t('loadingAdminData')} />;
  }

  const { cart, getCartSubtotal, removeFromCart, updateQuantity, clearCart } = cartCtx;

  if (cart.length === 0 && !isLoading && !showOrderSuccessModal) {
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

  const handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleQuantityChange = (item: CartItem, newQuantity: number) => {
    const localizedName = getLocalized(item.name) as string;
    if (newQuantity <= 0) {
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

  const handleAutoFillAddress = async () => {
    if (!navigator.geolocation) {
      toast.error(t('geolocationNotSupported'));
      return;
    }
    setIsLoadingLocation(true);
    toast.info(t('requestingLocation'));
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        toast.success(t('locationPinpointed'));
        try {
          const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}`);
          if (!response.ok) throw new Error(`Nominatim API error: ${response.statusText}`);
          const data = await response.json();
          let addressString = data.display_name || "Could not determine full address.";
          setFormData(prev => ({ ...prev, billingAddress: addressString }));
          toast.success(t('addressAutofilled'));
        } catch (error) {
          console.error("Reverse geocoding error:", error);
          toast.error(t('reverseGeocodingError'));
          setFormData(prev => ({ ...prev, billingAddress: `Lat: ${latitude.toFixed(4)}, Lon: ${longitude.toFixed(4)} (Manual entry recommended)`}));
        } finally {
          setIsLoadingLocation(false);
        }
      },
      (error) => {
        setIsLoadingLocation(false);
        switch (error.code) {
          case error.PERMISSION_DENIED: toast.error(t('locationPermissionDenied')); break;
          case error.POSITION_UNAVAILABLE: toast.error(t('locationUnavailable')); break;
          case error.TIMEOUT: toast.error(t('locationTimeout')); break;
          default: toast.error(t('unknownLocationError')); break;
        }
      }, { timeout: 10000, enableHighAccuracy: true }
    );
  };

  const handleSubmitOrder = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (cart.length === 0) {
      toast.error(t('cartIsEmpty'));
      return;
    }
    if (!formData.customerName.trim() || !formData.billingAddress.trim() || !formData.phoneNumber.trim() || !formData.wilayaCode || !formData.commune) {
        toast.warn(t('fillAllFields'));
        return;
    }
    if(availableShippingOptions.options.length > 1 && !deliveryMethod){
        toast.warn(t('selectDeliveryMethod'));
        return;
    }
    if(!deliveryMethod && availableShippingOptions.options.length > 0){
        toast.error(t('deliveryNotAvailable'));
        return;
    }
    if(availableShippingOptions.unavailable){
        toast.error(t('deliveryNotAvailable'));
        return;
    }
    setIsLoading(true);
    
    const wilayaName = algerianWilayas[formData.wilayaCode].name;
    const newOrder = await orderCtx.addOrder(
        formData.customerName, cart, finalTotal, formData.billingAddress,
        wilayaName, formData.phoneNumber, formData.phoneNumberSecondary, formData.commune, deliveryMethod!, shippingCost
    );
    
    setIsLoading(false);
    if (newOrder) {
        toast.success(t('orderPlacedSuccessfully'));
        setPlacedOrderId(newOrder.id);
        setShowOrderSuccessModal(true);
    }
  };
  
  const inputBaseClass = "mt-1 block w-full p-3 bg-white text-gumball-dark placeholder-gray-400 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-gumball-pink focus:border-gumball-pink dark:bg-gumball-dark-card dark:text-gumball-light-bg dark:placeholder-gray-500";

  return (
    <div className="container mx-auto p-4 md:p-8 animate-fadeIn">
      <h1 className="text-4xl sm:text-5xl font-display text-gumball-pink dark:text-gumball-pink/90 mb-8 text-center">{t('yourCartAndCheckout')}</h1>

      {isLoading && (
        <div className="fixed inset-0 bg-black/50 flex flex-col items-center justify-center z-[100]">
            <LoadingSpinner message={t('confirmingOrder')} color="text-gumball-yellow" size="lg" />
            <p className="text-gumball-yellow font-techno mt-4">{t('pleaseWait')}</p>
        </div>
      )}

      {showOrderSuccessModal && placedOrderId && (
        <Modal isOpen={showOrderSuccessModal} onClose={() => {
          setShowOrderSuccessModal(false);
          navigate('/'); 
        }} title={t('orderPlacedSuccessfully')}>
          <div className="text-center">
            <p className="text-2xl font-display text-gumball-green mb-4">{t('success')}</p>
            <p className="text-lg mb-2 dark:text-gray-200" dangerouslySetInnerHTML={{ __html: t('orderHasBeenPlaced', {orderId: placedOrderId})}} />
            <p className="mb-2 dark:text-gray-300">{t('trackYourProgress')}</p>
            <p className="text-sm text-gumball-blue dark:text-gumball-blue/80 mb-6 font-semibold">{t('orderSuccessContact')}</p>
            <Button onClick={() => {
              setShowOrderSuccessModal(false);
              navigate(`/track-order/${placedOrderId}`);
            }} variant="secondary" className="mr-2 mb-2 sm:mb-0">
              {t('trackYourOrder')}
            </Button>
            <Button onClick={() => {
              setShowOrderSuccessModal(false);
              navigate('/');
            }} variant="primary">
              {t('continueShopping')}
            </Button>
          </div>
        </Modal>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        
        {/* Cart View */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white dark:bg-gumball-dark-card shadow-xl rounded-lg p-6">
            <h2 className="text-2xl font-techno text-gumball-blue dark:text-gumball-blue/90 mb-4">{t('yourCart')}</h2>
            {cart.map((item) => {
              const localizedName = getLocalized(item.name) as string;
              return (
              <div key={item.id} className="flex flex-col md:flex-row items-center justify-between py-4 border-b border-gray-200 dark:border-gray-700 last:border-b-0">
                <div className="flex items-center mb-4 md:mb-0 w-full md:w-auto md:flex-1">
                  <Link to={`/product/${item.id}`} className="flex-shrink-0" aria-label={`${t('viewDetailsFor', {productName: localizedName})}`}>
                    <img 
                      src={item.imageUrl} 
                      alt={localizedName} 
                      className="w-20 h-20 object-cover rounded-md ltr:mr-4 rtl:ml-4 shadow-sm transition-transform duration-200 hover:scale-105" 
                    />
                  </Link>
                  <div>
                    <Link to={`/product/${item.id}`} className="group" aria-label={`${t('viewDetailsFor', {productName: localizedName})}`}>
                      <h3 className="text-lg font-semibold text-gumball-dark dark:text-gumball-light-bg group-hover:text-gumball-pink dark:group-hover:text-gumball-pink/90 transition-colors">
                        {localizedName}
                      </h3>
                    </Link>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{item.price.toLocaleString()} {t('currencyUnit')} {t('each')}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3 rtl:space-x-reverse">
                  <Button size="sm" variant="ghost" onClick={() => handleQuantityChange(item, item.quantity - 1)} aria-label={t('decreaseQty')}>
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 12h-15" /></svg>
                  </Button>
                  <input 
                    type="number"
                    value={item.quantity}
                    onChange={(e) => handleQuantityChange(item, parseInt(e.target.value) || 0)}
                    className="w-16 text-center bg-white text-gumball-dark border border-gray-300 dark:border-gray-600 rounded-md p-1 focus:ring-gumball-pink focus:border-gumball-pink dark:bg-gumball-dark-card dark:text-gumball-light-bg"
                    min="1"
                    max={item.stock}
                    aria-label={t('quantityFor', {name: localizedName})}
                  />
                  <Button size="sm" variant="ghost" onClick={() => handleQuantityChange(item, item.quantity + 1)} aria-label={t('increaseQty')} disabled={item.quantity >= item.stock}>
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
                  </Button>
                </div>
                <p className="font-techno text-lg text-gumball-green md:w-24 text-center md:text-end my-2 md:my-0">{(item.price * item.quantity).toLocaleString()} {t('currencyUnit')}</p>
                <Button variant="danger" size="sm" onClick={() => handleRemoveItemAttempt(item.id, localizedName)} aria-label={t('removeItem', {name: localizedName})}>
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12.56 0c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                  </svg>
                </Button>
              </div>
              )})}
              <div className="flex justify-end mt-4">
                  <Button variant="ghost" onClick={handleClearCartAttempt} className="text-red-500 hover:bg-red-100/50 dark:hover:bg-red-700/30">
                    {t('clearCart')}
                  </Button>
              </div>
          </div>
        </div>

        {/* Checkout Form & Summary */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white dark:bg-gumball-dark-card p-8 rounded-xl shadow-2xl sticky top-24">
            <h2 className="text-3xl font-techno text-gumball-purple dark:text-gumball-purple/90 mb-6">{t('checkout')}</h2>
            <div className="p-4 mb-6 bg-blue-50 dark:bg-blue-900/30 border-s-4 border-blue-400 dark:border-blue-500 rounded-md" dir={dir}>
                <p className="text-sm font-semibold text-blue-800 dark:text-blue-200">{t('cashOnDeliveryInfo')}</p>
            </div>
            <form onSubmit={handleSubmitOrder} className="space-y-6">
              <div>
                <label htmlFor="customerName" className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t('fullName')}</label>
                <input type="text" name="customerName" id="customerName" value={formData.customerName} onChange={handleInputChange} required className={inputBaseClass} placeholder="e.g., John Doe"/>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t('phoneNumber')}</label>
                    <input type="tel" name="phoneNumber" id="phoneNumber" value={formData.phoneNumber} onChange={handleInputChange} required className={inputBaseClass} placeholder="e.g., 0555123456"/>
                  </div>
                  <div>
                    <label htmlFor="phoneNumberSecondary" className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t('phoneNumberSecondary')}</label>
                    <input type="tel" name="phoneNumberSecondary" id="phoneNumberSecondary" value={formData.phoneNumberSecondary} onChange={handleInputChange} className={inputBaseClass} placeholder="e.g., 0666123456"/>
                  </div>
              </div>
              <div>
                <label htmlFor="wilayaCode" className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t('wilayaLabel')}</label>
                <select name="wilayaCode" id="wilayaCode" value={formData.wilayaCode} onChange={handleInputChange} required className={inputBaseClass}>
                    <option value="">{t('wilayaPlaceholder')}</option>
                    {wilayasList.map(w => <option key={w.code} value={w.code}>{w.name}</option>)}
                </select>
              </div>
              <div>
                  <label htmlFor="commune" className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t('communeLabel')}</label>
                  <select name="commune" id="commune" value={formData.commune} onChange={handleInputChange} required className={inputBaseClass} disabled={!formData.wilayaCode}>
                      <option value="">{formData.wilayaCode ? t('communePlaceholder') : t('communeDisabledPlaceholder')}</option>
                      {communesList.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
              </div>
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label htmlFor="billingAddress" className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t('streetAddress')}</label>
                  <Button type="button" onClick={handleAutoFillAddress} variant="ghost" size="sm" leftIcon={<LocationPinIcon />} isLoading={isLoadingLocation} disabled={isLoadingLocation} className="text-xs">{isLoadingLocation ? t('locating') : t('useMyLocation')}</Button>
                </div>
                <textarea name="billingAddress" id="billingAddress" value={formData.billingAddress} onChange={handleInputChange} required rows={3} className={inputBaseClass} placeholder="e.g., 123 Main St, Apt 4B"/>
              </div>

              {formData.wilayaCode && (
              <div className="pt-6 border-t border-gray-200 dark:border-gray-700">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">{t('deliveryMethod')}</h3>
                  {availableShippingOptions.unavailable ? (
                    <p className="mt-2 text-red-500">{t('deliveryNotAvailable')}</p>
                  ) : (
                  <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                      {availableShippingOptions.options.map((method) => {
                      const price = algerianWilayas[formData.wilayaCode].deliveryPrice[method.toLowerCase() as 'domicile' | 'stopdesk'];
                      return (
                          <div key={method} onClick={() => setDeliveryMethod(method)}
                          className={`relative block rounded-lg border bg-white dark:bg-gumball-dark shadow-sm px-6 py-4 cursor-pointer focus:outline-none sm:flex sm:justify-between
                          ${deliveryMethod === method ? 'border-gumball-pink ring-2 ring-gumball-pink' : 'border-gray-300 dark:border-gray-600'}`}>
                          <div className="flex items-center">
                              <div className="text-sm">
                              <p className="font-medium text-gray-900 dark:text-gray-100">{t(method.toLowerCase() as 'domicile' | 'stopdesk')}</p>
                              <div className="text-gray-500 dark:text-gray-400">
                                  <span>{t('shippingCostLabel')}: {price.toLocaleString()} {t('currencyUnit')}</span>
                              </div>
                              </div>
                          </div>
                          {deliveryMethod === method && (
                              <div className="absolute -top-3 -end-3 rounded-full bg-gumball-pink text-white p-1">
                              <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                              </div>
                          )}
                          </div>
                      );
                      })}
                  </div>
                  )}
              </div>
              )}
              
              <div className="mt-6 pt-4 border-t-2 border-gumball-blue/30 dark:border-gumball-blue/50">
                <p className="flex justify-between text-lg font-techno dark:text-gray-200">
                    {t('subtotal')} <span>{getCartSubtotal().toLocaleString()} {t('currencyUnit')}</span>
                </p>
                <p className="flex justify-between text-sm text-gray-500 dark:text-gray-400">
                    {t('shippingCostLabel')} 
                    <span className={shippingCost > 0 ? "text-gumball-dark dark:text-gumball-light-bg" : "text-gumball-green"}>
                        {formData.wilayaCode ? (shippingCost > 0 ? `${shippingCost.toLocaleString()} ${t('currencyUnit')}`: t('freeShipping')) : t('selectWilayaFirst')}
                    </span>
                </p>
                <p className="flex justify-between text-2xl font-display text-gumball-green mt-2">
                    {t('total').replace(':','')} <span>{finalTotal.toLocaleString()} {t('currencyUnit')}</span>
                </p>
              </div>

              <Button type="submit" variant="primary" size="lg" className="w-full font-display text-xl !mt-10" isLoading={isLoading} disabled={isLoading || (availableShippingOptions.unavailable && formData.wilayaCode !== '')}>
                {isLoading ? t('confirmingOrder') : t('placeOrder')}
              </Button>
            </form>
          </div>
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
            setModalConfig({ isOpen: false });
        }}
        onCancel={() => setModalConfig({ isOpen: false })}
        confirmButtonText={modalConfig.confirmText || t('confirm')}
        confirmButtonVariant={modalConfig.confirmVariant || "danger"}
      />
    </div>
  );
};