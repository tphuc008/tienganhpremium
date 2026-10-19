# Tiếng Anh Premium — Vocabulary Website

Website độc lập với English Practice Hub cũ, dùng nền xanh đen, tím và cyan tương tự thiết kế cũ.

## Structure preview

- Trang chủ chọn Unit; mỗi Unit có đúng hai lựa chọn: Bài giảng chi tiết / Bài tập mới.
- Bài giảng chi tiết: overview, các mục kiến thức để trống, notes/comments được ChatGPT tổng hợp.
- Bài tập mới: 10 câu A–D và một passage ngắn có 5 câu.
- Cả hai lựa chọn đều in/PDF được. Bản in có thể được chỉnh sửa riêng và không thay đổi nội dung chung.
- Chưa thêm kiến thức Vocabulary hay format giải thích; đang chờ duyệt.

## ChatGPT → Website

1. Giáo viên gửi Google Docs link trong ChatGPT và yêu cầu đọc đầy đủ comments.
2. ChatGPT tạo hai phần: bài giảng chi tiết và 10+5 câu luyện tập.
3. Giáo viên duyệt, copy gói JSON sang trang Quản lý của website, chọn Xem thử.
4. Trang Quản lý cho tải file lessons.json.
5. Giáo viên commit file xuất ra vào data/lessons.json trên GitHub; mọi học sinh thấy cùng bản đó sau khi deploy.

Lưu ý: GitHub Pages là hosting tĩnh, nên paste dữ liệu ở trang Quản lý hiện chỉ là preview trong localStorage của trình duyệt đó, không đồng bộ cho học sinh. Xuất bản trực tiếp chỉ bằng một nút sẽ cần backend hoặc tích hợp GitHub write có xác thực sau khi duyệt cấu trúc.

## JSON format ban đầu (chưa chốt format kiến thức)

File data/lessons.json chứa object có version và units (array). Mỗi unit chứa:

- id, title, topic, published
- lesson: { overview, sections: [{ title, content }], notes: [string] }
- practice: { mcq: [{ question, options: [A,B,C,D], answer, explanation }], reading: { title, passage, questions: [cùng kiểu MCQ] } }

Bộ chuẩn gồm 10 phần tử practice.mcq và 5 phần tử practice.reading.questions.

## GitHub Pages

Vào Settings → Pages → Build and deployment → Deploy from a branch → main → /(root) → Save.

Đường dẫn dự kiến: https://tphuc008.github.io/tienganhpremium/

Không đưa API keys, dữ liệu học sinh riêng tư hoặc bí mật vào repository công khai. Màn Quản lý hiện chưa có hệ thống xác thực.