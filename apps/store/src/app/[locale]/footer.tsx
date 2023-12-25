import LanguageSelector from '~/components/footer/LanguageSelector';
import React from 'react';

const Footer = () => {
  return (
    <footer className="flex justify-start px-6 py-4 md:px-12">
      <div className="flex items-center gap-4 lg:justify-between">
        <LanguageSelector />
      </div>
    </footer>
  );
};

export default Footer;
