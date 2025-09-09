import React, { useContext, useState, ChangeEvent, FormEvent, useMemo, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { CartContext, OrderContext } from '../App';
import { Button } from '../components/Button';
import { Modal } from '../components/Modal';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { toast } from 'react-toastify';
import { useI18n } from '../hooks/useI18n';
import { algerianWilayas } from '../data/algeria-shipping-data';
import { ShippingMethod, Order } from '../types';


interface CheckoutFormData {
  customerName: string;
  billingAddress: string;
  wilayaCode: string;
  commune: string;
  phoneNumber: string;
  phoneNumberSecondary?: string;
}

// Location Icon for the button
const LocationPinIcon: React.FC<{ className?: string }> = ({ className = "w-5 h-5" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
  </svg>
);


export const CheckoutPage: React.FC = () => {
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

  const wilayasList = useMemo(() => {
    return Object.entries(algerianWilayas).map(([code, data]) => ({
      code: code,
      name: `${code} - ${data.name}`
    }));
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
    // Reset commune when wilaya changes
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
    return <LoadingSpinner message="Loading Checkout..." />;
  }

  const { cart, getCartSubtotal } = cartCtx;

  if (cart.length === 0 && !isLoading && !showOrderSuccessModal) {
    return (
      <div className="text-center py-20">
        <h2 className="text-3xl font-display text-gumball-purple dark:text-gumball-purple/80">{t('cartIsEmpty')}</h2>
        <p className="my-4 dark:text-gray-300">{t('browseAndAdd')}</p>
        <Button as={Link} to="/" variant="primary">{t('shopNow')}</Button>
      </div>
    );
  }

  const handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
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
          // Using OpenStreetMap Nominatim for reverse geocoding (free, no API key for basic use)
          const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}`);
          if (!response.ok) {
            throw new Error(`Nominatim API error: ${response.statusText}`);
          }
          const data = await response.json();
          
          let addressString = data.display_name || "Could not determine full address.";
          
          setFormData(prev => ({
            ...prev,
            billingAddress: addressString,
          }));
          toast.success(t('addressAutofilled'));

        } catch (error) {
          console.error("Reverse geocoding error:", error);
          toast.error(t('reverseGeocodingError'));
           setFormData(prev => ({
            ...prev,
            billingAddress: `Lat: ${latitude.toFixed(4)}, Lon: ${longitude.toFixed(4)} (Manual entry recommended)`,
          }));
        } finally {
          setIsLoadingLocation(false);
        }
      },
      (error) => {
        setIsLoadingLocation(false);
        switch (error.code) {
          case error.PERMISSION_DENIED:
            toast.error(t('locationPermissionDenied'));
            break;
          case error.POSITION_UNAVAILABLE:
            toast.error(t('locationUnavailable'));
            break;
          case error.TIMEOUT:
            toast.error(t('locationTimeout'));
            break;
          default:
            toast.error(t('unknownLocationError'));
            break;
        }
      },
      { timeout: 10000, enableHighAccuracy: true }
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
    if(availableShippingOptions.options.length > 0 && !deliveryMethod){
        toast.warn(t('selectDeliveryMethod'));
        return;
    }
    if(!deliveryMethod){
        toast.error(t('deliveryNotAvailable'));
        return;
    }
    setIsLoading(true);
    const wilayaName = algerianWilayas[formData.wilayaCode].name;
    const newOrder: Order | null = await orderCtx.addOrder(
      formData.customerName,
      cart,
      finalTotal,
      formData.billingAddress,
      wilayaName,
      formData.phoneNumber,
      formData.phoneNumberSecondary,
      formData.commune,
      deliveryMethod,
      shippingCost
    );
    
    setIsLoading(false);
    if (newOrder) {
        setPlacedOrderId(newOrder.id);
        setShowOrderSuccessModal(true);
    } else {
        toast.error("Order placement failed. Please try again or contact support.");
    }
  };
  
  const inputBaseClass = "mt-1 block w-full p-3 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-gumball-pink focus:border-gumball-pink dark:bg-gumball-dark dark:text-gumball-light-bg dark:placeholder-gray-400";


  return (
    <div className="container mx-auto p-4 md:p-8 animate-fadeIn">
      <h1 className="text-5xl font-display text-gumball-pink dark:text-gumball-pink/90 mb-8 text-center">{t('checkout')}</h1>

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
            <p className="mb-6 dark:text-gray-300">{t('trackYourProgress')}</p>
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 bg-white dark:bg-gumball-dark-card p-6 rounded-xl shadow-lg order-last lg:order-first">
          <h2 className="text-2xl font-techno text-gumball-blue dark:text-gumball-blue/90 mb-6 border-b-2 pb-2 border-gumball-blue/30 dark:border-gumball-blue/50">{t('yourOrderSummary')}</h2>
          {cart.map(item => (
            <div key={item.id} className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-700">
              <div>
                <p className="font-semibold dark:text-gray-200">{getLocalized(item.name)} <span className="text-xs text-gray-500 dark:text-gray-400">(x{item.quantity})</span></p>
                <p className="text-xs text-gumball-pink dark:text-gumball-pink/80">${item.price.toFixed(2)} {t('each')}</p>
              </div>
              <p className="font-semibold dark:text-gray-200">${(item.price * item.quantity).toFixed(2)}</p>
            </div>
          ))}
          <div className="mt-6 pt-4 border-t-2 border-gumball-blue/30 dark:border-gumball-blue/50">
            <p className="flex justify-between text-lg font-techno dark:text-gray-200">
              {t('subtotal')} <span>${getCartSubtotal().toFixed(2)}</span>
            </p>
             <p className="flex justify-between text-sm text-gray-500 dark:text-gray-400">
                {t('shippingCostLabel')} 
                <span className={shippingCost > 0 ? "text-gumball-dark dark:text-gumball-light-bg" : "text-gumball-green"}>
                    {formData.wilayaCode ? (shippingCost > 0 ? `${shippingCost.toFixed(2)} ${t('currencyUnit')}`: t('freeShipping')) : t('selectWilayaFirst')}
                </span>
            </p>
            <p className="flex justify-between text-2xl font-display text-gumball-green mt-2">
              {t('total').replace(':','')} <span>${finalTotal.toFixed(2)}</span>
            </p>
          </div>
        </div>

        <div className="lg:col-span-2 bg-white dark:bg-gumball-dark-card p-8 rounded-xl shadow-2xl">
          <h2 className="text-3xl font-techno text-gumball-purple dark:text-gumball-purple/90 mb-6">{t('deliveryInfo')}</h2>
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
                  <input type="tel" name="phoneNumberSecondary" id="phoneNumberSecondary" value={formData.phoneNumberSecondary || ''} onChange={handleInputChange} className={inputBaseClass} placeholder="e.g., 0666123456"/>
                </div>
            </div>
            
            <div>
              <label htmlFor="wilayaCode" className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t('stateProvince')}</label>
              <select name="wilayaCode" id="wilayaCode" value={formData.wilayaCode} onChange={handleInputChange} required className={inputBaseClass}>
                <option value="">{t('wilayaPlaceholder')}</option>
                {wilayasList.map(w => <option key={w.code} value={w.code}>{w.name}</option>)}
              </select>
            </div>


             <div>
                <label htmlFor="commune" className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t('neighborhood')}</label>
                <select name="commune" id="commune" value={formData.commune} onChange={handleInputChange} required className={inputBaseClass} disabled={!formData.wilayaCode}>
                    <option value="">{formData.wilayaCode ? t('communePlaceholder') : t('communeDisabledPlaceholder')}</option>
                    {communesList.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label htmlFor="billingAddress" className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t('streetAddress')}</label>
                <Button 
                    type="button" 
                    onClick={handleAutoFillAddress} 
                    variant="ghost" 
                    size="sm"
                    leftIcon={<LocationPinIcon />}
                    isLoading={isLoadingLocation}
                    disabled={isLoadingLocation}
                    className="text-xs"
                >
                    {isLoadingLocation ? t('locating') : t('useMyLocation')}
                </Button>
              </div>
              <textarea name="billingAddress" id="billingAddress" value={formData.billingAddress} onChange={handleInputChange} required rows={3} className={inputBaseClass} placeholder="e.g., 123 Main St, Apt 4B, Anytown, CA 90210"/>
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
                        ${deliveryMethod === method ? 'border-gumball-pink ring-2 ring-gumball-pink' : 'border-gray-300 dark:border-gray-600'}`}
                        >
                        <div className="flex items-center">
                            <div className="text-sm">
                            <p className="font-medium text-gray-900 dark:text-gray-100">{t(method.toLowerCase() as 'domicile' | 'stopdesk')}</p>
                            <div className="text-gray-500 dark:text-gray-400">
                                <span>{t('shippingCostLabel')}: {price} {t('currencyUnit')}</span>
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
            
            <Button type="submit" variant="primary" size="lg" className="w-full font-display text-xl !mt-10" isLoading={isLoading} disabled={isLoading}>
              {isLoading ? t('confirmingOrder') : t('placeOrder')}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};