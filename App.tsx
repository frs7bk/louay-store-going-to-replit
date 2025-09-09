





import React, { useState, useEffect, createContext, useCallback, useMemo, useContext } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Session } from '@supabase/supabase-js';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { HomePage } from './pages/HomePage';
import { CartCheckoutPage } from './pages/CartCheckoutPage';
import { AdminPanelPage } from './pages/AdminPanelPage';
import { TrackOrderPage } from './pages/TrackOrderPage'; 
import { ProductDetailPage } from './pages/ProductDetailPage';
import { AddAndCheckoutPage } from './pages/AddAndCheckoutPage';
import { LoginPage } from './pages/LoginPage';
import { Product, CartItem, NewProductData, Order, OrderStatus, OrderStatusUpdate, LikedProductsContextType, ProductReview, ProductQuestion, ProductAnswer, QnAContextType as IQnAContextType, ProductContextType as IProductContextType, ShippingMethod, Database, Json } from './types';
import { ToastContainer, toast } from 'react-toastify';
import { ScrollToTop } from './components/ScrollToTop';
import { PageLayout } from './components/PageLayout';
import { I18nProvider, useI18n } from './hooks/useI18n';
import { supabase } from './supabaseClient';
import { LoadingSpinner } from './components/LoadingSpinner';


// Theme Context
interface ThemeContextType {
  theme: 'light' | 'dark';
  toggleTheme: () => void;
}
export const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// Product Context
export const ProductContext = createContext<IProductContextType | undefined>(undefined);

// Wishlist Context
interface WishlistContextType {
  wishlist: string[];
  toggleWishlistItem: (productId: string) => void;
  isProductWished: (productId: string) => boolean;
}
export const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

// Cart Context
interface CartContextType {
  cart: CartItem[];
  addToCart: (product: Product, quantity?: number) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  getCartSubtotal: () => number;
}
export const CartContext = createContext<CartContextType | undefined>(undefined);

// Order Context
export interface OrderContextType {
  orders: Order[];
  isLoading: boolean;
  addOrder: (
    customerName: string, 
    items: CartItem[], 
    totalPrice: number,
    billingAddress: string,
    wilaya: string,
    phoneNumber: string,
    phoneNumberSecondary: string | undefined,
    commune: string,
    shippingMethod: ShippingMethod,
    shippingCost: number,
  ) => Promise<Order | null>;
  updateOrderStatus: (orderId: string, status: OrderStatus, adminNotes?: string) => Promise<void>; 
  getOrderById: (orderId: string) => Order | undefined;
}
export const OrderContext = createContext<OrderContextType | undefined>(undefined);

// Liked Products Context
export const LikedProductsContext = createContext<LikedProductsContextType | undefined>(undefined);

// Auth Context
interface AuthContextType {
  session: Session | null;
  isLoading: boolean;
  isAdminAuthenticated: boolean;
  loginAdmin: (password: string) => Promise<boolean>;
  logoutAdmin: () => Promise<void>;
}
export const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Q&A Context
export const QnAContext = createContext<IQnAContextType | undefined>(undefined);

// Review Context
export interface ReviewContextType {
  reviews: ProductReview[];
  isLoading: boolean;
  addReview: (productId: string, reviewerName: string, rating: number, comment: string, reviewerAvatar?: string) => Promise<ProductReview | null>;
  deleteReview: (reviewId: string) => Promise<void>;
}
export const ReviewContext = createContext<ReviewContextType | undefined>(undefined);


const AppContent: React.FC = () => {
    const { dir } = useI18n();

    return (
        <div className="flex flex-col min-h-screen bg-gumball-light-bg dark:bg-gumball-dark-deep transition-colors duration-300">
            <Navbar />
            <Routes>
                <Route path="/" element={<PageLayout><HomePage /></PageLayout>} />
                <Route path="/product/:productId" element={<PageLayout><ProductDetailPage /></PageLayout>} />
                <Route path="/cart" element={<PageLayout><CartCheckoutPage /></PageLayout>} />
                <Route path="/track-order/" element={<PageLayout><TrackOrderPage /></PageLayout>} />
                <Route path="/track-order/:orderId" element={<PageLayout><TrackOrderPage /></PageLayout>} />
                <Route path="/add-and-checkout" element={<PageLayout><AddAndCheckoutPage /></PageLayout>} />
                <Route 
                    path="/admin" 
                    element={
                        <AuthConsumer>
                            {({ isAdminAuthenticated, isLoading }) => {
                                if (isLoading) {
                                    return <div className="flex justify-center items-center h-screen"><LoadingSpinner /></div>;
                                }
                                return isAdminAuthenticated ? (
                                    <PageLayout useContainer={false}><AdminPanelPage /></PageLayout>
                                ) : (
                                    <Navigate to="/login" replace />
                                );
                            }}
                        </AuthConsumer>
                    } 
                />
                <Route path="/login" element={<PageLayout useContainer={false}><LoginPage /></PageLayout>} />
                <Route path="*" element={<PageLayout><HomePage /></PageLayout>} />
            </Routes>
            <Footer />
            <ToastContainer
                position={dir === 'rtl' ? "top-left" : "top-right"}
                autoClose={3500}
                hideProgressBar={false}
                newestOnTop
                closeOnClick
                rtl={dir === 'rtl'}
                pauseOnFocusLoss
                draggable
                draggablePercent={30}
                pauseOnHover
                theme="colored"
            />
        </div>
    );
};

const AuthConsumer: React.FC<{ children: (auth: AuthContextType) => React.ReactNode }> = ({ children }) => {
    const authContext = useContext(AuthContext);
    if (!authContext) {
        return <div className="flex justify-center items-center h-screen"><LoadingSpinner /></div>;
    }
    return <>{children(authContext)}</>;
};

const mapProductFromDb = (dbProduct: any): Product => ({
    id: dbProduct.id,
    createdAt: dbProduct.created_at,
    name: dbProduct.name,
    description: dbProduct.description,
    price: dbProduct.price,
    originalPrice: dbProduct.original_price,
    imageUrl: dbProduct.image_url,
    additionalImageUrls: dbProduct.additional_image_urls,
    category: dbProduct.category,
    stock: dbProduct.stock,
    keywords: dbProduct.keywords,
    likes: dbProduct.likes,
    averageRating: dbProduct.average_rating,
    reviewCount: dbProduct.review_count,
    // Calculate discountPercentage on the fly
    discountPercentage: dbProduct.original_price && dbProduct.price < dbProduct.original_price ? ((dbProduct.original_price - dbProduct.price) / dbProduct.original_price) * 100 : undefined,
});

const App: React.FC = () => {
  // --- Traffic Source Tracking ---
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const refSource = params.get('ref');
    if (refSource && !sessionStorage.getItem('trafficSource')) {
      sessionStorage.setItem('trafficSource', refSource);
    }
    const sourceToLog = sessionStorage.getItem('trafficSource') || 'direct';
    console.log(`Visit from source: ${sourceToLog}`);
  }, []);

  // --- Theme State ---
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const savedTheme = localStorage.getItem('louayStoreTheme') as 'light' | 'dark';
    if (savedTheme) return savedTheme;
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    localStorage.setItem('louayStoreTheme', theme);
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setTheme(prevTheme => (prevTheme === 'light' ? 'dark' : 'light'));
  }, []);
  
  const themeContextValue: ThemeContextType = useMemo(() => ({
    theme,
    toggleTheme,
  }), [theme, toggleTheme]);

  // --- Auth State ---
  const [session, setSession] = useState<Session | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  useEffect(() => {
      supabase.auth.getSession().then(({ data: { session } }) => {
          setSession(session);
          setIsAuthLoading(false);
      });

      const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
          setSession(session);
      });

      return () => subscription.unsubscribe();
  }, []);

  const loginAdmin = useCallback(async (password: string): Promise<boolean> => {
      const { error } = await supabase.auth.signInWithPassword({
          email: 'admin@louay.store', // Use a fixed admin email
          password,
      });
      if (error) {
          toast.error(error.message);
          return false;
      }
      return true;
  }, []);

  const logoutAdmin = useCallback(async () => {
      await supabase.auth.signOut();
  }, []);
  
  const authContextValue: AuthContextType = useMemo(() => ({
      session,
      isLoading: isAuthLoading,
      isAdminAuthenticated: !!session,
      loginAdmin,
      logoutAdmin,
  }), [session, isAuthLoading, loginAdmin, logoutAdmin]);

  // --- Products State ---
  const [products, setProducts] = useState<Product[]>([]);
  const [isProductsLoading, setIsProductsLoading] = useState(true);

  useEffect(() => {
      const fetchProducts = async () => {
          setIsProductsLoading(true);
          const { data, error } = await supabase.from('products').select('*').order('created_at', { ascending: false });
          if (error) {
              toast.error('Failed to load products.');
          } else {
              setProducts(data.map(mapProductFromDb));
          }
          setIsProductsLoading(false);
      };
      fetchProducts();
  }, []);
  
  const addProduct = useCallback(async (newProductData: NewProductData): Promise<Product | null> => {
    const dbProductData: Database['public']['Tables']['products']['Insert'] = {
        name: newProductData.name,
        description: newProductData.description,
        price: newProductData.price,
        original_price: newProductData.originalPrice,
        image_url: newProductData.imageUrl,
        additional_image_urls: newProductData.additionalImageUrls,
        category: newProductData.category,
        stock: newProductData.stock,
        keywords: newProductData.keywords,
    };
    const { data, error } = await supabase.from('products').insert([dbProductData]).select();
    if (error) {
      toast.error(`Error adding product: ${error.message}`);
      return null;
    }
    const newProduct = mapProductFromDb(data[0]);
    setProducts(prev => [newProduct, ...prev]);
    return newProduct;
  }, []);

  const updateProduct = useCallback(async (updatedProduct: Product) => {
    const { id, createdAt, discountPercentage, ...rest } = updatedProduct;
    const updateData: Database['public']['Tables']['products']['Update'] = {
        name: rest.name,
        description: rest.description,
        price: rest.price,
        original_price: rest.originalPrice,
        image_url: rest.imageUrl,
        additional_image_urls: rest.additionalImageUrls,
        category: rest.category,
        stock: rest.stock,
        keywords: rest.keywords,
        likes: rest.likes,
        average_rating: rest.averageRating,
        review_count: rest.reviewCount,
    };
    const { error } = await supabase.from('products').update(updateData).eq('id', id);
    if (error) {
      toast.error(`Error updating product: ${error.message}`);
    } else {
      setProducts(prev => prev.map(p => p.id === id ? updatedProduct : p));
    }
  }, []);
  
  const deleteProduct = useCallback(async (productId: string) => {
    const { error } = await supabase.from('products').delete().eq('id', productId);
    if (error) {
      toast.error(`Error deleting product: ${error.message}`);
    } else {
      setProducts(prev => prev.filter(p => p.id !== productId));
    }
  }, []);

  const incrementProductLike = useCallback(async (productId: string) => {
    const { error } = await supabase.rpc('increment_likes', { product_id_in: productId });
    if (error) {
        toast.error("Failed to update like on server.");
    } else {
        setProducts(prev => prev.map(p => p.id === productId ? { ...p, likes: p.likes + 1 } : p));
    }
  }, []);
  
  const decrementProductLike = useCallback(async (productId: string) => {
    const product = products.find(p => p.id === productId);
    if(product && product.likes > 0) {
        const { error } = await supabase.rpc('decrement_likes', { product_id_in: productId });
        if (error) {
            toast.error("Failed to update like on server.");
        } else {
            setProducts(prev => prev.map(p => p.id === productId ? { ...p, likes: Math.max(0, p.likes - 1) } : p));
        }
    }
  }, [products]);
  
  const getProductById = useCallback((productId: string) => products.find(p => p.id === productId), [products]);

  const productContextValue: IProductContextType = useMemo(() => ({
    products,
    isLoading: isProductsLoading,
    addProduct,
    updateProduct,
    deleteProduct,
    incrementProductLike,
    decrementProductLike,
    getProductById,
  }), [products, isProductsLoading, addProduct, updateProduct, deleteProduct, incrementProductLike, decrementProductLike, getProductById]);

  // --- Cart, Wishlist, LikedProducts (Local State) ---
  const [wishlist, setWishlist] = useState<string[]>(() => JSON.parse(localStorage.getItem('louayStoreWishlist') || '[]'));
  useEffect(() => { localStorage.setItem('louayStoreWishlist', JSON.stringify(wishlist)); }, [wishlist]);
  const toggleWishlistItem = useCallback((productId: string) => setWishlist(p => p.includes(productId) ? p.filter(id => id !== productId) : [...p, productId]), []);
  const isProductWished = useCallback((productId: string) => wishlist.includes(productId), [wishlist]);
  const wishlistContextValue: WishlistContextType = useMemo(() => ({ wishlist, toggleWishlistItem, isProductWished }), [wishlist, toggleWishlistItem, isProductWished]);
  
  const [likedProductIds, setLikedProductIds] = useState<string[]>(() => JSON.parse(localStorage.getItem('louayStoreLikedProducts') || '[]'));
  useEffect(() => { localStorage.setItem('louayStoreLikedProducts', JSON.stringify(likedProductIds)); }, [likedProductIds]);
  const toggleProductLikeState = useCallback((productId: string): 'liked' | 'unliked' => {
      let status: 'liked' | 'unliked' = 'unliked';
      setLikedProductIds(prev => {
          if (prev.includes(productId)) { status = 'unliked'; return prev.filter(id => id !== productId); }
          else { status = 'liked'; return [...prev, productId]; }
      });
      return status;
  }, []);
  const isProductLikedByUser = useCallback((productId: string) => likedProductIds.includes(productId), [likedProductIds]);
  const likedProductsContextValue: LikedProductsContextType = useMemo(() => ({ likedProductIds, toggleProductLikeState, isProductLikedByUser }), [likedProductIds, toggleProductLikeState, isProductLikedByUser]);

  const [cart, setCart] = useState<CartItem[]>(() => JSON.parse(localStorage.getItem('louayStoreCart') || '[]'));
  useEffect(() => { localStorage.setItem('louayStoreCart', JSON.stringify(cart)); }, [cart]);
  const addToCart = useCallback((productToAdd: Product, quantity: number = 1) => {
      setCart(prev => {
          const existing = prev.find(item => item.id === productToAdd.id);
          if (existing) return prev.map(item => item.id === productToAdd.id ? { ...item, quantity: Math.min(item.quantity + quantity, productToAdd.stock) } : item);
          return [...prev, { ...productToAdd, quantity: Math.min(quantity, productToAdd.stock) }];
      });
  }, []);
  const removeFromCart = useCallback((productId: string) => setCart(prev => prev.filter(item => item.id !== productId)), []);
  const updateQuantity = useCallback((productId: string, quantity: number) => {
      setCart(prev => prev.map(item => {
          if (item.id === productId) {
              const stock = products.find(p => p.id === productId)?.stock ?? Infinity;
              return { ...item, quantity: Math.max(0, Math.min(quantity, stock)) };
          }
          return item;
      }).filter(item => item.quantity > 0));
  }, [products]);
  const clearCart = useCallback(() => setCart([]), []);
  const getCartSubtotal = useCallback(() => cart.reduce((total, item) => total + item.price * item.quantity, 0), [cart]);
  const cartContextValue: CartContextType = useMemo(() => ({ cart, addToCart, removeFromCart, updateQuantity, clearCart, getCartSubtotal }), [cart, addToCart, removeFromCart, updateQuantity, clearCart, getCartSubtotal]);

  // --- Orders State ---
  const [orders, setOrders] = useState<Order[]>([]);
  const [isOrdersLoading, setIsOrdersLoading] = useState(true);
  useEffect(() => {
      const fetchOrders = async () => {
          setIsOrdersLoading(true);
          const { data, error } = await supabase.from('orders').select('*').order('created_at', { ascending: false });
          if (error) { toast.error('Failed to load orders.'); } 
          else { setOrders(data.map(o => ({...o, createdAt: o.created_at} as Order))); }
          setIsOrdersLoading(false);
      };
      fetchOrders();
  }, []);
  const addOrder = useCallback(async (customerName: string, items: CartItem[], totalPrice: number, billingAddress: string, wilaya: string, phoneNumber: string, phoneNumberSecondary: string | undefined, commune: string, shippingMethod: ShippingMethod, shippingCost: number): Promise<Order | null> => {
      const initialStatus: OrderStatus = "Pending Approval";
      const newOrderData: Database['public']['Tables']['orders']['Insert'] = {
          customer_name: customerName, items: items, total_price: totalPrice, billing_address: billingAddress,
          wilaya, phone_number: phoneNumber, phone_number_secondary: phoneNumberSecondary, commune,
          shipping_method: shippingMethod, shipping_cost: shippingCost, status: initialStatus,
          status_history: [{ status: initialStatus, timestamp: new Date().toISOString(), notes: "Order created." }]
      };
      const { data, error } = await supabase.from('orders').insert([newOrderData]).select();
      if (error) { toast.error(`Order placement failed: ${error.message}`); return null; }
      const newOrder = { ...data[0], createdAt: data[0].created_at } as Order;
      setOrders(prev => [newOrder, ...prev]);
      clearCart();
      return newOrder;
  }, [clearCart]);
  const updateOrderStatus = useCallback(async (orderId: string, status: OrderStatus, adminNotes?: string) => {
      const orderToUpdate = orders.find(o => o.id === orderId);
      if (!orderToUpdate) return;
      const newStatusUpdate: OrderStatusUpdate = { status, timestamp: new Date().toISOString(), notes: adminNotes || `Status changed to ${status} by Admin.`};
      const newHistory = [...(Array.isArray(orderToUpdate.statusHistory) ? orderToUpdate.statusHistory : []), newStatusUpdate];
      const updateData: Database['public']['Tables']['orders']['Update'] = { status, status_history: newHistory };
      const { error } = await supabase.from('orders').update(updateData).eq('id', orderId);
      if (error) { toast.error(`Failed to update order status: ${error.message}`); } 
      else { setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status, statusHistory: newHistory } : o)); }
  }, [orders]);
  const getOrderById = useCallback((orderId: string) => orders.find(o => o.id === orderId), [orders]);
  const orderContextValue: OrderContextType = useMemo(() => ({ orders, isLoading: isOrdersLoading, addOrder, updateOrderStatus, getOrderById }), [orders, isOrdersLoading, addOrder, updateOrderStatus, getOrderById]);
  
  // --- Q&A State ---
  const [questions, setQuestions] = useState<ProductQuestion[]>([]);
  const [isQnALoading, setIsQnALoading] = useState(true);
  useEffect(() => {
    const fetchQnA = async () => {
        setIsQnALoading(true);
        const { data, error } = await supabase.from('questions').select('*, answers(*)').order('created_at', { ascending: false });
        if (error) { toast.error("Failed to load Q&A."); }
        else {
            const mappedData = data.map(q => ({
                ...q,
                productId: q.product_id,
                userName: q.user_name,
                questionText: q.question_text,
                createdAt: q.created_at,
                answers: q.answers.map((a: any) => ({...a, questionId: a.question_id, responderName: a.responder_name, answerText: a.answer_text, createdAt: a.created_at}))
            }));
            setQuestions(mappedData);
        }
        setIsQnALoading(false);
    }
    fetchQnA();
  }, []);
  const addQuestion = useCallback(async (productId: string, userName: string, questionText: string): Promise<ProductQuestion | null> => {
      const insertData: Database['public']['Tables']['questions']['Insert'] = { product_id: productId, user_name: userName, question_text: questionText };
      const { data, error } = await supabase.from('questions').insert([insertData]).select('*, answers(*)');
      if (error) { toast.error(`Failed to add question: ${error.message}`); return null; }
      const newQ = { ...data[0], productId: data[0].product_id, userName: data[0].user_name, questionText: data[0].question_text, createdAt: data[0].created_at, answers: [] };
      setQuestions(prev => [newQ, ...prev]);
      return newQ;
  }, []);
  const addAnswerToQuestion = useCallback(async (questionId: string, responderName: string, answerText: string) => {
      const insertData: Database['public']['Tables']['answers']['Insert'] = { question_id: questionId, responder_name: responderName, answer_text: answerText };
      const { data: newAnswer, error } = await supabase.from('answers').insert([insertData]).select();
      if (error) { toast.error(`Failed to add answer: ${error.message}`); }
      else {
          setQuestions(prev => prev.map(q => q.id === questionId ? { ...q, answers: [...q.answers, {...newAnswer[0], questionId: newAnswer[0].question_id, responderName: newAnswer[0].responder_name, answerText: newAnswer[0].answer_text, createdAt: newAnswer[0].created_at}] } : q));
      }
  }, []);
  const deleteQuestion = useCallback(async (questionId: string) => {
      const { error } = await supabase.from('questions').delete().eq('id', questionId);
      if (error) { toast.error(`Failed to delete question: ${error.message}`); }
      else { setQuestions(prev => prev.filter(q => q.id !== questionId)); }
  }, []);
  const updateAnswerText = useCallback(async (questionId: string, answerId: string, newAnswerText: string) => {
      const updateData: Database['public']['Tables']['answers']['Update'] = { answer_text: newAnswerText, created_at: new Date().toISOString() };
      const { error } = await supabase.from('answers').update(updateData).eq('id', answerId);
      if(error) { toast.error(`Failed to update answer: ${error.message}`); }
      else {
          setQuestions(prev => prev.map(q => q.id === questionId ? { ...q, answers: q.answers.map(a => a.id === answerId ? {...a, answerText: newAnswerText, createdAt: new Date().toISOString()} : a) } : q));
      }
  }, []);
  const qnaContextValue: IQnAContextType = useMemo(() => ({ questions, isLoading: isQnALoading, addQuestion, addAnswerToQuestion, deleteQuestion, updateAnswerText }), [questions, isQnALoading, addQuestion, addAnswerToQuestion, deleteQuestion, updateAnswerText]);

  // --- Review State ---
  const [reviews, setReviews] = useState<ProductReview[]>([]);
  const [isReviewsLoading, setIsReviewsLoading] = useState(true);
  useEffect(() => {
      const fetchReviews = async () => {
          setIsReviewsLoading(true);
          const { data, error } = await supabase.from('reviews').select('*').order('created_at', { ascending: false });
          if(error) { toast.error("Failed to load reviews."); }
          else { setReviews(data.map(r => ({...r, productId: r.product_id, reviewerName: r.reviewer_name, reviewerAvatar: r.reviewer_avatar, createdAt: r.created_at} as ProductReview))); }
          setIsReviewsLoading(false);
      }
      fetchReviews();
  }, []);
  const addReview = useCallback(async (productId: string, reviewerName: string, rating: number, comment: string, reviewerAvatar: string | undefined): Promise<ProductReview | null> => {
      const insertData: Database['public']['Tables']['reviews']['Insert'] = { product_id: productId, reviewer_name: reviewerName, rating, comment, reviewer_avatar: reviewerAvatar || `https://picsum.photos/seed/${reviewerName.replace(/\s/g, '')}/40/40` };
      const { data, error } = await supabase.from('reviews').insert([insertData]).select();
      if(error) { toast.error(`Failed to add review: ${error.message}`); return null; }
      const newReview = { ...data[0], productId: data[0].product_id, reviewerName: data[0].reviewer_name, reviewerAvatar: data[0].reviewer_avatar, createdAt: data[0].created_at } as ProductReview;
      setReviews(prev => [newReview, ...prev]);
      // The DB trigger will update product rating, so we just need to re-fetch product data or update it locally if needed
      return newReview;
  }, []);
  const deleteReview = useCallback(async (reviewId: string) => {
      const { error } = await supabase.from('reviews').delete().eq('id', reviewId);
      if (error) { toast.error(`Failed to delete review: ${error.message}`); }
      else { setReviews(prev => prev.filter(r => r.id !== reviewId)); }
  }, []);
  const reviewContextValue: ReviewContextType = useMemo(() => ({ reviews, isLoading: isReviewsLoading, addReview, deleteReview }), [reviews, isReviewsLoading, addReview, deleteReview]);

  return (
    <I18nProvider>
        <ThemeContext.Provider value={themeContextValue}>
          <ProductContext.Provider value={productContextValue}>
            <WishlistContext.Provider value={wishlistContextValue}>
              <LikedProductsContext.Provider value={likedProductsContextValue}>
                <CartContext.Provider value={cartContextValue}>
                  <OrderContext.Provider value={orderContextValue}>
                    <AuthContext.Provider value={authContextValue}>
                        <QnAContext.Provider value={qnaContextValue}>
                            <ReviewContext.Provider value={reviewContextValue}>
                                <HashRouter>
                                <ScrollToTop />
                                <AppContent />
                                </HashRouter>
                            </ReviewContext.Provider>
                        </QnAContext.Provider>
                    </AuthContext.Provider>
                  </OrderContext.Provider>
                </CartContext.Provider>
              </LikedProductsContext.Provider>
            </WishlistContext.Provider>
          </ProductContext.Provider>
        </ThemeContext.Provider>
    </I18nProvider>
  );
};

export default App;