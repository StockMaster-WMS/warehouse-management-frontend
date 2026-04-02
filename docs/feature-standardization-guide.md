# Feature Standardization Guide

Tài liệu này là tiêu chuẩn chung để triển khai hoặc refactor các trang mới theo cùng một luồng kiến trúc: `page -> hook -> service -> backend`.

## 1) Mục tiêu

- Page tập trung render giao diện và wiring event.
- Hook xử lý state, derived state, luồng nghiệp vụ, toast/confirm.
- Service (RTK Query) xử lý gọi API, transform response, cache tags.
- Type/schema tách riêng để dễ test và tái sử dụng.
- Import thống nhất qua public API của module (`index.ts`).

## 2) Cấu trúc thư mục bắt buộc

```text
src/components/features/<feature>/
  components/            # UI thuần, không chứa nghiệp vụ nặng
  hooks/                 # orchestration/business flow
  schemas/               # zod schema + form validation
  constants.ts           # hằng số dùng chung (status, pageSize...)
  utils.ts               # helper format/map thuần
  index.ts               # public API cho module
```

Trong App Router:

```text
src/app/(dashboard)/<feature>/page.tsx
src/app/(dashboard)/<feature>/new/page.tsx
src/app/(dashboard)/<feature>/[id]/page.tsx
```

## 3) Quy tắc phân tầng

### 3.1 Page

- Chỉ render layout, section, compose component.
- Chỉ gọi hook cấp cao của feature.
- Không gọi API trực tiếp trong page.
- Không đặt business rule dài trong page.

### 3.2 Hook

- Chứa:
  - filter/search/pagination state
  - action handler (create/update/delete, workflow actions)
  - validate luồng nghiệp vụ trước mutation
  - derived state (`hasAnyFilter`, `canGoNext`...)
- Có thể dùng toast/confirm tại đây.
- Trả về object rõ ràng để page consume.

### 3.3 Service

- Tất cả endpoint đặt trong `src/store/services`.
- Dùng `normalizeApiResponsePaged` cho API phân trang.
- `invalidatesTags` / `providesTags` đầy đủ.
- Tách params builder riêng để tránh lặp logic.

### 3.4 Component

- Props typed rõ ràng, hạn chế `any`.
- UI component không mutate nghiệp vụ trực tiếp.
- Event callback truyền đủ dữ liệu cần thiết (ví dụ: `id + name`), không truyền thiếu.

## 4) Checklist trước khi merge

- [ ] Page đã gọn, logic chính nằm trong hook.
- [ ] Không còn import sâu vào `hooks/components` từ app page.
- [ ] Module có `index.ts` export đầy đủ, app import qua `index.ts`.
- [ ] Không còn `any` ở luồng quan trọng (form/filter/table row).
- [ ] Action xóa/sửa dùng đúng `id`, hiển thị đúng `name`.
- [ ] `get_errors` không còn lỗi TypeScript.
- [ ] Loading/error/empty/toast state đầy đủ.

## 5) Quy trình triển khai cho feature mới

1. Tạo skeleton module trong `features/<feature>`.
2. Tạo `constants.ts` + `utils.ts` trước.
3. Tách list page thành:
   - `use<Feature>PageLogic`
   - `<Feature>FiltersPanel`
   - `<Feature>Table`
   - `<Feature>PaginationFooter`
4. Tách detail page thành `use<Feature>DetailLogic`.
5. Tách new/edit page thành `useCreate<Feature>Form` / `useEdit<Feature>Form` + schema.
6. Hoàn thiện `index.ts` và đổi import về public API.
7. Chạy check lỗi TS cho các file vừa đổi.

## 6) Mẫu file index.ts

```ts
export { useXxxPageLogic } from "./hooks/useXxxPageLogic";
export { useXxxDetailLogic } from "./hooks/useXxxDetailLogic";
export { useCreateXxxForm } from "./hooks/useCreateXxxForm";

export { XXX_PAGE_SIZE, XXX_STATUS_OPTIONS } from "./constants";
export { formatXxxDate } from "./utils";

export { XxxFiltersPanel } from "./components/XxxFiltersPanel";
export { XxxTable } from "./components/XxxTable";
export { XxxPaginationFooter } from "./components/XxxPaginationFooter";
```

## 7) Bài học thực tế từ Product và Orders

- Không truyền `name` cho action delete nếu backend cần `id`.
- Không để component import ngược vào hook chỉ để lấy constants.
- Tính toán map/filter nên dùng helper typed thay vì `any`.
- Khi đổi cấu trúc module, ưu tiên giữ nguyên hành vi cũ, chỉ thay vị trí logic.

## 8) Definition of Done (DoD)

Feature đạt chuẩn khi:

- Luồng rõ ràng: `Page render -> Hook orchestration -> Service API -> BE`.
- Public API ổn định qua `index.ts`.
- TypeScript sạch lỗi.
- Code review nhìn vào là thấy ngay business flow nằm ở hook, không rải rác trong page.
