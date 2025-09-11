import React, { useState } from 'react'
import { Toaster } from 'react-hot-toast'
import { ProductCard } from './components/ProductCard'
import { ReviewForm } from './components/ReviewForm'
import { QuestionForm } from './components/QuestionForm'
import { AdminDashboard } from './components/AdminDashboard'
import { useRealtimeProducts, useRealtimeReviews, useRealtimeQuestions } from './hooks/useRealtime'
import { Search, Settings, Heart, Star, MessageCircle } from 'lucide-react'

function App() {
  const [currentView, setCurrentView] = useState<'products' | 'admin'>('products')
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  
  const { products, loading: productsLoading } = useRealtimeProducts()
  const { reviews } = useRealtimeReviews(selectedProductId || undefined)
  const { questions } = useRealtimeQuestions(selectedProductId || undefined)

  const handleAdminLogin = () => {
    const password = prompt('أدخل كلمة مرور الإدارة:')
    if (password === 'admin123') {
      setIsAdmin(true)
      setCurrentView('admin')
    } else {
      alert('كلمة مرور خاطئة')
    }
  }

  if (productsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
      <Toaster position="top-center" />
      
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4 rtl:space-x-reverse">
              <h1 className="text-2xl font-bold text-gray-900">متجر التقنية</h1>
              <div className="flex space-x-2 rtl:space-x-reverse">
                <button
                  onClick={() => setCurrentView('products')}
                  className={`px-4 py-2 rounded-md transition-colors ${
                    currentView === 'products'
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  المنتجات
                </button>
                {isAdmin && (
                  <button
                    onClick={() => setCurrentView('admin')}
                    className={`px-4 py-2 rounded-md transition-colors ${
                      currentView === 'admin'
                        ? 'bg-blue-600 text-white'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    لوحة التحكم
                  </button>
                )}
              </div>
            </div>
            
            <div className="flex items-center space-x-4 rtl:space-x-reverse">
              <div className="relative">
                <Search className="absolute right-3 rtl:left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="البحث في المنتجات..."
                  className="pl-10 rtl:pr-10 pr-4 rtl:pl-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              {!isAdmin && (
                <button
                  onClick={handleAdminLogin}
                  className="p-2 text-gray-600 hover:text-gray-900 transition-colors"
                  title="دخول الإدارة"
                >
                  <Settings className="w-5 h-5" />
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        {currentView === 'admin' ? (
          <AdminDashboard />
        ) : (
          <>
            {/* Products Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-12">
              {products.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onLike={(productId, newCount) => {
                    // Real-time update will handle this automatically
                    console.log(`Product ${productId} now has ${newCount} likes`)
                  }}
                />
              ))}
            </div>

            {/* Product Details Modal/Section */}
            {selectedProductId && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                  <div className="p-6">
                    <div className="flex justify-between items-center mb-6">
                      <h2 className="text-2xl font-bold">تفاصيل المنتج</h2>
                      <button
                        onClick={() => setSelectedProductId(null)}
                        className="text-gray-500 hover:text-gray-700"
                      >
                        ✕
                      </button>
                    </div>

                    {/* Reviews Section */}
                    <div className="mb-8">
                      <h3 className="text-xl font-semibold mb-4 flex items-center">
                        <Star className="w-5 h-5 ml-2 rtl:mr-2" />
                        التقييمات ({reviews.length})
                      </h3>
                      
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div className="space-y-4">
                          {reviews.map((review) => (
                            <div key={review.id} className="bg-gray-50 p-4 rounded-lg">
                              <div className="flex items-center space-x-2 rtl:space-x-reverse mb-2">
                                <span className="font-medium">{review.user_name}</span>
                                <div className="flex">
                                  {[...Array(5)].map((_, i) => (
                                    <Star
                                      key={i}
                                      className={`w-4 h-4 ${
                                        i < review.rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
                                      }`}
                                    />
                                  ))}
                                </div>
                              </div>
                              <p className="text-gray-700">{review.comment}</p>
                              {review.admin_response && (
                                <div className="mt-2 p-2 bg-blue-50 rounded">
                                  <p className="text-sm text-blue-800">
                                    <strong>رد الإدارة:</strong> {review.admin_response}
                                  </p>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                        
                        <ReviewForm
                          productId={selectedProductId}
                          onReviewSubmitted={() => {
                            // Real-time updates will handle this
                          }}
                        />
                      </div>
                    </div>

                    {/* Questions Section */}
                    <div>
                      <h3 className="text-xl font-semibold mb-4 flex items-center">
                        <MessageCircle className="w-5 h-5 ml-2 rtl:mr-2" />
                        الأسئلة والأجوبة ({questions.length})
                      </h3>
                      
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div className="space-y-4">
                          {questions.map((question) => (
                            <div key={question.id} className="bg-gray-50 p-4 rounded-lg">
                              <div className="flex items-center space-x-2 rtl:space-x-reverse mb-2">
                                <span className="font-medium">{question.user_name}</span>
                                <span className={`px-2 py-1 text-xs rounded-full ${
                                  question.is_answered 
                                    ? 'bg-green-100 text-green-800' 
                                    : 'bg-yellow-100 text-yellow-800'
                                }`}>
                                  {question.is_answered ? 'تم الرد' : 'في الانتظار'}
                                </span>
                              </div>
                              <p className="text-gray-700 mb-2">{question.question}</p>
                              {question.answer && (
                                <div className="mt-2 p-2 bg-green-50 rounded">
                                  <p className="text-sm text-green-800">
                                    <strong>الإجابة:</strong> {question.answer}
                                  </p>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                        
                        <QuestionForm
                          productId={selectedProductId}
                          onQuestionSubmitted={() => {
                            // Real-time updates will handle this
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  )
}

export default App