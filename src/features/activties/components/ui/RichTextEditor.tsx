'use client';

import React, { useEffect, useState } from 'react';
import { useEditor, EditorContent, BubbleMenu } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import Placeholder from '@tiptap/extension-placeholder';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import Color from '@tiptap/extension-color';
import Highlight from '@tiptap/extension-highlight';
import TextStyle from '@tiptap/extension-text-style';
import FontFamily from '@tiptap/extension-font-family';
import ListItem from '@tiptap/extension-list-item';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import Table from '@tiptap/extension-table';
import TableRow from '@tiptap/extension-table-row';
import TableCell from '@tiptap/extension-table-cell';
import TableHeader from '@tiptap/extension-table-header';
// import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight';
import Blockquote from '@tiptap/extension-blockquote';
import HorizontalRule from '@tiptap/extension-horizontal-rule';
import Strike from '@tiptap/extension-strike';
import Subscript from '@tiptap/extension-subscript';
import Superscript from '@tiptap/extension-superscript';
import Mention from '@tiptap/extension-mention';
import { cn } from '@/lib/utils';
import { useTheme } from 'next-themes';
// import { lowlight } from 'lowlight';

interface RichTextEditorProps {
  content: string;
  onChange: (content: string) => void;
  placeholder?: string;
  className?: string;
  minHeight?: string;
  label?: string;
  id?: string;
  disabled?: boolean;
  simple?: boolean; // Simple mode with fewer options
  enableMentions?: boolean; // Enable @ mentions
  onMentionSearch?: (query: string) => Promise<Array<{id: string, name: string}>>;
}

/**
 * Rich Text Editor Component
 *
 * A reusable rich text editor component that can be used across activity editors.
 * Supports formatting, links, images, and more.
 */
export const RichTextEditor: React.FC<RichTextEditorProps> = ({
  content,
  onChange,
  placeholder = 'Start typing...',
  className,
  minHeight = '150px',
  label,
  id,
  disabled = false,
  simple = false,
  enableMentions = false,
  onMentionSearch
}) => {
  const [isMounted, setIsMounted] = useState(false);
  const { resolvedTheme } = useTheme();

  // Inject CSS to ensure TipTap respects theme
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      /* Force TipTap editor to respect theme */
      .rich-text-editor .ProseMirror {
        background-color: ${resolvedTheme === 'dark' ? '#111827' : '#ffffff'} !important;
        color: ${resolvedTheme === 'dark' ? '#f3f4f6' : '#111827'} !important;
      }

      .rich-text-editor .ProseMirror p {
        color: ${resolvedTheme === 'dark' ? '#e5e7eb' : '#374151'} !important;
      }

      .rich-text-editor .ProseMirror h1,
      .rich-text-editor .ProseMirror h2,
      .rich-text-editor .ProseMirror h3,
      .rich-text-editor .ProseMirror h4,
      .rich-text-editor .ProseMirror h5,
      .rich-text-editor .ProseMirror h6 {
        color: ${resolvedTheme === 'dark' ? '#f3f4f6' : '#111827'} !important;
      }

      .rich-text-editor .ProseMirror strong {
        color: ${resolvedTheme === 'dark' ? '#f3f4f6' : '#111827'} !important;
      }

      .rich-text-editor .ProseMirror em {
        color: ${resolvedTheme === 'dark' ? '#e5e7eb' : '#374151'} !important;
      }

      .rich-text-editor .ProseMirror code {
        background-color: ${resolvedTheme === 'dark' ? '#1f2937' : '#f3f4f6'} !important;
        color: ${resolvedTheme === 'dark' ? '#f3f4f6' : '#111827'} !important;
      }

      .rich-text-editor .ProseMirror blockquote {
        color: ${resolvedTheme === 'dark' ? '#d1d5db' : '#4b5563'} !important;
        border-left-color: ${resolvedTheme === 'dark' ? '#4b5563' : '#d1d5db'} !important;
      }

      .rich-text-editor .ProseMirror li {
        color: ${resolvedTheme === 'dark' ? '#e5e7eb' : '#374151'} !important;
      }

      .rich-text-editor .ProseMirror a {
        color: ${resolvedTheme === 'dark' ? '#60a5fa' : '#2563eb'} !important;
      }

      .rich-text-editor .ProseMirror table {
        border-color: ${resolvedTheme === 'dark' ? '#4b5563' : '#d1d5db'} !important;
      }

      .rich-text-editor .ProseMirror th,
      .rich-text-editor .ProseMirror td {
        border-color: ${resolvedTheme === 'dark' ? '#4b5563' : '#d1d5db'} !important;
        color: ${resolvedTheme === 'dark' ? '#e5e7eb' : '#374151'} !important;
      }
    `;

    document.head.appendChild(style);

    return () => {
      document.head.removeChild(style);
    };
  }, [resolvedTheme]);

  // Initialize the editor
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        // Disable default extensions that we're replacing
        blockquote: false,
        horizontalRule: false,
        strike: false,
        listItem: false, // Disable to avoid duplicates
      }),
      TextStyle,
      Color,
      Highlight.configure({
        multicolor: true,
      }),
      FontFamily,
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      Underline,
      Strike,
      Subscript,
      Superscript,
      Blockquote,
      HorizontalRule,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-blue-600 dark:text-blue-400 underline cursor-pointer hover:text-blue-800 dark:hover:text-blue-300',
        },
      }),
      Image.configure({
        HTMLAttributes: {
          class: 'max-w-full rounded',
        },
      }),
      ListItem,
      TaskList,
      TaskItem.configure({
        nested: true,
      }),
      Table.configure({
        resizable: true,
      }),
      TableRow,
      TableHeader,
      TableCell,
      // CodeBlockLowlight.configure({
      //   lowlight,
      // }),
      Placeholder.configure({
        placeholder,
      }),
      // Conditionally add Mention extension
      ...(enableMentions ? [
        Mention.configure({
          HTMLAttributes: {
            class: 'mention bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-1 py-0.5 rounded text-sm font-medium',
          },
          suggestion: {
            items: async ({ query }: { query: string }) => {
              if (onMentionSearch) {
                try {
                  return await onMentionSearch(query);
                } catch (error) {
                  console.error('Error fetching mention suggestions:', error);
                  return [];
                }
              }
              return [];
            },
            render: () => {
              let component: any;
              let popup: any;

              return {
                onStart: (props: any) => {
                  component = document.createElement('div');
                  component.className = 'mention-suggestions bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-2 max-h-48 overflow-y-auto z-50';

                  popup = document.createElement('div');
                  popup.style.position = 'absolute';
                  popup.style.zIndex = '9999';
                  document.body.appendChild(popup);
                  popup.appendChild(component);

                  // Position the popup
                  const { range } = props;
                  const { from } = range;
                  const start = props.editor.view.coordsAtPos(from);
                  popup.style.left = `${start.left}px`;
                  popup.style.top = `${start.bottom + 5}px`;
                },

                onUpdate: (props: any) => {
                  const { items } = props;
                  component.innerHTML = '';

                  if (items.length === 0) {
                    const noResults = document.createElement('div');
                    noResults.className = 'text-gray-500 text-sm p-2';
                    noResults.textContent = 'No users found';
                    component.appendChild(noResults);
                    return;
                  }

                  items.forEach((item: any, index: number) => {
                    const button = document.createElement('button');
                    button.className = `w-full text-left p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded flex items-center gap-2 ${index === props.selectedIndex ? 'bg-gray-100 dark:bg-gray-700' : ''}`;
                    button.innerHTML = `
                      <div class="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs font-medium">
                        ${item.name.charAt(0).toUpperCase()}
                      </div>
                      <span class="text-sm">${item.name}</span>
                    `;
                    button.addEventListener('click', () => props.command({ id: item.id, label: item.name }));
                    component.appendChild(button);
                  });
                },

                onKeyDown: (props: any) => {
                  if (props.event.key === 'Escape') {
                    popup?.remove();
                    return true;
                  }
                  return false;
                },

                onExit: () => {
                  popup?.remove();
                },
              };
            },
          },
        })
      ] : []),
    ],
    content,
    editable: !disabled,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  // Handle content changes from outside
  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content);
    }
  }, [content, editor]);

  // Handle client-side rendering
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Add a link
  const addLink = () => {
    if (!editor) return;

    const previousUrl = editor.getAttributes('link').href;
    const url = window.prompt('URL', previousUrl);

    // cancelled
    if (url === null) {
      return;
    }

    // empty
    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }

    // update link
    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  };

  // Add an image
  const addImage = () => {
    if (!editor) return;

    const url = window.prompt('Image URL');

    if (url) {
      editor.chain().focus().setImage({ src: url }).run();
    }
  };

  // Set text color
  const setTextColor = (color: string) => {
    if (!editor) return;
    editor.chain().focus().setColor(color).run();
  };



  if (!isMounted) {
    return (
      <div className={cn("border border-gray-300 dark:border-gray-600 rounded-md p-3 bg-gray-50 dark:bg-gray-800", className)}>
        <div className="animate-pulse h-24 bg-gray-200 dark:bg-gray-700 rounded"></div>
      </div>
    );
  }

  return (
    <div
      className={cn("rich-text-editor", className)}
      data-theme={resolvedTheme}
    >
      {label && (
        <label htmlFor={id} className="block mb-2 text-sm font-medium text-gray-900 dark:text-gray-100">
          {label}
        </label>
      )}

      <div
        className={cn(
          "border border-gray-300 dark:border-gray-600 rounded-md overflow-hidden transition-colors",
          disabled ? "bg-gray-100 dark:bg-gray-800" : "bg-white dark:bg-gray-900",
          "focus-within:ring-2 focus-within:ring-blue-500 dark:focus-within:ring-blue-400 focus-within:border-blue-500 dark:focus-within:border-blue-400",
          // Force theme inheritance
          resolvedTheme === 'dark' ? 'dark' : ''
        )}
        data-theme={resolvedTheme}
      >
        {!disabled && (
          <div className="flex flex-wrap gap-1 p-2 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
            <button
              type="button"
              onClick={() => editor?.chain().focus().toggleBold().run()}
              className={cn(
                "p-2 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors text-gray-700 dark:text-gray-300",
                editor?.isActive('bold') && "bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              )}
              title="Bold (Ctrl+B)"
              aria-label="Bold"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" className="w-4 h-4 fill-current">
                <path d="M8 11h4.5a2.5 2.5 0 1 0 0-5H8v5Zm10 4.5a4.5 4.5 0 0 1-4.5 4.5H6V4h6.5a4.5 4.5 0 0 1 3.256 7.613A4.5 4.5 0 0 1 18 15.5ZM8 13v5h5.5a2.5 2.5 0 1 0 0-5H8Z"></path>
              </svg>
            </button>

            <button
              type="button"
              onClick={() => editor?.chain().focus().toggleItalic().run()}
              className={cn(
                "p-2 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors text-gray-700 dark:text-gray-300",
                editor?.isActive('italic') && "bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              )}
              title="Italic (Ctrl+I)"
              aria-label="Italic"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" className="w-4 h-4 fill-current">
                <path d="M15 20H7v-2h2.927l2.116-12H9V4h8v2h-2.927l-2.116 12H15v2Z"></path>
              </svg>
            </button>

            <button
              type="button"
              onClick={() => editor?.chain().focus().toggleUnderline().run()}
              className={cn(
                "p-2 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors text-gray-700 dark:text-gray-300",
                editor?.isActive('underline') && "bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              )}
              title="Underline (Ctrl+U)"
              aria-label="Underline"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" className="w-4 h-4 fill-current">
                <path d="M8 3v9a4 4 0 1 0 8 0V3h2v9a6 6 0 1 1-12 0V3h2ZM4 20h16v2H4v-2Z"></path>
              </svg>
            </button>

            <button
              type="button"
              onClick={() => editor?.chain().focus().toggleStrike().run()}
              className={cn(
                "p-2 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors text-gray-700 dark:text-gray-300",
                editor?.isActive('strike') && "bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              )}
              title="Strikethrough"
              aria-label="Strikethrough"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" className="w-4 h-4 fill-current">
                <path d="M17.154 14c.23.516.346 1.09.346 1.72 0 1.342-.524 2.392-1.571 3.147C14.88 19.622 13.433 20 11.586 20c-1.64 0-3.263-.381-4.87-1.144V16.6c1.52.877 3.075 1.316 4.666 1.316 2.551 0 3.83-.732 3.839-2.197a2.21 2.21 0 0 0-.648-1.603l-.12-.117H17.154zm-7.984-4h-2.32c0-1.287.138-2.316.414-3.077.276-.762.687-1.347 1.234-1.756.547-.408 1.244-.612 2.091-.612.27 0 .538.012.803.035v2.138a4.89 4.89 0 0 0-.481-.035c-.822 0-1.277.732-1.365 2.197a6.04 6.04 0 0 0-.376.11zm9.75 0H22v2H2v-2h7.014c.05.328.05.661 0 1.02.138.317.138.661 0 1.02H2v2h20v-2h-3.08z"></path>
              </svg>
            </button>

            <div className="w-px h-6 mx-1 bg-gray-300 dark:bg-gray-600"></div>

            {!simple && (
              <>
                <button
                  type="button"
                  onClick={() => editor?.chain().focus().toggleHeading({ level: 1 }).run()}
                  className={cn(
                    "p-2 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors text-gray-700 dark:text-gray-300",
                    editor?.isActive('heading', { level: 1 }) && "bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  )}
                  title="Heading 1"
                  aria-label="Heading 1"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" className="w-4 h-4 fill-current">
                    <path d="M13 20h-2v-7H4v7H2V4h2v7h7V4h2v16zm8-12v12h-2v-9.796l-2 .536V8.67L19.5 8H21z"></path>
                  </svg>
                </button>

                <button
                  type="button"
                  onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()}
                  className={cn(
                    "p-2 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors text-gray-700 dark:text-gray-300",
                    editor?.isActive('heading', { level: 2 }) && "bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  )}
                  title="Heading 2"
                  aria-label="Heading 2"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" className="w-4 h-4 fill-current">
                    <path d="M4 4v7h7V4h2v16h-2v-7H4v7H2V4h2zm14.5 4c2.071 0 3.75 1.679 3.75 3.75 0 .857-.288 1.648-.772 2.28l-.148.18L18.034 18H22v2h-7v-1.556l4.82-5.546c.268-.307.43-.709.43-1.148 0-.966-.784-1.75-1.75-1.75-.918 0-1.671.707-1.744 1.606l-.006.144h-2C14.75 9.679 16.429 8 18.5 8z"></path>
                  </svg>
                </button>

                <button
                  type="button"
                  onClick={() => editor?.chain().focus().toggleHeading({ level: 3 }).run()}
                  className={cn(
                    "p-2 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors text-gray-700 dark:text-gray-300",
                    editor?.isActive('heading', { level: 3 }) && "bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  )}
                  title="Heading 3"
                  aria-label="Heading 3"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" className="w-4 h-4 fill-current">
                    <path d="M22 8l-.002 2-2.505 2.854c1.59.435 2.757 1.89 2.757 3.646 0 2.071-1.679 3.75-3.75 3.75s-3.75-1.679-3.75-3.75c0-1.757 1.168-3.211 2.757-3.646L14.002 10H22V8zM4 4v7h7V4h2v16h-2v-7H4v7H2V4h2z"></path>
                  </svg>
                </button>

                <div className="w-px h-6 mx-1 bg-gray-300 dark:bg-gray-600"></div>

                <button
                  type="button"
                  onClick={() => editor?.chain().focus().toggleBulletList().run()}
                  className={cn(
                    "p-2 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors text-gray-700 dark:text-gray-300",
                    editor?.isActive('bulletList') && "bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  )}
                  title="Bullet List"
                  aria-label="Bullet List"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" className="w-4 h-4 fill-current">
                    <path d="M8 4h13v2H8V4ZM4.5 6.5a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3Zm0 7a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3Zm0 6.9a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3ZM8 11h13v2H8v-2Zm0 7h13v2H8v-2Z"></path>
                  </svg>
                </button>

                <button
                  type="button"
                  onClick={() => editor?.chain().focus().toggleOrderedList().run()}
                  className={cn(
                    "p-2 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors text-gray-700 dark:text-gray-300",
                    editor?.isActive('orderedList') && "bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  )}
                  title="Numbered List"
                  aria-label="Numbered List"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" className="w-4 h-4 fill-current">
                    <path d="M8 4h13v2H8V4ZM5 3v3h1v1H3V6h1V4H3V3h2Zm-2 7h3.25v1.5H5v1h1.25V14H3v-1h1v-1H3v-2h2Zm0 7h3v1H3v-1Zm2-2v.5H3v1h2V18H3v-3h2v1ZM8 11h13v2H8v-2Zm0 7h13v2H8v-2Z"></path>
                  </svg>
                </button>

                <button
                  type="button"
                  onClick={() => editor?.chain().focus().toggleBlockquote().run()}
                  className={cn(
                    "p-2 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors text-gray-700 dark:text-gray-300",
                    editor?.isActive('blockquote') && "bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  )}
                  title="Quote"
                  aria-label="Quote"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" className="w-4 h-4 fill-current">
                    <path d="M4.583 17.321C3.553 16.227 3 15 3 13.011c0-3.5 2.457-6.637 6.03-8.188l.893 1.378c-3.335 1.804-3.987 4.145-4.247 5.621.537-.278 1.24-.375 1.929-.311 1.804.167 3.226 1.648 3.226 3.489a3.5 3.5 0 0 1-3.5 3.5c-1.073 0-2.099-.49-2.748-1.179zm10 0C13.553 16.227 13 15 13 13.011c0-3.5 2.457-6.637 6.03-8.188l.893 1.378c-3.335 1.804-3.987 4.145-4.247 5.621.537-.278 1.24-.375 1.929-.311 1.804.167 3.226 1.648 3.226 3.489a3.5 3.5 0 0 1-3.5 3.5c-1.073 0-2.099-.49-2.748-1.179z"></path>
                  </svg>
                </button>

                <button
                  type="button"
                  onClick={() => editor?.chain().focus().toggleCode().run()}
                  className={cn(
                    "p-2 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors text-gray-700 dark:text-gray-300",
                    editor?.isActive('code') && "bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  )}
                  title="Inline Code"
                  aria-label="Inline Code"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" className="w-4 h-4 fill-current">
                    <path d="M24 12l-5.657 5.657-1.414-1.414L21.172 12l-4.243-4.243 1.414-1.414L24 12zM2.828 12l4.243 4.243-1.414 1.414L0 12l5.657-5.657L7.07 7.757 2.828 12zm6.96 9H7.66l6.552-18h2.128L9.788 21z"></path>
                  </svg>
                </button>

                <button
                  type="button"
                  onClick={() => editor?.chain().focus().toggleCodeBlock().run()}
                  className={cn(
                    "p-2 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors text-gray-700 dark:text-gray-300",
                    editor?.isActive('codeBlock') && "bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  )}
                  title="Code Block"
                  aria-label="Code Block"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" className="w-4 h-4 fill-current">
                    <path d="M3 3h18a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1zm1 2v14h16V5H4zm4 4h8v2H8V9zm0 4h8v2H8v-2z"></path>
                  </svg>
                </button>

                <button
                  type="button"
                  onClick={() => editor?.chain().focus().setHorizontalRule().run()}
                  className={cn(
                    "p-2 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors text-gray-700 dark:text-gray-300"
                  )}
                  title="Horizontal Rule"
                  aria-label="Horizontal Rule"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" className="w-4 h-4 fill-current">
                    <path d="M2 11h20v2H2v-2z"></path>
                  </svg>
                </button>

                <div className="w-px h-6 mx-1 bg-gray-300 dark:bg-gray-600"></div>

                <button
                  type="button"
                  onClick={() => editor?.chain().focus().toggleTaskList().run()}
                  className={cn(
                    "p-2 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors text-gray-700 dark:text-gray-300",
                    editor?.isActive('taskList') && "bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  )}
                  title="Task List"
                  aria-label="Task List"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" className="w-4 h-4 fill-current">
                    <path d="M8.5 2h7a1.5 1.5 0 0 1 1.5 1.5v17a1.5 1.5 0 0 1-1.5 1.5h-7A1.5 1.5 0 0 1 7 20.5v-17A1.5 1.5 0 0 1 8.5 2zM9 4v16h6V4H9zm1 3h4v2h-4V7zm0 4h4v2h-4v-2zm0 4h4v2h-4v-2z"></path>
                  </svg>
                </button>

                <div className="w-px h-6 mx-1 bg-gray-300 dark:bg-gray-600"></div>

                <button
                  type="button"
                  onClick={() => editor?.chain().focus().toggleSubscript().run()}
                  className={cn(
                    "p-2 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors text-gray-700 dark:text-gray-300",
                    editor?.isActive('subscript') && "bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  )}
                  title="Subscript"
                  aria-label="Subscript"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" className="w-4 h-4 fill-current">
                    <path d="M5.596 4L10.5 12.096 15.404 4H18l-6.202 9.304L18 22h-2.596L10.5 13.904 5.596 22H3l6.202-9.696L3 4h2.596zM21.55 17.58a.8.8 0 0 0-.18-.375 1.4 1.4 0 0 0-.442-.28 1.8 1.8 0 0 0-.622-.1c-.256 0-.48.05-.672.15-.192.1-.343.24-.453.42-.11.18-.165.39-.165.63 0 .25.055.46.165.63.11.17.261.3.453.39.192.09.416.135.672.135.256 0 .48-.045.672-.135.192-.09.343-.22.453-.39.11-.17.165-.38.165-.63zm-.165 2.295c-.11.18-.261.32-.453.42-.192.1-.416.15-.672.15-.256 0-.48-.05-.672-.15a1.4 1.4 0 0 1-.453-.42c-.11-.18-.165-.39-.165-.63 0-.24.055-.45.165-.63.11-.18.261-.32.453-.42.192-.1.416-.15.672-.15.256 0 .48.05.672.15.192.1.343.24.453.42.11.18.165.39.165.63 0 .24-.055.45-.165.63z"></path>
                  </svg>
                </button>

                <button
                  type="button"
                  onClick={() => editor?.chain().focus().toggleSuperscript().run()}
                  className={cn(
                    "p-2 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors text-gray-700 dark:text-gray-300",
                    editor?.isActive('superscript') && "bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  )}
                  title="Superscript"
                  aria-label="Superscript"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" className="w-4 h-4 fill-current">
                    <path d="M5.596 8L10.5 16.096 15.404 8H18l-6.202 9.304L18 26h-2.596L10.5 17.904 5.596 26H3l6.202-9.696L3 8h2.596zM21.55 5.58a.8.8 0 0 0-.18-.375 1.4 1.4 0 0 0-.442-.28 1.8 1.8 0 0 0-.622-.1c-.256 0-.48.05-.672.15-.192.1-.343.24-.453.42-.11.18-.165.39-.165.63 0 .25.055.46.165.63.11.17.261.3.453.39.192.09.416.135.672.135.256 0 .48-.045.672-.135.192-.09.343-.22.453-.39.11-.17.165-.38.165-.63zm-.165 2.295c-.11.18-.261.32-.453.42-.192.1-.416.15-.672.15-.256 0-.48-.05-.672-.15a1.4 1.4 0 0 1-.453-.42c-.11-.18-.165-.39-.165-.63 0-.24.055-.45.165-.63.11-.18.261-.32.453-.42.192-.1.416-.15.672-.15.256 0 .48.05.672.15.192.1.343.24.453.42.11.18.165.39.165.63 0 .24-.055.45-.165.63z"></path>
                  </svg>
                </button>

                <button
                  type="button"
                  onClick={() => editor?.chain().focus().toggleHighlight().run()}
                  className={cn(
                    "p-2 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors text-gray-700 dark:text-gray-300",
                    editor?.isActive('highlight') && "bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  )}
                  title="Highlight"
                  aria-label="Highlight"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" className="w-4 h-4 fill-current">
                    <path d="M15.243 4.515l-6.738 6.737-.707 2.121-1.04 1.041 2.828 2.829 1.04-1.041 2.122-.707 6.737-6.738-4.242-4.242zm6.364 3.535a1 1 0 0 1 0 1.414l-7.779 7.779-2.12.707-1.415 1.414a1 1 0 0 1-1.414 0l-4.243-4.243a1 1 0 0 1 0-1.414l1.414-1.414.707-2.121 7.779-7.779a1 1 0 0 1 1.414 0l5.657 5.657zM6 19l2 2H3l3-2z"></path>
                  </svg>
                </button>

                <div className="flex gap-1">
                  {['#000000', '#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#8b5cf6', '#ec4899'].map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setTextColor(color)}
                      className="w-6 h-6 rounded border border-gray-300 dark:border-gray-600 hover:scale-110 transition-transform"
                      style={{ backgroundColor: color }}
                      title={`Text Color: ${color}`}
                      aria-label={`Set text color to ${color}`}
                    />
                  ))}
                </div>

                <div className="w-px h-6 mx-1 bg-gray-300 dark:bg-gray-600"></div>
              </>
            )}

            <button
              type="button"
              onClick={addLink}
              className={cn(
                "p-2 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors text-gray-700 dark:text-gray-300",
                editor?.isActive('link') && "bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              )}
              title="Link (Ctrl+K)"
              aria-label="Link"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" className="w-4 h-4 fill-current">
                <path d="M18.364 15.536 16.95 14.12l1.414-1.414a5 5 0 1 0-7.071-7.071L9.879 7.05 8.464 5.636 9.88 4.222a7 7 0 0 1 9.9 9.9l-1.415 1.414Zm-2.828 2.828-1.415 1.414a7 7 0 0 1-9.9-9.9l1.415-1.414L7.05 9.88l-1.414 1.414a5 5 0 1 0 7.071 7.071l1.414-1.414 1.415 1.414Zm-.708-10.607 1.415 1.415-7.071 7.07-1.415-1.414 7.071-7.07Z"></path>
              </svg>
            </button>

            {!simple && (
              <>
                <button
                  type="button"
                  onClick={addImage}
                  className={cn(
                    "p-2 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors text-gray-700 dark:text-gray-300"
                  )}
                  title="Image"
                  aria-label="Image"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" className="w-4 h-4 fill-current">
                    <path d="M2.9918 21C2.44405 21 2 20.5551 2 20.0066V3.9934C2 3.44476 2.45531 3 2.9918 3H21.0082C21.556 3 22 3.44495 22 3.9934V20.0066C22 20.5552 21.5447 21 21.0082 21H2.9918ZM20 15V5H4V19L14 9L20 15ZM20 17.8284L14 11.8284L6.82843 19H20V17.8284ZM8 11C6.89543 11 6 10.1046 6 9C6 7.89543 6.89543 7 8 7C9.10457 7 10 7.89543 10 9C10 10.1046 9.10457 11 8 11Z"></path>
                  </svg>
                </button>

                <button
                  type="button"
                  onClick={() => editor?.chain().focus().setHorizontalRule().run()}
                  className={cn(
                    "p-2 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors text-gray-700 dark:text-gray-300"
                  )}
                  title="Horizontal Rule"
                  aria-label="Horizontal Rule"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" className="w-4 h-4 fill-current">
                    <path d="M2 11h2v2H2v-2zm4 0h12v2H6v-2zm14 0h2v2h-2v-2z"></path>
                  </svg>
                </button>

                <div className="w-px h-6 mx-1 bg-gray-300 dark:bg-gray-600"></div>

                <button
                  type="button"
                  onClick={() => editor?.chain().focus().setTextAlign('left').run()}
                  className={cn(
                    "p-2 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors text-gray-700 dark:text-gray-300",
                    editor?.isActive({ textAlign: 'left' }) && "bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  )}
                  title="Align Left"
                  aria-label="Align Left"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" className="w-4 h-4 fill-current">
                    <path d="M3 4h18v2H3V4zm0 4h12v2H3V8zm0 4h18v2H3v-2zm0 4h12v2H3v-2z"></path>
                  </svg>
                </button>

                <button
                  type="button"
                  onClick={() => editor?.chain().focus().setTextAlign('center').run()}
                  className={cn(
                    "p-2 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors text-gray-700 dark:text-gray-300",
                    editor?.isActive({ textAlign: 'center' }) && "bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  )}
                  title="Align Center"
                  aria-label="Align Center"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" className="w-4 h-4 fill-current">
                    <path d="M3 4h18v2H3V4zm4 4h10v2H7V8zm-4 4h18v2H3v-2zm4 4h10v2H7v-2z"></path>
                  </svg>
                </button>

                <button
                  type="button"
                  onClick={() => editor?.chain().focus().setTextAlign('right').run()}
                  className={cn(
                    "p-2 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors text-gray-700 dark:text-gray-300",
                    editor?.isActive({ textAlign: 'right' }) && "bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  )}
                  title="Align Right"
                  aria-label="Align Right"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" className="w-4 h-4 fill-current">
                    <path d="M3 4h18v2H3V4zm6 4h12v2H9V8zm-6 4h18v2H3v-2zm6 4h12v2H9v-2z"></path>
                  </svg>
                </button>

                <button
                  type="button"
                  onClick={() => editor?.chain().focus().setTextAlign('justify').run()}
                  className={cn(
                    "p-2 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors text-gray-700 dark:text-gray-300",
                    editor?.isActive({ textAlign: 'justify' }) && "bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  )}
                  title="Justify"
                  aria-label="Justify"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" className="w-4 h-4 fill-current">
                    <path d="M3 4h18v2H3V4zm0 4h18v2H3V8zm0 4h18v2H3v-2zm0 4h18v2H3v-2z"></path>
                  </svg>
                </button>

                <div className="w-px h-6 mx-1 bg-gray-300 dark:bg-gray-600"></div>

                <button
                  type="button"
                  onClick={() => editor?.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}
                  className={cn(
                    "p-2 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors text-gray-700 dark:text-gray-300"
                  )}
                  title="Insert Table"
                  aria-label="Insert Table"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" className="w-4 h-4 fill-current">
                    <path d="M4 3h16a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1zm1 2v4h5V5H5zm7 0v4h7V5h-7zm7 6h-7v4h7v-4zm-9 4V11H5v4h3zm2 2v4h7v-4h-7zm-2 0H5v4h3v-4z"></path>
                  </svg>
                </button>

                <div className="w-px h-6 mx-1 bg-gray-300 dark:bg-gray-600"></div>

                <button
                  type="button"
                  onClick={() => editor?.chain().focus().undo().run()}
                  disabled={!editor?.can().undo()}
                  className={cn(
                    "p-2 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors text-gray-700 dark:text-gray-300",
                    !editor?.can().undo() && "opacity-50 cursor-not-allowed"
                  )}
                  title="Undo (Ctrl+Z)"
                  aria-label="Undo"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" className="w-4 h-4 fill-current">
                    <path d="M5.828 7l2.536 2.536L6.95 10.95 2 6l4.95-4.95 1.414 1.414L5.828 5H13a8 8 0 1 1 0 16H4v-2h9a6 6 0 1 0 0-12H5.828z"></path>
                  </svg>
                </button>

                <button
                  type="button"
                  onClick={() => editor?.chain().focus().redo().run()}
                  disabled={!editor?.can().redo()}
                  className={cn(
                    "p-2 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors text-gray-700 dark:text-gray-300",
                    !editor?.can().redo() && "opacity-50 cursor-not-allowed"
                  )}
                  title="Redo (Ctrl+Y)"
                  aria-label="Redo"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" className="w-4 h-4 fill-current">
                    <path d="M18.172 7H11a6 6 0 1 0 0 12h9v2h-9a8 8 0 1 1 0-16h7.172l-2.536-2.536L17.05 1.05 22 6l-4.95 4.95-1.414-1.414L18.172 7z"></path>
                  </svg>
                </button>
              </>
            )}
          </div>
        )}

        <EditorContent
          editor={editor}
          className={cn(
            "prose dark:prose-invert max-w-none p-4",
            "focus:outline-none",
            "bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100",
            "prose-headings:text-gray-900 dark:prose-headings:text-gray-100",
            "prose-p:text-gray-800 dark:prose-p:text-gray-200",
            "prose-strong:text-gray-900 dark:prose-strong:text-gray-100",
            "prose-em:text-gray-800 dark:prose-em:text-gray-200",
            "prose-code:text-gray-900 dark:prose-code:text-gray-100 prose-code:bg-gray-100 dark:prose-code:bg-gray-800",
            "prose-blockquote:text-gray-700 dark:prose-blockquote:text-gray-300 prose-blockquote:border-gray-300 dark:prose-blockquote:border-gray-600",
            "prose-li:text-gray-800 dark:prose-li:text-gray-200",
            "prose-a:text-blue-600 dark:prose-a:text-blue-400",
            disabled ? "opacity-75 cursor-not-allowed" : "cursor-text",
            // Fix black box and cursor issues
            "[&_.ProseMirror]:focus-visible:outline-none",
            "[&_.ProseMirror]:focus:outline-none",
            "[&_.ProseMirror]:focus:ring-0",
            "[&_.ProseMirror]:focus:border-transparent",
            "[&_.ProseMirror]:focus:shadow-none",
            "[&_.ProseMirror]:caret-color-current",
            "[&_.ProseMirror]:selection:bg-blue-200",
            "[&_.ProseMirror]:dark:selection:bg-blue-800",
            // Force theme inheritance for TipTap content
            resolvedTheme === 'dark' ? 'dark' : ''
          )}
          style={{
            minHeight,
            // Additional inline styles to prevent black box
            '--tw-ring-shadow': 'none',
            '--tw-ring-offset-shadow': 'none',
          } as React.CSSProperties}
          data-theme={resolvedTheme}
        />

        {editor && (
          <BubbleMenu editor={editor} tippyOptions={{ duration: 100 }}>
            <div
              className="flex bg-white dark:bg-gray-800 shadow-lg rounded-md overflow-hidden border border-gray-200 dark:border-gray-700"
              data-theme={resolvedTheme}
            >
              <button
                onClick={() => editor.chain().focus().toggleBold().run()}
                className={cn(
                  "p-2 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-gray-700 dark:text-gray-300",
                  editor.isActive('bold') && "bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                )}
                title="Bold"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" className="w-4 h-4 fill-current">
                  <path d="M8 11h4.5a2.5 2.5 0 1 0 0-5H8v5Zm10 4.5a4.5 4.5 0 0 1-4.5 4.5H6V4h6.5a4.5 4.5 0 0 1 3.256 7.613A4.5 4.5 0 0 1 18 15.5ZM8 13v5h5.5a2.5 2.5 0 1 0 0-5H8Z"></path>
                </svg>
              </button>
              <button
                onClick={() => editor.chain().focus().toggleItalic().run()}
                className={cn(
                  "p-2 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-gray-700 dark:text-gray-300",
                  editor.isActive('italic') && "bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                )}
                title="Italic"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" className="w-4 h-4 fill-current">
                  <path d="M15 20H7v-2h2.927l2.116-12H9V4h8v2h-2.927l-2.116 12H15v2Z"></path>
                </svg>
              </button>
              <button
                onClick={() => editor.chain().focus().toggleUnderline().run()}
                className={cn(
                  "p-2 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-gray-700 dark:text-gray-300",
                  editor.isActive('underline') && "bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                )}
                title="Underline"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" className="w-4 h-4 fill-current">
                  <path d="M8 3v9a4 4 0 1 0 8 0V3h2v9a6 6 0 1 1-12 0V3h2ZM4 20h16v2H4v-2Z"></path>
                </svg>
              </button>
              <button
                onClick={() => editor.chain().focus().toggleStrike().run()}
                className={cn(
                  "p-2 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-gray-700 dark:text-gray-300",
                  editor.isActive('strike') && "bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                )}
                title="Strikethrough"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" className="w-4 h-4 fill-current">
                  <path d="M17.154 14c.23.516.346 1.09.346 1.72 0 1.342-.524 2.392-1.571 3.147C14.88 19.622 13.433 20 11.586 20c-1.64 0-3.263-.381-4.87-1.144V16.6c1.52.877 3.075 1.316 4.666 1.316 2.551 0 3.83-.732 3.839-2.197a2.21 2.21 0 0 0-.648-1.603l-.12-.117H17.154zm-7.984-4h-2.32c0-1.287.138-2.316.414-3.077.276-.762.687-1.347 1.234-1.756.547-.408 1.244-.612 2.091-.612.27 0 .538.012.803.035v2.138a4.89 4.89 0 0 0-.481-.035c-.822 0-1.277.732-1.365 2.197a6.04 6.04 0 0 0-.376.11zm9.75 0H22v2H2v-2h7.014c.05.328.05.661 0 1.02.138.317.138.661 0 1.02H2v2h20v-2h-3.08z"></path>
                </svg>
              </button>
              <button
                onClick={() => editor.chain().focus().toggleHighlight().run()}
                className={cn(
                  "p-2 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-gray-700 dark:text-gray-300",
                  editor.isActive('highlight') && "bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                )}
                title="Highlight"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" className="w-4 h-4 fill-current">
                  <path d="M15.243 4.515l-6.738 6.737-.707 2.121-1.04 1.041 2.828 2.829 1.04-1.041 2.122-.707 6.737-6.738-4.242-4.242zm6.364 3.535a1 1 0 0 1 0 1.414l-7.779 7.779-2.12.707-1.415 1.414a1 1 0 0 1-1.414 0l-4.243-4.243a1 1 0 0 1 0-1.414l1.414-1.414.707-2.121 7.779-7.779a1 1 0 0 1 1.414 0l5.657 5.657zM6 19l2 2H3l3-2z"></path>
                </svg>
              </button>
              <button
                onClick={addLink}
                className={cn(
                  "p-2 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-gray-700 dark:text-gray-300",
                  editor.isActive('link') && "bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                )}
                title="Link"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" className="w-4 h-4 fill-current">
                  <path d="M18.364 15.536 16.95 14.12l1.414-1.414a5 5 0 1 0-7.071-7.071L9.879 7.05 8.464 5.636 9.88 4.222a7 7 0 0 1 9.9 9.9l-1.415 1.414Zm-2.828 2.828-1.415 1.414a7 7 0 0 1-9.9-9.9l1.415-1.414L7.05 9.88l-1.414 1.414a5 5 0 1 0 7.071 7.071l1.414-1.414 1.415 1.414Zm-.708-10.607 1.415 1.415-7.071 7.07-1.415-1.414 7.071-7.07Z"></path>
                </svg>
              </button>
            </div>
          </BubbleMenu>
        )}
      </div>
    </div>
  );
};

export default RichTextEditor;
