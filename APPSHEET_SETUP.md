# Google Sheets → AppSheet 설정안

## MVP 아키텍처

```text
[Google Sheets: 시트1]
  품목 마스터 / 세율 / 통관 체크
            |
            v
[AppSheet Data Source]
  컬럼 타입·검증·검색 인덱스
            |
      +-----+-----+
      v           v
[모바일 앱]   [웹 브라우저]
  검색/상세     검색/상세
```

Google Sheets를 단일 원본으로 유지하고 AppSheet는 조회 UI와 권한만 담당합니다. 세율과 위험물 판단값 변경은 시트에서 관리하고 AppSheet Sync로 반영합니다.

## 1. 시트 정리

- 첫 행은 현재 헤더를 그대로 유지합니다.
- `모델넘버`는 빈 값과 중복이 없도록 관리하고 Key로 사용합니다.
- HS CODE는 앞자리 0 보존을 위해 숫자가 아닌 Text로 유지합니다.
- `원산지증명서`, `정격전압`, `위험물`은 문자열 `O/X`가 아니라 Google Sheets의 네이티브 `TRUE/FALSE` 값으로 저장합니다. `O/X` 문자열은 AppSheet의 Yes/No 필드에서 빈값으로 표시될 수 있습니다.
- `제품이미지`에는 Drive 이미지 파일 경로나 공개 가능한 이미지 URL을 넣습니다.
- 4행 아래에 있는 UNI-PASS 참고 URL은 데이터 행 밖의 별도 `설정` 탭으로 이동하는 것이 안전합니다.

## 2. AppSheet 앱 생성

1. AppSheet에서 `Create > App > Start with existing data`를 선택합니다.
2. 공유된 Google Sheet와 `시트1`을 데이터 원본으로 선택합니다.
3. `Data > Columns`에서 아래 타입을 지정합니다.

| 컬럼 | 타입 | 주요 설정 |
| --- | --- | --- |
| 모델넘버 | Text | Key=ON, Label=OFF, Required=ON, Editable=OFF |
| 제품명 | Name | Label=ON, Searchable=ON |
| 분류 | Enum | Searchable=ON |
| HS CODE | Text | Searchable=ON |
| 기본/협정세율 | Percent | Decimal digits=2 |
| 원산지증명서 | Yes/No | Required=ON |
| 정격전압 | Yes/No | Required=ON |
| 배터리 종류 | Enum | Suggested values: `없음`, `AA 배터리`, `내장 배터리(리튬 이온)` |
| 위험물 | Yes/No | Required=ON |
| 제품이미지 | Image | Image/File folder path 지정 |

## 3. 화면과 Slice

- `품목 조회`: Deck 또는 Table 뷰, Search 활성화, 분류/위험물/배터리를 Quick filter로 사용합니다.
- `품목 상세`: Detail 뷰에서 세율 그룹과 통관 체크 그룹을 분리합니다.
- `위험물 품목`: Slice 조건을 `[위험물] = TRUE`로 설정합니다.
- `배터리 내장`: Slice 조건을 `CONTAINS([배터리 종류], "내장")`로 설정합니다.
- Format Rule `위험물 주의`: 조건 `[위험물] = TRUE`, 강조색은 주황/적색으로 설정합니다.

## 4. 권한과 운영

- 조회 전용 사용자에게는 `Are updates allowed? = READ_ONLY`를 적용합니다.
- 관리자만 수정해야 한다면 Security Filter 또는 별도 관리자 앱을 둡니다.
- Sync는 시작 시 동기화와 자동 업데이트를 켜고, 데이터가 커지면 Delayed Sync를 검토합니다.
- HS CODE와 세율은 신고 전 관세사 또는 UNI-PASS에서 최종 검증하도록 안내 문구를 표시합니다.

## 다음 단계

실시간 웹 동기화가 필요하면 Google Apps Script 웹 API를 시트에 추가하고 `app.js`의 초기 데이터를 API 응답으로 교체합니다. 인증 없는 공개 API는 통관·거래 데이터를 노출할 수 있으므로 조직 계정 로그인 또는 AppSheet 권한을 우선 사용합니다.

## 구현 확인

- 기본 화면은 제품명, HS CODE, 모델넘버를 보여주는 읽기 전용 Deck 뷰입니다.
- 모델넘버 검색과 상세 세율 조회를 확인했습니다.
- `위험물 = Y` 필터가 위험물 품목 2건만 반환하는 것을 확인했습니다.
