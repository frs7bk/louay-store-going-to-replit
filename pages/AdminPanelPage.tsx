import React, { useState, useEffect, useCallback, useContext, ChangeEvent, useRef, FormEvent } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { AdminSidebar } from '../components/AdminSidebar';
import { Product, AdminSection, GroundingChunk, NewProductData, Order, OrderStatus, OrderStatusUpdate, ProductQuestion, ProductReview, ProductAnswer, Candidate, ProductContextType as IProductContextType, QnAContextType as IQnAContextType, Language, MultilingualString, ShippingMethod, SalesReportData } from '../types'; 
import { OrderContextType, ReviewContextType } from '../App';
import { Button } from '../components/Button';
import { generateProductDescription, searchRecentEvents, generateAnalyticsInsights } from '../services/geminiService';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { ProductContext, OrderContext, QnAContext, ReviewContext } from '../App';
import { toast } from 'react-toastify';
import { StarRating } from '../components/StarRating';
import { ORDER_STATUSES } from '../constants';
import { ConfirmationModal } from '../components/ConfirmationModal';
import { Modal } from '../components/Modal';
import { useI18n } from '../hooks/useI18n';

// --- Icons ---
const DashboardIcon: React.FC<{ className?: string }> = ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-9.75 0h9.75" /></svg>;
const ProductsIcon: React.FC<{ className?: string }> = ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125V6.375c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v.001c0 .621.504 1.125 1.125 1.125z" /></svg>;
const OrdersIcon: React.FC<{ className?: string }> = ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 6.75h7.5M8.25 12h7.5m-7.5 5.25h7.5M3.75 6.75h.007v.008H3.75V6.75zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zM3.75 12h.007v.008H3.75V12zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm-.375 5.25h.007v.008H3.75v-.008zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" /></svg>;
const QnAIcon: React.FC<{ className?: string }> = ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193l-3.722.537V17.5c0 .621-.504 1.125-1.125 1.125H9.75c-.621 0-1.125-.504-1.125-1.125V15M3 16.5V17.5c0 .621.504 1.125 1.125 1.125h1.5c.621 0 1.125-.504 1.125-1.125V16.5m-3.375 0h1.5m-1.5 0c-.621 0-1.125-.504-1.125-1.125v-1.5c0-.621.504-1.125 1.125-1.125H6.75c.621 0 1.125.504 1.125 1.125v1.5c0 .621-.504-1.125-1.125-1.125m-3.375 0h1.5Q6.375 16.5 6.75 16.125m-3.375 0c.375.375.875.375 1.125.375m0 0c.25 0 .5-.125.5-.375M3 12h18M3 12c0-1.136.847-2.1 1.98-2.193l3.722-.537V6.5c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125v3.286c0 .97.616 1.813 1.5 2.097M6.75 12a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm4.5 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm4.5 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" /></svg>;
const ReviewsIcon: React.FC<{ className?: string }> = ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.82.61l-4.725-2.885a.563.563 0 00-.652 0l-4.725 2.885a.562.562 0 01-.82-.61l1.285-5.385a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" /></svg>;
const AISparklesIcon: React.FC<{ className?: string }> = ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L1.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.25 12L17 14.188l-1.25-2.188L13.563 11l2.188-1.25L17 7.563l1.25 2.188L20.438 11l-2.188 1.25zM12 1.25L10.813 3.563 8.562 4.812 10.813 6.062 12 8.25l1.188-2.188L15.438 4.812 13.188 3.563 12 1.25z" /></svg>;
const ReportsIcon: React.FC<{ className?: string }> = ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9zM19.5 14.25v2.625a3.375 3.375 0 01-3.375 3.375H8.25m11.25-6.375v2.625a3.375 3.375 0 01-3.375 3.375H8.25M15 14.25H8.25M15 11.25H8.25M15 8.25H8.25" /></svg>;
const AnalyticsIcon: React.FC<{ className?: string }> = ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" /></svg>;
const LinkIcon: React.FC<{ className?: string }> = ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" /></svg>;
const TrashIcon: React.FC<{ className?: string }> = ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12.56 0c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" /></svg>;
const EditIcon: React.FC<{ className?: string }> = ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" /></svg>;
const PlusIcon: React.FC<{ className?: string }> = ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>;
const EyeIcon: React.FC<{ className?: string }> = ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.432 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>;
const HamburgerIcon: React.FC<{ className?: string }> = ({ className }) => (<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" /></svg>);
const CloseIcon: React.FC<{ className?: string }> = ({ className = "w-4 h-4" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
);
const UsersIcon: React.FC<{ className?: string }> = ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m-7.5-2.962a3.75 3.75 0 100-7.5 3.75 3.75 0 000 7.5zM3.75 18.75a3 3 0 003.75 0m6.75-3a3 3 0 00-3.75 0m3.75 0a3 3 0 00-3.75 0M12.75 5.106a9 9 0 018.415 8.415m-8.415-8.415a9 9 0 00-8.415 8.415" /></svg>;


const inputBaseClass = "block w-full px-3 py-2 text-sm sm:text-base bg-white dark:bg-gumball-dark-card border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-gumball-pink focus:border-gumball-pink placeholder-gray-400 dark:placeholder-gray-500 text-gumball-dark dark:text-gumball-light-bg";
const labelBaseClass = "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1";


export const AdminPanelPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { t, getLocalized } = useI18n();

  const productCtx = useContext(ProductContext);
  const orderCtx = useContext(OrderContext);
  const qnaCtx = useContext(QnAContext);
  const reviewCtx = useContext(ReviewContext);

  const [activeSection, setActiveSection] = useState<string>('dashboard');
  
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isDesktop, setIsDesktop] = useState(window.matchMedia('(min-width: 768px)').matches);
  const [isDesktopSidebarCollapsed, setIsDesktopSidebarCollapsed] = useState(() => {
     return localStorage.getItem('adminSidebarCollapsed') === 'true';
  });

  const [modalConfig, setModalConfig] = useState<{
      isOpen: boolean;
      title?: string;
      message?: React.ReactNode;
      onConfirmAction?: () => void;
      confirmText?: string;
      confirmVariant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  }>({ isOpen: false });

  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [showProductModal, setShowProductModal] = useState(false);
  
  const [editingAnswer, setEditingAnswer] = useState<{ questionId: string; answer: ProductAnswer } | null>(null);
  const [showAnswerModal, setShowAnswerModal] = useState(false);
  
  const [viewingOrder, setViewingOrder] = useState<Order | null>(null);
  const [showOrderModal, setShowOrderModal] = useState(false);

  const ADMIN_SECTIONS: AdminSection[] = [
    { id: 'dashboard', name: t('adminDashboard'), icon: <DashboardIcon /> },
    { id: 'analytics', name: t('adminAnalyticsDashboard'), icon: <AnalyticsIcon /> },
    { id: 'products', name: t('adminManageProducts'), icon: <ProductsIcon /> },
    { id: 'orders', name: t('adminViewOrders'), icon: <OrdersIcon /> },
    { id: 'qna', name: t('adminManageQnA'), icon: <QnAIcon /> },
    { id: 'reviews', name: t('adminManageReviews'), icon: <ReviewsIcon /> },
    { id: 'marketing', name: t('adminMarketingTools'), icon: <LinkIcon /> },
    { id: 'reports', name: t('adminMonthlyReports'), icon: <ReportsIcon /> },
  ];


  useEffect(() => {
    const mediaQuery = window.matchMedia('(min-width: 768px)');
    const handler = () => setIsDesktop(mediaQuery.matches);
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  useEffect(() => {
    localStorage.setItem('adminSidebarCollapsed', String(isDesktopSidebarCollapsed));
  }, [isDesktopSidebarCollapsed]);
  
  useEffect(() => {
    const hash = location.hash.replace('#', '');
    const newActiveSectionCandidate = ADMIN_SECTIONS.find(s => s.id === hash) ? hash : 'dashboard';

    if (newActiveSectionCandidate !== activeSection) {
        setActiveSection(newActiveSectionCandidate);
    }
    if (!hash && newActiveSectionCandidate === 'dashboard' && location.hash !== '#dashboard') {
        navigate('#dashboard', { replace: true });
    }
  }, [location.hash, navigate, activeSection, ADMIN_SECTIONS]);

  const handleSelectSection = (sectionId: string) => {
    navigate(`#${sectionId}`);
    if (!isDesktop) {
      setIsMobileSidebarOpen(false);
    }
  };

  const toggleDesktopCollapse = () => setIsDesktopSidebarCollapsed(prev => !prev);
  const toggleMobileSidebar = () => setIsMobileSidebarOpen(prev => !prev);

  const handleDeleteProduct = (productId: string) => {
    const productToDelete = productCtx?.products.find(p => p.id === productId);
    const localizedName = productToDelete ? getLocalized(productToDelete.name) as string : t('general');
    setModalConfig({
      isOpen: true,
      title: t('confirmDeleteProductTitle'),
      message: <div dangerouslySetInnerHTML={{ __html: t('confirmDeleteProductMessage', { productName: localizedName }) }} />,
      onConfirmAction: () => {
        productCtx?.deleteProduct(productId);
        toast.success(t('productDeleted', { productName: localizedName }));
      },
      confirmText: t('deleteProduct'),
      confirmVariant: "danger",
    });
  };

    const handleViewOrder = (order: Order) => {
        setViewingOrder(order);
        setShowOrderModal(true);
    };
    
    const handleUpdateOrderStatus = (orderId: string, newStatus: OrderStatus) => {
        orderCtx?.updateOrderStatus(orderId, newStatus, `Status updated by Admin via panel.`);
        const localizedStatus = t(`status${newStatus.replace(/\s/g, '')}`);
        toast.success(t('statusUpdated', { orderId: orderId.substring(0, 8), status: localizedStatus }));
        if(viewingOrder?.id === orderId) {
            setViewingOrder(prev => prev ? {...prev, status: newStatus, statusHistory: [...prev.statusHistory, {status: newStatus, timestamp: new Date().toISOString(), notes: "Status updated by Admin."}]} : null);
        }
    };

  const handleEditAnswer = (questionId: string, answer: ProductAnswer) => {
    setEditingAnswer({ questionId, answer });
    setShowAnswerModal(true);
  };
  
  const handleDeleteQuestion = (questionId: string) => {
    const questionToDelete = qnaCtx?.questions.find(q => q.id === questionId);
    setModalConfig({
        isOpen: true,
        title: t('confirmDeleteQuestionTitle'),
        message: <div dangerouslySetInnerHTML={{ __html: t('confirmDeleteQuestionMessage', { userName: questionToDelete?.userName || 'user', questionText: questionToDelete?.questionText.substring(0, 50) || '' }) }} />,
        onConfirmAction: () => {
            qnaCtx?.deleteQuestion(questionId);
            toast.success(t('questionByDeleted', { userName: questionToDelete?.userName || 'user' }));
        },
        confirmText: t('deleteQuestion'),
        confirmVariant: "danger",
    });
  };

  const handleDeleteReview = (reviewId: string) => {
    const reviewToDelete = reviewCtx?.reviews.find(r => r.id === reviewId);
    setModalConfig({
        isOpen: true,
        title: t('confirmDeleteReviewTitle'),
        message: <div dangerouslySetInnerHTML={{ __html: t('confirmDeleteReviewMessage', { reviewerName: reviewToDelete?.reviewerName || 'user', productId: reviewToDelete?.productId || '' }) }} />,
        onConfirmAction: () => {
            reviewCtx?.deleteReview(reviewId);
            toast.success(t('reviewDeleted', { reviewerName: reviewToDelete?.reviewerName || 'user' }));
        },
        confirmText: t('deleteReview'),
        confirmVariant: "danger",
    });
  };
  

  const renderActiveSection = () => {
    if (!productCtx || !orderCtx || !qnaCtx || !reviewCtx) {
      return <LoadingSpinner message={t('loadingAdminData')} />;
    }

    switch (activeSection) {
      case 'dashboard':
        return <DashboardPane />;
      case 'analytics':
        return <AnalyticsPane orderCtx={orderCtx} />;
      case 'products':
        return <ManageProductsPane 
                    products={productCtx.products} 
                    onEdit={(product) => { setEditingProduct(product); setShowProductModal(true); }} 
                    onDelete={handleDeleteProduct}
                    onAdd={() => { setEditingProduct(null); setShowProductModal(true);}} 
                />;
      case 'orders':
        return <ManageOrdersPane 
                    orders={orderCtx.orders} 
                    onViewDetails={handleViewOrder}
                    onUpdateStatus={handleUpdateOrderStatus}
                />;
      case 'qna':
        return <ManageQnAPane 
                    questions={qnaCtx.questions} 
                    onEditAnswer={handleEditAnswer}
                    onDeleteQuestion={handleDeleteQuestion}
                    addAnswerToQuestion={qnaCtx.addAnswerToQuestion}
                />;
      case 'reviews':
        return <ManageReviewsPane 
                    reviews={reviewCtx.reviews} 
                    getProductById={productCtx.getProductById}
                    onDelete={handleDeleteReview}
                />;
      case 'marketing':
        return <MarketingToolsPane productCtx={productCtx} />;
      case 'reports':
        return <ManageReportsPane 
                    productCtx={productCtx}
                    orderCtx={orderCtx}
                    qnaCtx={qnaCtx}
                    reviewCtx={reviewCtx}
                />;
      default:
        return <div className="text-center p-10 text-xl font-display text-gumball-purple">{t('selectSection')}</div>;
    }
  };

  return (
    <div className="md:flex bg-gumball-light-bg dark:bg-gumball-dark-deep">
      <AdminSidebar
        sections={ADMIN_SECTIONS}
        activeSection={activeSection}
        onSelectSection={handleSelectSection}
        isMobileOpen={isMobileSidebarOpen}
        isDesktop={isDesktop}
        isDesktopCollapsed={isDesktopSidebarCollapsed}
        onToggleDesktopCollapse={toggleDesktopCollapse}
      />
      
      {isMobileSidebarOpen && !isDesktop && (
        <div 
            className="fixed inset-0 z-30 bg-black/50 md:hidden"
            onClick={toggleMobileSidebar}
            aria-hidden="true"
        ></div>
      )}

      <main className="flex-1 flex flex-col overflow-auto min-h-[calc(100vh-5rem)]">
        <header className="p-4 bg-white dark:bg-gumball-dark-card shadow-md sticky top-0 z-20 flex items-center">
          {!isDesktop && (
            <Button variant="ghost" onClick={toggleMobileSidebar} className="mr-3 p-2 text-gumball-blue dark:text-gumball-light-bg" aria-label={t('openSidebar')}>
              <HamburgerIcon className="w-6 h-6" />
            </Button>
          )}
          <h1 className="text-2xl font-display text-gumball-pink dark:text-gumball-pink/90">
            {ADMIN_SECTIONS.find(s => s.id === activeSection)?.name || t('adminPanel')}
          </h1>
        </header>
        <div className="p-4 sm:p-6 lg:p-8 flex-1">
          {renderActiveSection()}
        </div>
      </main>

      <ProductFormModal
        isOpen={showProductModal}
        onClose={() => { setShowProductModal(false); setEditingProduct(null); }}
        product={editingProduct}
        productCtx={productCtx}
      />
      
      <AnswerFormModal
        isOpen={showAnswerModal}
        onClose={() => { setShowAnswerModal(false); setEditingAnswer(null); }}
        editingAnswerData={editingAnswer}
        qnaCtx={qnaCtx}
      />

      <OrderDetailsModal
          isOpen={showOrderModal}
          onClose={() => { setShowOrderModal(false); setViewingOrder(null);}}
          order={viewingOrder}
          onUpdateStatus={handleUpdateOrderStatus}
      />

      <ConfirmationModal
        isOpen={modalConfig.isOpen}
        title={modalConfig.title || t('confirmAction')}
        message={modalConfig.message || t('areYouSure')}
        onConfirm={() => {
            if (modalConfig.onConfirmAction) modalConfig.onConfirmAction();
            setModalConfig({ isOpen: false });
        }}
        onCancel={() => setModalConfig({ isOpen: false })}
        confirmButtonText={modalConfig.confirmText}
        confirmButtonVariant={modalConfig.confirmVariant}
      />
    </div>
  );
};


// --- Dashboard Pane ---
const DashboardPane: React.FC = () => {
  const productCtx = useContext(ProductContext);
  const orderCtx = useContext(OrderContext);
  const qnaCtx = useContext(QnAContext);
  const reviewCtx = useContext(ReviewContext);
  const { t } = useI18n();
  
  const [newsQuery, setNewsQuery] = useState('');
  const [newsResults, setNewsResults] = useState<{text: string; sources?: GroundingChunk[] } | null>(null);
  const [isSearchingNews, setIsSearchingNews] = useState(false);
  const [visitorCount, setVisitorCount] = useState(() => Math.floor(Math.random() * 10) + 5);

  useEffect(() => {
    const interval = setInterval(() => {
        const change = Math.random() > 0.6 ? (Math.random() > 0.5 ? 1 : -1) : 0;
        setVisitorCount(prevCount => Math.max(3, prevCount + change));
    }, 3000);
    return () => clearInterval(interval);
  }, []);


  const handleSearchNews = async (e: FormEvent) => {
    e.preventDefault();
    if (!newsQuery.trim()) {
      toast.warn("Please enter a topic to search for news.");
      return;
    }
    setIsSearchingNews(true);
    setNewsResults(null);
    try {
      const results = await searchRecentEvents(newsQuery);
      setNewsResults(results);
      if(!results.text && (!results.sources || results.sources.length === 0)) {
        toast.info(t('noNewsFound'));
      }
    } catch (error) {
      toast.error(t('newsFetchFailed'));
      console.error(error);
    } finally {
      setIsSearchingNews(false);
    }
  };


  const stats = [
    { title: t('totalProducts'), value: productCtx?.products.length || 0, icon: <ProductsIcon className="w-8 h-8"/>, color: 'text-gumball-blue' },
    { title: t('totalOrders'), value: orderCtx?.orders.length || 0, icon: <OrdersIcon className="w-8 h-8"/>, color: 'text-gumball-green' },
    { title: t('pendingQuestions'), value: qnaCtx?.questions.filter(q => q.answers.length === 0).length || 0, icon: <QnAIcon className="w-8 h-8"/>, color: 'text-gumball-yellow' },
    { title: t('liveVisitors'), value: visitorCount, icon: <UsersIcon className="w-8 h-8"/>, color: 'text-gumball-pink', isLive: true },
  ];

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map(stat => (
          <div key={stat.title} className={`relative bg-white dark:bg-gumball-dark-card p-6 rounded-xl shadow-lg flex items-center space-x-4 rtl:space-x-reverse border-l-4 rtl:border-l-0 rtl:border-r-4 ${stat.color.replace('text-', 'border-')}`}>
            {stat.isLive && (
                <span className="absolute top-3 right-3 flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-gumball-green opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-gumball-green"></span>
                </span>
            )}
            <div className={`p-3 rounded-full bg-opacity-20 ${stat.color.replace('text-', 'bg-')} ${stat.color}`}>
              {stat.icon}
            </div>
            <div>
              <p key={stat.isLive ? stat.value : undefined} className={`text-3xl font-bold font-techno text-gumball-dark dark:text-gumball-light-bg ${stat.isLive ? 'animate-fadeIn' : ''}`}>
                {stat.value}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">{stat.title}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white dark:bg-gumball-dark-card p-6 rounded-xl shadow-lg">
          <h3 className="text-xl font-display text-gumball-purple dark:text-gumball-purple/90 mb-4 flex items-center">
            <AISparklesIcon className="w-6 h-6 me-2 text-gumball-yellow" />
            {t('latestNews')}
          </h3>
          <form onSubmit={handleSearchNews} className="flex gap-2 mb-4">
            <input 
                type="text" 
                value={newsQuery}
                onChange={(e) => setNewsQuery(e.target.value)}
                placeholder={t('searchCurrentEvents')}
                className={inputBaseClass + " flex-grow"}
            />
            <Button type="submit" variant="primary" isLoading={isSearchingNews}>{t('search')}</Button>
          </form>
          {isSearchingNews && <LoadingSpinner message={t('aiSearching')} />}
          {newsResults && (
            <div className="mt-4 p-4 bg-gumball-light-bg dark:bg-gumball-dark rounded-md max-h-96 overflow-y-auto">
              <p className="text-gumball-dark dark:text-gumball-light-bg whitespace-pre-wrap">{newsResults.text || "No specific text found from AI, but check sources if available."}</p>
              {newsResults.sources && newsResults.sources.length > 0 && (
                <div className="mt-3">
                  <h4 className="font-semibold text-sm text-gumball-blue dark:text-gumball-blue/80 mb-1">{t('sources')}</h4>
                  <ul className="list-disc list-inside space-y-1">
                    {newsResults.sources.map((source, idx) => (
                      source.web && <li key={idx} className="text-xs">
                        <a href={source.web.uri} target="_blank" rel="noopener noreferrer" className="text-gumball-pink hover:underline dark:text-gumball-pink/80">
                          {source.web.title || source.web.uri}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
      </div>
    </div>
  );
};


// --- Analytics Pane ---
interface AnalyticsPaneProps {
  orderCtx: OrderContextType;
}

const AnalyticsPane: React.FC<AnalyticsPaneProps> = ({ orderCtx }) => {
  const { t, getLocalized } = useI18n();
  const [analyticsData, setAnalyticsData] = useState<SalesReportData | null>(null);
  const [aiInsight, setAiInsight] = useState<string>('');
  const [isGeneratingInsight, setIsGeneratingInsight] = useState(false);

  useEffect(() => {
    const visitsRaw = localStorage.getItem('louayStoreVisits');
    const visits = visitsRaw ? JSON.parse(visitsRaw) : [];

    const trafficSources: { [key: string]: number } = {};
    visits.forEach((visit: { source: string }) => {
        const sourceKey = visit.source.startsWith('promo_link') ? 'Marketing Link' : (visit.source.charAt(0).toUpperCase() + visit.source.slice(1));
        trafficSources[sourceKey] = (trafficSources[sourceKey] || 0) + 1;
    });

    const today = new Date();
    const salesByDay: { [date: string]: number } = {};
    for (let i = 29; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      const dateString = date.toISOString().split('T')[0];
      salesByDay[dateString] = 0;
    }

    let totalRevenue = 0;
    const productSales: { [id: string]: { name: string, id: string, quantity: number, revenue: number } } = {};

    orderCtx.orders.forEach(order => {
      const orderDate = new Date(order.createdAt);
      const dateString = orderDate.toISOString().split('T')[0];
      
      if (salesByDay.hasOwnProperty(dateString)) {
          salesByDay[dateString] += order.totalPrice;
      }
      totalRevenue += order.totalPrice;

      order.items.forEach(item => {
        const localizedName = getLocalized(item.name) as string;
        if (!productSales[item.id]) productSales[item.id] = { name: localizedName, id: item.id, quantity: 0, revenue: 0 };
        productSales[item.id].quantity += item.quantity;
        productSales[item.id].revenue += item.price * item.quantity;
      });
    });

    const totalOrders = orderCtx.orders.length;
    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
    const topSellingProducts = Object.values(productSales)
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5)
      .map(p => ({ productId: p.id, productName: p.name, unitsSold: p.quantity, revenue: p.revenue }));
    
    const totalVisits = visits.length || 1;
    const conversionRate = totalOrders > 0 ? (totalOrders / totalVisits) * 100 : 0;

    setAnalyticsData({
      totalRevenue, totalOrders, averageOrderValue,
      conversionRate: Math.min(100, conversionRate),
      salesByDay, topSellingProducts, trafficSources
    });
  }, [orderCtx.orders, getLocalized]);

  const handleGetAIInsight = async () => {
    if (!analyticsData) { toast.warn(t('analyticsDataNotReady')); return; }
    setIsGeneratingInsight(true);
    setAiInsight('');
    try {
      const insight = await generateAnalyticsInsights(analyticsData);
      setAiInsight(insight);
      toast.success(t('analyticsGetInsights'));
    } catch (error) {
      toast.error(t('newsFetchFailed'));
    } finally {
      setIsGeneratingInsight(false);
    }
  };

  if (!analyticsData) return <LoadingSpinner message={t('loadingAnalytics')} />;

  const maxDailySale = Math.max(...Object.values(analyticsData.salesByDay), 1);
  
  const totalTraffic = Object.values(analyticsData.trafficSources).reduce((sum, count) => sum + count, 0) || 1;
  const pieColors = ['#3498db', '#e91e63', '#f1c40f', '#2ecc71', '#9b59b6', '#e67e22', '#1abc9c'];
  let accumulatedAngle = 0;
  
  const getSourceDisplayName = (source: string) => {
    const key = `traffic${source.charAt(0).toUpperCase() + source.slice(1).replace(/ /g, '')}`;
    const translated = t(key);
    // If translation is not found, t returns the key. Fallback to the original source string.
    return translated === key ? source : translated;
  }

  const topTrafficSource = Object.entries(analyticsData.trafficSources).sort((a, b) => b[1] - a[1])[0];

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white dark:bg-gumball-dark-card p-5 rounded-xl shadow-lg"><p className="text-sm text-gray-500 dark:text-gray-400">{t('analyticsTotalRevenue')}</p><p className="text-3xl font-bold font-techno text-gumball-green">{analyticsData.totalRevenue.toLocaleString(undefined, {minimumFractionDigits: 2})} {t('currencyUnit')}</p></div>
          <div className="bg-white dark:bg-gumball-dark-card p-5 rounded-xl shadow-lg"><p className="text-sm text-gray-500 dark:text-gray-400">{t('analyticsTotalOrders')}</p><p className="text-3xl font-bold font-techno text-gumball-dark dark:text-gumball-light-bg">{analyticsData.totalOrders.toLocaleString()}</p></div>
          <div className="bg-white dark:bg-gumball-dark-card p-5 rounded-xl shadow-lg"><p className="text-sm text-gray-500 dark:text-gray-400">{t('analyticsAOV')}</p><p className="text-3xl font-bold font-techno text-gumball-blue">{analyticsData.averageOrderValue.toLocaleString(undefined, {minimumFractionDigits: 2})} {t('currencyUnit')}</p></div>
          <div className="bg-white dark:bg-gumball-dark-card p-5 rounded-xl shadow-lg"><p className="text-sm text-gray-500 dark:text-gray-400">{t('analyticsConversionRate')}</p><p className="text-3xl font-bold font-techno text-gumball-pink">{analyticsData.conversionRate.toFixed(1)}%</p></div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white dark:bg-gumball-dark-card p-6 rounded-xl shadow-lg">
          <h3 className="font-display text-xl text-gumball-purple dark:text-gumball-purple/90 mb-4">{t('analyticsSalesTrend')}</h3>
          <div className="flex items-end justify-between h-64 space-x-1 p-2 bg-gray-50 dark:bg-gumball-dark rounded-md">
            {Object.entries(analyticsData.salesByDay).map(([date, revenue]) => (
              <div key={date} className="flex-1 flex flex-col justify-end items-center group">
                 <div className="w-full bg-gumball-blue hover:bg-gumball-pink rounded-t-md transition-colors" style={{ height: `${(revenue / maxDailySale) * 100}%` }} title={`${date}: ${revenue.toLocaleString()} ${t('currencyUnit')}`}></div>
              </div>
            ))}
          </div>
           <p className="text-xs text-gray-400 text-center mt-2">{t('analyticsLast30Days')}</p>
        </div>
        <div className="bg-white dark:bg-gumball-dark-card p-6 rounded-xl shadow-lg">
          <h3 className="font-display text-xl text-gumball-purple dark:text-gumball-purple/90 mb-4">{t('analyticsTopProducts')}</h3>
          <ul className="space-y-3">
            {analyticsData.topSellingProducts.map(p => (
              <li key={p.productId} className="flex justify-between items-center text-sm border-b border-gray-100 dark:border-gray-700 pb-2">
                <span className="font-semibold text-gumball-dark dark:text-gumball-light-bg truncate pe-2">{p.productName}</span>
                <span className="text-gumball-green font-techno">{p.unitsSold} {t('analyticsUnits')}</span>
              </li>
            ))}
             {analyticsData.topSellingProducts.length === 0 && <p className="text-sm text-gray-500">{t('noDataAvailable')}</p>}
          </ul>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white dark:bg-gumball-dark-card p-6 rounded-xl shadow-lg">
           <h3 className="font-display text-xl text-gumball-purple dark:text-gumball-purple/90 mb-4">{t('trafficSources')}</h3>
           <div className="flex flex-col md:flex-row items-center gap-6">
                <div className="w-48 h-48 rounded-full relative" style={{background: `conic-gradient(${Object.entries(analyticsData.trafficSources).map(([source, count], index) => {
                    const percentage = (count / totalTraffic) * 360;
                    const color = pieColors[index % pieColors.length];
                    const startAngle = accumulatedAngle;
                    accumulatedAngle += percentage;
                    return `${color} ${startAngle}deg ${accumulatedAngle}deg`;
                }).join(', ')})`}}>
                     <div className="absolute inset-2 bg-white dark:bg-gumball-dark-card rounded-full"></div>
                </div>
                <div className="flex-1">
                    <ul className="space-y-2">
                       {Object.entries(analyticsData.trafficSources).sort((a,b)=>b[1]-a[1]).map(([source, count], index) => (
                           <li key={source} className="flex items-center text-sm">
                               <span className="w-3 h-3 rounded-full me-2" style={{backgroundColor: pieColors[index % pieColors.length]}}></span>
                               <span className="font-semibold text-gumball-dark dark:text-gumball-light-bg">{getSourceDisplayName(source)}:</span>
                               <span className="ms-auto text-gray-600 dark:text-gray-400">{count} {t('visits')} ({(count/totalTraffic * 100).toFixed(1)}%)</span>
                           </li>
                       ))}
                       {Object.keys(analyticsData.trafficSources).length === 0 && <p className="text-sm text-gray-500">{t('noDataAvailable')}</p>}
                    </ul>
                </div>
           </div>
        </div>

        <div className="bg-white dark:bg-gumball-dark-card p-6 rounded-xl shadow-lg">
          <h3 className="font-display text-xl text-gumball-purple dark:text-gumball-purple/90 mb-4">{t('analyticsAIInsights')}</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">{t('analyticsAIHelper')}</p>
          <Button onClick={handleGetAIInsight} isLoading={isGeneratingInsight} variant="secondary" size="sm" leftIcon={<AISparklesIcon/>}>
              {isGeneratingInsight ? t('generating') : t('analyticsGetInsights')}
          </Button>
          {isGeneratingInsight && <LoadingSpinner message="" size="sm" />}
          {aiInsight && (
              <div className="mt-4 p-4 prose prose-sm dark:prose-invert prose-headings:text-gumball-pink prose-strong:text-gumball-dark dark:prose-strong:text-gumball-light-bg bg-gumball-light-bg dark:bg-gumball-dark rounded-md max-h-80 overflow-y-auto" dangerouslySetInnerHTML={{ __html: aiInsight.replace(/\n/g, '<br />') }} />
          )}
        </div>
      </div>
    </div>
  );
};


// --- Manage Products Pane ---
interface ManageProductsPaneProps {
  products: Product[];
  onEdit: (product: Product) => void;
  onDelete: (productId: string) => void;
  onAdd: () => void;
}
const ManageProductsPane: React.FC<ManageProductsPaneProps> = ({ products, onEdit, onDelete, onAdd }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const { t, getLocalized } = useI18n();

  const filteredProducts = products.filter(p => 
    (getLocalized(p.name) as string).toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <input 
          type="text" 
          placeholder={t('searchProductsPlaceholder')}
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className={inputBaseClass + " sm:max-w-xs w-full"}
        />
        <Button onClick={onAdd} variant="primary" leftIcon={<PlusIcon className="w-5 h-5"/>}>{t('addNewProduct')}</Button>
      </div>
      <div className="overflow-x-auto bg-white dark:bg-gumball-dark-card shadow-lg rounded-xl">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gumball-dark">
            <tr>
              <th scope="col" className="px-4 py-3 text-start text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">{t('productImage')}</th>
              <th scope="col" className="px-4 py-3 text-start text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">{t('productName')}</th>
              <th scope="col" className="px-4 py-3 text-start text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">{t('productPrice')}</th>
              <th scope="col" className="px-4 py-3 text-start text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">{t('productStock')}</th>
              <th scope="col" className="px-4 py-3 text-start text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">{t('productLikes')}</th>
              <th scope="col" className="px-4 py-3 text-start text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">{t('productActions')}</th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gumball-dark-card divide-y divide-gray-200 dark:divide-gray-700">
            {filteredProducts.length > 0 ? filteredProducts.map((product) => (
              <tr key={product.id} className="hover:bg-gray-50 dark:hover:bg-gumball-dark transition-colors">
                <td className="px-4 py-3 whitespace-nowrap">
                  <img 
                    src={product.imageUrl || 'https://picsum.photos/seed/placeholder/50/50'} 
                    alt={getLocalized(product.name) as string} 
                    className="w-12 h-12 object-cover rounded-md shadow-sm"
                    onError={(e) => (e.currentTarget.src = 'https://picsum.photos/seed/placeholder_err/50/50')}
                  />
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gumball-dark dark:text-gumball-light-bg">{getLocalized(product.name)}</td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gumball-dark dark:text-gumball-light-bg">
                  {product.originalPrice && product.originalPrice > product.price ? (
                    <>
                      <span className="line-through text-gray-400 dark:text-gray-500">{product.originalPrice.toLocaleString()} {t('currencyUnit')}</span>
                      <br />
                      <span className="text-red-500 font-semibold">{product.price.toLocaleString()} {t('currencyUnit')}</span>
                    </>
                  ) : (
                    <span className="text-gumball-green">{product.price.toLocaleString()} {t('currencyUnit')}</span>
                  )}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{product.stock}</td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{product.likes}</td>
                <td className="px-4 py-3 whitespace-nowrap text-sm font-medium space-x-2 rtl:space-x-reverse">
                  <Button onClick={() => onEdit(product)} variant="ghost" size="sm" className="text-gumball-blue hover:text-gumball-pink p-1"><EditIcon className="w-5 h-5"/></Button>
                  <Button onClick={() => onDelete(product.id)} variant="ghost" size="sm" className="text-red-500 hover:text-red-700 p-1"><TrashIcon className="w-5 h-5"/></Button>
                </td>
              </tr>
            )) : (
              <tr><td colSpan={6} className="text-center py-10 text-gray-500 dark:text-gray-400">{t('noProductsFound')}</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};


// --- Product Form Modal ---
interface ProductFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product | null;
  productCtx: IProductContextType | undefined;
}

const initialModalFormData: NewProductData = {
  name: { en: '', ar: '' },
  description: { en: '', ar: '' },
  price: 0,
  originalPrice: undefined,
  discountPercentage: undefined,
  imageUrl: '',
  category: { en: '', ar: '' },
  stock: 0,
  keywords: { en: [], ar: [] },
  additionalImageUrls: [],
};

const fileToDataUrl = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

const getInitialModalFormData = (p: Product | null): NewProductData => {
  if (p) {
    return {
      id: p.id,
      name: p.name,
      description: p.description,
      price: p.price,
      originalPrice: p.originalPrice,
      discountPercentage: p.discountPercentage,
      imageUrl: p.imageUrl,
      category: p.category,
      stock: p.stock,
      keywords: p.keywords,
      additionalImageUrls: p.additionalImageUrls || [],
      likes: p.likes,
      averageRating: p.averageRating,
      reviewCount: p.reviewCount,
    };
  }
  return { ...initialModalFormData };
};


const ProductFormModal: React.FC<ProductFormModalProps> = ({ isOpen, onClose, product, productCtx }) => {
  const [formData, setFormData] = useState<NewProductData>(getInitialModalFormData(product));
  const [isGeneratingDesc, setIsGeneratingDesc] = useState(false);
  const [mainImagePreview, setMainImagePreview] = useState<string | null>(null);
  const [additionalImagesPreview, setAdditionalImagesPreview] = useState<string[]>([]);
  const mainImageInputRef = useRef<HTMLInputElement>(null);
  const additionalImagesInputRef = useRef<HTMLInputElement>(null);
  const [activeLangTab, setActiveLangTab] = useState<Language>('en');
  const { t, language: currentAppLang } = useI18n();


  useEffect(() => {
    if (isOpen) { 
        const initialData = getInitialModalFormData(product);
        setFormData(initialData);
        if (initialData.imageUrl) setMainImagePreview(initialData.imageUrl);
        else setMainImagePreview(null);
        if (initialData.additionalImageUrls) setAdditionalImagesPreview(initialData.additionalImageUrls);
        else setAdditionalImagesPreview([]);
        setActiveLangTab('en'); // Reset to english tab on open
    } else {
        setMainImagePreview(null);
        setAdditionalImagesPreview([]);
    }
  }, [product, isOpen]);

  useEffect(() => {
    const op = formData.originalPrice;
    const sp = formData.price;
    if (op && typeof op === 'number' && op > 0 && typeof sp === 'number' && sp > 0 && op > sp) {
        const calculatedDiscount = ((op - sp) / op) * 100;
        setFormData(prev => ({ ...prev, discountPercentage: parseFloat(calculatedDiscount.toFixed(1)) }));
    } else {
        setFormData(prev => ({ ...prev, discountPercentage: undefined }));
    }
  }, [formData.originalPrice, formData.price]);


  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>, lang: Language) => {
    const { name, value } = e.target;
    setFormData(prev => ({
        ...prev,
        [name]: {
            ...prev[name as keyof NewProductData] as MultilingualString,
            [lang]: value
        }
    }));
  };

  const handleKeywordsChange = (e: ChangeEvent<HTMLInputElement>, lang: Language) => {
    const { value } = e.target;
    const keywordsArray = value.split(',').map(s => s.trim()).filter(s => s);
     setFormData(prev => ({
        ...prev,
        keywords: {
            ...prev.keywords,
            [lang]: keywordsArray
        }
    }));
  }

  const handleNonLocalizedChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    let processedValue: string | number | undefined = value;
  
    if (name === 'originalPrice' || name === 'price' || name === 'stock') {
      processedValue = value === '' ? undefined : parseFloat(value);
      if (name !== 'originalPrice' && isNaN(processedValue as number)) processedValue = 0; 
      if (name === 'originalPrice' && value === '') processedValue = undefined;
    }
    setFormData(prev => ({ ...prev, [name]: processedValue }));
  }

  const handleMainImageChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const dataUrl = await fileToDataUrl(file);
        setFormData(prev => ({ ...prev, imageUrl: dataUrl }));
        setMainImagePreview(dataUrl);
      } catch (error) {
        toast.error("Failed to load main image preview.");
      }
    }
  };

  const handleAdditionalImagesChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      try {
        const newFileUrls = await Promise.all(Array.from(files).map(file => fileToDataUrl(file)));
        setFormData(prev => ({ ...prev, additionalImageUrls: [...(prev.additionalImageUrls || []), ...newFileUrls] }));
        setAdditionalImagesPreview(prev => [...prev, ...newFileUrls]);
      } catch (error) {
        toast.error("Failed to load some additional image previews.");
      }
    }
  };
  
  const handleDeleteAdditionalImage = (indexToDelete: number) => {
    setFormData(prev => ({ ...prev, additionalImageUrls: prev.additionalImageUrls?.filter((_, i) => i !== indexToDelete) || [] }));
    setAdditionalImagesPreview(prev => prev.filter((_, i) => i !== indexToDelete));
    if (additionalImagesInputRef.current) additionalImagesInputRef.current.value = "";
    toast.info(t('imageRemoved'));
  };

  const handleGenerateDescription = async () => {
    const productNameForPrompt = formData.name[currentAppLang] || formData.name.en;
    if (!productNameForPrompt) {
      toast.warn(t('aiDescriptionWarning'));
      return;
    }
    setIsGeneratingDesc(true);
    try {
      const keywordsForPrompt = formData.keywords[currentAppLang] || formData.keywords.en;
      const desc = await generateProductDescription(productNameForPrompt, keywordsForPrompt);
      setFormData(prev => ({
        ...prev,
        description: {
            ...prev.description,
            [currentAppLang]: desc
        }
      }));
      toast.success(t('aiDescriptionGenerated'));
    } catch (error) {
      toast.error(t('newsFetchFailed')); // Reusing translation key
    } finally {
      setIsGeneratingDesc(false);
    }
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if ((formData.price < 0 && formData.price !== undefined) || (formData.stock < 0 && formData.stock !== undefined) || (formData.originalPrice !== undefined && formData.originalPrice < 0)) {
        toast.error(t('priceNegativeError'));
        return;
    }
    if (formData.originalPrice && formData.price > formData.originalPrice) {
      toast.warn(t('priceMismatchWarning'));
      return;
    }
    if (!formData.imageUrl) {
        toast.error(t('mainImageRequired'));
        return;
    }

    const dataToSave: NewProductData = {
      ...formData,
      discountPercentage: (formData.originalPrice && formData.price && formData.originalPrice > formData.price) 
                          ? parseFloat((((formData.originalPrice - formData.price) / formData.originalPrice) * 100).toFixed(1)) 
                          : undefined,
      originalPrice: formData.originalPrice === 0 ? undefined : formData.originalPrice,
    };

    if (product && productCtx) { 
      const updatedProductData: Product = { ...product, ...dataToSave, id: product.id, likes: product.likes };
      productCtx.updateProduct(updatedProductData);
      toast.success(t('productUpdated', {name: dataToSave.name.en}));
    } else if (productCtx) { 
      productCtx.addProduct(dataToSave);
      toast.success(t('productAdded', {name: dataToSave.name.en}));
    }
    
    if(mainImageInputRef.current) mainImageInputRef.current.value = "";
    if(additionalImagesInputRef.current) additionalImagesInputRef.current.value = "";
    onClose();
  };

  const langTabs: {id: Language, name: string}[] = [{id: 'en', name: t('english')}, {id: 'ar', name: t('arabic')}];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={product ? t('editProduct') : t('addProduct')} size="xl">
      <form onSubmit={handleSubmit} className="space-y-4 max-h-[75vh] overflow-y-auto p-1 pr-3">
        
        <div className="border-b border-gray-200 dark:border-gray-700">
            <nav className="-mb-px flex space-x-4 rtl:space-x-reverse" aria-label="Tabs">
                {langTabs.map(tab => (
                    <button
                        key={tab.id}
                        type="button"
                        onClick={() => setActiveLangTab(tab.id)}
                        className={`${
                            activeLangTab === tab.id
                                ? 'border-gumball-pink text-gumball-pink'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                        } whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm transition-colors focus:outline-none`}
                    >
                        {tab.name}
                    </button>
                ))}
            </nav>
        </div>

        <div className="pt-2">
            {/* English Fields */}
            <div className={`${activeLangTab === 'en' ? 'block' : 'hidden'}`}>
                <div className="space-y-4">
                    <div><label htmlFor="name-en" className={labelBaseClass}>{t('productNameEN')}</label><input type="text" id="name-en" name="name" value={formData.name.en} onChange={(e) => handleChange(e, 'en')} className={inputBaseClass} required /></div>
                    <div><label htmlFor="description-en" className={labelBaseClass}>{t('descriptionEN')}</label><textarea id="description-en" name="description" value={formData.description.en} onChange={(e) => handleChange(e, 'en')} rows={3} className={inputBaseClass} required /></div>
                    <div><label htmlFor="category-en" className={labelBaseClass}>{t('categoryEN')}</label><input type="text" id="category-en" name="category" value={formData.category.en} onChange={(e) => handleChange(e, 'en')} className={inputBaseClass} required /></div>
                    <div><label htmlFor="keywords-en" className={labelBaseClass}>{t('keywordsEN')}</label><input type="text" id="keywords-en" name="keywords" value={formData.keywords.en.join(', ')} onChange={(e) => handleKeywordsChange(e, 'en')} className={inputBaseClass} placeholder={t('keywordsPlaceholder')} /></div>
                </div>
            </div>
            {/* Arabic Fields */}
            <div className={`${activeLangTab === 'ar' ? 'block' : 'hidden'}`} dir="rtl">
                 <div className="space-y-4">
                    <div><label htmlFor="name-ar" className={labelBaseClass}>{t('productNameAR')}</label><input type="text" id="name-ar" name="name" value={formData.name.ar} onChange={(e) => handleChange(e, 'ar')} className={inputBaseClass} required /></div>
                    <div><label htmlFor="description-ar" className={labelBaseClass}>{t('descriptionAR')}</label><textarea id="description-ar" name="description" value={formData.description.ar} onChange={(e) => handleChange(e, 'ar')} rows={3} className={inputBaseClass} required /></div>
                    <div><label htmlFor="category-ar" className={labelBaseClass}>{t('categoryAR')}</label><input type="text" id="category-ar" name="category" value={formData.category.ar} onChange={(e) => handleChange(e, 'ar')} className={inputBaseClass} required /></div>
                    <div><label htmlFor="keywords-ar" className={labelBaseClass}>{t('keywordsAR')}</label><input type="text" id="keywords-ar" name="keywords" value={formData.keywords.ar.join(', ')} onChange={(e) => handleKeywordsChange(e, 'ar')} className={inputBaseClass} placeholder={t('keywordsPlaceholder')} /></div>
                </div>
            </div>
        </div>
        
        <Button type="button" onClick={handleGenerateDescription} isLoading={isGeneratingDesc} variant="ghost" size="sm" className="mt-1 text-xs text-gumball-blue" leftIcon={<AISparklesIcon className="w-4 h-4" />}>
          {t('generateWithAI')} ({activeLangTab.toUpperCase()})
        </Button>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <div><label htmlFor="originalPrice" className={labelBaseClass}>{t('originalPrice')} <span className="text-xs text-gray-400">{t('optional')}</span></label><input type="number" name="originalPrice" id="originalPrice" value={formData.originalPrice === undefined ? '' : formData.originalPrice} onChange={handleNonLocalizedChange} className={inputBaseClass} step="0.01" min="0" placeholder="e.g., 99.99" /></div>
            <div><label htmlFor="price" className={labelBaseClass}>{t('sellingPrice')}</label><input type="number" name="price" id="price" value={formData.price} onChange={handleNonLocalizedChange} className={inputBaseClass} step="0.01" min="0" required /></div>
        </div>
         {formData.discountPercentage !== undefined && formData.discountPercentage > 0 && (
          <div className="p-2 bg-gumball-yellow/20 dark:bg-gumball-yellow/10 rounded-md"><p className="text-sm font-medium text-gumball-dark dark:text-gumball-dark-deep">{t('calculatedDiscount')} <span className="font-bold text-red-600">{formData.discountPercentage.toFixed(1)}%</span></p></div>
        )}
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div><label htmlFor="stock" className={labelBaseClass}>{t('stockQuantity')}</label><input type="number" name="stock" id="stock" value={formData.stock} onChange={handleNonLocalizedChange} className={inputBaseClass} min="0" required /></div>
        </div>
        
        <div><label htmlFor="mainImageFile" className={labelBaseClass}>{t('mainImage')}</label><input type="file" name="mainImageFile" id="mainImageFile" accept="image/*" onChange={handleMainImageChange} className={`${inputBaseClass} file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-gumball-pink/10 file:text-gumball-pink hover:file:bg-gumball-pink/20 dark:file:bg-gumball-pink/80 dark:file:text-white dark:hover:file:bg-gumball-pink`} ref={mainImageInputRef}/>
          {mainImagePreview && (<div className="mt-2 p-2 border border-gray-200 dark:border-gray-700 rounded-md inline-block"><img src={mainImagePreview} alt={t('imagePreviewMain')} className="h-24 w-auto object-contain rounded"/></div>)}
        </div>
        
        <div><label htmlFor="additionalImageFiles" className={labelBaseClass}>{t('additionalImages')}</label><input type="file" name="additionalImageFiles" id="additionalImageFiles" accept="image/*" multiple onChange={handleAdditionalImagesChange} className={`${inputBaseClass} file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-gumball-blue/10 file:text-gumball-blue hover:file:bg-gumball-blue/20 dark:file:bg-gumball-blue/80 dark:file:text-white dark:hover:file:bg-gumball-blue`} ref={additionalImagesInputRef}/>
          {additionalImagesPreview.length > 0 && (<div className="mt-2 flex flex-wrap gap-2">{additionalImagesPreview.map((src, index) => (<div key={index} className="relative group p-1 border border-gray-200 dark:border-gray-700 rounded-md"><img src={src} alt={t('imagePreviewAdditional', {index: index+1})} className="h-20 w-auto object-contain rounded"/><button type="button" onClick={() => handleDeleteAdditionalImage(index)} className="absolute top-0.5 right-0.5 bg-red-600 text-white rounded-full p-0.5 w-5 h-5 flex items-center justify-center opacity-0 group-hover:opacity-100 hover:bg-red-700 transition-all duration-150 z-10" aria-label={t('removeImage')} title={t('removeImage')}><CloseIcon className="w-3 h-3" /></button></div>))}</div>)}
        </div>

        <div className="p-3 my-4 bg-yellow-50 dark:bg-yellow-900/30 border-l-4 border-yellow-400 dark:border-yellow-500 rounded-md">
            <p className="text-xs text-yellow-700 dark:text-yellow-300" dangerouslySetInnerHTML={{ __html: t('imageStorageWarning') }} />
        </div>
        
        <div className="flex justify-end space-x-3 rtl:space-x-reverse pt-2">
          <Button type="button" variant="ghost" onClick={onClose}>{t('cancel')}</Button>
          <Button type="submit" variant="primary">{product ? t('updateProduct') : t('addProduct')}</Button>
        </div>
      </form>
    </Modal>
  );
};

// --- Manage Orders Pane ---
interface ManageOrdersPaneProps {
  orders: Order[];
  onViewDetails: (order: Order) => void;
  onUpdateStatus: (orderId: string, newStatus: OrderStatus) => void;
}
const ManageOrdersPane: React.FC<ManageOrdersPaneProps> = ({ orders, onViewDetails, onUpdateStatus }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const { t } = useI18n();

  const filteredOrders = orders.filter(o => 
    o.id.toLowerCase().includes(searchTerm.toLowerCase()) || 
    o.customerName.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  const getLocalizedStatus = (status: OrderStatus) => {
    const keyMap: Record<OrderStatus, string> = {
        "Pending Approval": "statusPending", "Processing": "statusProcessing", "Preparing for Shipment": "statusPreparing",
        "Shipped": "statusShipped", "Delivered": "statusDelivered", "Cancelled": "statusCancelled", "Returned": "statusReturned"
    };
    return t(keyMap[status]);
  }

  return (
    <div className="space-y-6">
      <input 
        type="text" 
        placeholder={t('searchOrders')}
        value={searchTerm}
        onChange={e => setSearchTerm(e.target.value)}
        className={inputBaseClass + " w-full sm:max-w-md"}
      />
      <div className="overflow-x-auto bg-white dark:bg-gumball-dark-card shadow-lg rounded-xl">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gumball-dark">
            <tr>
              <th scope="col" className="px-4 py-3 text-start text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">{t('orderId')}</th>
              <th scope="col" className="px-4 py-3 text-start text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">{t('customerNameLabel')}</th>
              <th scope="col" className="px-4 py-3 text-start text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">{t('orderDateColumn')}</th>
              <th scope="col" className="px-4 py-3 text-start text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">{t('totalPrice')}</th>
              <th scope="col" className="px-4 py-3 text-start text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">{t('orderStatusColumn')}</th>
              <th scope="col" className="px-4 py-3 text-start text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">{t('productActions')}</th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gumball-dark-card divide-y divide-gray-200 dark:divide-gray-700">
            {filteredOrders.length > 0 ? filteredOrders.map((order) => (
              <tr key={order.id} className="hover:bg-gray-50 dark:hover:bg-gumball-dark transition-colors">
                <td className="px-4 py-3 text-sm font-mono text-gumball-blue dark:text-gumball-blue/80 break-all max-w-[10ch] xxs:max-w-[12ch] xs:max-w-[15ch] sm:max-w-[20ch] md:max-w-[25ch] lg:max-w-xs" title={order.id}>{order.id}</td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gumball-dark dark:text-gumball-light-bg">{order.customerName}</td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{new Date(order.createdAt).toLocaleDateString()}</td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gumball-green">{order.totalPrice.toLocaleString()} {t('currencyUnit')}</td>
                <td className="px-4 py-3 whitespace-nowrap text-sm">
                   <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                       order.status === 'Delivered' ? 'bg-green-100 text-green-800 dark:bg-green-700 dark:text-green-100' :
                       order.status === 'Shipped' ? 'bg-blue-100 text-blue-800 dark:bg-blue-700 dark:text-blue-100' :
                       order.status === 'Pending Approval' || order.status === 'Processing' || order.status === 'Preparing for Shipment' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-700 dark:text-yellow-100' :
                       order.status === 'Returned' ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-700 dark:text-indigo-100' :
                       order.status === 'Cancelled' ? 'bg-red-200 text-red-800 dark:bg-red-800 dark:text-red-100' :
                       'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
                   }`}>{getLocalizedStatus(order.status)}</span>
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm font-medium">
                  <Button onClick={() => onViewDetails(order)} variant="ghost" size="sm" className="text-gumball-blue hover:text-gumball-pink p-1"><EyeIcon className="w-5 h-5"/></Button>
                </td>
              </tr>
            )) : (
              <tr><td colSpan={6} className="text-center py-10 text-gray-500 dark:text-gray-400">{t('noOrdersFound')}</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// --- Order Details Modal ---
interface OrderDetailsModalProps {
    isOpen: boolean;
    onClose: () => void;
    order: Order | null;
    onUpdateStatus: (orderId: string, newStatus: OrderStatus) => void;
}
const OrderDetailsModal: React.FC<OrderDetailsModalProps> = ({ isOpen, onClose, order, onUpdateStatus }) => {
    const { t, getLocalized } = useI18n();
    if (!order) return null;
    const [newStatus, setNewStatus] = useState<OrderStatus>(order.status);
    useEffect(() => { if(order) setNewStatus(order.status); }, [order]);

    const handleStatusChange = () => { onUpdateStatus(order.id, newStatus); };
    const getLocalizedStatus = (status: OrderStatus) => t(`status${status.replace(/\s/g, '')}`);
    const getLocalizedShippingMethod = (method: ShippingMethod) => t(method.toLowerCase() as 'domicile' | 'stopdesk');

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={t('orderDetails', {orderId: order.id.substring(0,12)})} size="lg">
            <div className="space-y-4 max-h-[70vh] overflow-y-auto p-1 pe-2">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <p><strong>{t('customerNameLabel')}:</strong> {order.customerName}</p>
                    <p><strong>{t('orderDateColumn')}:</strong> {new Date(order.createdAt).toLocaleString()}</p>
                    <p><strong>{t('phone')}:</strong> {order.phoneNumber}</p>
                    {order.phoneNumberSecondary && <p><strong>{t('phoneNumberSecondary')}:</strong> {order.phoneNumberSecondary}</p>}
                    <p><strong>{t('wilayaLabel')}:</strong> {order.wilaya}</p>
                    <p><strong>{t('communeLabel')}:</strong> {order.commune}</p>
                    <p className="md:col-span-2"><strong>{t('billingAddress')}:</strong> {order.billingAddress}</p>
                    <p>
                        <strong>{t('deliveryMethod')}:</strong> {getLocalizedShippingMethod(order.shippingMethod)}
                    </p>
                    <p>
                        <strong>{t('shippingCostLabel')}:</strong> <span className="font-semibold">{order.shippingCost.toLocaleString()} {t('currencyUnit')}</span>
                    </p>
                    <p className="md:col-span-2">
                        <strong>{t('totalPrice')}:</strong> <span className="text-gumball-green font-semibold">{order.totalPrice.toLocaleString()} {t('currencyUnit')}</span>
                    </p>
                </div>

                <div className="mt-2"><h4 className="font-semibold mb-1">{t('items')}</h4><ul className="list-disc list-inside space-y-1 text-sm bg-gray-50 dark:bg-gumball-dark p-3 rounded-md">{order.items.map(item => (<li key={item.id}>{getLocalized(item.name)} (x{item.quantity}) - {item.price.toLocaleString()} {t('currencyUnit')} {t('each')}</li>))}</ul></div>
                <div className="mt-2"><h4 className="font-semibold mb-1">{t('statusHistory')}</h4><ul className="space-y-1 text-xs bg-gray-50 dark:bg-gumball-dark p-3 rounded-md max-h-32 overflow-y-auto">{order.statusHistory.slice().reverse().map((sh, idx) => ( <li key={idx}><strong>{getLocalizedStatus(sh.status)}</strong> ({new Date(sh.timestamp).toLocaleString()}) {sh.notes && <span className="italic text-gray-500">- "{sh.notes}"</span>}</li>))}</ul></div>
                <div className="pt-3 border-t dark:border-gray-700"><label htmlFor="orderStatus" className={labelBaseClass}>{t('updateOrderStatus')}</label><div className="flex gap-2 items-center"><select id="orderStatus" value={newStatus} onChange={(e) => setNewStatus(e.target.value as OrderStatus)} className={inputBaseClass + " flex-grow"}>{ORDER_STATUSES.map(status => (<option key={status} value={status}>{getLocalizedStatus(status)}</option>))}</select><Button onClick={handleStatusChange} variant="secondary" size="sm" disabled={newStatus === order.status}>{t('update')}</Button></div></div>
            </div>
            <div className="flex justify-end mt-6"><Button onClick={onClose} variant="primary">{t('close')}</Button></div>
        </Modal>
    );
};


// --- Manage Q&A Pane ---
interface ManageQnAPaneProps {
  questions: ProductQuestion[];
  onEditAnswer: (questionId: string, answer: ProductAnswer) => void;
  onDeleteQuestion: (questionId: string) => void;
  addAnswerToQuestion: (questionId: string, responderName: string, answerText: string) => void;
}
const ManageQnAPane: React.FC<ManageQnAPaneProps> = ({ questions, onEditAnswer, onDeleteQuestion, addAnswerToQuestion }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [answeringQuestionId, setAnsweringQuestionId] = useState<string | null>(null);
  const [answerText, setAnswerText] = useState('');
  const { t } = useI18n();

  const filteredQuestions = questions.filter(q => 
    q.questionText.toLowerCase().includes(searchTerm.toLowerCase()) || 
    q.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    q.productId.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleStartAnswering = (questionId: string) => {
    setAnsweringQuestionId(questionId); setAnswerText('');
  };
  
  const handleAddAnswer = (e: FormEvent) => {
    e.preventDefault();
    if (answeringQuestionId && answerText.trim()) {
      addAnswerToQuestion(answeringQuestionId, "Support Team", answerText);
      toast.success(t('answerPosted'));
      setAnsweringQuestionId(null); setAnswerText('');
    }
  };

  return (
    <div className="space-y-6">
       <input type="text" placeholder={t('searchQuestions')} value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className={inputBaseClass + " w-full sm:max-w-md"}/>
      <div className="space-y-4">
        {filteredQuestions.length > 0 ? filteredQuestions.map(q => (
          <div key={q.id} className="bg-white dark:bg-gumball-dark-card p-4 rounded-lg shadow-md border-l-4 border-gumball-purple">
            <div className="flex justify-between items-start">
              <div>
                <p className="font-semibold text-gumball-dark dark:text-gumball-light-bg">{q.questionText}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{t('byUser', {user: q.userName})} | {t('productRef', {id: q.productId === 'general' ? t('general') : q.productId})} | {t('askedDate', {date: new Date(q.createdAt).toLocaleDateString()})}</p>
              </div>
              <Button onClick={() => onDeleteQuestion(q.id)} variant="ghost" size="sm" className="text-red-500 hover:text-red-700 p-1 flex-shrink-0"><TrashIcon className="w-5 h-5"/></Button>
            </div>
            <div className="mt-3 space-y-2 ps-4 border-s-2 border-gray-200 dark:border-gray-600 ms-2">
              {q.answers.map(ans => (<div key={ans.id} className="bg-gray-50 dark:bg-gumball-dark p-2 rounded"><p className="text-sm text-gray-700 dark:text-gray-300">{ans.answerText}</p><p className="text-xs text-gray-400 dark:text-gray-500">{t('byUser', {user: ans.responderName})} | {t('askedDate', {date: new Date(ans.createdAt).toLocaleDateString()})}</p><Button onClick={() => onEditAnswer(q.id, ans)} variant="ghost" size="sm" className="text-xs text-gumball-blue p-0 mt-1">{t('edit')}</Button></div>))}
              {q.answers.length === 0 && answeringQuestionId !== q.id && (<Button onClick={() => handleStartAnswering(q.id)} variant="secondary" size="sm">{t('answerQuestion')}</Button>)}
              {answeringQuestionId === q.id && (<form onSubmit={handleAddAnswer} className="mt-2 space-y-2"><textarea value={answerText} onChange={(e) => setAnswerText(e.target.value)} placeholder={t('yourQuestionPlaceholder')} rows={2} className={inputBaseClass} required /><div className="flex gap-2"><Button type="submit" variant="primary" size="sm">{t('postAnswer')}</Button><Button type="button" variant="ghost" size="sm" onClick={() => setAnsweringQuestionId(null)}>{t('cancel')}</Button></div></form>)}
            </div>
          </div>
        )) : (<p className="text-center py-10 text-gray-500 dark:text-gray-400">{t('noQuestionsFound')}</p>)}
      </div>
    </div>
  );
};

// --- Answer Form Modal ---
interface AnswerFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingAnswerData: { questionId: string; answer: ProductAnswer } | null;
  qnaCtx: IQnAContextType | undefined;
}
const AnswerFormModal: React.FC<AnswerFormModalProps> = ({ isOpen, onClose, editingAnswerData, qnaCtx }) => {
  const [answerText, setAnswerText] = useState('');
  const { t } = useI18n();

  useEffect(() => { if (editingAnswerData) setAnswerText(editingAnswerData.answer.answerText); }, [editingAnswerData, isOpen]);
  const handleSubmit = (e: FormEvent) => { e.preventDefault(); if (editingAnswerData && qnaCtx) { qnaCtx.updateAnswerText(editingAnswerData.questionId, editingAnswerData.answer.id, answerText); toast.success(t('answerUpdated')); } onClose(); };
  if (!editingAnswerData) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={t('editAnswer')} size="md">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div><label htmlFor="answerText" className={labelBaseClass}>{t('answerText')}</label><textarea name="answerText" id="answerText" value={answerText} onChange={(e) => setAnswerText(e.target.value)} rows={4} className={inputBaseClass} required /></div>
        <div className="flex justify-end space-x-3 rtl:space-x-reverse"><Button type="button" variant="ghost" onClick={onClose}>{t('cancel')}</Button><Button type="submit" variant="primary">{t('updateAnswer')}</Button></div>
      </form>
    </Modal>
  );
};


// --- Manage Reviews Pane ---
interface ManageReviewsPaneProps {
  reviews: ProductReview[];
  getProductById: (productId: string) => Product | undefined;
  onDelete: (reviewId: string) => void;
}
const ManageReviewsPane: React.FC<ManageReviewsPaneProps> = ({ reviews, getProductById, onDelete }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const { t, getLocalized } = useI18n();
  
  const filteredReviews = reviews.filter(r => {
      const product = getProductById(r.productId);
      const localizedProductName = product ? getLocalized(product.name) as string : '';
      return r.reviewerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
             r.comment.toLowerCase().includes(searchTerm.toLowerCase()) ||
             r.productId.toLowerCase().includes(searchTerm.toLowerCase()) ||
             (localizedProductName && localizedProductName.toLowerCase().includes(searchTerm.toLowerCase()));
  });
  
  return (
    <div className="space-y-6">
      <input type="text" placeholder={t('searchReviews')} value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className={inputBaseClass + " w-full sm:max-w-md"}/>
      <div className="space-y-4">
        {filteredReviews.length > 0 ? filteredReviews.map(review => {
          const product = getProductById(review.productId);
          const localizedProductName = product ? getLocalized(product.name) : review.productId;
          return (
            <div key={review.id} className="bg-white dark:bg-gumball-dark-card p-4 rounded-lg shadow-md border-l-4 border-gumball-yellow">
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center space-x-2 mb-1">{review.reviewerAvatar && <img src={review.reviewerAvatar} alt={review.reviewerName} className="w-8 h-8 rounded-full"/>}<h4 className="font-semibold text-gumball-dark dark:text-gumball-light-bg">{review.reviewerName}</h4><StarRating rating={review.rating} starSize="w-4 h-4"/></div>
                  <p className="text-sm text-gray-700 dark:text-gray-300">{review.comment}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{t('product')} {localizedProductName} | {t('reviewDate', {date: new Date(review.createdAt).toLocaleDateString()})}</p>
                </div>
                <Button onClick={() => onDelete(review.id)} variant="ghost" size="sm" className="text-red-500 hover:text-red-700 p-1 flex-shrink-0"><TrashIcon className="w-5 h-5"/></Button>
              </div>
            </div>);
        }) : (<p className="text-center py-10 text-gray-500 dark:text-gray-400">{t('noReviewsFound')}</p>)}
      </div>
    </div>
  );
};


// --- Marketing Tools Pane ---
interface MarketingToolsPaneProps {
    productCtx: IProductContextType | undefined;
}
const MarketingToolsPane: React.FC<MarketingToolsPaneProps> = ({ productCtx }) => {
    const { t, getLocalized } = useI18n();
    const [selectedProductId, setSelectedProductId] = useState<string>('');
    const [generatedLink, setGeneratedLink] = useState<string>('');
    const [copyButtonText, setCopyButtonText] = useState<string>(t('copyLink'));

    useEffect(() => {
        if (selectedProductId) {
            const baseUrl = window.location.origin + window.location.pathname.split('/').slice(0, -1).join('/') + '/';
            const link = `${baseUrl}#/add-and-checkout?productId=${selectedProductId}&ref=promo_link_${selectedProductId}`;
            setGeneratedLink(link);
        } else {
            setGeneratedLink('');
        }
        setCopyButtonText(t('copyLink'));
    }, [selectedProductId, t]);

    const handleCopyLink = () => {
        if (generatedLink) {
            navigator.clipboard.writeText(generatedLink).then(() => {
                toast.success(t('linkCopied'));
                setCopyButtonText(t('linkCopied'));
                setTimeout(() => setCopyButtonText(t('copyLink')), 2500);
            }).catch(err => {
                toast.error('Failed to copy link.');
                console.error('Copy failed', err);
            });
        }
    };

    if (!productCtx) return <LoadingSpinner />;

    return (
        <div className="bg-white dark:bg-gumball-dark-card p-6 rounded-xl shadow-lg max-w-3xl mx-auto">
            <h2 className="text-2xl font-display text-gumball-purple dark:text-gumball-purple/90 mb-6">{t('generateMarketingLink')}</h2>
            
            <div className="space-y-4">
                <div>
                    <label htmlFor="product-select" className={labelBaseClass}>{t('selectProductToLink')}</label>
                    <select
                        id="product-select"
                        value={selectedProductId}
                        onChange={(e) => setSelectedProductId(e.target.value)}
                        className={inputBaseClass}
                    >
                        <option value="">{t('selectProductPlaceholder')}</option>
                        {productCtx.products.map(p => (
                            <option key={p.id} value={p.id}>{getLocalized(p.name)}</option>
                        ))}
                    </select>
                </div>

                {generatedLink && (
                    <div className="space-y-2 animate-fadeIn">
                        <label htmlFor="generated-link-display" className={labelBaseClass}>{t('generatedLink')}</label>
                        <div className="flex gap-2">
                            <input
                                id="generated-link-display"
                                type="text"
                                value={generatedLink}
                                readOnly
                                className={`${inputBaseClass} bg-gray-100 dark:bg-gumball-dark`}
                            />
                            <Button onClick={handleCopyLink} variant="secondary" className="flex-shrink-0">
                                {copyButtonText}
                            </Button>
                        </div>
                    </div>
                )}
            </div>

            <div className="mt-8 p-4 bg-blue-50 dark:bg-blue-900/30 border-l-4 rtl:border-l-0 rtl:border-r-4 border-blue-400 dark:border-blue-500 rounded-md">
                <h3 className="font-semibold text-blue-800 dark:text-blue-200">{t('marketingLinkInstructionsTitle')}</h3>
                <p className="mt-1 text-sm text-blue-700 dark:text-blue-300">{t('marketingLinkInstructionsBody')}</p>
            </div>
        </div>
    );
};

// --- CSV Helper Functions ---
const escapeCsvCell = (cellData: any): string => { let cell = String(cellData === null || cellData === undefined ? '' : cellData); if (cell.includes('"') || cell.includes(',') || cell.includes('\n') || cell.includes('\r')) { cell = cell.replace(/"/g, '""'); return `"${cell}"`; } return cell; };
const arrayToCsvRow = (rowArray: any[]): string => rowArray.map(escapeCsvCell).join(',');
const downloadCsv = (csvContent: string, filename: string) => { const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' }); const link = document.createElement("a"); if (link.download !== undefined) { const url = URL.createObjectURL(blob); link.setAttribute("href", url); link.setAttribute("download", filename); link.style.visibility = 'hidden'; document.body.appendChild(link); link.click(); document.body.removeChild(link); URL.revokeObjectURL(url); } else { toast.error("CSV download not supported by your browser directly."); }};

// --- Manage Reports Pane ---
interface ManageReportsPaneProps { productCtx?: IProductContextType; orderCtx?: OrderContextType; qnaCtx?: IQnAContextType; reviewCtx?: ReviewContextType; }
const ManageReportsPane: React.FC<ManageReportsPaneProps> = ({ productCtx, orderCtx, qnaCtx, reviewCtx }) => {
    const { t, getLocalized } = useI18n();
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth() + 1;
    const defaultReportYear = currentMonth === 1 ? currentYear - 1 : currentYear;
    const defaultReportMonth = currentMonth === 1 ? 12 : currentMonth - 1;

    const [selectedYear, setSelectedYear] = useState<number>(defaultReportYear);
    const [selectedMonth, setSelectedMonth] = useState<number>(defaultReportMonth);
    const [isGenerating, setIsGenerating] = useState(false);

    const availableYears = Array.from({ length: 5 }, (_, i) => currentYear - i).sort();
    const months = Array.from({ length: 12 }, (_, i) => ({ value: i + 1, name: t((new Date(0, i).toLocaleString('en', { month: 'long' })).toLowerCase()) }));

    const handleGenerateReport = () => {
        if (!productCtx || !orderCtx || !qnaCtx || !reviewCtx) { toast.error("Data contexts are not available."); return; }
        setIsGenerating(true);
        toast.info(t('generatingReportFor', { month: months.find(m=>m.value === selectedMonth)?.name || '', year: selectedYear }));
        const targetMonth = selectedMonth - 1;
        const monthlyOrders = orderCtx.orders.filter(o => new Date(o.createdAt).getFullYear() === selectedYear && new Date(o.createdAt).getMonth() === targetMonth);
        const monthlyQuestions = qnaCtx.questions.filter(q => new Date(q.createdAt).getFullYear() === selectedYear && new Date(q.createdAt).getMonth() === targetMonth);
        const monthlyAnsweredQuestions = monthlyQuestions.filter(q => q.answers.some(a => new Date(a.createdAt).getFullYear() === selectedYear && new Date(a.createdAt).getMonth() === targetMonth)).length;
        const monthlyReviews = reviewCtx.reviews.filter(r => new Date(r.createdAt).getFullYear() === selectedYear && new Date(r.createdAt).getMonth() === targetMonth);
        
        let totalRevenue = 0;
        const productSales: { [id: string]: { name: string, quantity: number, revenue: number } } = {};
        monthlyOrders.forEach(order => {
            totalRevenue += order.totalPrice;
            order.items.forEach(item => {
                const localizedName = getLocalized(item.name) as string;
                if (!productSales[item.id]) productSales[item.id] = { name: localizedName, quantity: 0, revenue: 0 };
                productSales[item.id].quantity += item.quantity;
                productSales[item.id].revenue += item.price * item.quantity;
            });
        });
        const averageOrderValue = monthlyOrders.length > 0 ? totalRevenue / monthlyOrders.length : 0;
        const topSellingProducts = Object.values(productSales).sort((a, b) => b.quantity - a.quantity).slice(0, 10);
        const detailedProductPerformance = Object.entries(productSales).map(([id, saleData]) => ({ id, name: saleData.name, unitsSold: saleData.quantity, revenue: saleData.revenue, currentStock: productCtx.getProductById(id)?.stock ?? 'N/A' }));
        const averageMonthlyRating = monthlyReviews.length > 0 ? monthlyReviews.reduce((sum, r) => sum + r.rating, 0) / monthlyReviews.length : 0;
        const currencyUnit = t('currencyUnit');

        let csvContent = `${t('appName')} - ${t('adminMonthlyReports')}\n${t('generatingReportFor', { month: months.find(m=>m.value === selectedMonth)?.name || '', year: selectedYear })}\n${new Date().toLocaleString()}\n\n`;
        csvContent += "Sales Summary\n" + arrayToCsvRow(["Metric", "Value"]) + "\n" + arrayToCsvRow(["Total Revenue", `${totalRevenue.toLocaleString()} ${currencyUnit}`]) + "\n" + arrayToCsvRow(["Total Orders", monthlyOrders.length]) + "\n" + arrayToCsvRow(["Average Order Value", `${averageOrderValue.toLocaleString()} ${currencyUnit}`]) + "\n\n";
        csvContent += "Top Selling Products\n" + arrayToCsvRow(["Product Name", "Quantity Sold", "Revenue"]) + "\n" + topSellingProducts.map(p => arrayToCsvRow([p.name, p.quantity, `${p.revenue.toLocaleString()} ${currencyUnit}`])).join('\n') + "\n\n";
        csvContent += "Detailed Product Performance\n" + arrayToCsvRow(["ID", "Name", "Units Sold", "Revenue", "Stock"]) + "\n" + detailedProductPerformance.map(p => arrayToCsvRow([p.id, p.name, p.unitsSold, `${p.revenue.toLocaleString()} ${currencyUnit}`, p.currentStock])).join('\n') + "\n\n";
        csvContent += "Q&A Summary\n" + arrayToCsvRow(["Metric", "Value"]) + "\n" + arrayToCsvRow(["New Questions", monthlyQuestions.length]) + "\n" + arrayToCsvRow(["Answered Questions", monthlyAnsweredQuestions]) + "\n\n";
        csvContent += "Review Summary\n" + arrayToCsvRow(["Metric", "Value"]) + "\n" + arrayToCsvRow(["New Reviews", monthlyReviews.length]) + "\n" + arrayToCsvRow(["Average Rating", averageMonthlyRating.toFixed(2)]) + "\n\n";
        
        setTimeout(() => { 
            const sanitizedAppName = t('appName').replace(/\s+/g, '');
            downloadCsv(csvContent, `${sanitizedAppName}_Report_${selectedYear}-${String(selectedMonth).padStart(2, '0')}.csv`);
            toast.success(t('reportGenerated')); 
            setIsGenerating(false); 
        }, 1500);
    };

    return (
        <div className="bg-white dark:bg-gumball-dark-card p-6 rounded-xl shadow-lg">
            <h2 className="text-2xl font-display text-gumball-purple dark:text-gumball-purple/90 mb-6">{t('generateMonthlyReport')}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6 items-end">
                <div><label htmlFor="reportYear" className={labelBaseClass}>{t('selectYear')}</label><select id="reportYear" value={selectedYear} onChange={(e) => setSelectedYear(parseInt(e.target.value))} className={inputBaseClass}>{availableYears.map(year => (<option key={year} value={year}>{year}</option>))}</select></div>
                <div><label htmlFor="reportMonth" className={labelBaseClass}>{t('selectMonth')}</label><select id="reportMonth" value={selectedMonth} onChange={(e) => setSelectedMonth(parseInt(e.target.value))} className={inputBaseClass}>{months.map(month => (<option key={month.value} value={month.value}>{month.name}</option>))}</select></div>
                <Button onClick={handleGenerateReport} variant="primary" size="md" isLoading={isGenerating} disabled={isGenerating} className="w-full sm:w-auto">{isGenerating ? t('generating') : t('generateAndDownload')}</Button>
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400"><p>{t('reportIncludes')}</p><p className="mt-2" dangerouslySetInnerHTML={{ __html: t('reportDetails') }}></p></div>
        </div>
    );
};