GET /api/workers/alerts 사고·알림 기록 연동 패치

적용 파일
- src/pages/Records.jsx

전제
- 이전 패치의 src/api/workerStatus.js가 존재해야 합니다.
- workerStatus.js 안에 getWorkerAlerts()가 포함되어 있습니다.

적용:
unzip -o ~/Downloads/worker-alerts-records-patch.zip -d .

그 다음:
npm run dev

동작:
- 사고·알림 기록 페이지 진입 시 GET /api/workers/alerts 자동 호출
- '추락' 탭은 실제 서버 추락 이력으로 표시
- 전체 탭에도 서버 추락 이력 반영
- deviceId로 작업자 이름/위치 매칭
- 상단 새로고침 버튼으로 추락 이력 재조회
- 외부요인/건강 기록은 해당 API 연결 전까지 기존 mock 데이터 유지
