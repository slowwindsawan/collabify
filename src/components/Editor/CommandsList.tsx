import React, { forwardRef, useEffect, useImperativeHandle, useState } from 'react';
import { 
  Text, 
  Heading1, 
  Heading2, 
  List, 
  ListOrdered, 
  CheckSquare, 
  Code, 
  Quote 
} from 'lucide-react';
import { useThemeStore } from '../../store/themeStore';

const CommandsList = forwardRef((props: any, ref) => {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const { mode } = useThemeStore();

  const selectItem = (index: number) => {
    const item = props.items[index];
    if (item) {
      props.command(item);
    }
  };

  const upHandler = () => {
    setSelectedIndex((selectedIndex + props.items.length - 1) % props.items.length);
  };

  const downHandler = () => {
    setSelectedIndex((selectedIndex + 1) % props.items.length);
  };

  const enterHandler = () => {
    selectItem(selectedIndex);
  };

  useEffect(() => setSelectedIndex(0), [props.items]);

  useImperativeHandle(ref, () => ({
    onKeyDown: ({ event }: { event: KeyboardEvent }) => {
      if (event.key === 'ArrowUp') {
        upHandler();
        return true;
      }

      if (event.key === 'ArrowDown') {
        downHandler();
        return true;
      }

      if (event.key === 'Enter') {
        enterHandler();
        return true;
      }

      return false;
    },
  }));

  const getIcon = (iconName: string) => {
    const iconProps = { size: 16 };
    switch (iconName) {
      case 'text':
        return <Text {...iconProps} />;
      case 'h-1':
        return <Heading1 {...iconProps} />;
      case 'h-2':
        return <Heading2 {...iconProps} />;
      case 'list':
        return <List {...iconProps} />;
      case 'list-ordered':
        return <ListOrdered {...iconProps} />;
      case 'check-square':
        return <CheckSquare {...iconProps} />;
      case 'code':
        return <Code {...iconProps} />;
      case 'quote':
        return <Quote {...iconProps} />;
      default:
        return <Text {...iconProps} />;
    }
  };

  return (
    <div className={`rounded-lg shadow-lg overflow-hidden ${mode === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border`}>
      <div className="max-h-[300px] overflow-y-auto p-2">
        {props.items.length ? (
          props.items.map((item: any, index: number) => (
            <button
              key={index}
              onClick={() => selectItem(index)}
              className={`
                w-full flex items-start p-2 rounded-md text-left
                ${mode === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}
                ${index === selectedIndex ? (mode === 'dark' ? 'bg-gray-700' : 'bg-gray-100') : ''}
              `}
            >
              <div className={`mr-2 mt-1 ${mode === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                {getIcon(item.icon)}
              </div>
              <div>
                <div className={`font-medium ${mode === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                  {item.title}
                </div>
                <div className={`text-sm ${mode === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                  {item.description}
                </div>
              </div>
            </button>
          ))
        ) : (
          <div className={`p-2 ${mode === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
            No results
          </div>
        )}
      </div>
    </div>
  );
});

CommandsList.displayName = 'CommandsList';

export default CommandsList;