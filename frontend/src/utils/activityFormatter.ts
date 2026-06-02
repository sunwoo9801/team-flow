export function formatActivityMessage(
  actionType: string,
  metadata: Record<string, unknown> | null,
  actorName: string
): string {
  switch (actionType) {
    case 'CARD_CREATED':
      return `${actorName}이(가) 카드를 생성했습니다.`;
    case 'CARD_TITLE_UPDATED':
      return `${actorName}이(가) 제목을 "${metadata?.before}" → "${metadata?.after}"(으)로 변경했습니다.`;
    case 'CARD_DESCRIPTION_UPDATED':
      return `${actorName}이(가) 설명을 수정했습니다.`;
    case 'CARD_MOVED':
      return `${actorName}이(가) 카드를 다른 컬럼으로 이동했습니다.`;
    case 'CARD_ASSIGNEE_CHANGED':
      return metadata?.after
        ? `${actorName}이(가) 담당자를 지정했습니다.`
        : `${actorName}이(가) 담당자를 해제했습니다.`;
    case 'CARD_DUE_DATE_CHANGED':
      return metadata?.after
        ? `${actorName}이(가) 마감일을 설정했습니다.`
        : `${actorName}이(가) 마감일을 삭제했습니다.`;
    case 'COMMENT_ADDED':
      return `${actorName}이(가) 댓글을 남겼습니다.`;
    case 'COMMENT_DELETED':
      return `${actorName}이(가) 댓글을 삭제했습니다.`;
    case 'ATTACHMENT_ADDED':
      return `${actorName}이(가) 첨부파일을 추가했습니다.`;
    case 'ATTACHMENT_DELETED':
      return `${actorName}이(가) 첨부파일을 삭제했습니다.`;
    case 'LABEL_ADDED':
      return `${actorName}이(가) 라벨을 추가했습니다.`;
    case 'LABEL_REMOVED':
      return `${actorName}이(가) 라벨을 제거했습니다.`;
    default:
      return `${actorName}이(가) 카드를 수정했습니다.`;
  }
}

export function formatRelativeTime(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffSec < 60) return '방금 전';
  if (diffMin < 60) return `${diffMin}분 전`;
  if (diffHour < 24) return `${diffHour}시간 전`;
  if (diffDay < 7) return `${diffDay}일 전`;
  return date.toLocaleDateString('ko-KR');
}
