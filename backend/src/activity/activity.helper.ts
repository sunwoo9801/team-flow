import { CardActionType } from '@prisma/client';

interface ActivityMetadata {
  field?: string;
  before?: unknown;
  after?: unknown;
  extra?: unknown;
}

export function formatActivityMessage(
  actionType: CardActionType,
  metadata: ActivityMetadata | null,
  actorName: string,
): string {
  switch (actionType) {
    case CardActionType.CARD_CREATED:
      return `${actorName}이(가) 카드를 생성했습니다.`;
    case CardActionType.CARD_TITLE_UPDATED:
      return `${actorName}이(가) 제목을 "${metadata?.before}" → "${metadata?.after}"(으)로 변경했습니다.`;
    case CardActionType.CARD_DESCRIPTION_UPDATED:
      return `${actorName}이(가) 설명을 수정했습니다.`;
    case CardActionType.CARD_MOVED:
      return `${actorName}이(가) 카드를 다른 컬럼으로 이동했습니다.`;
    case CardActionType.CARD_ASSIGNEE_CHANGED:
      return metadata?.after
        ? `${actorName}이(가) 담당자를 지정했습니다.`
        : `${actorName}이(가) 담당자를 해제했습니다.`;
    case CardActionType.CARD_DUE_DATE_CHANGED:
      return metadata?.after
        ? `${actorName}이(가) 마감일을 설정했습니다.`
        : `${actorName}이(가) 마감일을 삭제했습니다.`;
    case CardActionType.COMMENT_ADDED:
      return `${actorName}이(가) 댓글을 남겼습니다.`;
    case CardActionType.COMMENT_DELETED:
      return `${actorName}이(가) 댓글을 삭제했습니다.`;
    case CardActionType.ATTACHMENT_ADDED:
      return `${actorName}이(가) 첨부파일을 추가했습니다.`;
    case CardActionType.ATTACHMENT_DELETED:
      return `${actorName}이(가) 첨부파일을 삭제했습니다.`;
    case CardActionType.LABEL_ADDED:
      return `${actorName}이(가) 라벨을 추가했습니다.`;
    case CardActionType.LABEL_REMOVED:
      return `${actorName}이(가) 라벨을 제거했습니다.`;
    default:
      return `${actorName}이(가) 카드를 수정했습니다.`;
  }
}
