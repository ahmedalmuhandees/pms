# تصريح الزائر الذكي — تعليمات ربط تطبيق الساكن

هذه الواجهة للـ **تطبيق الموبايل (حساب الساكن فقط)**.  
لوحة الإدارة لديها صفحة مسح للحراس: `/visitor-scan`.

## المتطلبات

- تسجيل دخول ساكن: `POST /api/Auth/resident-login`
- إرسال التوكن في الهيدر: `Authorization: Bearer {token}`
- صلاحية الساكن تتضمن أصلاً `Permissions.Visitors.Create`

## 1) إنشاء تصريح زائر

`POST /api/Visitors`

### Body

```json
{
  "visitorName": "أحمد علي",
  "visitorPhone": "07700000000",
  "visitReason": "زيارة عائلية",
  "validUntil": "2026-11-07T23:59:59",
  "unitId": "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee"
}
```

| الحقل | مطلوب؟ | ملاحظات |
|---|---|---|
| `visitorName` | نعم | اسم الزائر |
| `visitorPhone` أو `phone` | مستحسن | رقم هاتف الزائر |
| `visitReason` | مستحسن | سبب الزيارة |
| `validUntil` | مستحسن | انتهاء الصلاحية؛ إن لم يُرسل يُضبط لنهاية يوم الزيارة |
| `unitId` | اختياري | إن أُرسل يجب أن يطابق وحدة الساكن؛ وإلا يُؤخذ من حساب الساكن |
| `residentId` | لا ترسله من التطبيق | السيرفر يفرضه من توكن الساكن |

> يمكن أيضاً إرسال `phone` بدل `visitorPhone` — كلاهما مقبول.

### Response (`data`)

أهم حقل للتطبيق:

```json
{
  "id": "...",
  "visitorName": "أحمد علي",
  "phone": "07700000000",
  "qrCodeToken": "a8f3b2c190124e8bb89a123456789abc",
  "validUntil": "2026-11-07T23:59:59",
  "visitReason": "زيارة عائلية",
  "isUsed": false,
  "unitId": "...",
  "residentId": "..."
}
```

### ماذا يفعل التطبيق بعد الإنشاء؟

1. خزّن `qrCodeToken`.
2. ارسم QR Code من **قيمة `qrCodeToken` كنص خام** (لا تضف URL إلا إذا اتفقت مع الحراسة).
3. اعرض للساكن: اسم الزائر + السبب + `validUntil` + صورة الـ QR.
4. عند انتهاء `validUntil` أو `isUsed = true` أخفِ/عطّل مشاركة التصريح.

## 2) عرض تصاريح الساكن

`GET /api/Visitors`

- للساكن يُفلتر تلقائياً على تصاريحه فقط.
- استخدم الحقول: `qrCodeToken`, `isUsed`, `validUntil`, `visitReason`, `usedAt`.

## 3) ما لا ينفّذه تطبيق الساكن

- **لا تستدعِ** `POST /api/Visitors/scan-pass` من تطبيق الساكن.
- المسح مخصص لحسابات الموظفين/الحراسة من لوحة الويب `/visitor-scan`.

## 4) مسح الحراسة (مرجع فقط)

`POST /api/Visitors/scan-pass`

```json
{
  "qrCodeToken": "a8f3b2c190124e8bb89a123456789abc",
  "carModel": "تويوتا كورولا",
  "carPlateNumber": "بغداد 12345"
}
```

أخطاء شائعة:

| HTTP | الرسالة |
|---|---|
| 404 | تصريح غير صالح |
| 400 | عذراً، هذا التصريح تم استخدامه مسبقاً! |
| 400 | عذراً، هذا التصريح منتهي الصلاحية! |

## 5) مثال تدفق سريع

```
ساكن يسجّل دخول
  → POST /api/Visitors (إنشاء تصريح)
  → يعرض QR من qrCodeToken
زائر يصل البوابة
  → الحارس يمسح QR في /visitor-scan
  → POST /api/Visitors/scan-pass
  → تظهر بيانات الساكن/الوحدة ويُعلَّم IsUsed=true
```
