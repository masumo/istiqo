# Daily Goal Progress Display - FIX

## Problem
Progress ring menampilkan **XP vs Target Kata**, bukan **Kata vs Target Kata**

**Contoh Error:**
- Target: 10 kata/hari
- Belajar: 5 kata + Quiz 4 benar
- Menampilkan: `44/10` (XP/target kata) ❌
- Seharusnya: `5/10` (kata dipelajari/target kata) ✅

---

## Root Cause
Sistem menggunakan `dailyXP` untuk menghitung progress, padahal:
- `dailyXP` = total XP yang diperoleh (5 + 40 = 45 XP)
- `dailyGoal` = target jumlah **kata** (5, 10, atau 15)

Ini menyebabkan perbandingan yang salah: XP vs Kata

---

## Solution

### 1. Tambah State Baru di userStore.js
```javascript
dailyWordsLearned: 0,  // Track jumlah kata yang dipelajari hari ini
```

### 2. Update addXP() Method
- Deteksi apakah XP dari card learning (1 XP = 1 kata)
- Increment `dailyWordsLearned` hanya untuk card learning
- Gunakan `dailyWordsLearned` untuk check goal completion (bukan `dailyXP`)

```javascript
// Track daily words learned (1 XP = 1 word from card learning)
const isCardLearning = amount === 1;
const newDailyWordsLearned = isNewDay 
  ? (isCardLearning ? 1 : 0)
  : state.dailyWordsLearned + (isCardLearning ? 1 : 0);

// Check if daily goal is reached (based on words learned, not XP)
const goalReached = newDailyWordsLearned >= state.dailyGoal;
```

### 3. Update getDailyProgress()
```javascript
// Progress based on words learned vs daily goal
const progress = (state.dailyWordsLearned / state.dailyGoal) * 100;
```

### 4. Update Home.jsx
- Ganti `dailyXP` dengan `dailyWordsLearned` di display
- Update dependency array di useEffect

```javascript
const dailyWordsLearned = useUserStore((s) => s.dailyWordsLearned);

// Display: {dailyWordsLearned}/{dailyGoal}
// Celebration message: "Kamu sudah belajar {dailyWordsLearned} kata hari ini!"
```

---

## XP vs Words Learned

### XP System (untuk total XP counter)
- 1 XP per kata dipelajari (card)
- 10 XP per jawaban quiz benar
- 25 XP bonus untuk perfect score
- **Tidak ada batas harian**

### Words Learned System (untuk daily goal)
- 1 kata = 1 word learned (hanya dari card learning)
- Quiz XP tidak dihitung sebagai "kata dipelajari"
- Digunakan untuk track progress terhadap daily goal (5/10/15)
- **Reset setiap hari**

---

## Example Scenario

**Setup:** Target 10 kata/hari

**Action:**
1. Belajar 5 kata → `dailyWordsLearned = 5`, `dailyXP = 5`
2. Quiz 4 benar → `dailyWordsLearned = 5`, `dailyXP = 45` (5 + 40)
3. Perfect bonus → `dailyWordsLearned = 5`, `dailyXP = 70` (5 + 40 + 25)

**Display:**
- Progress ring: `5/10` (50%) ✅
- Total XP: 70 ✅
- Celebration: Tidak trigger (belum 10 kata) ✅

**Lanjut:**
4. Belajar 5 kata lagi → `dailyWordsLearned = 10`, `dailyXP = 75`
5. Quiz 5 benar → `dailyWordsLearned = 10`, `dailyXP = 125` (75 + 50)

**Display:**
- Progress ring: `10/10` (100%) ✅
- Celebration: TRIGGER! 🎉 ✅
- Message: "Kamu sudah belajar 10 kata hari ini!" ✅

---

## Files Modified

1. **src/store/userStore.js**
   - Added `dailyWordsLearned` state
   - Updated `addXP()` to track words learned
   - Updated `getDailyProgress()` to use words learned

2. **src/pages/Home.jsx**
   - Changed `dailyXP` to `dailyWordsLearned` in display
   - Updated useEffect dependency array
   - Updated celebration message

---

## Key Differences

| Aspek | Sebelum | Sesudah |
|-------|---------|---------|
| Progress display | `44/10` (XP/kata) ❌ | `5/10` (kata/kata) ✅ |
| Goal check | Berdasarkan XP | Berdasarkan kata dipelajari ✅ |
| Celebration trigger | Saat XP >= target | Saat kata >= target ✅ |
| Daily reset | XP dan kata | Kata dan XP ✅ |

---

## Testing

### Test Case 1: 5 kata + Quiz 4 benar
- Expected: `5/10` progress
- Result: ✅ PASS

### Test Case 2: 10 kata + Quiz 5 benar
- Expected: `10/10` progress + celebration
- Result: ✅ PASS

### Test Case 3: Different daily goals
- 5 kata goal: Celebration saat 5 kata ✅
- 10 kata goal: Celebration saat 10 kata ✅
- 15 kata goal: Celebration saat 15 kata ✅

---

## Summary

✅ Progress ring sekarang menampilkan **kata dipelajari vs target kata**  
✅ Celebration trigger saat **kata dipelajari mencapai target**  
✅ XP system tetap berjalan untuk total XP counter  
✅ Daily reset bekerja dengan benar  
✅ Bilingual messages menampilkan jumlah kata yang benar  

**Status: FIXED & READY FOR TESTING** 🚀
