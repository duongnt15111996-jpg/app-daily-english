# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Start dev server (scan QR with Expo Go on phone)
npm start

# Platform-specific
npm run android   # launch on Android emulator
npm run ios       # launch on iOS simulator (macOS only)
npm run web       # launch in browser

# TypeScript check (no build step needed for Expo)
npx tsc --noEmit
```

No test runner is configured. TypeScript is the primary correctness check.

## Tech Stack

| Layer | Library | Version |
|---|---|---|
| Framework | Expo | ~54.0.0 |
| Runtime | React Native | 0.81.5 |
| Language | TypeScript | ~5.9.2 |
| Navigation | @react-navigation/native + stack + bottom-tabs | ^7.x |
| Audio | expo-av | ^16.0.8 |
| Haptics | expo-haptics | ~15.0.8 |
| Notifications | expo-notifications | ~0.29.x |
| Persistence | @react-native-async-storage/async-storage | ^2.2.0 |
| Animations | react-native-reanimated | ^4.3.1 |
| Gestures | react-native-gesture-handler | ~2.31.1 |
| Icons | @expo/vector-icons (Ionicons) | ^15.1.1 |

## Architecture

**Expo SDK 54 + React Native 0.81 + TypeScript**. No native code — runs entirely through Expo Go or an Expo build.

### Navigation (two-level)

```
AppNavigator (Stack)          ← src/navigation/AppNavigator.tsx
└── Tabs (Bottom Tab)         ← src/navigation/TabNavigator.tsx
    ├── Home
    ├── Topics
    ├── Vocabulary
    ├── Statistics
    └── Profile

Stack screens (pushed over tabs):
  TopicDetail        { topicId, topicTitle, iconColor, iconName }
  LessonDetail       { topicId, sectionId, sectionTitle, sectionDescription? }
  ListeningExercise  { topicId, lessonId }
  SavedWords
  LearningGoal
```

All screen params are typed in `RootStackParamList` (`AppNavigator.tsx`). Tab param types are in `TabParamList` (`TabNavigator.tsx`). `Tabs` route dùng `NavigatorScreenParams<TabParamList>` để có thể navigate đến tab cụ thể: `nav.navigate('Tabs', { screen: 'Topics' })`.

### Data layer

Content (topics, sections, lessons) lấy từ **backend API** — không còn hardcode trong app.

- `src/services/api.ts` — tất cả HTTP calls. Exports:
  - `fetchTopics()` → `ApiTopic[]`
  - `fetchSections(topicId)` → `ApiSection[]`
  - `fetchLessons(topicId, sectionId)` → `ApiLesson[]`
  - `registerDevice()`, `fetchProgress()`, `syncProgress()` — device progress sync
  - `fetchVocabularyWord(word)` → `WordDetails | null` — gọi `GET /api/v1/vocabulary/word/:word`
  - `fetchVocabularyTopics()` → `string[]` — gọi `GET /api/v1/vocabulary/topics`
  - `fetchRandomVocabularyWords(topic, count)` → `string[]` — gọi `GET /api/v1/vocabulary/random?topic=xxx&count=N`
  - `WordDetails` interface: `{ word, phonetic, partOfSpeech, definition, example, audioUrl, meanings?: WordMeaning[] }`
  - `WordMeaning` interface: `{ partOfSpeech: string; definitions: WordDefinition[] }`
  - `WordDefinition` interface: `{ definition: string; example?: string }`
- `BASE_URL` mặc định là `https://daily-english-backend-zzmv.onrender.com`. Override bằng `EXPO_PUBLIC_API_URL` trong `.env` nếu cần test với backend local.
- `fetchTopics()` normalize null fields: `iconName ?? 'book'`, `iconColor ?? ['#3B82F6', '#1560FC']` để tránh crash khi backend trả null.
- `src/data/topics.ts` — legacy hardcoded data, không còn dùng bởi màn hình nào (ListeningExerciseScreen đã migrate sang API).
- `src/data/vocabulary.ts` — `VOCABULARY_WORDS[]`. Không còn dùng bởi màn hình nào (SavedWordsScreen đã migrate sang API).
- `src/services/dictionaryApi.ts` — chỉ còn `fetchWordDetails(word)` delegate sang `fetchVocabularyWord` trong `api.ts`. `fetchTopicWords` (Datamuse API) không còn dùng bởi VocabularyScreen.

**Backend** nằm ở repo riêng: `../backend-daily-english` (Node.js + Express + PostgreSQL). Deploy trên Render tại `https://daily-english-backend-zzmv.onrender.com`.

### State / persistence

`src/store/progressStore.ts` là async layer duy nhất. Lưu `UserProgress` trong AsyncStorage key `'user_progress'`. Exports:

| Function | Effect |
|---|---|
| `getProgress()` | Read + auto-reset `todayCompleted` khi đổi ngày + cập nhật streak |
| `markLessonCompleted(id)` | Append vào `completedLessons`, tăng `todayCompleted.lessons`, ghi `weeklyActivity[today]` |
| `markWordLearned(id)` | Append vào `learnedWords`, tăng `todayCompleted.words` |
| `toggleSavedWord(id)` | Toggle trong `savedWords`, trả về trạng thái mới |
| `updateDailyGoal(lessons, words)` | Ghi đè `dailyGoal` |

`weeklyActivity: Record<string, number>` — maps `'YYYY-MM-DD'` → số lesson hoàn thành. Dùng bởi `StatisticsScreen`.

Progress **không reactive** — các screen dùng `useFocusEffect` để refresh khi vào focus.

### Shared constants

`src/constants/theme.ts` — source of truth cho `COLORS`, `FONTS`, `RADIUS`, `SPACING`, `SHADOW`. Không hardcode màu hay spacing. Available gradients: `blue`, `purple`, `green`, `orange`, `pink`.

`src/constants/types.ts` — tất cả TypeScript interfaces. Lưu ý:
- `Lesson.duration` và `Lesson.isCompleted` optional.
- `Lesson.description` optional.
- `UserProgress.weeklyActivity` là `Record<string, number>`.

### Key feature: Listening Exercise

`src/screens/listening/ListeningExerciseScreen.tsx`:

1. Nhận `{ topicId, lessonId }` → fetch `lesson.parts[]` từ API (`fetchListeningParts`)
2. State machine: `status: 'idle' | 'wrong' | 'correct' | 'completed'`
3. So sánh đáp án qua `normalizeText()` (lowercase + bỏ dấu câu)
4. Word-by-word feedback qua `getWordFeedback()` — highlight xanh/đỏ từng từ
5. Sai → shake animation + haptic, không cho tiếp
6. Đúng → success animation → unlock "Next Part"
7. Hoàn thành → gọi `markLessonCompleted()`
8. Audio: `Audio.Sound.createAsync({ uri: audioUrl })` qua expo-av. `audioUrl` rỗng → fallback setTimeout 2s.

### Key feature: Vocabulary Flashcard

`src/screens/vocabulary/VocabularyScreen.tsx`:

State machine: `ScreenView: 'selecting' | 'loading' | 'learning' | 'batch_done'`

1. **selecting** — grid 2 cột, danh sách topic fetch từ `GET /api/v1/vocabulary/topics` (+ "Random" luôn ở đầu). Icon map qua `TOPIC_ICON_MAP`, fallback `'library'`. Số từ lấy từ `dailyGoal.words`.
2. **loading** — fetch random words từ `GET /api/v1/vocabulary/random?topic=xxx&count=N` (chỉ trả từ có `meanings` không rỗng), hiện spinner.
3. **learning** — flashcard: mặt trước chỉ có word text. Tap flip → hiển thị tất cả definitions từ `meanings[]` array (mỗi meaning một partOfSpeech + definitions list có đánh số). Prefetch chạy ngầm: card đầu tiên prefetch ngay sau khi deck load, mỗi lần next card prefetch card tiếp theo — không set loading state. Nếu chưa có cache lúc flip mới fetch và hiện spinner. Prefetch chỉ cache non-null results (tránh block retry). Nút "Play" dùng `expo-speech` với debounce. "Review Again" → xuống cuối deck. "I Know This" → `markWordLearned(word)`, xóa khỏi deck.
4. **batch_done** — nút "Next Batch" load lại cùng topic, hoặc "Change Topic".

Word text dùng trực tiếp làm ID cho `markWordLearned` / `toggleSavedWord`.

### Component conventions

Shared UI trong `src/components/ui/`: `Card`, `Button`, `ProgressBar`. Nhận `style?: ViewStyle`. Dùng `SHADOW.sm` / `SHADOW.md` cho elevation.

Mỗi screen có `StyleSheet.create` riêng ở cuối file.

Icons dùng `@expo/vector-icons` (`Ionicons`). Cast tên icon động với `name as any`.

### Environment

File `.env` trong root project (không commit):
```
EXPO_PUBLIC_API_URL=https://daily-english-backend-zzmv.onrender.com
```
App mặc định dùng URL Render. Chỉ cần override `.env` khi muốn test với backend local. Sau khi thay đổi `.env` phải restart dev server với `npx expo start --clear` để Metro bundle lại env vars.

`EXPO_PUBLIC_GEMINI_API_KEY` đã bị xóa khỏi frontend — Gemini hiện được gọi từ backend. Key nằm trong `backend-daily-english/.env` (`GEMINI_API_KEY`) và Render env vars.

---

## Project Plan

### Đã hoàn thành ✅

**Hạ tầng**
- [x] Expo project khởi tạo với TypeScript
- [x] Toàn bộ dependencies đã cài (`npx tsc --noEmit` pass 0 errors)
- [x] Theme, design tokens, TypeScript interfaces (`src/constants/`)
- [x] Navigation hai tầng: Stack + Bottom Tab
- [x] AsyncStorage store với đầy đủ mutation functions
- [x] `sampleData.json` integration — JSON topics tự động merge vào `TOPICS[]`
- [x] `src/services/api.ts` — HTTP client với platform-aware BASE_URL
- [x] `.env` support qua `EXPO_PUBLIC_API_URL`

**Màn hình**
- [x] `OnboardingScreen` — 3 bước: welcome → chọn level → set goal. Lưu flag `onboarding_done` vào AsyncStorage
- [x] `HomeScreen` — popular topics fetch từ API, daily streak, today's tasks, nút "See All" navigate đúng sang tab Topics
- [x] `TopicsScreen` — fetch từ API, loading state
- [x] `TopicDetailScreen` — header dùng params từ navigation, fetch sections từ API
- [x] `LessonDetailScreen` — fetch lessons từ API, checkmark từ progressStore
- [x] `ListeningExerciseScreen` — audio player, check answer, shake/highlight feedback (**core feature**, đã migrate sang API)
- [x] `VocabularyScreen` — topic picker (từ DB) + flashcard (words từ DB), flip card hiển thị tất cả definitions từ `meanings[]`, audio playback qua expo-speech
- [x] `SavedWordsScreen` — danh sách + search, fetch chi tiết từ backend (`fetchVocabularyWord`)
- [x] `StatisticsScreen` — weekly bar chart từ `weeklyActivity`, achievements
- [x] `ProfileScreen` — profile header, menu, Daily Reminder toggle (expo-notifications, schedule 8:00 AM hàng ngày, persist AsyncStorage `'notifications_enabled'`)
- [x] `LearningGoalScreen` — stepper goal

**Shared components**
- [x] `Card`, `Button`, `ProgressBar` (`src/components/ui/`)

**Backend** (`../backend-daily-english`)
- [x] Node.js + Express + TypeScript + PostgreSQL, deploy trên Render
- [x] `GET/POST /api/v1/topics`
- [x] `GET/POST /api/v1/topics/:topicId/sections`
- [x] `GET/POST /api/v1/topics/:topicId/sections/:sectionId/lessons`
- [x] Device progress API: register device, get/put progress (upsert — tự tạo device nếu chưa có)
- [x] `GET /api/v1/vocabulary/topics` — trả `DISTINCT topic` từ bảng `vocabulary`
- [x] `GET /api/v1/vocabulary/random?topic=xxx&count=N` — random words từ bảng `vocabulary`, chỉ từ có `meanings` không rỗng
- [x] `GET /api/v1/vocabulary/word/:word` — case-insensitive lookup (`LOWER(word)`), trả `WordDetails` với `meanings[]` đầy đủ; Gemini fallback hiện comment out
- [x] `GET /api/v1/devices/:deviceId/progress` — trả default progress cho device mới (không còn throw 404)
- [x] `GET /api/v1/topics/:topicId/sections/:sectionId/lessons/:lessonId/parts` — endpoint listening parts cho ListeningExerciseScreen

**Services mới (frontend)**
- [x] `src/services/notificationService.ts` — `requestNotificationPermission`, `scheduleDaily(hour, minute)`, `cancelDailyReminder`, `getNotificationsEnabled`. Plugin `expo-notifications` đã config trong `app.json`.

---

### Cần làm tiếp 🔧

#### P2 — Tính năng còn thiếu

| Hạng mục | Mô tả |
|----------|-------|
| **Streak lost UI** | Không có thông báo khi streak bị reset về 0 |
| **Empty states** | `LessonDetailScreen` chưa có empty state khi API trả về rỗng |

#### P3 — Nội dung / UX

| Hạng mục | Mô tả |
|----------|-------|
| **Audio URLs** | `audio_url` trong bảng `vocabulary` đều null, đang fallback expo-speech |
| **Notification time picker** | Daily Reminder hiện cố định 8:00 AM, chưa cho user chọn giờ |
