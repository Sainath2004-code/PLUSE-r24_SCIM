import React from 'react';
import ReactMarkdown from 'react-markdown';
import { LayoutBlock } from '../types';

export const BlockRenderer: React.FC<{ block: LayoutBlock; value: any }> = ({ block, value }) => {
    if (!value && block.type !== 'divider') return null;

    switch (block.type) {
        case 'title':
            return <h1 className="text-4xl font-bold text-slate-900 leading-tight mb-4">{value}</h1>;
        case 'excerpt':
            return <p className="text-xl text-slate-600 leading-relaxed mb-6 font-light">{value}</p>;
        case 'markdown':
            return <div className="prose prose-slate max-w-none mb-6"><ReactMarkdown>{value}</ReactMarkdown></div>;
        case 'image':
            return (
                <figure className="mb-6">
                    <img src={value.src} alt={value.caption || ''} className="w-full h-auto rounded-lg shadow-md object-cover" />
                    {value.caption && <figcaption className="mt-2 text-center text-sm text-slate-500">{value.caption}</figcaption>}
                </figure>
            );
        case 'divider':
            return <hr className="my-8 border-slate-200" />;
        case 'tags':
            return (
                <div className="flex flex-wrap gap-2 mb-4">
                    {(value || []).map((tag: string) => (
                        <span key={tag} className="px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-sm font-medium">#{tag}</span>
                    ))}
                </div>
            );
        case 'author':
            return <div className="text-sm text-slate-500 font-medium mb-2">By {value}</div>;
        case 'publishDate':
            return <div className="text-sm text-slate-400 mb-4">{new Date(value).toLocaleDateString(undefined, { dateStyle: 'long' })}</div>;
        default:
            return null;
    }
};
