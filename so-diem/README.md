# Sổ Điểm: tính GPA và phân tích điểm bằng AI

Website tương tự tienichsv.com, thêm lưu học kỳ, biểu đồ GPA và phân tích bằng Google Gemini.

- **Front-end:** React 18 + Vite + Tailwind CSS 3 + Recharts (JavaScript)
- **Back-end:** Node.js 20+ / Express 5, REST API
- **Cơ sở dữ liệu:** MySQL 8 (hoặc MySQL tương thích)
- **AI:** Gemini API (gọi qua REST từ backend, khóa API không lộ ra trình duyệt)

## Cấu trúc

```
database/schema.sql      Tạo bảng users, semesters, courses, analyses
server/                  API Express
  src/services/gpa.js      Quy đổi điểm, tính GPA, điểm cuối kỳ cần đạt, GPA kỳ vọng
  src/services/gemini.js   Gọi Gemini và đọc kết quả JSON
  src/routes/              auth, gpa, semesters, analysis
client/                  Giao diện React
```

## Chạy trên máy

Yêu cầu: Node.js 20 trở lên, MySQL 8 (XAMPP, MySQL Workbench hoặc Docker đều được).

1. Tạo cơ sở dữ liệu: chạy file `database/schema.sql` trong MySQL.
2. Backend:
   ```bash
   cd server
   cp .env.example .env     # điền DB_PASSWORD, JWT_SECRET, GEMINI_API_KEY
   npm install
   npm run dev              # http://localhost:4000
   ```
3. Frontend (cửa sổ terminal khác):
   ```bash
   cd client
   npm install
   npm run dev              # http://localhost:5173
   ```

Khóa Gemini miễn phí lấy tại https://aistudio.google.com/apikey. Tên model đặt trong `GEMINI_MODEL`; nếu Google đổi tên model, chỉ cần sửa biến này.

## Danh sách endpoint

Tất cả bắt đầu bằng `/api`. Lỗi trả về dạng `{ "error": "..." }`.

| Method | Endpoint | Đăng nhập | Mô tả |
|---|---|---|---|
| GET | `/health` | Không | Kiểm tra server |
| POST | `/auth/register` | Không | `{ name, email, password }` |
| POST | `/auth/login` | Không | `{ email, password }` → `{ token, user }` |
| GET | `/auth/me` | Có | Thông tin tài khoản |
| POST | `/gpa/calculate` | Không | `{ courses: [{ name, credits, score }] }` → GPA thang 10 và 4 |
| POST | `/gpa/required-final` | Không | `{ components: [{ name, weight, score }], target }` (một thành phần để `score: null`) |
| POST | `/gpa/expected` | Không | `{ currentGpa, currentCredits, remainingCredits, targetGpa }` |
| GET | `/semesters` | Có | Danh sách học kỳ đã lưu kèm GPA |
| POST | `/semesters` | Có | `{ name, courses }` |
| DELETE | `/semesters/:id` | Có | Xóa học kỳ |
| POST | `/analysis` | Tùy chọn | Có `{ semesters }`: phân tích dữ liệu gửi lên. Không có body và đã đăng nhập: phân tích mọi học kỳ đã lưu |
| GET | `/analysis/history` | Có | 10 lần phân tích gần nhất |

Header cho endpoint cần đăng nhập: `Authorization: Bearer <token>`.

## Triển khai miễn phí

Các gói miễn phí thay đổi thường xuyên, hãy kiểm tra điều kiện hiện tại trước khi chọn.

- **Frontend:** Vercel, Netlify hoặc Cloudflare Pages. Build `npm run build`, thư mục `dist`, đặt `VITE_API_URL` là địa chỉ backend.
- **Backend:** Render (Web Service, gói miễn phí tự ngủ khi không có truy cập nên request đầu chậm). Root directory `server`, build `npm install`, start `npm start`, thêm các biến trong `.env.example`. Đặt `CLIENT_ORIGIN` là địa chỉ frontend.
- **MySQL:** TiDB Cloud Serverless hoặc Aiven (cả hai tương thích MySQL, có gói miễn phí). Chạy `schema.sql` trên đó và đặt `DB_SSL=true`.
- **Gemini:** gói miễn phí của Google AI Studio có giới hạn lượt dùng; backend đã giới hạn 10 lần phân tích mỗi 15 phút cho mỗi IP.

## Lưu ý

- Bảng quy đổi điểm nằm ở `SCALE` trong `server/src/services/gpa.js` (thang tín chỉ phổ biến). Mỗi trường có thể quy đổi khác nhau, hãy chỉnh theo quy chế trường bạn.
- Mật khẩu được băm bằng bcrypt, JWT hết hạn sau 7 ngày. Hãy đặt `JWT_SECRET` dài và không commit file `.env`.
