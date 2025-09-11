import React, { useState } from 'react'
import { supabase } from '../lib/supabase'
import toast from 'react-hot-toast'

interface QuestionFormProps {
  productId: string
  onQuestionSubmitted?: () => void
}

export const QuestionForm: React.FC<QuestionFormProps> = ({ 
  productId, 
  onQuestionSubmitted 
}) => {
  const [question, setQuestion] = useState('')
  const [userName, setUserName] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!userName.trim() || !question.trim()) {
      toast.error('يرجى ملء جميع الحقول المطلوبة')
      return
    }

    setIsSubmitting(true)

    try {
      const { error } = await supabase
        .from('questions')
        .insert({
          product_id: productId,
          user_name: userName.trim(),
          question: question.trim(),
          is_answered: false
        })

      if (error) throw error

      toast.success('تم إرسال سؤالك بنجاح! سيتم الرد عليه قريباً')
      
      // Reset form
      setQuestion('')
      setUserName('')
      onQuestionSubmitted?.()

    } catch (error) {
      console.error('Error submitting question:', error)
      toast.error('حدث خطأ أثناء إرسال السؤال')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="bg-gray-50 p-6 rounded-lg">
      <h3 className="text-lg font-semibold mb-4">اطرح سؤالاً</h3>
      
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
          سؤالك
        </label>
        <textarea
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          rows={4}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="اكتب سؤالك هنا..."
          required
        />
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className={`w-full py-2 px-4 rounded-md text-white font-medium ${
          isSubmitting
            ? 'bg-gray-400 cursor-not-allowed'
            : 'bg-green-600 hover:bg-green-700'
        } transition-colors duration-200`}
      >
        {isSubmitting ? 'جاري الإرسال...' : 'إرسال السؤال'}
      </button>
    </form>
  )
}