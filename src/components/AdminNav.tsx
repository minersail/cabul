'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function AdminNav() {
  const pathname = usePathname()

  const adminPages = [
    { href: '/admin/tokenize', label: '🔤 Tokenizer', description: 'Test tokenization API' },
    { href: '/admin/translate', label: '🌐 Translator', description: 'Test translation API' },
    { href: '/admin/scrape', label: '📰 Le Monde Scraper', description: 'Test article scraping' },
    { href: '/admin/scrape/scriptslug', label: '🎬 Script Scraper', description: 'Test movie script processing' },
    { href: '/admin/compositionality', label: '🔗 Compositionality', description: 'Test phrase analysis' },
  ]

  const isActive = (href: string) => pathname === href

  return (
    <div className="bg-white shadow border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          <div className="flex items-center">
            <Link href="/" className="text-xl font-bold text-gray-900 hover:text-gray-700">
              🏠 Vocab Herald
            </Link>
            <span className="ml-4 px-2 py-1 bg-red-100 text-red-800 text-xs font-medium rounded">
              Admin Test Suite
            </span>
          </div>
          
          {/* Desktop Navigation */}
          <nav className="hidden lg:flex space-x-8">
            {adminPages.map((page) => (
              <Link
                key={page.href}
                href={page.href}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive(page.href)
                    ? 'bg-indigo-100 text-indigo-700'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
                title={page.description}
              >
                {page.label}
              </Link>
            ))}
          </nav>

          {/* Mobile Menu Button */}
          <div className="lg:hidden">
            <details className="relative">
              <summary className="cursor-pointer px-3 py-2 rounded-md text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100">
                ☰ Menu
              </summary>
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-md shadow-lg border z-10">
                <div className="py-1">
                  {adminPages.map((page) => (
                    <Link
                      key={page.href}
                      href={page.href}
                      className={`block px-4 py-2 text-sm ${
                        isActive(page.href)
                          ? 'bg-indigo-100 text-indigo-700'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                      title={page.description}
                    >
                      {page.label}
                    </Link>
                  ))}
                </div>
              </div>
            </details>
          </div>
        </div>
      </div>
    </div>
  )
} 