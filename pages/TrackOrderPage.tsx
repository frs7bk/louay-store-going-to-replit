

import React, { useContext, useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { OrderContext } from '../App';
import { Order, OrderStatus, OrderStatusUpdate, ShippingMethod } from '../types';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { Button } from '../components/Button';
import { useI18n } from '../hooks/useI18n';

const getStatusIcon = (status: OrderStatusUpdate['status']): string => {
  switch (status) {
    case 'Pending Approval': return '📝';
    case 'Processing': return '⚙️';
    case 'Preparing for Shipment': return '📦';
    case 'Shipped': return '🚚';
    case 'Delivered': return '✅';
    case 'Cancelled': return '❌';
    case 'Returned': return '↩️';
    default: return '❓';
  }
};

export const TrackOrderPage: React.FC = () => {
  const { orderId: orderIdFromUrl } = useParams<{ orderId?: string }>();
  const orderCtx = useContext(OrderContext);
  const navigate = useNavigate();
  const { t, getLocalized } = useI18n();

  const [searchedOrderId, setSearchedOrderId] = useState<string | null>(null);
  const [currentOrder, setCurrentOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [inputOrderId, setInputOrderId] = useState<string>('');
  const [attemptedSearch, setAttemptedSearch] = useState<boolean>(false);

  useEffect(() => {
    if (!orderCtx) {
      setIsLoading(false);
      setCurrentOrder(null);
      setSearchedOrderId(null);
      setInputOrderId('');
      setAttemptedSearch(false);
      return; 
    }

    if (orderIdFromUrl) {
      setIsLoading(true);
      setCurrentOrder(null);
      setSearchedOrderId(orderIdFromUrl);
      setInputOrderId(orderIdFromUrl);
      setAttemptedSearch(true);

      const timerId = setTimeout(() => {
        try {
          if (!orderCtx) { 
            console.error("TrackOrderPage: OrderContext became undefined during search timeout.");
            setCurrentOrder(null);
            return;
          }
          const foundOrder = orderCtx.getOrderById(orderIdFromUrl);
          setCurrentOrder(foundOrder || null);
        } catch (e) {
          console.error(`TrackOrderPage: Error fetching/setting order for ${orderIdFromUrl}:`, e);
          setCurrentOrder(null);
        } finally {
          setIsLoading(false);
        }
      }, 700); 

      return () => {
        clearTimeout(timerId);
      };
    } else {
      setCurrentOrder(null);
      setSearchedOrderId(null);
      setInputOrderId('');
      setIsLoading(false);
      setAttemptedSearch(false);
    }
  }, [orderIdFromUrl, orderCtx]);

  const handleTrackOrderSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedOrderId = inputOrderId.trim();
    if (trimmedOrderId) {
      navigate(`/track-order/${trimmedOrderId}`);
    } else {
      navigate('/track-order/');
    }
  };
  
  const getLocalizedStatus = (status: OrderStatus): string => {
    const keyMap = {
        "Pending Approval": "statusPending",
        "Processing": "statusProcessing",
        "Preparing for Shipment": "statusPreparing",
        "Shipped": "statusShipped",
        "Delivered": "statusDelivered",
        "Cancelled": "statusCancelled",
        "Returned": "statusReturned"
    };
    return t(keyMap[status] || status);
  };
  
    const getLocalizedShippingMethod = (method: ShippingMethod) => {
        return t(method.toLowerCase() as 'domicile' | 'stopdesk');
    };


  if (!orderCtx && !isLoading) { // Ensure isLoading is also checked
    return <LoadingSpinner message="Order system is initializing..." />;
  }

  if (isLoading) {
    return <LoadingSpinner message={t('searchingForOrder', {orderId: searchedOrderId || '...'})} />;
  }

  if (currentOrder && searchedOrderId) {
    return (
      <div className="container mx-auto p-4 md:p-8 animate-fadeIn">
        <h1 className="text-4xl md:text-5xl font-display text-gumball-pink dark:text-gumball-pink/90 mb-8 text-center"
          dangerouslySetInnerHTML={{__html: t('orderTrackingFor', {orderId: `<span class="text-gumball-blue dark:text-gumball-blue/80">${currentOrder.id.substring(0, 12)}...</span>`})}}
        />

        <div className="bg-white dark:bg-gumball-dark-card shadow-xl rounded-xl p-6 md:p-8 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6 pb-6 border-b border-gray-200 dark:border-gray-700">
            <div>
              <h2 className="font-techno text-xl text-gumball-dark dark:text-gumball-light-bg mb-1">{t('orderId')}</h2>
              <p className="text-lg dark:text-gray-300">{currentOrder.id}</p>
            </div>
            <div>
              <h2 className="font-techno text-xl text-gumball-dark dark:text-gumball-light-bg mb-1">{t('customer')}</h2>
              <p className="text-lg dark:text-gray-300">{currentOrder.customerName}</p>
            </div>
             <div>
              <h2 className="font-techno text-xl text-gumball-dark dark:text-gumball-light-bg mb-1">{t('deliveryMethod')}</h2>
              <p className="text-lg dark:text-gray-300">{getLocalizedShippingMethod(currentOrder.shippingMethod)}</p>
            </div>
             <div>
              <h2 className="font-techno text-xl text-gumball-dark dark:text-gumball-light-bg mb-1">{t('shippingCostLabel')}</h2>
              <p className="text-lg font-semibold text-gumball-dark dark:text-gumball-light-bg">{currentOrder.shippingCost.toLocaleString()} {t('currencyUnit')}</p>
            </div>
            <div>
              <h2 className="font-techno text-xl text-gumball-dark dark:text-gumball-light-bg mb-1">{t('orderDate')}</h2>
              <p className="text-lg dark:text-gray-300">{new Date(currentOrder.createdAt).toLocaleString()}</p>
            </div>
            <div>
              <h2 className="font-techno text-xl text-gumball-dark dark:text-gumball-light-bg mb-1">{t('totalPrice')}</h2>
              <p className="text-lg font-semibold text-gumball-green">{currentOrder.totalPrice.toLocaleString()} {t('currencyUnit')}</p>
            </div>
          </div>

          <h2 className="text-2xl font-techno text-gumball-purple dark:text-gumball-purple/80 mb-6">{t('orderStatusTimeline')}</h2>
          <div className="space-y-6 relative ltr:pl-8 rtl:pr-8 ltr:border-l-2 rtl:border-r-2 border-gumball-pink/50 dark:border-gumball-pink/30">
            {currentOrder.statusHistory.map((update, index) => (
              <div key={index} className="relative ltr:pl-4 rtl:pr-4 py-2">
                <div className={`absolute ltr:-left-[1.6rem] rtl:-right-[1.6rem] top-1/2 -translate-y-1/2 w-8 h-8 rounded-full flex items-center justify-center text-xl shadow-md
                  ${index === currentOrder.statusHistory.length - 1 ? 'bg-gumball-green text-white animate-bounceOnce' : 'bg-gumball-pink text-white'}`}>
                  {getStatusIcon(update.status)}
                </div>
                <div className={`p-4 rounded-lg shadow-md ${index === currentOrder.statusHistory.length - 1 ? 'bg-gumball-green/10 dark:bg-gumball-green/5 ltr:border-l-4 rtl:border-r-4 border-gumball-green dark:border-gumball-green/70' : 'bg-gray-50 dark:bg-gumball-dark'}`}>
                  <p className={`font-display text-xl ${index === currentOrder.statusHistory.length - 1 ? 'text-gumball-green' : 'text-gumball-blue dark:text-gumball-blue/80'}`}>{getLocalizedStatus(update.status)}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{new Date(update.timestamp).toLocaleString()}</p>
                  {update.notes && <p className="text-sm text-gray-700 dark:text-gray-300 italic">"{update.notes}"</p>}
                </div>
              </div>
            ))}
          </div>

          <h2 className="text-2xl font-techno text-gumball-purple dark:text-gumball-purple/80 mt-10 mb-4">{t('itemsInOrder')}</h2>
          <div className="space-y-3">
              {currentOrder.items.map(item => (
                  <div key={item.id} className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gumball-dark rounded-md shadow-sm">
                      <div>
                          <p className="font-semibold dark:text-gray-200">{getLocalized(item.name)} <span className="text-xs text-gray-500 dark:text-gray-400">(x{item.quantity})</span></p>
                      </div>
                      <p className="text-gumball-dark dark:text-gray-200">{item.price.toLocaleString()} {t('currencyUnit')}</p>
                  </div>
              ))}
          </div>

          <div className="mt-12 text-center">
            <Button as={Link} to="/" variant="primary" size="lg">
              {t('continueShopping')}
            </Button>
             <Button as={Link} to="/track-order" variant="ghost" className="mt-4 ltr:ml-3 rtl:mr-3" onClick={() => {
                setInputOrderId(''); 
                setAttemptedSearch(false);
                setCurrentOrder(null);
                setSearchedOrderId(null);
             }}>
              {t('trackAnotherOrder')}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  let messageElement: React.ReactNode = null;
  if (attemptedSearch && searchedOrderId && !currentOrder && !isLoading) {
    messageElement = (
      <p className="mb-4 text-lg text-red-500" dangerouslySetInnerHTML={{ __html: t('orderNotFound', {orderId: searchedOrderId})}}/>
    );
  } else if (!attemptedSearch && !isLoading) { 
    messageElement = (
      <p className="mb-4 text-lg text-gumball-dark dark:text-gumball-light-bg/80">{t('enterOrderId')}</p>
    );
  }

  return (
    <div className="text-center py-10 animate-fadeIn">
      <img src="https://picsum.photos/seed/trackorder/200/150?gravity=center" alt="Order tracking illustration" className="mx-auto mb-6 rounded-lg shadow-lg opacity-80 dark:opacity-70" />
      <h1 className="text-4xl font-display text-gumball-purple dark:text-gumball-purple/80 mb-6">{t('trackOrderTitle')}</h1>
      {messageElement}
      <form onSubmit={handleTrackOrderSubmit} className="max-w-md mx-auto flex flex-col sm:flex-row gap-3 p-4 bg-white/50 dark:bg-gumball-dark-card/50 rounded-lg shadow-md">
        <input
          type="text"
          value={inputOrderId}
          onChange={(e) => { setInputOrderId(e.target.value); }}
          placeholder={t('enterOrderIdPlaceholder')}
          className="flex-grow p-3 border-2 border-gumball-purple dark:border-gumball-purple/70 focus:ring-gumball-pink focus:border-gumball-pink shadow-md rounded-lg text-lg font-techno bg-white text-gumball-dark dark:bg-gumball-dark-card dark:text-gumball-light-bg dark:placeholder-gray-400"
          aria-label={t('orderId')}
        />
        <Button type="submit" variant="primary" size="lg" className="font-techno text-lg">
          {t('track')}
        </Button>
      </form>
       <Button as={Link} to="/" variant="ghost" className="mt-8 text-gumball-blue hover:text-gumball-pink dark:text-gumball-blue/80 dark:hover:text-gumball-pink/80">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 ltr:mr-2 rtl:ml-2"><path strokeLinecap="round" strokeLinejoin="round" d="M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3" /></svg>
        {t('backToShopping')}
      </Button>
    </div>
  );
};