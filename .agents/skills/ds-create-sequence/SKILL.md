---
name: ds-create-sequence
description: Tu dong quet thu muc shell-scripts/sequences, dong bo file am thanh va kich ban sang public/, dang ky cac sequence moi vao SequenceScheduler va DirectorLaptop, tinh toan thoi diem bat dau thong minh (Smart Active Window Seeking), va chay kiem thu tu dong.
---

# Skill: ds-create-sequence

Skill nay huong dan quy trinh va cung cap script tu dong hoa nham giup nha phat trien (Developer) va tro ly AI (AI Agents) nap cac kịch ban phao hoa (sequence scripts tu `shell-scripts/sequences/*.json`) vao he thong trinh dien tu dong (`SequenceScheduler` va `DirectorLaptop`).

Neu kịch ban hoac file am thanh da ton tai trong he thong, skill se tu dong bo qua (idempotent), khong nap de hay tao trung lap.

## Quy tac cot loi (Critical Rules)
1. **NO EMOJIS OR ICONS**: Tuyet doi khong su dung bat ky bieu tuong cam xuc (emoji) hay icon nao trong ma nguon, comment, commit message, tai lieu hay thong bao. Giu toan bo noi dung chuyen nghiep va thuan van ban (text-only).
2. **IDEMPOTENT & NON-DESTRUCTIVE**: Kiem tra ky truoc khi copy hoac dang ky. Neu sequence ID da co trong `DEFAULT_SEQUENCES` hoac file mp3 da co trong `public/`, bo qua buoc do.
3. **SMART ACTIVE WINDOW SEEKING**: Cac sequence co chua nhac hoac cac cue phao hoa bat dau sau giay thu 5.0 (vi du nhac drop o giay 86.3s) phai duoc he thong tu dong seek den ngay truoc nhap drop (0.6s) de phao hoa va am nhac bung no dong thoi, khong de khoang chet (dead air gap).
4. **STATIC ASSET COMPLIANCE**: Vite chi serve file tinh tu thu muc `public/`. Tat ca file am thanh (.mp3) va sequence json phai duoc sao chep vao `public/` va `public/audio/` de tranh loi HTTP 404.
5. **VERIFY VIA TEST & BUILD**: Sau khi nap sequence moi, luon chay bo kiem thu `npx vitest run tests/managers/SequenceScheduler.test.js` va lenh `npm run build` de dam bao khong gay loi bien dich.

Chi tiet quy trinh tung buoc, ban do thu muc va script thuc thi tu dong xem tai: [workflow.md](workflow.md).

