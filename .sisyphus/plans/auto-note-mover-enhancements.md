# Auto Note Mover Enhancement Plan

## Context

### Original Request
GitHub Issues/PRs에서 추출한 사용자 요청을 기반으로 Auto Note Mover 플러그인에 우선순위 기능 추가 구현

### Interview Summary
**Key Discussions**:
- P1~P4 기능 요청 분석 및 우선순위 결정
- 이미 구현된 기능 확인 (AND/OR, frontmatter, 날짜폴더, regex 제외 등)
- Templater, 중첩 태그, 재귀적 폴더 제외 등은 기존 기능으로 해결 가능 확인
- 테스트 프레임워크: Vitest로 업그레이드 결정
- 소스 폴더 제한: 다중 폴더 지원 결정
- 중복 파일: Note Composer Merge 연동 결정
- Regex 캡처 그룹: PR #42 참조하여 구현 결정

**Research Findings**:
- 현재 코드베이스: 조건 기반 규칙 매칭 (`FolderTagRule`, `RuleCondition`)
- PR #42 캡처 그룹 구현: `folder.replace(/\$(\d)/g, (_, i) => match[i] || '')`
- Note Composer: Obsidian 내장 플러그인, Merge 기능 제공

### Metis Review
**Identified Gaps** (addressed):
- Templater 미설치 시 동작 → P3 제외됨 (이미 해결)
- 일괄 이동 진행 상황 → Notice로 표시
- Note Composer 미활성화 시 → 기존 동작(Skip) 유지

---

## Work Objectives

### Core Objective
Auto Note Mover 플러그인에 5개 핵심 기능 추가: 일괄 이동, 소스 폴더 제한, 알림 숨기기, 중복 파일 Merge, Regex 캡처 그룹 경로

### Concrete Deliverables
1. `Move all notes` 명령어 (Command Palette)
2. 규칙별 `sourceFolders: string[]` 필드 및 UI
3. `hide_notifications` 설정 토글
4. 중복 파일 발생 시 Note Composer Merge 옵션
5. 폴더 경로에서 `$1`, `$2` 캡처 그룹 치환

### Definition of Done
- [ ] `npm run build` → exit code 0, `main.js` 파일 생성됨
- [ ] `npx vitest run` → exit code 0, 모든 테스트 통과
- [ ] 기존 설정 파일(새 필드 없음) 로드 테스트: `loadSettings()` 호출 시 오류 없음 (테스트에 포함)
- [ ] 각 기능별 Manual Verification Steps 완료 (각 Task에 명시됨)

### Must Have
- 기존 설정 형식 호환 (새 필드는 optional)
- 일괄 이동 시 제외 폴더 및 `AutoNoteMover: disable` 존중
- Note Composer 미활성화 시 graceful fallback

### Must NOT Have (Guardrails)
- 기존 설정 스키마 breaking change 금지
- Undo 기능 (별도 범위)
- Dry-run 모드 (별도 범위)
- Note Composer 외 다른 플러그인 연동

---

## Verification Strategy

### Test Decision
- **Infrastructure exists**: YES (node --test)
- **User wants tests**: YES (Vitest 업그레이드)
- **Framework**: Vitest

### Test Setup Task
Vitest 설정 및 기존 테스트 마이그레이션 필요

### Test Structure
각 TODO는 구현 + 테스트를 포함. TDD 또는 구현 후 테스트 작성.

---

## Task Flow

```
Task 0 (Vitest 설정)
    ↓
Task 1 (일괄 이동) ──────────────────┐
Task 2 (소스 폴더 제한) ─────────────┼──→ Task 6 (통합 테스트)
Task 3 (알림 숨기기) ────────────────┤
Task 4 (중복 파일 Merge) ────────────┤
Task 5 (Regex 캡처 그룹) ────────────┘
```

## Parallelization

| Group | Tasks | Reason |
|-------|-------|--------|
| A | 1, 2, 3, 4, 5 | Task 0 완료 후 독립적으로 병렬 진행 가능 |

| Task | Depends On | Reason |
|------|------------|--------|
| 1-5 | 0 | Vitest 설정 필요 |
| 6 | 1-5 | 모든 기능 구현 후 통합 테스트 |

---

## TODOs

### Task 0: Vitest 설정 및 테스트 마이그레이션

**What to do**:
- Vitest 설치: `npm install -D vitest`
- `vitest.config.ts` 생성 (TypeScript 지원 설정 포함)
- 기존 `tests/*.test.js` → `tests/*.test.ts` 마이그레이션
- `package.json` 스크립트 업데이트: `"test": "vitest run"`
- TypeScript 테스트 실행 설정:
  - `tsconfig.json`에 `"include": ["tests/**/*"]` 추가 또는 별도 `tsconfig.test.json` 생성
  - Vitest 내장 esbuild 트랜스폼 사용 (별도 ts-node 불필요)
  - `vitest.config.ts`에 `globals: true` 설정으로 describe/it import 생략

**CJS → ESM 마이그레이션 상세**:
```typescript
// BEFORE (node:test CJS)
const { describe, it } = require('node:test');
const assert = require('node:assert');

// AFTER (Vitest ESM)
import { describe, it, expect } from 'vitest';
// 또는 globals: true 설정 시 import 생략 가능

// assert 변환
assert.strictEqual(a, b)  →  expect(a).toBe(b)
assert.ok(value)          →  expect(value).toBeTruthy()
assert.deepStrictEqual()  →  expect(a).toEqual(b)
```

**Must NOT do**:
- 테스트 로직/시나리오 변경 (문법 변환만)

**Parallelizable**: NO (다른 모든 작업의 선행 조건)

**References**:
- `package.json` - 현재 test 스크립트: `"test": "node --test tests/"`
- `tests/ruleMatching.test.js` - 기존 테스트 패턴
- `tests/pathProcessing.test.js` - 기존 테스트 패턴
- Vitest 공식 문서: https://vitest.dev/guide/

**Acceptance Criteria**:
- [x] `package.json`의 `devDependencies`에 `"vitest"` 존재
- [x] `vitest.config.ts` 파일 존재
- [x] `tests/*.test.ts` 파일 존재 (`.js` 파일 없음)
- [x] `npx vitest run` → 기존 테스트 모두 통과 (exit code 0)

**Contingency (Vitest 마이그레이션 실패 시)**:
- 기존 `node --test` 유지하고 Task 1-5 진행
- 테스트는 `.test.js`로 작성
- 마이그레이션은 별도 작업으로 분리

**Commit**: YES
- Message: `build: migrate test framework from node:test to vitest`
- Files: `package.json`, `vitest.config.ts`, `tests/*.test.ts`
- Pre-commit: `npx vitest run`

---

### Task 1: 전체 노트 일괄 이동 명령어

**What to do**:
- `main.ts`에 새 명령어 `Move-all-notes` 추가
- `vault.getMarkdownFiles()`로 모든 마크다운 파일 순회
- **중요**: `fileCheck(file, undefined, 'cmd')` 호출하여 Manual 모드에서도 동작하도록 함
  - 기존 `fileCheck()` 시그니처의 `caller` 파라미터 활용
  - `caller: 'cmd'`는 `trigger_auto_manual` 체크를 우회함 (main.ts:21-23)
- `fileCheck()` 수정: 이동 성공 시 `true` 반환, 아니면 `false` 반환
  - 현재 `fileCheck()`는 `void` 반환 → `boolean` 반환으로 변경
  - `fileMove()` 호출 후 `true` 반환
- **Metadata cache 재시도**: `getFileCache()` 반환이 null이면 50ms 대기 후 1회 재시도
  ```typescript
  let fileCache = this.app.metadataCache.getFileCache(file);
  if (!fileCache) {
    await sleep(50);
    fileCache = this.app.metadataCache.getFileCache(file);
  }
  if (!fileCache) { skippedCount++; continue; }
  ```
- 일괄 이동 시 반환값으로 이동 카운트 집계
- 진행 상황 Notice 표시: "Processing X/Y notes..."
- 완료 Notice: "Moved N notes (M skipped)"

**Must NOT do**:
- 제외 폴더 파일 이동
- `AutoNoteMover: disable` frontmatter 파일 이동
- 이미 올바른 위치의 파일 이동

**Parallelizable**: YES (Task 2, 3, 4, 5와 병렬)

**Pattern References**:
- `main.ts:127-139` - 기존 `Move-the-note` 명령어 패턴
- `main.ts:18-84` - `fileCheck()` 함수 (규칙 매칭 및 이동 로직)

**API References**:
- `this.app.vault.getMarkdownFiles()` - 모든 마크다운 파일 배열 반환
- `new Notice(message)` - 알림 표시

**Why Each Reference Matters**:
- `Move-the-note` 명령어: 새 명령어 등록 패턴 참조
- `fileCheck()`: 단일 파일 처리 로직 재사용

**Acceptance Criteria**:
- [ ] `main.ts`에 `id: 'Move-all-notes'` 명령어 등록 코드 존재
- [ ] `fileCheck()` 함수 시그니처가 `boolean` 반환으로 변경됨
- [ ] 테스트: `moveAllNotes.test.ts`에서 이동 카운트 검증 통과
- [ ] 수동 검증: Command Palette > "Move all notes" 실행 → Notice에 이동 수 표시

**Manual Verification Steps**:
```
1. Obsidian 개발자 모드로 플러그인 로드
2. Command Palette (Ctrl+P) 열기
3. "Auto Note Mover: Move all notes" 입력
4. 명령어 표시 확인 → 실행
5. Notice에 "Moved N notes" 메시지 확인
```

**Test Cases**:
```typescript
describe('Move all notes', () => {
  it('should move notes matching rules to correct folders')
  it('should skip notes in excluded folders')
  it('should skip notes with AutoNoteMover: disable frontmatter')
  it('should report correct count of moved notes')
})
```

**Commit**: YES
- Message: `feat: add move all notes command for batch processing`
- Files: `main.ts`, `tests/moveAllNotes.test.ts`
- Pre-commit: `npx vitest run`

---

### Task 2: 규칙별 소스 폴더 제한

**What to do**:
- `settings.ts`의 `FolderTagRule` 인터페이스에 필드 추가:
  ```typescript
  sourceFolders?: string[];
  sourceIncludeSubfolders?: boolean;
  ```
- `main.ts`의 `fileCheck()`에서 소스 폴더 체크 로직 추가
- Settings UI에 소스 폴더 입력 필드 추가 (다중 입력)
- 소스 폴더 미지정 시 기존 동작 (모든 폴더에 적용)

**Edge Cases & Normalization**:
- **Trailing slashes**: `normalizePath()`로 정규화 (`folder/` → `folder`)
- **Root folder 정규형**: 
  - UI 입력: 빈 문자열 `""` 또는 `/` 허용
  - 저장 시 정규화: 빈 문자열 `""`로 통일 (normalizePath("/") === "")
  - 체크 로직: `file.parent.path === ""` (루트 파일)
- **Path casing**: Obsidian은 OS 의존적. `normalizePath()` 사용으로 일관성 유지
- **Excluded folders와 상호작용**: 제외 폴더 체크가 먼저 실행됨 (기존 로직 유지). 소스 폴더는 제외 폴더 체크 통과 후 적용

**Must NOT do**:
- 기존 규칙 동작 변경 (sourceFolders 미지정 시)
- 단일 폴더만 지원 (다중 폴더 필수)

**Parallelizable**: YES (Task 1, 3, 4, 5와 병렬)

**References**:

**Pattern References**:
- `settings/settings.ts:32-38` - `FolderTagRule` 인터페이스 정의
- `settings/settings.ts:374-386` - 폴더 입력 UI 패턴 (`FolderSuggest`)
- `settings/settings.ts:493-532` - **다중 폴더 입력 UI 패턴** (Excluded folder 구현)
  - 배열 순회 + 각 항목별 input + 삭제 버튼
  - Add 버튼으로 새 항목 추가
- `main.ts:31-52` - 제외 폴더 체크 로직 (유사 패턴)

**UI 구현 패턴** (settings.ts:493-532 참조):
```typescript
// 다중 소스 폴더 UI - Excluded folder 패턴과 동일하게 구현
rule.sourceFolders?.forEach((folder, idx) => {
  const row = new Setting(body)
    .addSearch((cb) => {
      new FolderSuggest(this.app, cb.inputEl);
      cb.setValue(folder)
        .onChange(async (newVal) => {
          rule.sourceFolders[idx] = newVal;
          await this.plugin.saveSettings();
        });
    })
    .addExtraButton((cb) => {
      cb.setIcon('cross').onClick(async () => {
        rule.sourceFolders.splice(idx, 1);
        await this.plugin.saveSettings();
        this.display();
      });
    });
});
// Add button
new ButtonComponent(body).setButtonText('+ Add source folder').onClick(async () => {
  rule.sourceFolders = rule.sourceFolders || [];
  rule.sourceFolders.push('');
  await this.plugin.saveSettings();
  this.display();
});
```

**Type References**:
- `settings/settings.ts:40-42` - `ExcludedFolder` 인터페이스 (참조용)

**Why Each Reference Matters**:
- `FolderTagRule`: 새 필드 추가 위치
- 폴더 입력 UI: `FolderSuggest` 자동완성 패턴
- 제외 폴더 체크: 소스 폴더 체크 로직 유사 구현

**Acceptance Criteria**:
- [ ] `settings/settings.ts`에 `sourceFolders?: string[]`, `sourceIncludeSubfolders?: boolean` 타입 정의 존재
- [ ] 테스트: `sourceFolders.test.ts` 4개 케이스 모두 통과 (exit code 0)
- [ ] 기존 설정 파일(sourceFolders 없음) 로드 시 `loadSettings()` 오류 없음

**Manual Verification Steps**:
```
1. Settings > Auto Note Mover 열기
2. 규칙 카드에 "Source folders" 입력란 확인
3. "Inbox" 입력 후 저장
4. Inbox 폴더 외 파일이 해당 규칙에 매칭 안되는지 확인
```

**Test Cases**:
```typescript
describe('Source folder restriction', () => {
  it('should only apply rule to files in specified source folders')
  it('should include subfolders when sourceIncludeSubfolders is true')
  it('should apply to all folders when sourceFolders is empty')
  it('should support multiple source folders')
})
```

**Commit**: YES
- Message: `feat: add source folder restriction per rule`
- Files: `settings/settings.ts`, `main.ts`, `tests/sourceFolders.test.ts`
- Pre-commit: `npx vitest run`

---

### Task 3: 알림 숨기기 옵션

**What to do**:
- `settings.ts`의 `AutoNoteMoverSettings`에 필드 추가:
  ```typescript
  hide_notifications?: boolean;
  ```
- `utils/Utils.ts`의 `fileMove()` 함수 시그니처 수정:
  ```typescript
  // BEFORE
  export const fileMove = async (app: App, settingFolder: string, fileFullName: string, file: TFile) => { ... }
  
  // AFTER
  export const fileMove = async (
    app: App, 
    settingFolder: string, 
    fileFullName: string, 
    file: TFile,
    hideNotifications?: boolean  // 새 파라미터
  ) => { ... }
  ```
- `fileMove()` 내부에서 Notice 호출을 조건부로 변경:
  ```typescript
  // Utils.ts:60 수정
  if (!hideNotifications) {
    new Notice(`[Auto Note Mover]\nMoved the note "${fileFullName}"\nto the "${settingFolder}".`);
  }
  ```
- **main.ts 호출부 업데이트** (main.ts:80):
  ```typescript
  void fileMove(this.app, processedFolder, fileFullName, file, this.settings.hide_notifications);
  ```
- Settings UI에 토글 추가
- 에러 알림은 항상 표시:
  - `Utils.ts:49-51` (중복 파일 에러) → 조건 체크 없이 항상 표시
  - `Utils.ts:60` (성공 알림) → `hideNotifications` 체크

**Must NOT do**:
- 에러 알림(`Utils.ts:49-51`) 숨기기
- console.log 등 개발자 로그 제거

**Parallelizable**: YES (Task 1, 2, 4, 5와 병렬)

**References**:

**Pattern References**:
- `settings/settings.ts:44-52` - `AutoNoteMoverSettings` 인터페이스
- `settings/settings.ts:143-151` - 토글 설정 UI 패턴
- `utils/Utils.ts:60` - 성공 Notice 호출 위치

**Why Each Reference Matters**:
- `AutoNoteMoverSettings`: 새 설정 필드 추가 위치
- 토글 UI: `.addToggle()` 패턴 참조
- `fileMove`: Notice 조건부 호출로 변경

**Acceptance Criteria**:
- [ ] `settings/settings.ts`에 `hide_notifications?: boolean` 타입 정의 존재
- [ ] `utils/Utils.ts`의 `fileMove()`에서 `settings.hide_notifications` 체크 로직 존재
- [ ] 테스트: `hideNotifications.test.ts` 3개 케이스 모두 통과

**Manual Verification Steps**:
```
1. Settings > Auto Note Mover > "Hide notifications" 토글 확인
2. 토글 ON 후 파일 이동 트리거
3. 성공 알림 미표시 확인
4. 에러 상황(중복 파일) 시 알림 표시 확인
```

**Test Cases**:
```typescript
describe('Hide notifications', () => {
  it('should hide success notifications when enabled')
  it('should still show error notifications when enabled')
  it('should show all notifications when disabled')
})
```

**Commit**: YES
- Message: `feat: add option to hide success notifications`
- Files: `settings/settings.ts`, `utils/Utils.ts`, `tests/hideNotifications.test.ts`
- Pre-commit: `npx vitest run`

---

### Task 4: 중복 파일 Note Composer Merge 연동

**What to do**:
- `settings.ts`에 중복 파일 처리 옵션 추가:
  ```typescript
  duplicate_file_action?: 'skip' | 'merge';
  ```
- `utils/Utils.ts`의 `fileMove()`에서 중복 감지 시:
  - `skip`: 기존 동작 (Notice 후 스킵)
  - `merge`: Note Composer의 Merge 기능 호출
- Note Composer 플러그인 활성화 여부 확인
- Note Composer 미활성화 시 `skip`으로 fallback

**Must NOT do**:
- Note Composer 외 다른 방식의 Merge 구현
- 사용자 확인 없이 자동 Merge (설정으로 명시적 선택 필요)

**Parallelizable**: YES (Task 1, 2, 3, 5와 병렬)

**References**:

**Pattern References**:
- `utils/Utils.ts:46-53` - 현재 중복 파일 처리 로직
- `settings/settings.ts:125-135` - 드롭다운 설정 UI 패턴

**API References**:
- Obsidian Note Composer: `this.app.internalPlugins.getPluginById('note-composer')`
- Note Composer Merge: `this.app.commands.executeCommandById('note-composer:merge-file')`

**External References**:
- Note Composer 문서: https://help.obsidian.md/plugins/note-composer

**Why Each Reference Matters**:
- 중복 파일 처리 로직: 기존 skip 동작 위치
- 드롭다운 UI: 옵션 선택 패턴
- Note Composer API: Merge 기능 호출 방법

**Note Composer Merge 호출 전제조건**:
- `note-composer:merge-file` 명령은 **현재 활성 파일**을 대상으로 Merge 모달을 엽니다
- **Focus-Stealing 문제**: 자동 트리거 시 파일 활성화는 UX 방해
- **해결책**: Merge 옵션은 **Manual 모드에서만 동작**
  - `trigger_auto_manual === 'Manual'` 또는 `caller === 'cmd'`일 때만 merge 실행
  - Automatic 모드에서 중복 발생 시 → Skip으로 fallback + Notice 경고
- 구현 순서 (Manual 모드):
  1. 중복 파일(대상 폴더의 기존 파일) 경로 확인
  2. `app.workspace.openLinkText()`로 기존 파일을 활성화
  3. `app.commands.executeCommandById('note-composer:merge-file')` 호출
  4. 사용자가 모달에서 소스 파일(이동하려던 파일) 선택
- **Fallback**: Note Composer 비활성화 시 Skip + Notice 경고

**Acceptance Criteria**:
- [ ] `settings/settings.ts`에 `duplicate_file_action?: 'skip' | 'merge'` 타입 정의 존재
- [ ] `utils/Utils.ts`에 Note Composer 활성화 체크 함수 존재
- [ ] 테스트: `duplicateFileAction.test.ts` unit 테스트 통과

**Unit Testable Parts** (자동화 가능):
- `isNoteComposerEnabled(app)` 함수 - mock app으로 테스트
- `getDuplicateAction(settings, noteComposerEnabled)` 로직 - 순수 함수로 분리

**Manual Verification Required** (모달 UI):
```
1. Settings > "Duplicate file action" = "Merge" 설정
2. 대상 폴더에 동일 이름 파일 생성
3. 이동 트리거 → Note Composer Merge 모달 표시 확인
4. Note Composer 비활성화 후 동일 테스트 → Skip 동작 확인
```

**Test Cases**:
```typescript
describe('Duplicate file handling (unit)', () => {
  it('should return skip when action is skip')
  it('should return merge when action is merge and Note Composer enabled')
  it('should fallback to skip when Note Composer is disabled')
})
// Note: 실제 모달 호출은 수동 검증
```

**Commit**: YES
- Message: `feat: add Note Composer merge option for duplicate files`
- Files: `settings/settings.ts`, `utils/Utils.ts`, `tests/duplicateFileAction.test.ts`
- Pre-commit: `npx vitest run`

---

### Task 5: Regex 캡처 그룹 경로

**What to do**:
- `utils/ruleMatching.ts`에서 태그 매칭 시 캡처 그룹 반환
- `utils/pathProcessing.ts`에서 `$1`, `$2` 등을 캡처 그룹 값으로 치환
- 기존 `processFolderPath()` 함수 확장 또는 새 함수 추가
- Regex 모드(`use_regex_to_check_for_tags: true`)에서만 동작

**Data Flow (캡처 그룹 전파)**:
```
1. main.ts: fileCheck() 호출
2. ruleMatching.ts: isRuleMatched() 
   - evaluateCondition('tag') 에서 regex.exec() 실행
   - 반환값 변경: { matched: boolean, captureGroups?: string[] }
3. main.ts: 매칭 결과에서 captureGroups 추출
4. pathProcessing.ts: processFolderPath(folder, ..., captureGroups)
   - $1, $2 치환: folder.replace(/\$(\d)/g, (_, i) => captureGroups[i] || '')
```

**Interface Changes**:
```typescript
// ruleMatching.ts
interface MatchResult {
  matched: boolean;
  captureGroups?: string[];  // 새로 추가
}
export const isRuleMatched = (rule, ctx): MatchResult => { ... }

// pathProcessing.ts  
export const processFolderPath = (
  folderPath: string, 
  fileCache: ..., 
  file: TFile, 
  rule: FolderTagRule,
  captureGroups?: string[]  // 새 파라미터
): string => { ... }
```

**Call Site Updates Required**:
```typescript
// main.ts:70-82 변경 필요
// BEFORE
const matched = isRuleMatched(rule, { ... });
if (matched) { ... }

// AFTER
const result = isRuleMatched(rule, { ... });
if (result.matched) {
  const processedFolder = processFolderPath(rule.folder, fileCache, file, rule, result.captureGroups);
  void fileMove(this.app, processedFolder, fileFullName, file);
  break;
}
```

**pathProcessing.ts Early Return 수정**:
```typescript
// BEFORE (utils/pathProcessing.ts:10-13)
const hasTokens = tokenPattern.test(folderPath);
if (!hasTokens) return folderPath;

// AFTER - 캡처 그룹 치환도 처리
const hasDateTokens = /\{\{.+?\}\}/.test(folderPath);
const hasCaptureTokens = /\$\d/.test(folderPath);
if (!hasDateTokens && !hasCaptureTokens) return folderPath;

// 캡처 그룹 치환 (날짜 토큰 없어도 실행)
if (captureGroups && captureGroups.length > 0) {
  folderPath = folderPath.replace(/\$(\d)/g, (_, i) => captureGroups[parseInt(i)] || '');
}
// 이후 날짜 토큰 처리 (기존 로직)
```

**Must NOT do**:
- 비-regex 모드에서 캡처 그룹 처리
- 기존 날짜 토큰(`{{YYYY}}`) 동작 변경

**Parallelizable**: YES (Task 1, 2, 3, 4와 병렬)

**References**:

**Pattern References**:
- `utils/ruleMatching.ts:88-108` - 태그 매칭 로직 (`evaluateCondition` case 'tag')
- `utils/pathProcessing.ts:9-74` - `processFolderPath()` 함수
- PR #42 구현: `folder.replace(/\$(\d)/g, (_, i) => match[i] || '')`

**Type References**:
- `settings/settings.ts:15-30` - `RuleCondition` 인터페이스

**Why Each Reference Matters**:
- 태그 매칭 로직: 캡처 그룹 추출 위치
- `processFolderPath`: 경로 처리 확장 위치
- PR #42: 캡처 그룹 치환 패턴

**Implementation Pattern** (from PR #42):
```typescript
// 태그 매칭 시 캡처 그룹 추출
const regex = new RegExp(tagPattern);
const match = regex.exec(tag);
if (match) {
  // $1, $2를 캡처 그룹 값으로 치환
  const processedFolder = folder.replace(/\$(\d)/g, (_, i) => match[parseInt(i)] || '');
}
```

**Acceptance Criteria**:
- [ ] `utils/ruleMatching.ts`에 `MatchResult` 인터페이스 정의됨
- [ ] `isRuleMatched()` 반환 타입이 `MatchResult`로 변경됨
- [ ] `tests/ruleMatching.test.ts`에서 모든 assertion이 `.matched` 접근으로 수정됨
- [ ] 테스트: `captureGroups.test.ts` 5개 케이스 모두 통과

**Files to Modify**:
- `utils/ruleMatching.ts` - 반환 타입 변경, captureGroups 추출
- `utils/pathProcessing.ts` - captureGroups 파라미터 추가, $N 치환
- `main.ts:70-82` - 호출부 업데이트
- `tests/ruleMatching.test.ts` - 모든 assertion 수정:
  ```typescript
  // BEFORE
  expect(isRuleMatched(...)).toBe(true)
  
  // AFTER
  expect(isRuleMatched(...).matched).toBe(true)
  ```

**Test Cases**:
```typescript
describe('Regex capture groups in folder path', () => {
  it('should replace $1 with first capture group')
  it('should replace multiple capture groups ($1, $2)')
  it('should leave $N unchanged if no capture group exists')
  it('should work alongside date tokens like {{YYYY}}')
  it('should not process capture groups in non-regex mode')
  it('should return capture groups when regex matches', () => {
    const result = isRuleMatched(rule, context);
    expect(result.matched).toBe(true);
    expect(result.captureGroups).toEqual(['book']);
  })
})
```

**Commit**: YES
- Message: `feat: support regex capture groups in folder path ($1, $2)`
- Files: `utils/ruleMatching.ts`, `utils/pathProcessing.ts`, `main.ts`, `tests/captureGroups.test.ts`
- Pre-commit: `npx vitest run`

---

### Task 6: 통합 테스트 및 최종 검증

**What to do**:
- 모든 기능 통합 테스트 작성
- 기존 설정 마이그레이션 테스트
- 빌드 검증

**Must NOT do**:
- 새로운 기능 추가

**Parallelizable**: NO (모든 Task 완료 후)

**Pattern References**:
- `main.ts:163-206` - `loadSettings()` 마이그레이션 로직

**Acceptance Criteria**:
- [ ] `npm run build` 성공, `main.js` 생성됨
- [ ] `npx vitest run` 모든 테스트 통과 (0 failures)
- [ ] 기존 설정 파일(새 필드 없음)로 플러그인 로드 시 오류 없음
- [ ] 새 설정 필드가 undefined일 때 기본값으로 동작함

**Concrete Verification Steps**:
```bash
# 1. 빌드 검증
npm run build
ls -la main.js  # Expected: 파일 존재, 크기 > 0

# 2. 테스트 실행
npx vitest run  # Expected: All tests passed

# 3. 설정 마이그레이션 검증 (수동)
# - 기존 data.json 백업
# - 플러그인 활성화
# - 새 설정 필드가 UI에 표시되는지 확인
# - 기존 규칙이 정상 동작하는지 확인
```

**Test Cases**:
```typescript
describe('Integration tests', () => {
  it('should load legacy settings without new fields')
  it('should save and load settings with all new fields')
  it('should apply sourceFolders restriction before rule matching')
  it('should handle capture groups with date tokens together')
})
```

**Commit**: YES
- Message: `test: add integration tests for all new features`
- Files: `tests/integration.test.ts`
- Pre-commit: `npx vitest run`

---

## Commit Strategy

| After Task | Message | Files | Verification |
|------------|---------|-------|--------------|
| 0 | `build: migrate test framework from node:test to vitest` | package.json, vitest.config.ts, tests/*.test.ts | `npx vitest run` |
| 1 | `feat: add move all notes command for batch processing` | main.ts, tests/moveAllNotes.test.ts | `npx vitest run` |
| 2 | `feat: add source folder restriction per rule` | settings/settings.ts, main.ts, tests/sourceFolders.test.ts | `npx vitest run` |
| 3 | `feat: add option to hide success notifications` | settings/settings.ts, utils/Utils.ts, tests/hideNotifications.test.ts | `npx vitest run` |
| 4 | `feat: add Note Composer merge option for duplicate files` | settings/settings.ts, utils/Utils.ts, tests/duplicateFileAction.test.ts | `npx vitest run` |
| 5 | `feat: support regex capture groups in folder path ($1, $2)` | utils/ruleMatching.ts, utils/pathProcessing.ts, main.ts, tests/captureGroups.test.ts | `npx vitest run` |
| 6 | `test: add integration tests for all new features` | tests/integration.test.ts | `npx vitest run` |

---

## Success Criteria

### Verification Commands
```bash
npm run build          # Expected: 빌드 성공, main.js 생성
npx vitest run         # Expected: 모든 테스트 통과
```

### Final Checklist
- [ ] 5개 기능 모두 구현됨
- [ ] `npx vitest run` → 모든 테스트 통과
- [ ] 기존 설정 파일 로드 시 오류 없음
- [ ] `npm run build` → main.js 생성됨
