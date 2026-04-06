import React from 'react';
import ReactMarkdown from 'react-markdown';
import { LayoutBlock } from '../types';

export const BlockRenderer: React.FC<{ block: LayoutBlock; value: any }> = ({ block, value }) => {
    if (!value && block.type !== 'divider') return null;

    switch (block.type) {
        case 'title':
        case 'excerpt':
            // These are handled specifically in the layout (PublicDetail) — skip re-rendering in the body
            return null;

        case 'markdown':
            return (
                <div className="mb-8 text-gray-800 leading-8 text-[17px] font-inter space-y-6">
                    <ReactMarkdown
                        components={{
                            h1: ({ children }) => <h1 className="font-playfair text-3xl font-bold text-gray-900 mt-10 mb-4 leading-tight">{children}</h1>,
                            h2: ({ children }) => <h2 className="font-playfair text-2xl font-bold text-intel-800 mt-8 mb-3 pb-2 border-b border-gray-200">{children}</h2>,
                            h3: ({ children }) => <h3 className="font-semibold text-xl text-gray-800 mt-6 mb-2">{children}</h3>,
                            p: ({ children }) => <p className="mb-5 text-gray-700 leading-8">{children}</p>,
                            ul: ({ children }) => <ul className="list-disc list-outside ml-6 mb-5 space-y-2 text-gray-700">{children}</ul>,
                            ol: ({ children }) => <ol className="list-decimal list-outside ml-6 mb-5 space-y-2 text-gray-700">{children}</ol>,
                            li: ({ children }) => <li className="leading-7">{children}</li>,
                            strong: ({ children }) => <strong className="font-bold text-gray-900">{children}</strong>,
                            em: ({ children }) => <em className="italic text-gray-700">{children}</em>,
                            blockquote: ({ children }) => (
                                <blockquote className="border-l-4 border-maroon-500 pl-5 py-1 my-6 bg-maroon-50 text-maroon-800 italic rounded-r-lg">
                                    {children}
                                </blockquote>
                            ),
                            code: ({ children, className }) => {
                                const isBlock = className?.includes('language-');
                                return isBlock
                                    ? <code className="block bg-gray-900 text-green-400 rounded-lg p-4 my-4 text-sm font-mono overflow-x-auto">{children}</code>
                                    : <code className="bg-gray-100 text-maroon-700 px-1.5 py-0.5 rounded text-sm font-mono">{children}</code>;
                            },
                            hr: () => <hr className="my-8 border-gray-200" />,
                        }}
                    >
                        {value}
                    </ReactMarkdown>
                </div>
            );

        case 'image':
            if (!value?.src) return null;
            return (
                <figure className="mb-8">
                    <img
                        src={value.src}
                        alt={value.caption || ''}
                        className="w-full h-auto rounded-xl shadow-lg object-cover max-h-[500px]"
                    />
                    {value.caption && (
                        <figcaption className="mt-3 text-center text-sm text-gray-500 italic">
                            {value.caption}
                        </figcaption>
                    )}
                </figure>
            );

        case 'divider':
            return (
                <div className="my-10 flex items-center gap-4">
                    <div className="flex-1 h-px bg-gray-200" />
                    <div className="w-1.5 h-1.5 rounded-full bg-maroon-400" />
                    <div className="flex-1 h-px bg-gray-200" />
                </div>
            );

        case 'pdf':
            if (!value?.url) return null;
            return (
                <div className="mb-8 w-full h-[800px] border border-gray-200 rounded-xl overflow-hidden shadow-lg bg-gray-50 flex flex-col">
                    <div className="bg-gray-100 p-3 border-b border-gray-200 flex justify-between items-center">
                        <span className="text-sm font-semibold text-gray-700 truncate">{value.filename || 'Document'}</span>
                        <a href={value.url} target="_blank" rel="noopener noreferrer" className="text-xs bg-white border border-gray-300 px-3 py-1.5 rounded-md hover:bg-gray-50 flex items-center gap-2 font-medium text-gray-700 transition">
                            Open PDF
                        </a>
                    </div>
                    <iframe src={value.url} className="w-full flex-1 border-none" title="PDF Viewer" />
                </div>
            );

        case 'tags':
            if (!Array.isArray(value) || !value.length) return null;
            return (
                <div className="flex flex-wrap gap-2 mb-6">
                    {value.map((tag: string) => (
                        <span
                            key={tag}
                            className="px-3 py-1 bg-intel-100 text-intel-700 text-[11px] font-mono uppercase tracking-wider rounded-full"
                        >
                            #{tag}
                        </span>
                    ))}
                </div>
            );

        case 'author':
            return (
                <div className="text-sm text-gray-500 font-medium mb-3">
                    By <span className="text-gray-800 font-semibold">{value}</span>
                </div>
            );

        case 'publishDate':
            try {
                return (
                    <div className="text-sm text-gray-400 font-mono mb-4">
                        {new Date(value).toLocaleDateString('en-IN', { dateStyle: 'long' })}
                    </div>
                );
            } catch {
                return null;
            }

        case 'category':
            return (
                <div className="mb-4">
                    <span className="px-3 py-1 bg-maroon-100 text-maroon-700 text-xs font-semibold uppercase tracking-wider rounded-full">
                        {value}
                    </span>
                </div>
            );

        default:
            // Render any unknown block type as plain text if it's a string
            if (typeof value === 'string' && value.trim()) {
                return <p className="text-gray-700 leading-8 mb-4">{value}</p>;
            }
            return null;
    }
};
