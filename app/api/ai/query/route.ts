import { NextResponse } from "next/server";
import { Client, Databases, Storage } from 'node-appwrite';
import { GoogleGenerativeAI } from "@google/generative-ai";

const client = new Client()
    .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || '')
    .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT || '');

const databases = new Databases(client);
const storage = new Storage(client);


const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY || '');


interface FileMetadata {
    $id: string;
    $collectionId: string;
    $databaseId: string;
    $createdAt: string;
    $updatedAt: string;
    $permissions: string[];
    bucketFileId: string;
    type: string;
    name: string;
    mimeType: string;
}

function getMimeType(fileName: string): string {
    const extension = fileName.split('.').pop()?.toLowerCase();
    const mimeTypes: { [key: string]: string } = {
        'jpg': 'image/jpeg',
        'jpeg': 'image/jpeg',
        'png': 'image/png',
        'gif': 'image/gif',
        'webp': 'image/webp'
    };
    return mimeTypes[extension || ''] || 'image/jpeg';
}

async function getFileContent(bucketFileId: string, fileType: string) {
    try {
        const fileContent = await storage.getFileView(
            process.env.NEXT_PUBLIC_APPWRITE_BUCKET || '',
            bucketFileId
        );

        if (fileType === 'image') {
            return fileContent;
        } else {
            return new TextDecoder().decode(fileContent);
        }
    } catch (error) {
        console.error('Error getting file content:', error);
        throw new Error('Failed to get file content');
    }
}


async function queryGemini(
    content: string | Uint8Array,
    query: string,
    fileType: string,
    fileName: string
) {
    try {
        if (fileType === 'image') {
            const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
            
            const prompt = query;
            const imageParts = [
                {
                    inlineData: {
                        data: Buffer.from(content as Uint8Array).toString('base64'),
                        mimeType: getMimeType(fileName)
                    }
                }
            ];

            const result = await model.generateContent([prompt, ...imageParts]);
            const response = await result.response;
            return response.text();
        } else {
            const model = genAI.getGenerativeModel({ model: "gemini-pro" });
            const chat = model.startChat({
                history: [
                    {
                        role: "user",
                        parts: [{ text: `Here is the content I want you to analyze: ${content}` }]
                    },
                    {
                        role: "model",
                        parts: [{ text: "I understand. I'll help you analyze this content. What would you like to know?" }]
                    },
                ],
                generationConfig: {
                    maxOutputTokens: 1000,
                    temperature: 0.7,
                },
            });

            const result = await chat.sendMessage([{ text: query }]);
            const response = await result.response;
            return response.text();
        }
    } catch (error) {
        console.error('Error querying Gemini:', error);
        throw new Error(`Failed to get AI response: ${error instanceof Error ? error.message : 'Unknown error'}`);
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


        const file = await databases.getDocument<FileMetadata>(
            process.env.NEXT_PUBLIC_APPWRITE_DATABASE || '',
            process.env.NEXT_PUBLIC_APPWRITE_FILES_COLLECTION || '',
            fileId
        );

        const fileContent = await getFileContent(file.bucketFileId, file.type);

        let contentToAnalyze: string | Uint8Array;
        if (file.type === 'image') {
            if (!(fileContent instanceof ArrayBuffer)) {
                throw new Error('Invalid image data received');
            }
            contentToAnalyze = new Uint8Array(fileContent);
        } else {
            const MAX_CONTENT_LENGTH = 5000;
            const textContent = fileContent as string;
            contentToAnalyze = textContent.length > MAX_CONTENT_LENGTH 
                ? textContent.substring(0, MAX_CONTENT_LENGTH) 
                : textContent;
        }

        const aiResponse = await queryGemini(
            contentToAnalyze,
            query,
            file.type,
            file.name
        );

        return NextResponse.json({ response: aiResponse });

    } catch (error) {
        console.error('API Error:', error);
        return NextResponse.json(
            { 
                error: 'Failed to process request',
                details: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        );
    }
}