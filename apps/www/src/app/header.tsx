import React from 'react';
import Logo from "~/components/header/logo.tsx";

const Header = () => {
    return (
        <div className="relative bg-primary border-b px-3 sm:px-6 lg:px-8 py-4">
            <header className="">
                <div className="flex items-center">
                    <Logo/>
                </div>
            </header>
        </div>
    );
};

export default Header;