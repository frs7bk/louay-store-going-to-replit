import React, { useState } from 'react'
import { Star } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { generateReviewResponse } from '../lib/gemini'
import toast from 'react-hot-toast'

interface ReviewFormProps {
  productId: string
  onReviewSubmitted?: () => void
}

export const ReviewForm: React.FC<ReviewFormProps> = ({ 
  productId, 
  onReviewSubmitted 
}) => {
  const [rating, setRating] = useState(5)
  const [comment, setComment] = useState('')
  const [userName, setUserName] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!userName.trim() || !comment.trim()) {
      toast.error('يرجى ملء جميع الحقول المطلوبة')
      return
    }

    setIsSubmitting(true)

    try {
      // Submit review
      const { data: review, error } = await supabase
        .from('reviews')
        .insert({
          product_id: productId,
          user_name: userName.trim(),
          rating,
          comment: comment.trim(),
          is_approved: true // Auto-approve for demo
        })
        .select()
        .single()

      if (error) throw error

      // Update product rating
      const { data: reviews } = await supabase
        .from('reviews')
        .select('rating')
        .eq('product_id', productId)
        .eq('is_approved', true)

      if (reviews) {
        const totalRating = reviews.reduce((sum, r) => sum + r.rating, 0)
        const averageRating = totalRating / reviews.length

        await supabase
          .from('products')
          .update({
            average_rating: averageRating,
            reviews_count: reviews.length
          })
          .eq('id', productId)
      }

      // Generate AI response (optional)
      try {
        const aiResponse = await generateReviewResponse(comment, rating)
        await supabase
          .from('reviews')
          .update({ admin_response: aiResponse })
          .eq('id', review.id)
      } catch (aiError) {
        console.log('AI response generation failed:', aiError)
      }

      toast.success('تم إرسال تقييمك بنجاح!')
      
      // Reset form
      setRating(5)
      setComment('')
      setUserName('')
      onReviewSubmitted?.()

    } catch (error) {
      console.error('Error submitting review:', error)
      toast.error('حدث خطأ أثناء إرسال التقييم')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="bg-gray-50 p-6 rounded-lg">
      <h3 className="text-lg font-semibold mb-4">أضف تقييمك</h3>
      
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          اسمك
        </label>
        <input
          type="text"
          value={userName}
          onChange={(e) => setUserName(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="أدخل اسمك"
          required
        />
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          التقييم
        </label>
        <div className="flex space-x-1 rtl:space-x-reverse">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => setRating(star)}
              className={`p-1 ${
                star <= rating ? 'text-yellow-500' : 'text-gray-300'
              } hover:text-yellow-500 transition-colors`}
            >
              <Star className="w-6 h-6 fill-current" />
            </button>
          ))}
        </div>
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          تعليقك
        </label>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          rows={4}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="شاركنا رأيك في المنتج..."
          required
        />
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className={`w-full py-2 px-4 rounded-md text-white font-medium ${
          isSubmitting
            ? 'bg-gray-400 cursor-not-allowed'
            : 'bg-blue-600 hover:bg-blue-700'
        } transition-colors duration-200`}
      >
        {isSubmitting ? 'جاري الإرسال...' : 'إرسال التقييم'}
      </button>
    </form>
  )
}