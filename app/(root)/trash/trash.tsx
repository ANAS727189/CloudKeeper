import React from "react";
import Sort from "../../components/Sort";
import { getFiles, getTotalSpaceUsed } from "@/lib/actions/file.actions";
import { Models } from "node-appwrite";
import Card from "../../components/Card"
import { getFileTypesParams } from "@/lib/utils";

const Page = async ({ searchParams, params }: SearchParamProps) => {
    const type = ((await params)?.type as string) || "";
    // const searchText = ((await searchParams)?.query as string) || "";
    // const sort = ((await searchParams)?.sort as string) || "";

    // const types = getFileTypesParams(type) as FileType[];

    // const files = await getFiles({ types, searchText, sort });

    const [trash, trashtotalSpace] = await Promise.all([
        getFiles({ types: [], limit: 10 }),
        getTotalSpaceUsed(),
    ]);

    // console.log("trash"+trash);
    // console.log(trashtotalSpace + "trash");

    return (
        <div className="page-container">
        <section className="w-full">
            <h1 className="h1 capitalize">{type}</h1>

            <div className="total-size-section">
            <p className="body-1">
                Total: <span className="h5">0 MB</span>
            </p>

            <div className="sort-container">
                <p className="body-1 hidden text-light-200 sm:block">Sort by:</p>

                <Sort />
            </div>
            </div>
        </section>

        {/* Render the files */}
        {trash.total > 0 ? (
            <section className="file-list">
            {trash.documents.map((file: Models.Document) => (
                <Card key={file.$id} file={file} />
            ))}
            </section>
        ) : (
            <p className="empty-list">No files deleted</p>
        )}
        </div>
    );
};

export default Page;