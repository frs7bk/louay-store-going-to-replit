

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      products: {
        Row: { 
          id: string
          created_at: string
          name: any
          description: any
          price: number
          original_price: number | null
          image_url: string
          additional_image_urls: any | null
          category: any
          stock: number
          keywords: any | null
          likes: number
          average_rating: number | null
          review_count: number | null
        }
        Insert: { 
          id?: string
          created_at?: string
          name: any
          description: any
          price: number
          original_price?: number | null
          image_url: string
          additional_image_urls?: any | null
          category: any
          stock?: number
          keywords?: any | null
          likes?: number
          average_rating?: number | null
          review_count?: number | null
        }
        Update: { 
          id?: string
          created_at?: string
          name?: any
          description?: any
          price?: number
          original_price?: number | null
          image_url?: string
          additional_image_urls?: any | null
          category?: any
          stock?: number
          keywords?: any | null
          likes?: number
          average_rating?: number | null
          review_count?: number | null
        }
      }
      reviews: {
        Row: {
          id: string
          created_at: string
          product_id: string
          reviewer_name: string
          reviewer_avatar: string | null
          rating: number
          comment: string
        }
        Insert: {
          id?: string
          created_at?: string
          product_id: string
          reviewer_name: string
          reviewer_avatar?: string | null
          rating: number
          comment: string
        }
        Update: {
          id?: string
          created_at?: string
          product_id?: string
          reviewer_name?: string
          reviewer_avatar?: string | null
          rating?: number
          comment?: string
        }
      }
      questions: {
        Row: {
          id: string
          created_at: string
          product_id: string
          user_name: string
          question_text: string
        }
        Insert: {
          id?: string
          created_at?: string
          product_id: string
          user_name: string
          question_text: string
        }
        Update: {
          id?: string
          created_at?: string
          product_id?: string
          user_name?: string
          question_text?: string
        }
      }
      answers: {
        Row: {
          id: string
          created_at: string
          question_id: string
          responder_name: string
          answer_text: string
        }
        Insert: {
          id?: string
          created_at?: string
          question_id: string
          responder_name: string
          answer_text: string
        }
        Update: {
          id?: string
          created_at?: string
          question_id?: string
          responder_name?: string
          answer_text?: string
        }
      }
      orders: {
        Row: {
          id: string
          created_at: string
          customer_name: string
          items: any
          total_price: number
          status: string 
          status_history: any | null
          billing_address: string
          wilaya: string
          commune: string
          phone_number: string
          phone_number_secondary: string | null
          shipping_method: string
          shipping_cost: number
        }
        Insert: {
          id?: string
          created_at?: string
          customer_name: string
          items: any
          total_price: number
          status?: string
          status_history?: any | null
          billing_address: string
          wilaya: string
          commune: string
          phone_number: string
          phone_number_secondary?: string | null
          shipping_method: string
          shipping_cost: number
        }
        Update: {
          id?: string
          created_at?: string
          customer_name?: string
          items?: any
          total_price?: number
          status?: string
          status_history?: any | null
          billing_address?: string
          wilaya?: string
          commune?: string
          phone_number?: string
          phone_number_secondary?: string | null
          shipping_method?: string
          shipping_cost?: number
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      order_status: | "Pending Approval" | "Processing" | "Preparing for Shipment" | "Shipped" | "Delivered" | "Cancelled" | "Returned"
      shipping_method: | "Domicile" | "Stopdesk"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

export type Language = 'en' | 'ar';

export type MultilingualString = {
  en: string;
  ar: string;
};

export interface Product {
  id: string;
  createdAt: string;
  name: MultilingualString;
  description: MultilingualString;
  price: number;
  originalPrice?: number;
  discountPercentage?: number;
  imageUrl: string;
  additionalImageUrls?: string[]; 
  category: MultilingualString;
  stock: number;
  keywords: {
    en: string[];
    ar: string[];
  };
  likes: number;
  averageRating?: number; 
  reviewCount?: number;   
}

export type NewProductData = Omit<Product, 'id' | 'likes' | 'createdAt'> & { 
  id?: string; 
  likes?: number; 
  additionalImageUrls?: string[]; 
  averageRating?: number; 
  reviewCount?: number;
  originalPrice?: number; 
  discountPercentage?: number;
};

export interface CartItem extends Product {
  quantity: number;
}

export interface AdminSection {
  id:string;
  name: string;
  icon?: React.ReactNode;
}

export interface GroundingChunkWeb {
  uri: string;
  title: string;
}

export interface GroundingChunk {
  web?: GroundingChunkWeb;
}

export interface GroundingMetadata {
  groundingChunks?: GroundingChunk[];
}

export interface Candidate {
  groundingMetadata?: GroundingMetadata;
}

export type OrderStatus = 
  | "Pending Approval" 
  | "Processing" 
  | "Preparing for Shipment" 
  | "Shipped" 
  | "Delivered"
  | "Cancelled"
  | "Returned";

export interface OrderStatusUpdate {
  status: OrderStatus;
  timestamp: string;
  notes?: string;
}

export type ShippingMethod = 'Domicile' | 'Stopdesk';

export interface Order {
  id: string;
  customerName: string;
  items: CartItem[];
  totalPrice: number;
  createdAt: string;
  status: OrderStatus;
  statusHistory: OrderStatusUpdate[];
  billingAddress: string;
  wilaya: string;
  phoneNumber: string;
  phoneNumberSecondary?: string;
  commune: string;
  shippingMethod: ShippingMethod;
  shippingCost: number;
}

export interface LikedProductsContextType {
  likedProductIds: string[];
  toggleProductLikeState: (productId: string) => 'liked' | 'unliked';
  isProductLikedByUser: (productId: string) => boolean;
}

export interface ProductReview {
  id: string;
  productId: string;
  reviewerName: string;
  reviewerAvatar?: string;
  rating: number;
  comment: string;
  createdAt: string;
}

export interface ProductQuestion {
  id: string;
  productId: string;
  userName: string;
  questionText: string;
  createdAt: string;
  answers: ProductAnswer[];
}

export interface ProductAnswer {
  id: string;
  questionId: string;
  responderName: string;
  answerText: string;
  createdAt: string;
}

export interface QnAContextType {
  questions: ProductQuestion[];
  isLoading: boolean;
  addQuestion: (productId: string, userName: string, questionText: string) => Promise<ProductQuestion | null>;
  addAnswerToQuestion: (questionId: string, responderName: string, answerText: string) => Promise<void>;
  deleteQuestion: (questionId: string) => Promise<void>;
  updateAnswerText: (questionId: string, answerId: string, newAnswerText: string) => Promise<void>;
}

export interface ProductContextType {
  products: Product[];
  isLoading: boolean;
  addProduct: (newProductData: NewProductData) => Promise<Product | null>;
  updateProduct: (updatedProduct: Product) => Promise<void>;
  deleteProduct: (productId: string) => Promise<void>;
  incrementProductLike: (productId: string) => Promise<void>;
  decrementProductLike: (productId: string) => Promise<void>;
  getProductById: (productId: string) => Product | undefined;
}

export interface SalesReportData {
  totalRevenue: number;
  totalOrders: number;
  averageOrderValue: number;
  conversionRate: number;
  salesByDay: { [date: string]: number };
  topSellingProducts: {
    productName: string;
    productId: string;
    unitsSold: number;
    revenue: number;
  }[];
  trafficSources: { [source: string]: number };
}