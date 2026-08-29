import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import TextAlign from '@tiptap/extension-text-align';
import { useEffect } from 'react';
import {
  Undo2,
  Redo2,
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  AlignLeft,
  AlignCenter,
  AlignRight,
  List,
  ListOrdered,
  Quote,
  Code,
  Type,
} from 'lucide-react';

interface RichTextEditorProps {
  value: string;
  onChange: (content: string) => void;
  placeholder?: string;
}

export default function RichTextEditor({
  value,
  onChange,
  placeholder = 'Type Your Reply...',
}: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        // StarterKit v3 bundles Underline — no separate import needed
      }),
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
    ],
    content: value,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: 'tiptap focus:outline-none min-h-[240px] p-5 text-sm text-gray-800',
        'data-placeholder': placeholder,
      },
    },
  });

  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      if (editor.getText() === '' && value === '') return;
    }
  }, [value, editor]);

  if (!editor) return null;

  return (
    <div className="w-full border border-gray-200 rounded-xl bg-white overflow-hidden font-sans">
      {/* 1. Formatting Toolbar directly above/integrated */}
      <div className="flex items-center flex-wrap gap-1 px-3.5 py-2.5 bg-gray-50/80 border-b border-gray-100 text-gray-600 text-sm">
        {/* Undo */}
        <button
          type="button"
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
          className="p-2 hover:bg-gray-200/70 rounded-lg text-gray-600 disabled:opacity-30 transition-colors cursor-pointer"
          title="Undo"
        >
          <Undo2 className="w-4 h-4" />
        </button>

        {/* Redo */}
        <button
          type="button"
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
          className="p-2 hover:bg-gray-200/70 rounded-lg text-gray-600 disabled:opacity-30 transition-colors cursor-pointer"
          title="Redo"
        >
          <Redo2 className="w-4 h-4" />
        </button>

        <div className="w-px h-4 bg-gray-300 mx-1" />

        {/* Font Size Type */}
        <button
          type="button"
          className="p-2 hover:bg-gray-200/70 rounded-lg text-gray-700 font-semibold flex items-center gap-1 transition-colors cursor-pointer"
          title="Font Size"
        >
          <Type className="w-4 h-4" />
        </button>

        <div className="w-px h-4 bg-gray-300 mx-1" />

        {/* Bold */}
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={`p-2 rounded-lg transition-colors cursor-pointer ${
            editor.isActive('bold')
              ? 'bg-green-100 text-green-700 font-bold'
              : 'hover:bg-gray-200/70 text-gray-700'
          }`}
          title="Bold"
        >
          <Bold className="w-4 h-4" />
        </button>

        {/* Italic */}
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={`p-2 rounded-lg transition-colors cursor-pointer ${
            editor.isActive('italic')
              ? 'bg-green-100 text-green-700'
              : 'hover:bg-gray-200/70 text-gray-700'
          }`}
          title="Italic"
        >
          <Italic className="w-4 h-4" />
        </button>

        {/* Underline */}
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          className={`p-2 rounded-lg transition-colors cursor-pointer ${
            editor.isActive('underline')
              ? 'bg-green-100 text-green-700'
              : 'hover:bg-gray-200/70 text-gray-700'
          }`}
          title="Underline"
        >
          <UnderlineIcon className="w-4 h-4" />
        </button>

        {/* Strikethrough */}
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleStrike().run()}
          className={`p-2 rounded-lg transition-colors cursor-pointer ${
            editor.isActive('strike')
              ? 'bg-green-100 text-green-700'
              : 'hover:bg-gray-200/70 text-gray-700'
          }`}
          title="Strikethrough"
        >
          <Strikethrough className="w-4 h-4" />
        </button>

        <div className="w-px h-4 bg-gray-300 mx-1" />

        {/* Align Left */}
        <button
          type="button"
          onClick={() => editor.chain().focus().setTextAlign('left').run()}
          className={`p-2 rounded-lg transition-colors cursor-pointer ${
            editor.isActive({ textAlign: 'left' })
              ? 'bg-green-100 text-green-700'
              : 'hover:bg-gray-200/70 text-gray-700'
          }`}
          title="Align Left"
        >
          <AlignLeft className="w-4 h-4" />
        </button>

        {/* Align Center */}
        <button
          type="button"
          onClick={() => editor.chain().focus().setTextAlign('center').run()}
          className={`p-2 rounded-lg transition-colors cursor-pointer ${
            editor.isActive({ textAlign: 'center' })
              ? 'bg-green-100 text-green-700'
              : 'hover:bg-gray-200/70 text-gray-700'
          }`}
          title="Align Center"
        >
          <AlignCenter className="w-4 h-4" />
        </button>

        {/* Align Right */}
        <button
          type="button"
          onClick={() => editor.chain().focus().setTextAlign('right').run()}
          className={`p-2 rounded-lg transition-colors cursor-pointer ${
            editor.isActive({ textAlign: 'right' })
              ? 'bg-green-100 text-green-700'
              : 'hover:bg-gray-200/70 text-gray-700'
          }`}
          title="Align Right"
        >
          <AlignRight className="w-4 h-4" />
        </button>

        <div className="w-px h-4 bg-gray-300 mx-1" />

        {/* Bullet List */}
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={`p-2 rounded-lg transition-colors cursor-pointer ${
            editor.isActive('bulletList')
              ? 'bg-green-100 text-green-700'
              : 'hover:bg-gray-200/70 text-gray-700'
          }`}
          title="Bullet List"
        >
          <List className="w-4 h-4" />
        </button>

        {/* Ordered List */}
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={`p-2 rounded-lg transition-colors cursor-pointer ${
            editor.isActive('orderedList')
              ? 'bg-green-100 text-green-700'
              : 'hover:bg-gray-200/70 text-gray-700'
          }`}
          title="Numbered List"
        >
          <ListOrdered className="w-4 h-4" />
        </button>

        <div className="w-px h-4 bg-gray-300 mx-1" />

        {/* Blockquote */}
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          className={`p-2 rounded-lg transition-colors cursor-pointer ${
            editor.isActive('blockquote')
              ? 'bg-green-100 text-green-700'
              : 'hover:bg-gray-200/70 text-gray-700'
          }`}
          title="Quote"
        >
          <Quote className="w-4 h-4" />
        </button>

        {/* Code */}
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleCode().run()}
          className={`p-2 rounded-lg transition-colors cursor-pointer ${
            editor.isActive('code')
              ? 'bg-green-100 text-green-700'
              : 'hover:bg-gray-200/70 text-gray-700'
          }`}
          title="Code"
        >
          <Code className="w-4 h-4" />
        </button>
      </div>

      {/* 2. Editor Content Area */}
      <div className="bg-white min-h-[200px]">
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}
