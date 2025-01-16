// app/api/ai/query/route.ts
import { NextResponse } from "next/server";
import { Client, Databases, Storage } from 'node-appwrite';
import { GoogleGenerativeAI } from "@google/generative-ai";

// Initialize Appwrite client
const client = new Client()
    .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || '')
    .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT || '')

const databases = new Databases(client);
const storage = new Storage(client);

// Initialize Gemini API
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY || '');
const model = genAI.getGenerativeModel({ model: "gemini-pro" });

async function getFileContent(bucketFileId: string) {
    try {
        // Get file content from Appwrite Storage
        const fileContent = await storage.getFileView(
            process.env.NEXT_PUBLIC_APPWRITE_BUCKET || '',
            bucketFileId
        );

        // Convert the file content to text
        const text = new TextDecoder().decode(fileContent);
        return text;
    } catch (error) {
        console.error('Error getting file content:', error);
        throw new Error('Failed to get file content');
    }
}

async function queryGemini(content: string, query: string) {
    try {
        // Create a chat instance
        const chat = model.startChat({
            history: [
                {
                    role: "user",
                    parts: [{text: `Here is the content I want you to analyze: ${content}`}]
                },
                {
                    role: "model",
                    parts: [{text: "I understand. I'll help you analyze this content. What would you like to know?"}]
                },
            ],
            generationConfig: {
                maxOutputTokens: 1000,
                temperature: 0.7,
            },
        });

        // Send the query and get response
        const result = await chat.sendMessage([{text: query}]);
        const response = await result.response;
        
        return response.text();
    } catch (error) {
        console.error('Error querying Gemini:', error);
        throw new Error('Failed to get AI response');
    }
}

export async function POST(request: Request) {
    try {
        const { fileId, query } = await request.json();

        if (!fileId || !query) {
            return NextResponse.json(
                { error: 'Missing required parameters' },
                { status: 400 }
            );
        }

        // Get the file details from Appwrite Database
        const file = await databases.getDocument(
            process.env.NEXT_PUBLIC_APPWRITE_DATABASE || '',
            process.env.NEXT_PUBLIC_APPWRITE_FILES_COLLECTION || '',
            fileId
        );

        // Get the file content
        const fileContent = await getFileContent(file.bucketFileId);
        // Limit the content length to avoid too many tokens error
        const MAX_CONTENT_LENGTH = 5000; // Adjust the limit as needed
        const limitedContent = fileContent.length > MAX_CONTENT_LENGTH 
            ? fileContent.substring(0, MAX_CONTENT_LENGTH) 
            : fileContent;

        // Query Gemini with the content and user's question
        const aiResponse = await queryGemini(limitedContent, query);

        return NextResponse.json({ response: aiResponse });

    } catch (error) {
        console.error('API Error:', error);
        return NextResponse.json(
            { error: 'Failed to process request' },
            { status: 500 }
        );
    }
}