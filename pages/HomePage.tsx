

import React, { useState, useEffect, useContext, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ProductCard } from '../components/ProductCard';
import { Product, ProductQuestion } from '../types';
import { Button } from '../components/Button';
import { CartContext, ProductContext, WishlistContext, LikedProductsContext, QnAContext } from '../App';
// import { getFunFact } from '../services/geminiService'; // Removed getFunFact import
import { LoadingSpinner } from '../components/LoadingSpinner';
import { toast } from 'react-toastify';
import { useI18n } from '../hooks/useI18n';


const GeneralQnASection: React.FC = () => {
  const qnaCtx = useContext(QnAContext);
  const [newQuestionText, setNewQuestionText] = useState('');
  const { t } = useI18n();
  
  if (!qnaCtx) return <p>Loading Q&A...</p>;

  const handleAskQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newQuestionText.trim() === '') {
        toast.warn(t('typeQuestionFirst'));
        return;
    }
    await qnaCtx.addQuestion('general', "Valued Customer", newQuestionText);
    toast.info(t('questionSubmittedInfo'));
    setNewQuestionText('');
  };

  if (qnaCtx.isLoading) {
    return <div className="py-16 flex justify-center"><LoadingSpinner message="Loading Q&A..." /></div>;
  }
  
  const generalQuestions = qnaCtx.questions.filter(q => q.productId === 'general')
                                .sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                                .slice(0,3);

  return (
    <section className="py-16 bg-gumball-blue/5 dark:bg-gumball-blue/10 rounded-xl shadow-inner mt-16">
      <div className="container mx-auto px-4">
        <h2 className="text-4xl font-display text-gumball-purple dark:text-gumball-purple/90 mb-10 text-center">
          {t('haveQuestions')}
        </h2>
        <div className="max-w-3xl mx-auto space-y-8">
          {generalQuestions.length > 0 ? generalQuestions.map(qa => (
            <div key={qa.id} className="bg-white dark:bg-gumball-dark-card p-5 rounded-lg shadow-lg border-s-4 border-gumball-green dark:border-gumball-green/70">
              <div className="mb-3">
                <p className="font-semibold text-gumball-dark dark:text-gumball-light-bg"><span className="text-gumball-purple dark:text-gumball-purple/80">Q:</span> {qa.questionText}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Asked by: {qa.userName} on {new Date(qa.createdAt).toLocaleDateString()}</p>
              </div>
              {qa.answers.length > 0 ? qa.answers.map(ans => (
                <div key={ans.id} className="ms-4 ps-4 border-s-2 border-gray-200 dark:border-gray-700 py-2 bg-gumball-light-bg/50 dark:bg-gumball-dark/50 rounded-e-md">
                  <p className="text-gray-700 dark:text-gray-300"><span className="font-semibold text-gumball-green dark:text-gumball-green/80">A:</span> {ans.answerText}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Answered by: {ans.responderName} on {new Date(ans.createdAt).toLocaleDateString()}</p>
                </div>
              )) : (
                 <p className="ms-4 text-sm text-gray-500 dark:text-gray-400 italic">{t('generalQuestionAnswered')}</p>
              )}
            </div>
          )) : (
            <p className="text-center text-gray-600 dark:text-gray-400">{t('noGeneralQuestions')}</p>
          )}
          
          <form onSubmit={handleAskQuestion} className="mt-10 bg-gumball-light-bg dark:bg-gumball-dark p-6 rounded-lg shadow-xl">
            <h3 className="text-2xl font-techno text-gumball-yellow dark:text-gumball-yellow/80 mb-4">{t('askYourQuestion')}</h3>
            <textarea 
              value={newQuestionText}
              onChange={(e) => setNewQuestionText(e.target.value)}
              placeholder={t('askGeneralQuestion')}
              rows={4}
              className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-md mb-4 bg-white text-gumball-dark placeholder-gray-500 dark:bg-gumball-dark-card dark:text-gumball-light-bg dark:placeholder-gray-400"
              aria-label="Your general question text"
              required
            />
            <Button type="submit" variant="primary" size="lg">{t('submitQuestion')}</Button>
          </form>
        </div>
      </div>
    </section>
  );
};


export const HomePage: React.FC = () => {
  const productCtx = useContext(ProductContext);
  const cartCtx = useContext(CartContext);
  const wishlistCtx = useContext(WishlistContext);
  const likedProductsCtx = useContext(LikedProductsContext); 
  const navigate = useNavigate();
  const { t, getLocalized, language } = useI18n();

  const [searchTerm, setSearchTerm] = useState<string>('');
  const [showWishlist, setShowWishlist] = useState<boolean>(false);
  
  const [selectedCategory, setSelectedCategory] = useState<string>(t('allCategories'));
  const [sortOption, setSortOption] = useState<string>('default');
  
  const allCategoriesKey = t('allCategories');
  useEffect(() => {
    setSelectedCategory(allCategoriesKey);
  }, [allCategoriesKey]);


  const categories = useMemo(() => {
    if (!productCtx) return [t('allCategories')];
    const uniqueCategories = Array.from(
        new Set(productCtx.products.map(p => getLocalized(p.category) as string))
    );
    return [t('allCategories'), ...uniqueCategories.sort()];
  }, [productCtx, getLocalized, t]);

  const sortOptionsList = [
    { value: 'default', label: t('defaultSorting') },
    { value: 'price_asc', label: t('priceAsc') },
    { value: 'price_desc', label: t('priceDesc') },
    { value: 'name_asc', label: t('nameAsc') },
    { value: 'name_desc', label: t('nameDesc') },
    { value: 'likes_desc', label: t('mostLiked') },
    { value: 'rating_desc', label: t('highestRated')},
  ];

  const productsToDisplay = useMemo(() => {
    if (!productCtx) return [];
    let currentProducts = [...productCtx.products]; 

    if (showWishlist && wishlistCtx) {
      currentProducts = currentProducts.filter(p => wishlistCtx.isProductWished(p.id));
    }

    if (selectedCategory !== t('allCategories')) {
      currentProducts = currentProducts.filter(p => getLocalized(p.category) === selectedCategory);
    }

    if (searchTerm.trim() !== '') {
      const lowerSearchTerm = searchTerm.toLowerCase();
      currentProducts = currentProducts.filter(product =>
        (getLocalized(product.name) as string).toLowerCase().includes(lowerSearchTerm)
      );
    }

    switch (sortOption) {
      case 'price_asc':
        currentProducts.sort((a, b) => a.price - b.price);
        break;
      case 'price_desc':
        currentProducts.sort((a, b) => b.price - a.price);
        break;
      case 'name_asc':
        currentProducts.sort((a, b) => (getLocalized(a.name) as string).localeCompare(getLocalized(b.name) as string, language));
        break;
      case 'name_desc':
        currentProducts.sort((a, b) => (getLocalized(b.name) as string).localeCompare(getLocalized(a.name) as string, language));
        break;
      case 'likes_desc':
        currentProducts.sort((a,b) => b.likes - a.likes);
        break;
      case 'rating_desc':
        currentProducts.sort((a,b) => (b.averageRating ?? 0) - (a.averageRating ?? 0));
        break;
      default:
        // Default sorting is by created_at from the backend
        break;
    }
    return currentProducts;
  }, [productCtx, searchTerm, showWishlist, wishlistCtx, selectedCategory, sortOption, t, getLocalized, language]);


  if (!productCtx || !cartCtx || !wishlistCtx || !likedProductsCtx) { 
    return <LoadingSpinner message="Loading application..." />;
  }
  
  const handleHeroCTAClick = () => {
    const productSection = document.getElementById('product-grid-section');
    if (productSection) {
      productSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className="animate-fadeIn">
      <section className="text-center py-24 md:py-32 bg-gradient-to-br from-gumball-pink via-gumball-purple to-gumball-blue rounded-xl shadow-2xl mb-12 relative overflow-hidden">
        <div className="relative z-10 max-w-4xl mx-auto px-4">
          <h1 className="text-6xl sm:text-7xl md:text-8xl font-display text-white drop-shadow-2xl mb-6 leading-tight">
            {t('innovativeTech')}
          </h1>
          <p className="text-xl sm:text-2xl md:text-3xl font-techno text-white/95 mb-12">
            {t('cuttingEdgeGadgets')}
          </p>
          <Button
            onClick={handleHeroCTAClick}
            variant="secondary" 
            size="lg"
            className="font-display text-2xl md:text-3xl px-10 py-5 !rounded-full shadow-lg transform hover:scale-110 active:scale-95 hover:shadow-gumball-yellow/40 dark:hover:shadow-gumball-yellow/30"
          >
            {t('shopGadgets')}
          </Button>
        </div>
      </section>
      
      <section id="product-grid-section" className="mb-8 px-2 mt-16">
        <div className="flex flex-col sm:flex-row gap-4 items-center flex-wrap mb-8">
            <input
            type="text"
            placeholder={t('searchProducts')}
            className="w-full sm:flex-1 p-3.5 rounded-lg border-2 border-gumball-purple focus:ring-gumball-pink focus:border-gumball-pink shadow-md text-lg font-techno bg-white text-gumball-dark dark:bg-gumball-dark-card dark:border-gumball-purple/70 dark:text-gumball-light-bg dark:placeholder-gray-400"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            aria-label={t('searchProducts')}
            />
            <div className="w-full sm:w-auto">
                <label htmlFor="category-filter" className="sr-only">{t('filterByCategory')}</label>
                <select
                    id="category-filter"
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="w-full p-3.5 rounded-lg border-2 border-gumball-purple focus:ring-gumball-pink focus:border-gumball-pink shadow-md text-lg font-techno bg-white dark:bg-gumball-dark-card dark:border-gumball-purple/70 dark:text-gumball-light-bg"
                    aria-label={t('filterByCategory')}
                >
                    {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                </select>
            </div>
            <div className="w-full sm:w-auto">
                <label htmlFor="sort-options" className="sr-only">{t('sortProducts')}</label>
                <select
                    id="sort-options"
                    value={sortOption}
                    onChange={(e) => setSortOption(e.target.value)}
                    className="w-full p-3.5 rounded-lg border-2 border-gumball-purple focus:ring-gumball-pink focus:border-gumball-pink shadow-md text-lg font-techno bg-white dark:bg-gumball-dark-card dark:border-gumball-purple/70 dark:text-gumball-light-bg"
                    aria-label={t('sortProducts')}
                >
                    {sortOptionsList.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                </select>
            </div>
            <Button 
            onClick={() => setShowWishlist(!showWishlist)}
            variant={showWishlist ? "secondary" : "primary"}
            className="w-full sm:w-auto font-techno py-3 px-5 text-lg"
            aria-pressed={showWishlist}
            >
            {showWishlist ? t('showAll') : t('showWishlist', { count: wishlistCtx.wishlist.length })}
            </Button>
        </div>

        {productCtx.isLoading ? (
             <LoadingSpinner message="Loading products..." />
        ) : productsToDisplay.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {productsToDisplay.map((product) => (
                <ProductCard key={product.id} product={product} /> 
            ))}
            </div>
        ) : (
            <div className="text-center text-2xl font-display text-gumball-purple dark:text-gumball-purple/80 py-10 min-h-[200px] flex flex-col justify-center items-center">
                <img src="https://picsum.photos/seed/noresults/200/150?grayscale" alt="No results" className="rounded-lg shadow-md mb-4 opacity-70 dark:opacity-50"/>
            {showWishlist && wishlistCtx.wishlist.length === 0 
                ? t('wishlistEmpty')
                : searchTerm || selectedCategory !== t('allCategories')
                ? t('noProductsMatch')
                : t('noProductsAvailable')
            }
            </div>
        )}
      </section>

      <GeneralQnASection />

    </div>
  );
};