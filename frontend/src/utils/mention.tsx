import type { ReactNode } from 'react';

const MENTION_REGEX = /@\[(.+?)\]\((.+?)\)/g;

export function serializeMention(name: string, userId: string): string {
  return `@[${name}](${userId})`;
}

export function renderMentionContent(content: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  const regex = new RegExp(MENTION_REGEX);
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let key = 0;

  while ((match = regex.exec(content)) !== null) {
    if (match.index > lastIndex) {
      nodes.push(content.slice(lastIndex, match.index));
    }
    nodes.push(
      <span key={`mention-${key++}`} className="text-blue-600 font-medium">
        @{match[1]}
      </span>
    );
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < content.length) nodes.push(content.slice(lastIndex));
  return nodes;
}
