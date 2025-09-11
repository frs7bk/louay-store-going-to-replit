import { GoogleGenerativeAI } from '@google/genai'

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY

let genAI: GoogleGenerativeAI | null = null

if (API_KEY) {
  genAI = new GoogleGenerativeAI(API_KEY)
} else {
  console.warn('Gemini API Key not found. AI features will be limited.')
}

export const generateContent = async (prompt: string): Promise<string> => {
  if (!genAI) {
    throw new Error('Gemini AI is not initialized. Please check your API key.')
  }

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' })
    const result = await model.generateContent(prompt)
    const response = await result.response
    return response.text()
  } catch (error) {
    console.error('Error generating content:', error)
    throw new Error('Failed to generate AI content')
  }
}

export const generateProductDescription = async (
  productName: string,
  category: string,
  features: string[]
): Promise<string> => {
  const prompt = `
    اكتب وصفاً جذاباً ومفصلاً لمنتج باللغة العربية:
    
    اسم المنتج: ${productName}
    الفئة: ${category}
    المميزات: ${features.join(', ')}
    
    يجب أن يكون الوصف:
    - جذاب ومقنع للعملاء
    - يبرز المميزات الرئيسية
    - مناسب للتسويق الإلكتروني
    - لا يتجاوز 150 كلمة
  `
  
  return generateContent(prompt)
}

export const generateReviewResponse = async (
  review: string,
  rating: number
): Promise<string> => {
  const prompt = `
    اكتب رداً مهذباً ومهنياً على هذا التقييم باللغة العربية:
    
    التقييم: ${review}
    النجوم: ${rating}/5
    
    يجب أن يكون الرد:
    - مهذب ومهني
    - يشكر العميل على وقته
    - يعالج أي مخاوف إن وجدت
    - قصير ومباشر
  `
  
  return generateContent(prompt)
}