import { ArrowUpIcon } from 'lucide-react';
import { type ChangeEvent, useEffect, useRef, useState } from 'react';
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupTextarea,
} from '../ui/input-group';

type MessageComposerProps = {
  onSend: (content: string) => Promise<void> | void;
  onTyping?: () => void;
  onStopTyping?: () => void;
  disabled?: boolean;
  placeholder?: string;
};

const MAX_CHAR_LIMIT = 4000;

const MessageComposor = ({
  placeholder,
  disabled,
  onSend,
  onStopTyping,
  onTyping,
}: MessageComposerProps) => {
  const [content, setContent] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleInput = (e: ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setContent(val);

    if (val.trim().length > 0) {
      onTyping?.();
    } else {
      onStopTyping?.();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSend = async () => {
    const trimmed = content.trim();
    if (!trimmed || disabled || trimmed.length > MAX_CHAR_LIMIT) {
      return;
    }

    setContent('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }

    onStopTyping?.();
    await onSend(trimmed);
  };

  // Auto-focus composer input when conversation changes
  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  const isOverLimit = content.length > MAX_CHAR_LIMIT;
  const isNearLimit = content.length > MAX_CHAR_LIMIT - 200;

  return (
    <div className="p-4 w-full">
      <InputGroup>
        <InputGroupTextarea
          aria-label="Message"
          className="min-h-14 outline-0 ring-0"
          onChange={handleInput}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          value={content}
          autoFocus
          ref={textareaRef}
        />
        <InputGroupAddon align="block-end" className="pt-1">
          {/* <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <InputGroupButton
                    aria-label="Add context"
                    size="icon-sm"
                    type="button"
                    variant="outline"
                  />
                }
              >
                <PlusIcon aria-hidden="true" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-44" side="top">
                <DropdownMenuItem>
                  <PaperclipIcon aria-hidden="true" />
                  Add Photos & Files
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <TelescopeIcon aria-hidden="true" />
                  Deep Research
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <GlobeIcon aria-hidden="true" />
                  Web Search
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu> */}

          {content.length > 0 && (
            <span
              className={`text-sm ${
                isOverLimit
                  ? 'text-red-400 font-semibold'
                  : isNearLimit
                    ? 'text-amber-400'
                    : 'text-muted-foreground'
              }`}
            >
              {content.length}/{MAX_CHAR_LIMIT}
            </span>
          )}

          <InputGroupButton
            className="ms-auto"
            onClick={handleSend}
            disabled={disabled || !content.trim() || isOverLimit}
            size="icon-sm"
            type="submit"
            variant="default"
          >
            <ArrowUpIcon aria-hidden="true" />
            <span className="sr-only">Send</span>
          </InputGroupButton>
        </InputGroupAddon>
      </InputGroup>
    </div>
  );
};

export default MessageComposor;
