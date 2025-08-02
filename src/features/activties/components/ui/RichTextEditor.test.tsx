'use client';

import React, { useState } from 'react';
import { RichTextEditor } from './RichTextEditor';

/**
 * Test component for RichTextEditor
 * This component demonstrates the enhanced RichTextEditor with theme support and comprehensive tools
 */
export const RichTextEditorTest: React.FC = () => {
  const [content, setContent] = useState('<p>Welcome to the enhanced Rich Text Editor!</p><p>Try out the new features:</p><ul><li>Bold, italic, underline, strikethrough</li><li>Multiple heading levels (H1, H2, H3)</li><li>Lists (bullet, numbered, task lists)</li><li>Text alignment (left, center, right, justify)</li><li>Text colors and highlighting</li><li>Code blocks and inline code</li><li>Tables, quotes, and horizontal rules</li><li>Subscript and superscript</li><li>Links and images</li></ul>');
  const [simpleContent, setSimpleContent] = useState('<p>This is a simple editor with fewer tools.</p>');

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
          Enhanced Rich Text Editor Test
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Testing the updated RichTextEditor with comprehensive tools and proper theme support
        </p>
      </div>

      {/* Full Featured Editor */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
          Full Featured Editor
        </h2>
        <RichTextEditor
          content={content}
          onChange={setContent}
          placeholder="Start typing with full features..."
          label="Rich Text Content"
          minHeight="300px"
          className="w-full"
        />
      </div>

      {/* Simple Editor */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
          Simple Editor (Limited Tools)
        </h2>
        <RichTextEditor
          content={simpleContent}
          onChange={setSimpleContent}
          placeholder="Simple editor with basic tools..."
          label="Simple Content"
          minHeight="200px"
          simple={true}
          className="w-full"
        />
      </div>

      {/* Disabled Editor */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
          Disabled Editor (Read-only)
        </h2>
        <RichTextEditor
          content="<p>This editor is disabled and shows read-only content with proper theme styling.</p>"
          onChange={() => {}}
          placeholder="Disabled editor..."
          label="Read-only Content"
          minHeight="150px"
          disabled={true}
          className="w-full"
        />
      </div>

      {/* Content Preview */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
          Content Preview (HTML Output)
        </h2>
        <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-md border border-gray-200 dark:border-gray-700">
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Full Editor HTML:
          </h3>
          <pre className="text-xs text-gray-600 dark:text-gray-400 whitespace-pre-wrap break-all">
            {content}
          </pre>
        </div>
        <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-md border border-gray-200 dark:border-gray-700">
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Simple Editor HTML:
          </h3>
          <pre className="text-xs text-gray-600 dark:text-gray-400 whitespace-pre-wrap break-all">
            {simpleContent}
          </pre>
        </div>
      </div>

      {/* Theme Testing Instructions */}
      <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-md border border-blue-200 dark:border-blue-800">
        <h3 className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-2">
          Theme Testing Instructions:
        </h3>
        <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
          <li>• Toggle between light and dark mode to test theme adaptation</li>
          <li>• Check that all toolbar buttons are visible and properly styled</li>
          <li>• Verify that text content has good contrast in both themes</li>
          <li>• Test the bubble menu by selecting text</li>
          <li>• Try all formatting options and color selections</li>
          <li>• Test table insertion and manipulation</li>
          <li>• Verify that focus states and hover effects work properly</li>
        </ul>
      </div>
    </div>
  );
};

export default RichTextEditorTest;
