/**
 * Rich Text Editor UI Component
 * Wrapper around the activities RichTextEditor for consistent UI usage
 */

'use client';

import { RichTextEditor as ActivityRichTextEditor } from '@/features/activties/components/ui/RichTextEditor';

// Re-export the component with the same interface
export const RichTextEditor = ActivityRichTextEditor;

// Re-export the props type if needed
export type { RichTextEditorProps } from '@/features/activties/components/ui/RichTextEditor';
