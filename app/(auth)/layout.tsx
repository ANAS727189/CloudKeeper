"use client";
import React from "react";
import Image from "next/image";
import { usePathname } from 'next/navigation'

const Layout = ({ children }: { children: React.ReactNode }) => {
    const pathname = usePathname()
    return (
        <div className="flex min-h-screen">
            {pathname === "/sign-in" ? (
                <>
                <section className="hidden w-1/2 items-center justify-center bg-brand p-2 lg:flex xl:w-2/5">
            <div className="flex max-h-[800px] max-w-[430px] flex-col justify-center space-y-1">
            <div className="flex items-center space-x-4">
            <Image
                    src="/assets/icons/logo-full-brand.svg"
                    alt="logo"
                    width={136}
                    height={50}
                    className="h-auto"
                />
                <h1 className="h1 text-white"><span className="text-[#ff6f42]">Cloud</span><span className="text-[#048c74]">Keeper</span></h1>
            </div>

            <div className="space-y-3 text-white">
                <h1 className="h1">Manage your files the best way</h1>
                <p className="body-1">
                This is a place where you can store all your documents.
                </p>
            </div>
            <Image
                src="/assets/images/files.png"
                alt="Files"
                width={280}
                height={280}
                className="transition-all hover:rotate-2 hover:scale-105"
            />
            </div>
        </section>

        <section className="flex flex-1 flex-col items-center bg-gray-900 text-gray-300 p-4 py-10 lg:justify-center lg:p-10 lg:py-0">
            <div className="mb-16 lg:hidden">
            <Image
                src="/assets/icons/logo-full-brand.svg"
                alt="logo"
                width={224}
                height={82}
                className="h-auto w-[200px] lg:w-[250px]"
            />
            </div>

            {children}
        </section>
                </>
) : (
    <>
    
    <section className="flex flex-1 flex-col items-center bg-gray-900 text-gray-300 p-4 py-10 lg:justify-center lg:p-10 lg:py-0">
            <div className="mb-16 lg:hidden">
            <Image
                src="/assets/icons/logo-full-brand.svg"
                alt="logo"
                width={224}
                height={82}
                className="h-auto w-[200px] lg:w-[250px]"
            />
            </div>

            {children}
        </section>

    <section className="hidden w-1/2 items-center justify-center bg-brand p-2 lg:flex xl:w-2/5">
            <div className="flex max-h-[800px] max-w-[430px] flex-col justify-center space-y-1">
            <div className="flex items-center space-x-4">
            <Image
                    src="/assets/icons/logo-full-brand.svg"
                    alt="logo"
                    width={136}
                    height={50}
                    className="h-auto"
                />
                <h1 className="h1 text-white"><span className="text-[#ff6f42]">Cloud</span><span className="text-[#048c74]">Keeper</span></h1>
            </div>

            <div className="space-y-3 text-white">
                <h1 className="h1">Manage your files the best way</h1>
                <p className="body-1">
                This is a place where you can store all your documents.
                </p>
            </div>
            <Image
                src="/assets/images/files.png"
                alt="Files"
                width={280}
                height={280}
                className="transition-all hover:rotate-2 hover:scale-105"
            />
            </div>
        </section>

    </>
)}
        </div>

    );
};

export default Layout;