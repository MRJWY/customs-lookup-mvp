# 통관정보 조회 MVP

공유 Google Sheet의 품목 데이터를 기준으로 만든 모바일 대응 조회 앱입니다. 모델넘버, 제품명, 분류, HS CODE와 배터리 정보로 검색하고 위험물·내장 배터리·협정세율 적용 품목을 필터링할 수 있습니다.

## 실행

```powershell
cd apps/customs-lookup
npm start
```

브라우저에서 `http://localhost:4173`을 엽니다. 모바일 Chrome/Safari의 홈 화면 추가 기능을 사용하면 설치형 앱처럼 사용할 수 있습니다.

웹 앱은 시작할 때 공개 Google Sheets의 `시트1`을 Google Visualization 응답으로 직접 읽습니다. 시트에서 값을 수정한 뒤 웹 앱의 우측 상단 동기화 버튼을 누르거나 페이지를 새로 열면 최신 데이터가 반영됩니다. 네트워크 오류가 발생할 때만 `app.js`의 내장 데이터를 대신 표시합니다.

## 공개 배포

GitHub Pages가 `main` 브랜치 루트의 정적 파일을 배포합니다. 별도 API 키나 서버가 필요하지 않으며, 원본 Google Sheet도 공개 읽기 상태여야 합니다.

## 원본 컬럼 매핑

| Google Sheets | 앱 필드 | AppSheet 타입 |
| --- | --- | --- |
| 모델넘버 | `model` | Text, Key |
| 제품명 | `name` | Name |
| 분류 | `category` | Enum |
| HS CODE | `hsCode` | Text |
| 26년 기본세율 | `baseRate` | Percent |
| 26년 중국 협정세율 | `chinaRate` | Percent |
| 원산지증명서 | `originCertificate` | Yes/No |
| 정격전압 | `ratedVoltage` | Yes/No |
| 배터리 종류 | `battery` | Enum/Text |
| 위험물 | `dangerous` | Yes/No |
| 제품이미지 | `image` | Image |

상세 AppSheet 설정은 [APPSHEET_SETUP.md](APPSHEET_SETUP.md)를 참고합니다.
