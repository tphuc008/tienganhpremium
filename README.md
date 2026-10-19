# Tiếng Anh Premium — Vocabulary Website

Website độc lập với English Practice Hub cũ, dùng nền xanh đen, tím và cyan tương tự thiết kế cũ.


## Giao diện: Format B — Study Workspace

- Sidebar trái: Thư viện, danh sách Unit và hai phần của Unit đang học.
- Chọn Unit trước khi đọc bài giảng hoặc làm bài tập.
- Mỗi Unit có hai mục: Bài giảng chi tiết và Bài tập mới (10–20 câu A–D + passage 5 câu).
- Nút in riêng trên từng trang; bản in mở theo đúng nội dung đang xem.
- Trên điện thoại sidebar đổi thành thanh điều hướng ngắn, tránh chiếm chiều rộng bài học.
- Chưa thêm kiến thức Vocabulary chính thức; chỉ có khung chờ duyệt.

## Structure preview

- Trang chủ chọn Unit; mỗi Unit có đúng hai lựa chọn: Bài giảng chi tiết / Bài tập mới.
- Bài giảng chi tiết: overview, các mục kiến thức để trống, notes/comments được ChatGPT tổng hợp.
- Bài tập mới: 10–20 câu A–D và một passage ngắn có 5 câu.
- Cả hai lựa chọn đều in/PDF được. Bản in có thể được chỉnh sửa riêng và không thay đổi nội dung chung.
- Chưa thêm kiến thức Vocabulary hay format giải thích; đang chờ duyệt.

## ChatGPT → Website

1. Giáo viên gửi Google Docs link trong ChatGPT và yêu cầu đọc đầy đủ comments.
2. ChatGPT tạo hai phần: bài giảng chi tiết và 10–20 câu Vocabulary và 5 câu Reading.
3. Giáo viên duyệt, copy gói JSON sang trang Quản lý của website, chọn Xem thử.
4. Trang Quản lý cho tải file lessons.json.
5. Giáo viên commit file xuất ra vào data/lessons.json trên GitHub; mọi học sinh thấy cùng bản đó sau khi deploy.

Lưu ý: GitHub Pages là hosting tĩnh, nên paste dữ liệu ở trang Quản lý hiện chỉ là preview trong localStorage của trình duyệt đó, không đồng bộ cho học sinh. Xuất bản trực tiếp chỉ bằng một nút sẽ cần backend hoặc tích hợp GitHub write có xác thực sau khi duyệt cấu trúc.

## JSON format ban đầu (chưa chốt format kiến thức)

File data/lessons.json chứa object có version và units (array). Mỗi unit chứa:

- id, title, topic, published
- lesson: { overview, sections: [{ title, content }], notes: [string] }
- practice: { mcq: [{ question, options: [A,B,C,D], answer, explanation }], reading: { title, passage, questions: [cùng kiểu MCQ] } }

Bộ chuẩn gồm 10–20 phần tử practice.mcq và 5 phần tử practice.reading.questions.

## GitHub Pages

Vào Settings → Pages → Build and deployment → Deploy from a branch → main → /(root) → Save.

Đường dẫn dự kiến: https://tphuc008.github.io/tienganhpremium/

Không đưa API keys, dữ liệu học sinh riêng tư hoặc bí mật vào repository công khai. Màn Quản lý hiện chưa có hệ thống xác thực.
## Unit 6 — Artificial Intelligence (đã xuất bản)

- Nguồn: Google Docs Unit 6 for Students, bao gồm 71 comments.
- Bài giảng: 14 nhóm kiến thức, 16 ghi chú tổng hợp đã chuẩn hóa, phụ lục lời giải bộ 40 câu gốc.
- Bài tập mới: 16 câu Vocabulary (10 Context / 3 Synonym / 3 Antonym), một reading passage với 5 câu hỏi.
- Đáp án và giải thích từng lựa chọn nằm trong dữ liệu chung, chỉ hiện trong giao diện quiz khi học sinh nộp bài hoặc khi chọn in đáp án ở cuối PDF.
- Các ghi chú kiểm định dành riêng cho giáo viên không nằm trong giao diện học sinh.
- Dữ liệu chính thức trong data/lessons.json. Không cần gọi AI API từ website.
