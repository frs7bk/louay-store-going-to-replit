import React, { useState, useEffect } from 'react'
import { 
  Plus, 
  Edit, 
  Trash2, 
  MessageSquare, 
  Star, 
  Heart,
  Users,
  TrendingUp,
  Eye
} from 'lucide-react'
import { supabase } from '../lib/supabase'
import { generateProductDescription } from '../lib/gemini'
import { Product, Review, Question } from '../types/database'
import toast from 'react-hot-toast'

export const AdminDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState('overview')
  const [products, setProducts] = useState<Product[]>([])
  const [reviews, setReviews] = useState<Review[]>([])
  const [questions, setQuestions] = useState<Question[]>([])
  const [loading, setLoading] = useState(true)

  // Stats
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalReviews: 0,
    totalQuestions: 0,
    totalLikes: 0,
    averageRating: 0
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    
    try {
      // Fetch products
      const { data: productsData } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false })

      // Fetch reviews
      const { data: reviewsData } = await supabase
        .from('reviews')
        .select('*')
        .order('created_at', { ascending: false })

      // Fetch questions
      const { data: questionsData } = await supabase
        .from('questions')
        .select('*')
        .order('created_at', { ascending: false })

      // Fetch likes count
      const { count: likesCount } = await supabase
        .from('likes')
        .select('*', { count: 'exact', head: true })

      setProducts(productsData || [])
      setReviews(reviewsData || [])
      setQuestions(questionsData || [])

      // Calculate stats
      const totalReviews = reviewsData?.length || 0
      const averageRating = totalReviews > 0 
        ? reviewsData!.reduce((sum, r) => sum + r.rating, 0) / totalReviews 
        : 0

      setStats({
        totalProducts: productsData?.length || 0,
        totalReviews,
        totalQuestions: questionsData?.length || 0,
        totalLikes: likesCount || 0,
        averageRating
      })

    } catch (error) {
      console.error('Error fetching data:', error)
      toast.error('حدث خطأ في تحميل البيانات')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteProduct = async (productId: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا المنتج؟')) return

    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', productId)

      if (error) throw error

      toast.success('تم حذف المنتج بنجاح')
      fetchData()
    } catch (error) {
      console.error('Error deleting product:', error)
      toast.error('حدث خطأ في حذف المنتج')
    }
  }

  const handleAnswerQuestion = async (questionId: string, answer: string) => {
    try {
      const { error } = await supabase
        .from('questions')
        .update({
          answer,
          is_answered: true,
          answered_at: new Date().toISOString()
        })
        .eq('id', questionId)

      if (error) throw error

      toast.success('تم الرد على السؤال بنجاح')
      fetchData()
    } catch (error) {
      console.error('Error answering question:', error)
      toast.error('حدث خطأ في الرد على السؤال')
    }
  }

  const handleApproveReview = async (reviewId: string, approved: boolean) => {
    try {
      const { error } = await supabase
        .from('reviews')
        .update({ is_approved: approved })
        .eq('id', reviewId)

      if (error) throw error

      toast.success(approved ? 'تم قبول التقييم' : 'تم رفض التقييم')
      fetchData()
    } catch (error) {
      console.error('Error updating review:', error)
      toast.error('حدث خطأ في تحديث التقييم')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">لوحة التحكم الإدارية</h1>

      {/* Navigation Tabs */}
      <div className="border-b border-gray-200 mb-8">
        <nav className="-mb-px flex space-x-8 rtl:space-x-reverse">
          {[
            { id: 'overview', name: 'نظرة عامة', icon: TrendingUp },
            { id: 'products', name: 'المنتجات', icon: Plus },
            { id: 'reviews', name: 'التقييمات', icon: Star },
            { id: 'questions', name: 'الأسئلة', icon: MessageSquare }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center space-x-2 rtl:space-x-reverse py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <tab.icon className="w-5 h-5" />
              <span>{tab.name}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Plus className="w-6 h-6 text-blue-600" />
              </div>
              <div className="mr-4 rtl:ml-4">
                <p className="text-sm font-medium text-gray-600">إجمالي المنتجات</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.totalProducts}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Star className="w-6 h-6 text-yellow-600" />
              </div>
              <div className="mr-4 rtl:ml-4">
                <p className="text-sm font-medium text-gray-600">إجمالي التقييمات</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.totalReviews}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <MessageSquare className="w-6 h-6 text-green-600" />
              </div>
              <div className="mr-4 rtl:ml-4">
                <p className="text-sm font-medium text-gray-600">إجمالي الأسئلة</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.totalQuestions}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex items-center">
              <div className="p-2 bg-red-100 rounded-lg">
                <Heart className="w-6 h-6 text-red-600" />
              </div>
              <div className="mr-4 rtl:ml-4">
                <p className="text-sm font-medium text-gray-600">إجمالي الإعجابات</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.totalLikes}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Products Tab */}
      {activeTab === 'products' && (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">إدارة المنتجات</h2>
              <button className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors">
                إضافة منتج جديد
              </button>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    المنتج
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    السعر
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    الإعجابات
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    التقييم
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    الإجراءات
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {products.map((product) => (
                  <tr key={product.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <img
                          className="h-10 w-10 rounded-lg object-cover"
                          src={product.image_url}
                          alt={product.name}
                        />
                        <div className="mr-4 rtl:ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {product.name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {product.category}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      ${product.price}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {product.likes_count}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {product.average_rating.toFixed(1)} ({product.reviews_count})
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2 rtl:space-x-reverse">
                        <button className="text-blue-600 hover:text-blue-900">
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteProduct(product.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Reviews Tab */}
      {activeTab === 'reviews' && (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">إدارة التقييمات</h2>
          </div>
          
          <div className="divide-y divide-gray-200">
            {reviews.map((review) => (
              <div key={review.id} className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 rtl:space-x-reverse mb-2">
                      <span className="font-medium text-gray-900">{review.user_name}</span>
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
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        review.is_approved 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {review.is_approved ? 'مقبول' : 'في الانتظار'}
                      </span>
                    </div>
                    <p className="text-gray-700 mb-2">{review.comment}</p>
                    {review.admin_response && (
                      <div className="bg-blue-50 p-3 rounded-lg">
                        <p className="text-sm text-blue-800">
                          <strong>رد الإدارة:</strong> {review.admin_response}
                        </p>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex space-x-2 rtl:space-x-reverse">
                    {!review.is_approved && (
                      <button
                        onClick={() => handleApproveReview(review.id, true)}
                        className="text-green-600 hover:text-green-900"
                      >
                        قبول
                      </button>
                    )}
                    <button
                      onClick={() => handleApproveReview(review.id, false)}
                      className="text-red-600 hover:text-red-900"
                    >
                      رفض
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Questions Tab */}
      {activeTab === 'questions' && (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">إدارة الأسئلة</h2>
          </div>
          
          <div className="divide-y divide-gray-200">
            {questions.map((question) => (
              <div key={question.id} className="p-6">
                <div className="mb-4">
                  <div className="flex items-center space-x-2 rtl:space-x-reverse mb-2">
                    <span className="font-medium text-gray-900">{question.user_name}</span>
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
                    <div className="bg-green-50 p-3 rounded-lg">
                      <p className="text-sm text-green-800">
                        <strong>الإجابة:</strong> {question.answer}
                      </p>
                    </div>
                  )}
                </div>
                
                {!question.is_answered && (
                  <div className="mt-4">
                    <textarea
                      placeholder="اكتب إجابتك هنا..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      rows={3}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && e.ctrlKey) {
                          const answer = (e.target as HTMLTextAreaElement).value
                          if (answer.trim()) {
                            handleAnswerQuestion(question.id, answer.trim())
                          }
                        }
                      }}
                    />
                    <button
                      onClick={(e) => {
                        const textarea = e.currentTarget.previousElementSibling as HTMLTextAreaElement
                        const answer = textarea.value
                        if (answer.trim()) {
                          handleAnswerQuestion(question.id, answer.trim())
                        }
                      }}
                      className="mt-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
                    >
                      إرسال الإجابة
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}