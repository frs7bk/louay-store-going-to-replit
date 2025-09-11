import { useEffect, useState } from 'react'
import { supabase, subscribeToTable } from '../lib/supabase'
import { Product, Review, Question } from '../types/database'

export const useRealtimeProducts = () => {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Initial fetch
    const fetchProducts = async () => {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching products:', error)
      } else {
        setProducts(data || [])
      }
      setLoading(false)
    }

    fetchProducts()

    // Real-time subscription
    const channel = subscribeToTable('products', (payload) => {
      const { eventType, new: newRecord, old: oldRecord } = payload

      setProducts(current => {
        switch (eventType) {
          case 'INSERT':
            if (newRecord.is_active) {
              return [newRecord, ...current]
            }
            return current
          case 'UPDATE':
            return current.map(product => 
              product.id === newRecord.id ? newRecord : product
            )
          case 'DELETE':
            return current.filter(product => product.id !== oldRecord.id)
          default:
            return current
        }
      })
    })

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  return { products, loading, setProducts }
}

export const useRealtimeReviews = (productId?: string) => {
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchReviews = async () => {
      let query = supabase
        .from('reviews')
        .select('*')
        .eq('is_approved', true)
        .order('created_at', { ascending: false })

      if (productId) {
        query = query.eq('product_id', productId)
      }

      const { data, error } = await query

      if (error) {
        console.error('Error fetching reviews:', error)
      } else {
        setReviews(data || [])
      }
      setLoading(false)
    }

    fetchReviews()

    // Real-time subscription
    const filter = productId ? `product_id=eq.${productId}` : undefined
    const channel = subscribeToTable('reviews', (payload) => {
      const { eventType, new: newRecord, old: oldRecord } = payload

      setReviews(current => {
        switch (eventType) {
          case 'INSERT':
            if (newRecord.is_approved && (!productId || newRecord.product_id === productId)) {
              return [newRecord, ...current]
            }
            return current
          case 'UPDATE':
            return current.map(review => 
              review.id === newRecord.id ? newRecord : review
            )
          case 'DELETE':
            return current.filter(review => review.id !== oldRecord.id)
          default:
            return current
        }
      })
    }, filter)

    return () => {
      supabase.removeChannel(channel)
    }
  }, [productId])

  return { reviews, loading, setReviews }
}

export const useRealtimeQuestions = (productId?: string) => {
  const [questions, setQuestions] = useState<Question[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchQuestions = async () => {
      let query = supabase
        .from('questions')
        .select('*')
        .order('created_at', { ascending: false })

      if (productId) {
        query = query.eq('product_id', productId)
      }

      const { data, error } = await query

      if (error) {
        console.error('Error fetching questions:', error)
      } else {
        setQuestions(data || [])
      }
      setLoading(false)
    }

    fetchQuestions()

    // Real-time subscription
    const filter = productId ? `product_id=eq.${productId}` : undefined
    const channel = subscribeToTable('questions', (payload) => {
      const { eventType, new: newRecord, old: oldRecord } = payload

      setQuestions(current => {
        switch (eventType) {
          case 'INSERT':
            if (!productId || newRecord.product_id === productId) {
              return [newRecord, ...current]
            }
            return current
          case 'UPDATE':
            return current.map(question => 
              question.id === newRecord.id ? newRecord : question
            )
          case 'DELETE':
            return current.filter(question => question.id !== oldRecord.id)
          default:
            return current
        }
      })
    }, filter)

    return () => {
      supabase.removeChannel(channel)
    }
  }, [productId])

  return { questions, loading, setQuestions }
}