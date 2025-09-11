import React, { useState } from 'react'
import { Heart, Star, MessageCircle } from 'lucide-react'
import { Product } from '../types/database'
import { supabase } from '../lib/supabase'
import toast from 'react-hot-toast'

interface ProductCardProps {
  product: Product
  onLike?: (productId: string, newCount: number) => void
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, onLike }) => {
  const [isLiking, setIsLiking] = useState(false)
  const [hasLiked, setHasLiked] = useState(false)

  const handleLike = async () => {
    if (isLiking) return

    setIsLiking(true)
    
    try {
      // Get user identifier (IP or session)
      const userIdentifier = localStorage.getItem('user_id') || 
        Math.random().toString(36).substring(7)
      
      if (!localStorage.getItem('user_id')) {
        localStorage.setItem('user_id', userIdentifier)
      }

      // Check if already liked
      const { data: existingLike } = await supabase
        .from('likes')
        .select('id')
        .eq('product_id', product.id)
        .eq('user_id', userIdentifier)
        .single()

      if (existingLike) {
        // Unlike
        await supabase
          .from('likes')
          .delete()
          .eq('product_id', product.id)
          .eq('user_id', userIdentifier)

        // Update product likes count
        const { error } = await supabase
          .from('products')
          .update({ likes_count: Math.max(0, product.likes_count - 1) })
          .eq('id', product.id)

        if (!error) {
          setHasLiked(false)
          onLike?.(product.id, Math.max(0, product.likes_count - 1))
          toast.success('تم إلغاء الإعجاب')
        }
      } else {
        // Like
        await supabase
          .from('likes')
          .insert({
            product_id: product.id,
            user_id: userIdentifier,
            user_ip: 'unknown'
          })

        // Update product likes count
        const { error } = await supabase
          .from('products')
          .update({ likes_count: product.likes_count + 1 })
          .eq('id', product.id)

        if (!error) {
          setHasLiked(true)
          onLike?.(product.id, product.likes_count + 1)
          toast.success('تم الإعجاب بالمنتج!')
        }
      }
    } catch (error) {
      console.error('Error handling like:', error)
      toast.error('حدث خطأ، يرجى المحاولة مرة أخرى')
    } finally {
      setIsLiking(false)
    }
  }

  // Check if user has liked this product
  React.useEffect(() => {
    const checkLikeStatus = async () => {
      const userIdentifier = localStorage.getItem('user_id')
      if (!userIdentifier) return

      const { data } = await supabase
        .from('likes')
        .select('id')
        .eq('product_id', product.id)
        .eq('user_id', userIdentifier)
        .single()

      setHasLiked(!!data)
    }

    checkLikeStatus()
  }, [product.id])

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300">
      <div className="relative">
        <img
          src={product.image_url}
          alt={product.name}
          className="w-full h-48 object-cover"
        />
        <button
          onClick={handleLike}
          disabled={isLiking}
          className={`absolute top-2 right-2 p-2 rounded-full transition-colors duration-200 ${
            hasLiked
              ? 'bg-red-500 text-white'
              : 'bg-white text-gray-600 hover:bg-red-50 hover:text-red-500'
          } ${isLiking ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <Heart className={`w-5 h-5 ${hasLiked ? 'fill-current' : ''}`} />
        </button>
      </div>

      <div className="p-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
          {product.name}
        </h3>
        
        <p className="text-gray-600 text-sm mb-3 line-clamp-2">
          {product.description}
        </p>

        <div className="flex items-center justify-between mb-3">
          <span className="text-2xl font-bold text-blue-600">
            ${product.price}
          </span>
          
          <div className="flex items-center space-x-4 rtl:space-x-reverse">
            <div className="flex items-center space-x-1 rtl:space-x-reverse">
              <Heart className="w-4 h-4 text-red-500" />
              <span className="text-sm text-gray-600">{product.likes_count}</span>
            </div>
            
            <div className="flex items-center space-x-1 rtl:space-x-reverse">
              <Star className="w-4 h-4 text-yellow-500" />
              <span className="text-sm text-gray-600">
                {product.average_rating.toFixed(1)}
              </span>
            </div>
            
            <div className="flex items-center space-x-1 rtl:space-x-reverse">
              <MessageCircle className="w-4 h-4 text-green-500" />
              <span className="text-sm text-gray-600">{product.reviews_count}</span>
            </div>
          </div>
        </div>

        <button className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors duration-200">
          عرض التفاصيل
        </button>
      </div>
    </div>
  )
}