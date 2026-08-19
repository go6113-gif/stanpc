# Supabase 이메일 회원가입 설정

## 1. 환경변수 설정 (.env.local)

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

**가져오는 방법:**
- Supabase 대시보드 → 프로젝트 → Settings → API
- `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
- `anon public` → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

---

## 2. Supabase 대시보드에서 이메일 인증 활성화

### (1) Authentication 설정
1. Supabase 대시보드 → **Authentication** → **Providers**
2. **Email** 찾기 → **Enable** 클릭

### (2) 이메일 확인 비활성화 (필수!)
1. **Authentication** → **Policies**
2. "Require email confirmation" → **OFF** 설정
   - (가입 즉시 세션 발급, 이탈률 감소)

### (3) SMTP 설정 (선택사항)
- 기본값: Supabase가 제공하는 SMTP 사용
- 커스텀 이메일: **Email** → **SMTP Settings** 에서 설정

---

## 3. 환경변수 확인

```bash
# poca-exchange/.env.local 에서 확인
NEXT_PUBLIC_SUPABASE_URL=✓ 설정됨
NEXT_PUBLIC_SUPABASE_ANON_KEY=✓ 설정됨
```

---

## 4. 테스트

```bash
# poca-exchange/ 디렉터리에서
npm run dev

# 브라우저에서 확인
http://localhost:3000/auth/signup
```

### 테스트 플로우
1. 이메일: `test@example.com`
2. 비밀번호: `TestPass123` (8자 이상, 영문+숫자)
3. "회원가입" 클릭
4. ✅ 성공 메시지 표시 → 홈으로 이동

---

## 5. 프로덕션 체크리스트

- [ ] `NEXT_PUBLIC_SUPABASE_URL` 환경변수 추가
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` 환경변수 추가
- [ ] Supabase Email provider 활성화
- [ ] "Require email confirmation" OFF 설정
- [ ] 커스텀 이메일 필요시 SMTP 설정 (선택)

---

## 트러블슈팅

| 에러 | 원인 | 해결 |
|------|------|------|
| `Invalid API key` | 환경변수 미설정 | 1번 단계 확인 |
| `Unsupported provider` | Email provider OFF | Supabase 대시보드에서 활성화 |
| 이메일 미도착 | SMTP 미설정 | Supabase 기본 SMTP 사용 or 커스텀 설정 |

---

**설정 완료 후 `npm run dev` 재시작하세요!** 🚀
