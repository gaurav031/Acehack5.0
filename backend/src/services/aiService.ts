import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

class AISafetyService {
    /**
     * @dev Analyze incident reports to categorize risk and suggest actions.
     */
    async analyzeIncident(description: string, imageUrl?: string) {
        try {
            const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

            const prompt = `
        You are an AI Safety Assistant for a Tourist Safety System.
        Analyze the following incident report: "${description}".
        
        Provide a JSON response with:
        1. riskScore (0-100)
        2. category (Medical, Theft, Violence, Natural Disaster, Other)
        3. immediateAction (Short advice for the tourist)
        4. priority (Low, Medium, High, Critical)
        
        Return ONLY the JSON.
      `;

            const result = await model.generateContent(prompt);
            const response = await result.response;
            let text = response.text();

            // Basic JSON extraction from markdown if necessary
            text = text.replace(/```json|```/g, '').trim();

            return JSON.parse(text);
        } catch (error) {
            console.error('AI Analysis Error:', error);
            return {
                riskScore: 50,
                category: 'Other',
                immediateAction: 'Stay calm and find a safe public place.',
                priority: 'Medium'
            };
        }
    }

    /**
     * @dev Safety Chatbot to answer tourist queries.
     */
    async getSafetyAdvice(query: string, context?: string) {
        try {
            const model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro' });

            const prompt = `
        You are "Aegis", a helpful tourist safety AI. 
        Context of user: ${context || 'Unknown location'}.
        User Question: ${query}
        
        Rules:
        - Be concise and professional.
        - Prioritize safety instructions.
        - If the situation sounds like an emergency, tell them to press the SOS button immediately.
      `;

            const result = await model.generateContent(prompt);
            return result.response.text();
        } catch (error) {
            console.error('AI Chatbot Error:', error);
            return "I'm having trouble connecting to my safety database. If you are in immediate danger, please use the SOS button.";
        }
    }
}

export default new AISafetyService();
