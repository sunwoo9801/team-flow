/**
 * 댓글/설명 텍스트에서 @멘션된 userId 목록을 추출합니다.
 *
 * 프론트에서 mention 데이터를 `@[이름](userId)` 형식으로 직렬화해서 전송합니다.
 * 예: "안녕하세요 @[홍길동](cuid_abc123) 확인 부탁드려요"
 */
export function parseMentionedUserIds(text: string): string[] {
  const regex = /@\[.+?\]\((.+?)\)/g;
  const ids: string[] = [];
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    if (match[1] && !ids.includes(match[1])) {
      ids.push(match[1]);
    }
  }

  return ids;
}
