import React from "react";
import { Button } from "@/components/ui/button";
import { LogOut } from 'lucide-react';
import Search from "../components/Search"
import FileUploader from "../components/FileUploader"
import { signOutUser } from "@/lib/actions/user.actions";

const Header = ({
    userId,
    accountId,
    }: {
    userId: string;
    accountId: string;
    }) => {
    return (
        <header className="header">
        <Search />
        <div className="header-wrapper">
            <FileUploader ownerId={userId} accountId={accountId} />
            <form
            action={async () => {
                "use server";
                await signOutUser();
            }}
            >
            <Button 
                type="submit" 
                variant="ghost" 
                size="icon"
                className="text-gray-400 hover:text-gray-200 transition-colors"
            >
                <LogOut className="h-5 w-5" />
            </Button>
            </form>
        </div>
        </header>
    );
};

export default Header;

