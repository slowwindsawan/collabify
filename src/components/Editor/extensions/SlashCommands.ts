import { Extension } from '@tiptap/core';
import Suggestion from '@tiptap/suggestion';
import { ReactRenderer } from '@tiptap/react';
import tippy from 'tippy.js';
import CommandsList from '../CommandsList';

const SlashCommands = Extension.create({
  name: 'slashCommands',

  addOptions() {
    return {
      suggestion: {
        char: '/',
        command: ({ editor, range, props }) => {
          props.command({ editor, range });
        },
      },
    };
  },

  addProseMirrorPlugins() {
    return [
      Suggestion({
        editor: this.editor,
        ...this.options.suggestion,
        items: ({ query }) => {
          const commands = [
            {
              title: 'Text',
              description: 'Just start writing with plain text',
              searchTerms: ['text', 'plain', 'paragraph'],
              icon: 'text',
              command: ({ editor, range }) => {
                editor
                  .chain()
                  .focus()
                  .deleteRange(range)
                  .toggleNode('paragraph', 'paragraph')
                  .run();
              },
            },
            {
              title: 'Heading 1',
              description: 'Large section heading',
              searchTerms: ['title', 'big', 'large', 'h1'],
              icon: 'h-1',
              command: ({ editor, range }) => {
                editor
                  .chain()
                  .focus()
                  .deleteRange(range)
                  .setNode('heading', { level: 1 })
                  .run();
              },
            },
            {
              title: 'Heading 2',
              description: 'Medium section heading',
              searchTerms: ['subtitle', 'medium', 'h2'],
              icon: 'h-2',
              command: ({ editor, range }) => {
                editor
                  .chain()
                  .focus()
                  .deleteRange(range)
                  .setNode('heading', { level: 2 })
                  .run();
              },
            },
            {
              title: 'Bullet List',
              description: 'Create a simple bullet list',
              searchTerms: ['unordered', 'points', 'bullets'],
              icon: 'list',
              command: ({ editor, range }) => {
                editor
                  .chain()
                  .focus()
                  .deleteRange(range)
                  .toggleBulletList()
                  .run();
              },
            },
            {
              title: 'Numbered List',
              description: 'Create a numbered list',
              searchTerms: ['ordered', 'numbers'],
              icon: 'list-ordered',
              command: ({ editor, range }) => {
                editor
                  .chain()
                  .focus()
                  .deleteRange(range)
                  .toggleOrderedList()
                  .run();
              },
            },
            {
              title: 'Task List',
              description: 'Track tasks with a to-do list',
              searchTerms: ['todo', 'task', 'checkbox', 'check'],
              icon: 'check-square',
              command: ({ editor, range }) => {
                editor
                  .chain()
                  .focus()
                  .deleteRange(range)
                  .toggleTaskList()
                  .run();
              },
            },
            {
              title: 'Code Block',
              description: 'Add code with syntax highlighting',
              searchTerms: ['codeblock', 'fence', 'programming'],
              icon: 'code',
              command: ({ editor, range }) => {
                editor
                  .chain()
                  .focus()
                  .deleteRange(range)
                  .toggleCodeBlock()
                  .run();
              },
            },
            {
              title: 'Quote',
              description: 'Capture a quote',
              searchTerms: ['blockquote', 'quotation'],
              icon: 'quote',
              command: ({ editor, range }) => {
                editor
                  .chain()
                  .focus()
                  .deleteRange(range)
                  .toggleBlockquote()
                  .run();
              },
            },
          ];

          return commands.filter(item => {
            if (typeof query === 'string' && query.length > 0) {
              const search = query.toLowerCase();
              return (
                item.title.toLowerCase().includes(search) ||
                item.description.toLowerCase().includes(search) ||
                item.searchTerms.some(term => term.includes(search))
              );
            }
            return true;
          });
        },
        render: () => {
          let component;
          let popup;

          return {
            onStart: props => {
              component = new ReactRenderer(CommandsList, {
                props,
                editor: props.editor,
              });

              popup = tippy('body', {
                getReferenceClientRect: props.clientRect,
                appendTo: () => document.body,
                content: component.element,
                showOnCreate: true,
                interactive: true,
                trigger: 'manual',
                placement: 'bottom-start',
              });
            },
            onUpdate(props) {
              component.updateProps(props);

              popup[0].setProps({
                getReferenceClientRect: props.clientRect,
              });
            },
            onKeyDown(props) {
              if (props.event.key === 'Escape') {
                popup[0].hide();
                return true;
              }

              return component.ref?.onKeyDown(props);
            },
            onExit() {
              popup[0].destroy();
              component.destroy();
            },
          };
        },
      }),
    ];
  },
});

export default SlashCommands;