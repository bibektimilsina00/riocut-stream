'use client';

import { useRef } from 'react';
import {
    Bold,
    Italic,
    Underline,
    List,
    ListOrdered,
    Heading1,
    Heading2,
    Link as LinkIcon,
    Image as ImageIcon,
    Code,
    Quote,
} from 'lucide-react';

interface RichTextEditorProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
}

export default function RichTextEditor({ value, onChange, placeholder }: RichTextEditorProps) {
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const insertMarkdown = (before: string, after: string = '') => {
        const textarea = textareaRef.current;
        if (!textarea) return;

        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const selectedText = value.substring(start, end) || 'text';
        const newValue = value.substring(0, start) + before + selectedText + after + value.substring(end);

        onChange(newValue);

        // Reset cursor position
        setTimeout(() => {
            textarea.focus();
            const newCursorPos = start + before.length;
            textarea.setSelectionRange(newCursorPos, newCursorPos + selectedText.length);
        }, 0);
    };

    const toolbarButtons = [
        {
            icon: Heading1,
            label: 'Heading 1',
            action: () => insertMarkdown('<h1>', '</h1>'),
        },
        {
            icon: Heading2,
            label: 'Heading 2',
            action: () => insertMarkdown('<h2>', '</h2>'),
        },
        {
            icon: Bold,
            label: 'Bold',
            action: () => insertMarkdown('<strong>', '</strong>'),
        },
        {
            icon: Italic,
            label: 'Italic',
            action: () => insertMarkdown('<em>', '</em>'),
        },
        {
            icon: Underline,
            label: 'Underline',
            action: () => insertMarkdown('<u>', '</u>'),
        },
        {
            icon: List,
            label: 'Bullet List',
            action: () => insertMarkdown('<ul>\n  <li>', '</li>\n</ul>'),
        },
        {
            icon: ListOrdered,
            label: 'Numbered List',
            action: () => insertMarkdown('<ol>\n  <li>', '</li>\n</ol>'),
        },
        {
            icon: LinkIcon,
            label: 'Link',
            action: () => {
                const url = prompt('Enter URL:');
                if (url) insertMarkdown(`<a href="${url}" target="_blank" rel="noopener noreferrer">`, '</a>');
            },
        },
        {
            icon: ImageIcon,
            label: 'Image',
            action: () => {
                const url = prompt('Enter image URL:');
                const alt = prompt('Enter image description:') || 'Image';
                if (url) insertMarkdown(`<img src="${url}" alt="${alt}" class="rounded-lg my-4" />`);
            },
        },
        {
            icon: Code,
            label: 'Code',
            action: () => insertMarkdown('<code>', '</code>'),
        },
        {
            icon: Quote,
            label: 'Quote',
            action: () => insertMarkdown('<blockquote class="border-l-4 border-teal-500 pl-4 italic my-4">', '</blockquote>'),
        },
    ];

    return (
        <div className="border border-gray-700 rounded-lg overflow-hidden">
            {/* Toolbar */}
            <div className="bg-gray-800 border-b border-gray-700 p-2 flex flex-wrap gap-1">
                {toolbarButtons.map((button, index) => (
                    <button
                        key={index}
                        type="button"
                        onClick={button.action}
                        className="p-2 hover:bg-gray-700 rounded text-gray-300 hover:text-white transition-colors"
                        title={button.label}
                    >
                        <button.icon className="w-4 h-4" />
                    </button>
                ))}
            </div>

            {/* Editor */}
            <div className="bg-gray-900">
                <textarea
                    ref={textareaRef}
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder={placeholder}
                    className="w-full bg-transparent text-white p-4 min-h-[400px] resize-y focus:outline-none font-mono text-sm"
                    style={{ lineHeight: '1.6' }}
                />
            </div>

            {/* Help Text */}
            <div className="bg-gray-800 border-t border-gray-700 px-4 py-2">
                <p className="text-xs text-gray-400">
                    HTML formatting supported. Use the toolbar buttons or write HTML directly.
                </p>
            </div>
        </div>
    );
}
