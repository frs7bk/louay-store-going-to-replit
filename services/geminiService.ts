






import { GoogleGenerativeAI } from "@google/genai";
import { SalesReportData } from '../types';

// Ensure API_KEY is handled as per prompt. For local dev, you might use a .env file,
// but for the purpose of this exercise, we rely on process.env.API_KEY being set.
const API_KEY = process.env.API_KEY;

let ai: GoogleGenerativeAI | null = null;

if (API_KEY) {
  ai = new GoogleGenerativeAI(API_KEY);
} else {
  console.warn(
    "Gemini API Key not found. AI features will be limited or unavailable. Ensure process.env.API_KEY is set."
  );
}

const TEXT_MODEL_NAME = "gemini-2.5-flash";
const IMAGE_MODEL_NAME = "imagen-3.0-generate-002";

export const generateProductDescription = async (
  productName: string,
  keywords: string[]
): Promise<string> => {
  if (!ai) {
    return "AI service is not initialized. Please check API Key configuration.";
  }
  try {
    const prompt = `Generate a concise and informative product description for a product named "${productName}". 
    The description should be 2-3 sentences and highlight its key features or benefits. 
    Incorporate these keywords if relevant: ${keywords.join(", ")}.`;

    const model = ai.getGenerativeModel({ model: TEXT_MODEL_NAME });
    const response = await model.generateContent(prompt);
    
    return response.response.text();
  } catch (error) {
    console.error("Error generating product description with Gemini:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return `Failed to generate AI description for ${productName}. Error: ${errorMessage}`;
  }
};

export const searchRecentEvents = async (query: string): Promise<{ text: string; sources?: any[] }> => {
  if (!ai) {
    return { text: "AI service is not initialized for search.", sources: [] };
  }
  try {
    const model = ai.getGenerativeModel({ model: TEXT_MODEL_NAME });
    const response = await model.generateContent(query);
    
    return { text: response.response.text(), sources: [] };

  } catch (error) {
    console.error("Error searching with Gemini and Google Search:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return { text: `Failed to search: ${errorMessage}`, sources: [] };
  }
};


export const generateAnalyticsInsights = async (
  analyticsData: SalesReportData
): Promise<string> => {
  if (!ai) {
    return "AI service is not initialized. Please check API Key configuration.";
  }
  try {
    const trafficSourceSummary = Object.entries(analyticsData.trafficSources)
      .map(([source, count]) => `- ${source}: ${count} visits`)
      .join('\n');

    const dataSummary = `
      - Total Revenue: ${analyticsData.totalRevenue.toFixed(2)}
      - Total Orders: ${analyticsData.totalOrders}
      - Average Order Value: ${analyticsData.averageOrderValue.toFixed(2)}
      - Conversion Rate: ${analyticsData.conversionRate.toFixed(1)}%
      - Top Selling Products (by units): ${analyticsData.topSellingProducts.map(p => `${p.productName} (${p.unitsSold} units)`).join(', ')}
      - Traffic Sources:\n${trafficSourceSummary}
    `;

    const prompt = `You are an expert e-commerce consultant. Analyze the following sales and traffic data for a small online gadget store and provide actionable insights. Be concise, insightful, and focus on practical advice. The store owner wants to know what's working, what's not, and what to do next.

    Here is the data summary:
    ${dataSummary}

    Based on this, provide a brief analysis covering:
    1.  **Strengths:** What does the data suggest the store is doing well?
    2.  **Weaknesses/Opportunities:** What are the key areas for improvement? (e.g., if AOV is low, suggest bundling. If a traffic channel is underperforming, suggest a new strategy).
    3.  **Marketing & Channel Performance:** Comment on the traffic sources. Which channels are most effective? Where should marketing efforts be focused?
    4.  **Actionable Recommendations:** Provide 3-4 specific, actionable steps the owner should take next.
    
    Format the output clearly with markdown headings.`;

    const model = ai.getGenerativeModel({ model: TEXT_MODEL_NAME });
    const response = await model.generateContent(prompt);
    
    return response.response.text();
  } catch (error) {
    console.error("Error generating analytics insights with Gemini:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return `Failed to generate AI analysis. Error: ${errorMessage}`;
  }
};


export const generateDreamGadgetImage = async (prompt: string): Promise<string> => {
  if (!ai) {
    throw new Error("AI service is not initialized. Please check API Key configuration.");
  }
  try {
    // Note: Image generation is not available in the standard @google/genai package
    // This would require a different service or API
    throw new Error("Image generation is not available with the current Gemini API setup.");
    
  } catch (error) {
    console.error("Error generating dream gadget image with Gemini:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to generate image. Error: ${errorMessage}`);
  }
};