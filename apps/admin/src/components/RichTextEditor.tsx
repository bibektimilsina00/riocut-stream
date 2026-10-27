'use client';

import { useState, useRef, useEffect } from 'react';
import {
    Bold,
    Italic,
    Underline,
    List,
    ListOrdered,
    Heading1,
    Heading2,
    Heading3,
    Link as LinkIcon,
    Image as ImageIcon,
    Code,
    Quote,
    Eye,
    EyeOff,
    Maximize2,
    Minimize2,
    Type,
    AlignLeft,
    AlignCenter,
    AlignRight,
    Strikethrough,
    RotateCcw,
    RotateCw,
    FileText,
    Save,
} from 'lucide-react';

interface RichTextEditorProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    onSave?: () => void;
    autoSave?: boolean;
    maxLength?: number;
}

export default function RichTextEditor({
    value,
    onChange,
    placeholder,
    onSave,
    autoSave = false,
    maxLength = 10000
}: RichTextEditorProps) {
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const [isPreview, setIsPreview] = useState(false);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [wordCount, setWordCount] = useState(0);
    const [charCount, setCharCount] = useState(0);
    const [history, setHistory] = useState<string[]>([value]);
    const [historyIndex, setHistoryIndex] = useState(0);
    const [lastSaved, setLastSaved] = useState<Date | null>(null);

    // Auto-save functionality
    useEffect(() => {
        if (autoSave && onSave) {
            const timer = setTimeout(() => {
                onSave();
                setLastSaved(new Date());
            }, 3000); // Auto-save after 3 seconds of inactivity

            return () => clearTimeout(timer);
        }
    }, [value, autoSave, onSave]);

    // Update word and character count
    useEffect(() => {
        const words = value.trim() ? value.trim().split(/\s+/).length : 0;
        const chars = value.length;
        setWordCount(words);
        setCharCount(chars);
    }, [value]);

    const insertMarkdown = (before: string, after: string = '') => {
        const textarea = textareaRef.current;
        if (!textarea) return;

        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const selectedText = value.substring(start, end) || 'text';
        const newValue = value.substring(0, start) + before + selectedText + after + value.substring(end);

        // Add to history
        const newHistory = history.slice(0, historyIndex + 1);
        newHistory.push(newValue);
        setHistory(newHistory);
        setHistoryIndex(newHistory.length - 1);

        onChange(newValue);

        // Reset cursor position
        setTimeout(() => {
            textarea.focus();
            const newCursorPos = start + before.length;
            textarea.setSelectionRange(newCursorPos, newCursorPos + selectedText.length);
        }, 0);
    };

    const undo = () => {
        if (historyIndex > 0) {
            setHistoryIndex(historyIndex - 1);
            onChange(history[historyIndex - 1]);
        }
    };

    const redo = () => {
        if (historyIndex < history.length - 1) {
            setHistoryIndex(historyIndex + 1);
            onChange(history[historyIndex + 1]);
        }
    };

    const insertTable = () => {
        const tableHtml = `
<table class="w-full border-collapse border border-gray-300 my-4">
  <thead>
    <tr class="bg-gray-100">
      <th class="border border-gray-300 px-4 py-2">Header 1</th>
      <th class="border border-gray-300 px-4 py-2">Header 2</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td class="border border-gray-300 px-4 py-2">Cell 1</td>
      <td class="border border-gray-300 px-4 py-2">Cell 2</td>
    </tr>
  </tbody>
</table>`;
        insertMarkdown(tableHtml);
    };

    const insertVideoEmbed = () => {
        const url = prompt('Enter YouTube/Video URL:');
        if (url) {
            let embedHtml = '';
            if (url.includes('youtube.com') || url.includes('youtu.be')) {
                const videoId = url.includes('youtu.be')
                    ? url.split('youtu.be/')[1]?.split('?')[0]
                    : url.split('v=')[1]?.split('&')[0];
                embedHtml = `<div class="video-container my-6">
  <iframe 
    src="https://www.youtube.com/embed/${videoId}" 
    title="YouTube video" 
    frameborder="0" 
    allowfullscreen
    class="w-full aspect-video rounded-lg">
  </iframe>
</div>`;
            } else {
                embedHtml = `<video controls class="w-full rounded-lg my-4">
  <source src="${url}" type="video/mp4">
  Your browser does not support the video tag.
</video>`;
            }
            insertMarkdown(embedHtml);
        }
    };

    const toolbarButtons = [
        // Text Formatting
        {
            icon: Heading1,
            label: 'Heading 1',
            action: () => insertMarkdown('<h1 class="text-4xl font-bold mb-4">', '</h1>'),
        },
        {
            icon: Heading2,
            label: 'Heading 2',
            action: () => insertMarkdown('<h2 class="text-3xl font-semibold mb-3">', '</h2>'),
        },
        {
            icon: Heading3,
            label: 'Heading 3',
            action: () => insertMarkdown('<h3 class="text-2xl font-medium mb-2">', '</h3>'),
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
            icon: Strikethrough,
            label: 'Strikethrough',
            action: () => insertMarkdown('<s>', '</s>'),
        },
        // Lists
        {
            icon: List,
            label: 'Bullet List',
            action: () => insertMarkdown('<ul class="list-disc list-inside my-4 space-y-2">\n  <li>', '</li>\n  <li>Item 2</li>\n</ul>'),
        },
        {
            icon: ListOrdered,
            label: 'Numbered List',
            action: () => insertMarkdown('<ol class="list-decimal list-inside my-4 space-y-2">\n  <li>', '</li>\n  <li>Item 2</li>\n</ol>'),
        },
        // Media
        {
            icon: LinkIcon,
            label: 'Link',
            action: () => {
                const url = prompt('Enter URL:');
                if (url) insertMarkdown(`<a href="${url}" target="_blank" rel="noopener noreferrer" class="text-teal-500 hover:text-teal-700 underline">`, '</a>');
            },
        },
        {
            icon: ImageIcon,
            label: 'Image',
            action: () => {
                const url = prompt('Enter image URL:');
                const alt = prompt('Enter image description:') || 'Image';
                if (url) insertMarkdown(`<img src="${url}" alt="${alt}" class="rounded-lg my-4 max-w-full h-auto" />`);
            },
        },
        {
            icon: FileText,
            label: 'Video/Embed',
            action: insertVideoEmbed,
        },
        // Code & Quote
        {
            icon: Code,
            label: 'Inline Code',
            action: () => insertMarkdown('<code class="bg-gray-200 dark:bg-gray-800 px-2 py-1 rounded text-sm">', '</code>'),
        },
        {
            icon: Quote,
            label: 'Blockquote',
            action: () => insertMarkdown('<blockquote class="border-l-4 border-teal-500 pl-6 py-2 my-4 bg-gray-50 dark:bg-gray-800 italic">', '</blockquote>'),
        },
        // Alignment
        {
            icon: AlignLeft,
            label: 'Align Left',
            action: () => insertMarkdown('<div class="text-left">', '</div>'),
        },
        {
            icon: AlignCenter,
            label: 'Align Center',
            action: () => insertMarkdown('<div class="text-center">', '</div>'),
        },
        {
            icon: AlignRight,
            label: 'Align Right',
            action: () => insertMarkdown('<div class="text-right">', '</div>'),
        },
    ];

    const formatBytes = (bytes: number) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    return (
        <div className={`border border-gray-700 rounded-lg overflow-hidden ${isFullscreen ? 'fixed inset-0 z-50 bg-gray-900' : ''}`}>
            {/* Toolbar */}
            <div className="bg-gray-800 border-b border-gray-700 p-3">
                <div className="flex flex-wrap gap-2 items-center justify-between">
                    <div className="flex flex-wrap gap-1">
                        {/* History controls */}
                        <button
                            type="button"
                            onClick={undo}
                            disabled={historyIndex <= 0}
                            className="p-2 hover:bg-gray-700 rounded text-gray-300 hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Undo (Ctrl+Z)"
                        >
                            <RotateCcw className="w-4 h-4" />
                        </button>
                        <button
                            type="button"
                            onClick={redo}
                            disabled={historyIndex >= history.length - 1}
                            className="p-2 hover:bg-gray-700 rounded text-gray-300 hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Redo (Ctrl+Y)"
                        >
                            <RotateCw className="w-4 h-4" />
                        </button>

                        <div className="w-px bg-gray-600 h-8 mx-2" />

                        {/* Formatting tools */}
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

                        <div className="w-px bg-gray-600 h-8 mx-2" />

                        {/* Table */}
                        <button
                            type="button"
                            onClick={insertTable}
                            className="p-2 hover:bg-gray-700 rounded text-gray-300 hover:text-white transition-colors"
                            title="Insert Table"
                        >
                            <Type className="w-4 h-4" />
                        </button>
                    </div>

                    <div className="flex items-center gap-2">
                        {/* Save button */}
                        {onSave && (
                            <button
                                type="button"
                                onClick={() => {
                                    onSave();
                                    setLastSaved(new Date());
                                }}
                                className="p-2 hover:bg-gray-700 rounded text-gray-300 hover:text-white transition-colors"
                                title="Save (Ctrl+S)"
                            >
                                <Save className="w-4 h-4" />
                            </button>
                        )}

                        {/* Preview toggle */}
                        <button
                            type="button"
                            onClick={() => setIsPreview(!isPreview)}
                            className={`p-2 hover:bg-gray-700 rounded transition-colors ${isPreview ? 'text-teal-400 bg-gray-700' : 'text-gray-300 hover:text-white'
                                }`}
                            title="Toggle Preview"
                        >
                            {isPreview ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>

                        {/* Fullscreen toggle */}
                        <button
                            type="button"
                            onClick={() => setIsFullscreen(!isFullscreen)}
                            className="p-2 hover:bg-gray-700 rounded text-gray-300 hover:text-white transition-colors"
                            title="Toggle Fullscreen"
                        >
                            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                        </button>
                    </div>
                </div>
            </div>

            {/* Editor/Preview */}
            <div className={`bg-gray-900 ${isFullscreen ? 'flex-1 flex flex-col' : ''}`}>
                {isPreview ? (
                    <div
                        className={`p-6 text-white prose prose-invert max-w-none overflow-y-auto ${isFullscreen ? 'flex-1' : 'min-h-[400px]'
                            }`}
                        dangerouslySetInnerHTML={{ __html: value }}
                    />
                ) : (
                    <textarea
                        ref={textareaRef}
                        value={value}
                        onChange={(e) => {
                            const newValue = e.target.value;
                            if (newValue.length <= maxLength) {
                                onChange(newValue);
                                // Add to history on significant changes
                                if (Math.abs(newValue.length - value.length) > 10) {
                                    const newHistory = history.slice(0, historyIndex + 1);
                                    newHistory.push(newValue);
                                    setHistory(newHistory);
                                    setHistoryIndex(newHistory.length - 1);
                                }
                            }
                        }}
                        onKeyDown={(e) => {
                            if (e.ctrlKey || e.metaKey) {
                                if (e.key === 'z' && !e.shiftKey) {
                                    e.preventDefault();
                                    undo();
                                } else if ((e.key === 'y') || (e.key === 'z' && e.shiftKey)) {
                                    e.preventDefault();
                                    redo();
                                } else if (e.key === 's') {
                                    e.preventDefault();
                                    if (onSave) {
                                        onSave();
                                        setLastSaved(new Date());
                                    }
                                }
                            }
                        }}
                        placeholder={placeholder}
                        className={`w-full bg-transparent text-white p-6 resize-none focus:outline-none font-mono text-sm leading-relaxed ${isFullscreen ? 'flex-1' : 'min-h-[400px]'
                            }`}
                    />
                )}
            </div>

            {/* Status Bar */}
            <div className="bg-gray-800 border-t border-gray-700 px-4 py-2 flex justify-between items-center text-xs text-gray-400">
                <div className="flex items-center gap-4">
                    <span>{wordCount} words</span>
                    <span>{charCount}/{maxLength} characters</span>
                    {lastSaved && (
                        <span className="text-green-400">
                            Last saved: {lastSaved.toLocaleTimeString()}
                        </span>
                    )}
                </div>
                <div>
                    <span>HTML formatting supported. Use Ctrl+S to save, Ctrl+Z/Y for undo/redo.</span>
                </div>
            </div>
        </div>
    );
}