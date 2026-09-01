# 통관정보 조회 MVP

공유 Google Sheet의 품목 데이터를 기준으로 만든 모바일 대응 조회 앱입니다. 모델넘버, 제품명, 분류, HS CODE와 배터리 정보로 검색하고 위험물·내장 배터리·협정세율 적용 품목을 필터링할 수 있습니다.

## 실행

```powershell
cd apps/customs-lookup
npm start
```

브라우저에서 `http://localhost:4173`을 엽니다. 모바일 Chrome/Safari의 홈 화면 추가 기능을 사용하면 설치형 앱처럼 사용할 수 있습니다.

현재 MVP는 공유 시트에서 확인한 3개 품목을 `app.js`의 초기 데이터로 포함합니다. 운영 전환 시에는 AppSheet가 원본 시트를 직접 읽도록 하고, 이 웹 화면은 Apps Script API 또는 별도 동기화 엔드포인트를 붙이는 구성을 권장합니다.

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
