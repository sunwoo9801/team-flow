/**
 * mention 데이터를 백엔드 파싱 형식으로 직렬화/역직렬화합니다.
 *
 * 저장 형식: @[이름](userId)
 * 표시 형식: @이름 (하이라이트)
 */

export interface MentionUser {
  id: string;
  name: string;
}

export function serializeMentions(text: string, mentions: MentionUser[]): string {
  let result = text;
  for (const m of mentions) {
    result = result.replace(new RegExp(`@${m.name}(?=\\s|$)`, 'g'), `@[${m.name}](${m.id})`);
  }
  return result;
}

export function deserializeMentions(text: string): string {
  return text.replace(/@\[(.+?)\]\(.+?\)/g, '@$1');
}

export function extractMentionedIds(text: string): string[] {
  const regex = /@\[.+?\]\((.+?)\)/g;
  const ids: string[] = [];
  let match: RegExpExecArray | null;
  while ((match = regex.exec(text)) !== null) {
    if (match[1] && !ids.includes(match[1])) ids.push(match[1]);
  }
  return ids;
}
