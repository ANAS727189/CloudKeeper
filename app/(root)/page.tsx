import { Models } from "node-appwrite";
import Link from "next/link";
import { type LucideIcon } from 'lucide-react';

import ActionDropdown from "../components/ActionDropdown";
import { Chart } from "../components/Chart";
import { FormattedDateTime } from "../components/FormattedDateTime";
import { Thumbnail } from "../components/Thumbnail";
import { Separator } from "@/components/ui/separator";
import { getFiles, getTotalSpaceUsed } from "@/lib/actions/file.actions";
import { convertFileSize, getUsageSummary } from "@/lib/utils";

const Dashboard = async () => {
  // Parallel requests
    const [files, totalSpace] = await Promise.all([
    getFiles({ types: [], limit: 10 }),
        getTotalSpaceUsed(),
    ]);

    // Get usage summary
    const usageSummary = getUsageSummary(totalSpace);

    return (
        <div className="dashboard-container">
        <p className="text-gray-300 font-bold text-4xl">Dashboard</p>
        <section>
            <Chart used={totalSpace.used} />

            {/* Uploaded file type summaries */}
            <ul className="dashboard-summary-list">
            {usageSummary.map((summary) => {
                const IconComponent = summary.icon as LucideIcon;
                return (
                <Link
                    href={summary.url}
                    key={summary.title}
                    className="dashboard-summary-card group"
                >
                    <div className="space-y-4">
                    <div className="flex justify-between items-start gap-3">
                        <div className="relative z-10 p-3 rounded-xl bg-accent/50 group-hover:bg-accent/70 transition-colors">
                        <IconComponent className="w-[40px] h-[40px] text-primary" />
                        </div>
                        <h4 className="summary-type-size">
                        {convertFileSize(summary.size) || 0}
                        </h4>
                    </div>

                    <h5 className="summary-type-title">{summary.title}</h5>
                    <Separator className="bg-[#334155]" />
                    <FormattedDateTime
                        date={summary.latestDate}
                        className="text-center text-gray-400"
                    />
                    </div>
                </Link>
                );
            })}
        </ul>
        </section>

        {/* Recent files uploaded */}
        <section className="dashboard-recent-files">
            <h2 className="h3 xl:h2 text-gray-300">Recent files uploaded</h2>
            {files.documents.length > 0 ? (
            <ul className="mt-5 flex flex-col gap-5">
                {files.documents.map((file: Models.Document) => (
                <Link
                    href={file.url}
                    target="_blank"
                    className="flex items-center gap-3"
                    key={file.$id}
                >
                    <Thumbnail
                    type={file.type}
                    extension={file.extension}
                    url={file.url}
                    />

                    <div className="recent-file-details">
                    <div className="flex flex-col gap-1">
                        <p className="recent-file-name">{file.name}</p>
                        <FormattedDateTime
                        date={file.$createdAt}
                        className="caption text-gray-400"
                        />
                    </div>
                    <ActionDropdown file={file} />
                    </div>
                </Link>
                ))}
            </ul>
            ) : (
            <p className="empty-list">No files uploaded</p>
            )}
        </section>
        </div>
    );
    };

    export default Dashboard;

