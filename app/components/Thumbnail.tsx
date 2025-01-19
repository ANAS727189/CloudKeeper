import React from "react";
import Image from "next/image";
import { cn, getFileIcon } from "@/lib/utils";

interface Props {
    type: string;
    extension: string;
    url?: string;
    imageClassName?: string;
    className?: string;
    }

    export const Thumbnail = ({
    type,
    extension,
    url = "",
    imageClassName,
    className,
    }: Props) => {
    const isImage = type === "image" && extension !== "svg";

    return (
        <figure className={cn("thumbnail", className)}>
        {isImage ? (
            <Image
                src={url}
                alt="thumbnail"
                width={100}
                height={100}
                className={cn(
                "size-8 object-contain",
                imageClassName,
                isImage && "thumbnail-image",
                )}
            />
        ) : (
            <div className={cn("size-8 object-contain", imageClassName)}>
                {React.createElement(getFileIcon(extension, type))}
            </div>
        )}
        </figure>
    );
};
export default Thumbnail;