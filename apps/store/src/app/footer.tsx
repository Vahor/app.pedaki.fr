import { Button } from '@pedaki/design/ui/button';
import { IconBookText } from '@pedaki/design/ui/icons';
import LanguageSelector from '~/components/footer/LanguageSelector';
import CurrentPage from '~/components/header/current-page.tsx';
import Logo from '~/components/header/logo.tsx';
import { env } from '~/env.mjs';
import Link from 'next/link';
import React from 'react';

const Footer = () => {
  return (
    <footer className="flex justify-end px-6 py-4 md:px-12">
      <div className="flex items-center gap-4 lg:justify-between">
        <LanguageSelector />
      </div>
    </footer>
  );
};

export default Footer;
