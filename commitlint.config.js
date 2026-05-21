/** @type {import('@commitlint/types').UserConfig} */
export default {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [
      2,
      'always',
      [
        'feat', // 새로운 기능
        'fix', // 버그 수정
        'docs', // 문서 변경
        'style', // 코드 포맷 (로직 변경 없음)
        'refactor', // 리팩토링
        'test', // 테스트 추가/수정
        'chore', // 빌드/설정 변경
        'perf', // 성능 개선
        'ci', // CI 설정 변경
        'revert', // 커밋 되돌리기
      ],
    ],
    'subject-case': [2, 'always', 'sentence-case'],
    'subject-max-length': [2, 'always', 72],
    'body-max-line-length': [2, 'always', 100],
  },
};
