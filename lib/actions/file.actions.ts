"use server";

import { createAdminClient, createSessionClient } from "@/lib/appwrite";
import { InputFile } from "node-appwrite/file";
import { appwriteConfig } from "@/lib/appwrite/config";
import { ID, Models, Query } from "node-appwrite";
import { constructFileUrl, getFileType, parseStringify } from "@/lib/utils";
import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/actions/user.actions";
import { v2 as cloudinary } from 'cloudinary';
import { Readable } from 'stream';

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});


interface CompressionResult {
    compressedFile: Buffer;
    originalSize: number;
    compressedSize: number;
    compressionSavings: number;
}

interface UploadFileProps {
    file: File;
    ownerId: string;
    accountId: string;
    path: string;
}

type FileType = 'image' | 'document' | 'video' | 'audio' | 'other';

const compressFile = async (file: Buffer, fileName: string): Promise<CompressionResult> => {
    try {
        const originalSize = file.length;

        const stream = Readable.from(file);
        const uploadPromise = new Promise((resolve, reject) => {
            const uploadStream = cloudinary.uploader.upload_stream(
                {
                    resource_type: "auto",
                    folder: "compressed",
                    quality: "auto",
                    fetch_format: "auto",
                },
                (error, result) => {
                    if (error) reject(error);
                    else resolve(result);
                }
            );
            
            stream.pipe(uploadStream);
        });

        const result: any = await uploadPromise;
        
        const response = await fetch(result.secure_url);
        const compressedFile = Buffer.from(await response.arrayBuffer());
        
        const compressedSize = compressedFile.length;
        const compressionSavings = ((originalSize - compressedSize) / originalSize) * 100;

        return {
            compressedFile,
            originalSize,
            compressedSize,
            compressionSavings
        };
    } catch (error) {
        console.error("Compression failed:", error);
        throw error;
    }
};


const handleError = (error: unknown, message: string) => {
    console.log(error, message);
    throw error;
};


    export const uploadFile = async ({
    file,
    ownerId,
    accountId,
    path,
    }: UploadFileProps) => {
    const { storage, databases } = await createAdminClient();

    try {
        const fileBuffer = Buffer.from(await file.arrayBuffer());
        const compressionResult = await compressFile(fileBuffer, file.name);
        const inputFile = InputFile.fromBuffer(
            compressionResult.compressedFile,
            file.name
        );

        const bucketFile = await storage.createFile(
        appwriteConfig.bucket,
        ID.unique(),
        inputFile,
        );

        // const fileDocument = {
        // type: getFileType(bucketFile.name).type,
        // name: bucketFile.name,
        // url: constructFileUrl(bucketFile.$id),
        // extension: getFileType(bucketFile.name).extension,
        // size: bucketFile.sizeOriginal,
        // owner: ownerId,
        // accountId,
        // users: [],
        // bucketFileId: bucketFile.$id,
        // };
        const fileDocument = {
            type: getFileType(bucketFile.name).type,
            name: bucketFile.name,
            url: constructFileUrl(bucketFile.$id),
            extension: getFileType(bucketFile.name).extension,
            size: compressionResult.compressedSize,
            originalSize: compressionResult.originalSize,
            compressionSavings: Math.round(compressionResult.compressionSavings * 100) / 100,
            owner: ownerId,
            accountId,
            users: [],
            bucketFileId: bucketFile.$id,
        };


        const newFile = await databases
            .createDocument(
                appwriteConfig.databaseId,
                appwriteConfig.filesCollectionId,
                ID.unique(),
                fileDocument,
            )
            .catch(async (error: unknown) => {
                await storage.deleteFile(appwriteConfig.bucket, bucketFile.$id);
                handleError(error, "Failed to create file document");
            });

        revalidatePath(path);
        return parseStringify(newFile);
    }  catch (error) {
        handleError(error, "Failed to upload file");
    }
    };

    const createQueries = (
    currentUser: Models.Document,
    types: string[],
    searchText: string,
    sort: string,
    limit?: number,
    ) => {
    const queries = [
        Query.or([
        Query.equal("owner", [currentUser.$id]),
        Query.contains("users", [currentUser.email]),
        ]),
    ];

    if (types.length > 0) queries.push(Query.equal("type", types));
    if (searchText) queries.push(Query.contains("name", searchText));
    if (limit) queries.push(Query.limit(limit));

    if (sort) {
        const [sortBy, orderBy] = sort.split("-");

        queries.push(
        orderBy === "asc" ? Query.orderAsc(sortBy) : Query.orderDesc(sortBy),
        );
    }

    return queries;
    };

    export const getFiles = async ({
    types = [],
    searchText = "",
    sort = "$createdAt-desc",
    limit,
    }: GetFilesProps) => {
    const { databases } = await createAdminClient();

    try {
        const currentUser = await getCurrentUser();

        if (!currentUser) throw new Error("User not found");

        const queries = createQueries(currentUser, types, searchText, sort, limit);

        const files = await databases.listDocuments(
        appwriteConfig.databaseId,
        appwriteConfig.filesCollectionId,
        queries,
        );

        console.log({ files });
        return parseStringify(files);
    } catch (error) {
        handleError(error, "Failed to get files");
    }
    };

    export const renameFile = async ({
    fileId,
    name,
    extension,
    path,
    }: RenameFileProps) => {
    const { databases } = await createAdminClient();

    try {
        const newName = `${name}.${extension}`;
        const updatedFile = await databases.updateDocument(
        appwriteConfig.databaseId,
        appwriteConfig.filesCollectionId,
        fileId,
        {
            name: newName,
        },
        );

        revalidatePath(path);
        return parseStringify(updatedFile);
    } catch (error) {
        handleError(error, "Failed to rename file");
    }
    };

    export const updateFileUsers = async ({
    fileId,
    emails,
    path,
    }: UpdateFileUsersProps) => {
    const { databases } = await createAdminClient();

    try {
        const updatedFile = await databases.updateDocument(
        appwriteConfig.databaseId,
        appwriteConfig.filesCollectionId,
        fileId,
        {
            users: emails,
        },
        );

        revalidatePath(path);
        return parseStringify(updatedFile);
    } catch (error) {
        handleError(error, "Failed to rename file");
    }
    };

    export const deleteFile = async ({
    fileId,
    bucketFileId,
    path,
    }: DeleteFileProps) => {
    const { databases, storage } = await createAdminClient();

    try {
        const deletedFile = await databases.deleteDocument(
        appwriteConfig.databaseId,
        appwriteConfig.filesCollectionId,
        fileId,
        );

        if (deletedFile) {
        await storage.deleteFile(appwriteConfig.bucket, bucketFileId);
        }

        revalidatePath(path);
        return parseStringify({ status: "success" });
    } catch (error) {
        handleError(error, "Failed to rename file");
    }
    };

    // ============================== TOTAL FILE SPACE USED
    export async function getTotalSpaceUsed() {
    try {
        const { databases } = await createSessionClient();
        const currentUser = await getCurrentUser();
        if (!currentUser) throw new Error("User is not authenticated.");

        const files = await databases.listDocuments(
        appwriteConfig.databaseId,
        appwriteConfig.filesCollectionId,
        [Query.equal("owner", [currentUser.$id])],
        );

        const totalSpace = {
        image: { size: 0, latestDate: "" },
        document: { size: 0, latestDate: "" },
        video: { size: 0, latestDate: "" },
        audio: { size: 0, latestDate: "" },
        other: { size: 0, latestDate: "" },
        used: 0,
        all: 2 * 1024 * 1024 * 1024 /* 2GB available bucket storage */,
        };

        files.documents.forEach((file) => {
        const fileType = file.type as FileType;
        totalSpace[fileType].size += file.size;
        totalSpace.used += file.size;

        if (
            !totalSpace[fileType].latestDate ||
            new Date(file.$updatedAt) > new Date(totalSpace[fileType].latestDate)
        ) {
            totalSpace[fileType].latestDate = file.$updatedAt;
        }
        });

        return parseStringify(totalSpace);
    } catch (error) {
        handleError(error, "Error calculating total space used:, ");
    }
}