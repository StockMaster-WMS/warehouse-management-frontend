# Báo Cáo Kiểm Tra Hệ Thống Và Luồng Nghiệp Vụ Chính

Ngày rà soát: 21/05/2026  
Phạm vi: frontend Next.js/React trong `warehouse-management-frontend`, backend Spring Boot trong `warehouse-management-backend`, migration, service nghiệp vụ, bảo mật, hiệu năng, logic tồn kho và các luồng thao tác chính.

## 1. Tóm Tắt Điều Hành

Hệ thống đã có nền tảng khá chắc cho một WMS nội bộ: phân quyền theo vai trò, giới hạn dữ liệu theo kho, refresh token bằng HttpOnly cookie, transaction ở các nghiệp vụ nhạy cảm, idempotency cho nhập kho/điều chỉnh tồn, audit log, notification và các test nghiệp vụ quan trọng cho inbound/outbound. Đây là các điểm tốt và đúng hướng.

Các rủi ro cần ưu tiên nằm ở 5 nhóm:

| Mức | Nhóm | Vấn đề chính | Tác động |
| --- | --- | --- | --- |
| Cao | Kiểm thử/CI | Backend hiện bị chặn ở bước compile do file generated mapper trong `target/generated-sources/annotations` đọc lỗi | Không xác nhận được toàn bộ test suite, dễ bỏ lọt regression |
| Trung bình/Cao | Bảo mật triển khai | `AUTH_COOKIE_SECURE` mặc định false, `auth.mode` mặc định public, AI engine URL có default ngrok | Cấu hình production sai có thể làm giảm an toàn session hoặc gọi nhầm dịch vụ ngoài |
| Trung bình | Logic kho | Hoàn tất putaway đã có scope theo kho nhưng chưa thấy enforcement theo người được giao như picking | Nhân viên cùng kho có thể hoàn tất task không phải của mình nếu UI/API cho phép |
| Trung bình | Hiệu năng | RMA report đang lấy toàn bộ dữ liệu rồi filter trong memory | Chậm khi dữ liệu return lớn, tốn RAM/backend CPU |
| Thấp/Trung bình | Frontend/a11y | React Doctor còn cảnh báo label, giant component, prefer-useReducer, dynamic import component | Ảnh hưởng maintainability, khả năng dùng trên mobile và thiết bị hỗ trợ |

Kết luận: hệ thống dùng được cho các luồng chính, nhưng trước khi production nên xử lý cấu hình bảo mật, làm sạch build backend/test suite, và tối ưu các báo cáo có nguy cơ tăng dữ liệu lớn.

## 2. Cách Rà Soát

Đã kiểm tra các khu vực chính:

- Frontend routes: login, dashboard, warehouses, locations, categories, products, suppliers, customers, purchase orders, inbound, putaway, sales orders, picking, returns, cycle counts, inventory, reports, history, notifications, settings, security, AI assistant.
- Frontend auth/session: `AuthGuard`, RTK Query API slice, axios refresh flow, access control route map.
- Backend security: `SecurityConfig`, JWT provider/filter, auth controller/service, role-based `@PreAuthorize`.
- Backend nghiệp vụ: inbound receipt, purchase order, putaway, stock level/movement, sales order, picking, RMA, cycle count, warehouse access scope.
- Database/migration: các migration gần đây cho audit, cycle count, RMA, notification, idempotency, assignment kho.
- Test/build: frontend lint/build đã pass sau lượt cải thiện mobile trước đó; backend test hiện bị chặn ở compile artifact.

## 3. Kiến Trúc Tổng Quan

### 3.1 Frontend

- Next.js app router, các route nghiệp vụ nằm dưới `src/app/(dashboard)`.
- State/data fetching dùng Redux Toolkit Query qua API service trung tâm.
- Axios instance có:
  - `withCredentials` để gửi refresh cookie.
  - Access token lưu trong memory, không lưu localStorage.
  - Refresh queue để nhiều request 401 không bắn refresh đồng thời.
  - Tự redirect login khi refresh bị từ chối.
- `AuthGuard`:
  - Nếu chưa có access token thì gọi refresh session.
  - Gọi `/auth/me` để lấy user hiện tại.
  - Kiểm tra role và route qua `canAccessPath`.
  - Chuyển user về route mặc định theo role.

### 3.2 Backend

- Spring Boot, JPA/Hibernate, Flyway migration.
- JWT access token + refresh token cookie.
- Method-level authorization bằng `@PreAuthorize`.
- Warehouse data scope qua `WarehouseAccessService`.
- Các nghiệp vụ tồn kho quan trọng chạy trong transaction và dùng lock/idempotency:
  - Nhập kho từ PO.
  - Điều chỉnh tồn.
  - Reserved stock.
  - Xuất kho khi sales order shipped.
  - Putaway move từ receiving location sang location thật.

## 4. Những Phần Đã Làm Tốt

### 4.1 Bảo mật phiên đăng nhập khá tốt

- Access token chỉ lưu memory, giảm rủi ro bị lấy qua localStorage nếu có XSS.
- Refresh token dùng HttpOnly cookie.
- Có rotate refresh token khi refresh.
- Có blacklist access/refresh token khi logout/change session.
- JWT provider chặn secret rỗng, secret placeholder và secret quá ngắn.

### 4.2 Phân quyền và scope kho rõ ràng

- Role chính: `ADMIN`, `WAREHOUSE_MANAGER`, `WAREHOUSE_STAFF`, `REPORT_VIEWER`.
- Frontend có route guard.
- Backend vẫn có `@PreAuthorize`, nên không phụ thuộc hoàn toàn vào UI.
- `WarehouseAccessService` giới hạn warehouse visible theo role/user assignment.

### 4.3 Luồng tồn kho có kiểm soát tốt

- Stock adjustment có retry optimistic lock.
- Không cho on-hand âm.
- Không cho reserved vượt on-hand.
- Outbound không trừ tồn khi picking hoàn tất; tồn chỉ bị trừ khi ship. Đây là logic đúng cho kho thực tế.
- Cancel sales order giải phóng reserved.
- Inbound receipt có idempotency key để tránh double nhập.
- Putaway dùng adjustment âm/dương với idempotency key cho từng chiều chuyển.

### 4.4 Audit và notification được gắn vào nhiều điểm nhạy cảm

- Auth/profile/password, PO, inbound, putaway, sales order, picking exception, RMA, stock movement đều có dấu vết audit/notification ở nhiều chỗ.
- Exception handler trả lỗi generic cho lỗi ngoài dự kiến, có `errorId`, không lộ stack trace ra client.

### 4.5 Frontend đã có cải thiện mobile quan trọng

- Các bảng/category/location đã có hướng responsive tốt hơn.
- Search toolbar, pagination, tabs, page header đã thân thiện mobile hơn.
- Supplier edit có bottom action bar trên mobile.
- Đây là đúng nhu cầu vì nhân viên kho thường dùng điện thoại.

## 5. Phát Hiện Và Khuyến Nghị Ưu Tiên

### 5.1 Backend test đang bị chặn ở compile

Mức độ: Cao  
Khu vực: backend build/test  
Hiện trạng:

Khi chạy `.\mvnw.cmd test`, Maven dừng ở compile với lỗi đọc generated mapper:

- `target/generated-sources/annotations/com/warehouse_service/mapper/StockLevelMapperImpl.java`
- `target/generated-sources/annotations/com/outbound_service/mapper/PickingItemMapperImpl.java`

Nhận định:

- Đây giống lỗi artifact/stale/locked file trong `target` trên Windows hơn là lỗi business test.
- Nhưng vì compile chưa qua, chưa thể kết luận backend test suite xanh.

Khuyến nghị:

1. Clean target an toàn rồi chạy lại test.
2. Đảm bảo CI luôn chạy từ workspace sạch.
3. Nếu lỗi lặp lại, kiểm tra MapStruct/generated source encoding hoặc quyền file trong `target`.

### 5.2 Cấu hình bảo mật production cần siết lại

Mức độ: Trung bình/Cao  
Khu vực: `application.yaml`, auth cookie, deployment env

Hiện trạng:

- `AUTH_COOKIE_SECURE` mặc định false.
- `auth.mode` mặc định public.
- `AUTH_JWT_SECRET` default rỗng nhưng provider đã chặn khi app start.
- AI engine URL có default ngrok.

Tác động:

- Nếu deploy production mà quên set env, refresh cookie có thể không bị ép HTTPS.
- `auth.mode=public` có thể làm hiểu nhầm hoặc mở hành vi public ở các module khác nếu code dựa vào flag này.
- Default ngrok là rủi ro vận hành: gọi nhầm dịch vụ ngoài, rò dữ liệu nghiệp vụ, hoặc đứt tích hợp.

Khuyến nghị:

1. Production bắt buộc:
   - `AUTH_COOKIE_SECURE=true`
   - JWT secret dài, random, không commit vào repo.
   - CORS chỉ cho domain frontend thật.
2. Bỏ default ngrok khỏi config, chuyển thành env bắt buộc khi bật AI.
3. Thêm profile `prod` fail-fast nếu cookie secure false hoặc AI URL là ngrok.

### 5.3 `/api/auth/me` đang permit ở HTTP layer

Mức độ: Trung bình  
Khu vực: `SecurityConfig`, `AuthController`

Hiện trạng:

- `SecurityConfig` permit `/api/auth/me`.
- Controller tự đọc bearer token và validate.
- Frontend chỉ gọi khi có access token.

Tác động:

- Về thực tế vẫn có validate token.
- Nhưng pattern này lệch với các endpoint authenticated khác, dễ gây nhầm và khó audit.

Khuyến nghị:

- Chuyển `/api/auth/me` sang authenticated endpoint.
- Lấy user từ `SecurityContext` thay vì tự parse bearer ở controller nếu khả thi.

### 5.4 Putaway thiếu kiểm soát người được giao

Mức độ: Trung bình  
Khu vực: `PutawayTaskService`

Hiện trạng:

- Putaway completion có kiểm tra warehouse visible.
- Có overload nhận `actorId` và `canBypassAssignment`, nhưng implementation đang delegate sang hàm không dùng actor/assignment.
- Picking thì có kiểm soát assignee rõ hơn.

Tác động:

- Nếu một nhân viên có access cùng kho, họ có thể hoàn tất task putaway không phải của họ nếu API/UI cho phép.
- Với kho thực tế, điều này làm giảm accountability.

Khuyến nghị:

1. Nếu putaway task có assignee: enforce `assignedTo == actorId` cho `WAREHOUSE_STAFF`.
2. Cho phép `ADMIN`/`WAREHOUSE_MANAGER` bypass.
3. Audit log nên ghi rõ actor hoàn tất và assignee ban đầu.

### 5.5 RMA report filter trong memory

Mức độ: Trung bình  
Khu vực: `RmaService.getReport`

Hiện trạng:

- Service lấy `findAll(Sort...)` rồi filter trong memory.

Tác động:

- Khi số lượng RMA tăng, report chậm và tốn RAM.
- Pagination/filter phía UI không giải quyết được nếu backend đã kéo toàn bộ.

Khuyến nghị:

- Chuyển sang repository query/specification có filter DB-level:
  - type
  - status
  - supplier/customer
  - warehouse
  - date range
- Thêm paging.
- Thêm index cho các cột filter phổ biến.

### 5.6 React Doctor còn cảnh báo maintainability/a11y

Mức độ: Thấp/Trung bình  
Khu vực: frontend

Hiện trạng sau lượt fix trước:

- Warnings đã giảm mạnh từ 958 còn khoảng 153.
- Còn các nhóm cảnh báo:
  - label không liên kết control.
  - component quá lớn.
  - nên dùng `useReducer` cho state phức tạp.
  - dynamic import/component warning.

Tác động:

- Không nhất thiết gây lỗi ngay.
- Nhưng ảnh hưởng bảo trì, accessibility, và trải nghiệm mobile nếu form dùng nhiều.

Khuyến nghị:

1. Ưu tiên fix `label-has-associated-control` vì ảnh hưởng người dùng thật.
2. Tách giant components theo nghiệp vụ.
3. Với form có nhiều state phụ thuộc nhau, chuyển sang reducer hoặc form library pattern thống nhất.

### 5.7 Một số report/dashboard cần quan sát hiệu năng dữ liệu lớn

Mức độ: Thấp/Trung bình  
Khu vực: dashboard/report frontend và backend APIs

Khuyến nghị:

- Với bảng lớn: luôn dùng server-side paging/filter/sort.
- Với chart/report: cache theo khoảng thời gian và warehouse.
- Với inventory: tiếp tục giữ pattern bulk-load summary thay vì N+1.
- Thêm test dữ liệu lớn tối thiểu: 10k stock levels, 10k movements, 5k orders, 5k returns.

## 6. Luồng Chính Cực Chi Tiết

Phần này mô tả luồng theo cách người dùng thật thao tác trên hệ thống, kèm vai trò, màn hình, backend xử lý, dữ liệu thay đổi và lỗi thường gặp.

### 6.1 Luồng đăng nhập, giữ phiên và phân quyền

Vai trò tham gia:

- Tất cả user.

Màn hình:

- `/login`
- Sau đăng nhập chuyển vào `/dashboard`, `/picking` hoặc trang mặc định theo role.

Từng bước thao tác:

1. Người dùng mở hệ thống trên trình duyệt desktop hoặc điện thoại.
2. Nếu chưa đăng nhập, `AuthGuard` chuyển về `/login`.
3. Người dùng nhập email/username và mật khẩu.
4. Người dùng bấm đăng nhập.
5. Frontend gọi API login.
6. Backend kiểm tra user tồn tại, active, mật khẩu BCrypt đúng.
7. Backend trả access token và set refresh token vào HttpOnly cookie.
8. Frontend lưu access token trong memory.
9. Frontend gọi `/auth/me` để lấy thông tin user/roles.
10. Frontend kiểm tra route user được phép truy cập.
11. Nếu user vào route không được phép:
    - Hệ thống chuyển về route mặc định phù hợp role.
12. Khi access token hết hạn:
    - Request API nhận 401.
    - Axios đưa request vào refresh queue.
    - Gọi `/auth/refresh` bằng refresh cookie.
    - Nếu refresh thành công, retry request cũ.
    - Nếu refresh thất bại, xóa session và chuyển về login.

Dữ liệu thay đổi:

- Refresh token được rotate khi refresh.
- Token cũ có thể bị blacklist khi logout.

Lỗi thường gặp:

- Sai mật khẩu: không cấp token.
- User inactive: không đăng nhập.
- Refresh cookie hết hạn/không hợp lệ: bắt đăng nhập lại.
- User có role nhưng không có warehouse assignment: vào các màn kho có thể không thấy dữ liệu.

Điểm tốt:

- Không lưu access token ở localStorage.
- Có refresh queue chống spam refresh.
- Backend vẫn enforce role dù frontend đã guard.

### 6.2 Luồng thiết lập dữ liệu nền

Vai trò tham gia:

- `ADMIN`
- `WAREHOUSE_MANAGER` tùy quyền từng module.

Màn hình chính:

- `/warehouses`
- `/locations`
- `/categories`
- `/products`
- `/suppliers`
- `/customers`
- `/security`

Mục tiêu:

Chuẩn bị dữ liệu để các luồng nhập, xuất, kiểm kê, trả hàng hoạt động đúng.

Từng bước thao tác thực tế:

1. Admin tạo kho:
   - Vào `/warehouses`.
   - Bấm tạo mới.
   - Nhập mã kho, tên kho, địa chỉ, thông tin quản lý.
   - Lưu.
2. Admin/manager tạo vị trí trong kho:
   - Vào `/locations`.
   - Chọn kho.
   - Tạo location receiving, storage, picking, returns nếu nghiệp vụ cần.
   - Nhập mã location dễ scan/dễ đọc.
   - Lưu.
3. Admin tạo danh mục sản phẩm:
   - Vào `/categories`.
   - Tạo cây danh mục cha/con.
   - Kiểm tra hiển thị responsive trên mobile nếu cần thao tác nhanh.
4. Admin/manager tạo sản phẩm:
   - Vào `/products`.
   - Tạo mới.
   - Chọn category.
   - Nhập SKU, tên, đơn vị, barcode nếu có.
   - Thiết lập ngưỡng tồn thấp nếu hệ thống hỗ trợ ở form.
5. Admin/manager tạo nhà cung cấp:
   - Vào `/suppliers`.
   - Tạo supplier.
   - Nhập thông tin liên hệ, điều khoản, trạng thái.
6. Admin/manager tạo khách hàng:
   - Vào `/customers`.
   - Tạo customer.
   - Nhập thông tin giao hàng/liên hệ.
7. Admin phân quyền nhân viên:
   - Vào `/security`.
   - Tạo hoặc chỉnh user.
   - Gán role.
   - Gán warehouse cho nhân viên kho.

Backend xử lý chính:

- Validate unique code/SKU/email theo module.
- Kiểm tra warehouse/location relationship.
- Kiểm tra role trước khi cho tạo/sửa/xóa.
- Ghi audit log với thao tác quan trọng.

Lỗi thường gặp:

- Trùng mã kho, mã location, SKU.
- Location thuộc kho khác.
- Nhân viên chưa được gán warehouse nên không thấy task.
- Xóa dữ liệu nền đã phát sinh giao dịch có thể bị chặn.

Khuyến nghị vận hành:

- Tạo location chuẩn trước khi nhập hàng.
- Đặt mã location ngắn, dễ nhập trên điện thoại.
- Gán warehouse cho nhân viên trước khi giao picking/putaway.

### 6.3 Luồng mua hàng: tạo và duyệt Purchase Order

Vai trò tham gia:

- `ADMIN`
- `WAREHOUSE_MANAGER`

Màn hình:

- `/purchase-orders`
- `/purchase-orders/new`
- `/purchase-orders/[id]`

Mục tiêu:

Tạo đơn mua từ supplier để làm cơ sở nhập kho.

Từng bước thao tác:

1. Manager vào `/purchase-orders`.
2. Bấm tạo mới.
3. Chọn supplier.
4. Chọn warehouse nhận hàng.
5. Chọn ngày dự kiến nhận.
6. Thêm từng dòng sản phẩm:
   - Chọn product/SKU.
   - Nhập số lượng đặt.
   - Nhập đơn giá nếu hệ thống yêu cầu.
7. Kiểm tra tổng số lượng, tổng tiền.
8. Lưu PO ở trạng thái nháp hoặc tạo mới.
9. Mở chi tiết PO.
10. Nếu thông tin đúng, bấm approve/confirm tùy wording UI.
11. Backend chuyển trạng thái PO sang trạng thái có thể nhận hàng.

Backend xử lý chính:

- Kiểm tra supplier active.
- Kiểm tra warehouse user có quyền thao tác.
- Kiểm tra product tồn tại.
- Không cho nhập số lượng âm/0.
- Khi approve, PO mới trở thành nguồn cho inbound receipt.

Dữ liệu thay đổi:

- Tạo PO header.
- Tạo PO items.
- Trạng thái PO thay đổi từ draft/pending sang approved.
- Audit log ghi nhận tạo/duyệt.

Lỗi thường gặp:

- Chưa chọn warehouse.
- Sản phẩm inactive.
- User không có quyền với warehouse.
- PO đã approved thì một số trường không còn được sửa.

Điểm tốt:

- Backend inbound chỉ nhận PO ở trạng thái hợp lệ, nên không thể nhập hàng từ PO chưa được duyệt.

### 6.4 Luồng nhập kho: nhận hàng từ Purchase Order

Vai trò tham gia:

- `ADMIN`
- `WAREHOUSE_MANAGER`
- `WAREHOUSE_STAFF` nếu được cấp quyền theo kho.

Màn hình:

- `/inbound`
- `/inbound/new`
- `/purchase-orders/[id]`

Mục tiêu:

Ghi nhận hàng thực nhận từ nhà cung cấp và tăng tồn ở receiving location.

Từng bước thao tác thực tế trên kho:

1. Nhân viên nhận hàng mở điện thoại hoặc máy tính bảng.
2. Vào màn `/inbound`.
3. Bấm tạo phiếu nhập mới.
4. Chọn PO đã được duyệt.
5. Hệ thống hiển thị danh sách sản phẩm cần nhận:
   - SKU.
   - Tên sản phẩm.
   - Số lượng đã đặt.
   - Số lượng đã nhận trước đó.
   - Số lượng còn được nhận.
6. Nhân viên đối chiếu hàng thực tế với chứng từ.
7. Nhập số lượng thực nhận từng dòng.
8. Chọn receiving location.
9. Nếu có lô/serial/hạn sử dụng, nhập theo form nếu module hỗ trợ.
10. Kiểm tra lại tổng số lượng.
11. Bấm xác nhận nhận hàng.
12. Frontend gửi request kèm idempotency key.
13. Backend lock PO để tránh hai người nhập cùng lúc làm vượt số lượng.
14. Backend kiểm tra:
    - PO ở trạng thái nhận được.
    - Warehouse user có quyền.
    - Product nằm trong PO.
    - Không nhận vượt số lượng còn lại.
    - Không có dòng duplicate làm cộng dồn vượt.
15. Backend tạo inbound receipt.
16. Backend cập nhật số lượng đã nhận trên PO item.
17. Backend tăng tồn ở receiving location.
18. Backend tạo putaway tasks cho hàng vừa nhận.
19. Backend cập nhật trạng thái PO:
    - Partial nếu nhận một phần.
    - Completed/Received nếu nhận đủ.
20. Hệ thống hiển thị phiếu nhập vừa tạo.

Dữ liệu thay đổi:

- Inbound receipt.
- Receipt lines.
- Stock level tăng on-hand ở receiving location.
- Stock movement loại inbound/adjust.
- Putaway tasks.
- PO received quantity/status.
- Audit log.

Lỗi thường gặp:

- PO chưa approve.
- Nhập số lượng lớn hơn số lượng còn lại.
- Receiving location không thuộc warehouse của PO.
- Nhân viên không có quyền kho.
- Request bị double submit: idempotency key giúp trả lại kết quả cũ thay vì nhập đôi.

Điểm tốt:

- Idempotency ở inbound là rất quan trọng và đã có.
- Có lock PO, giảm rủi ro race condition.
- Có test xác nhận idempotency không làm tăng tồn hai lần.

### 6.5 Luồng putaway: chuyển hàng từ receiving sang vị trí lưu trữ

Vai trò tham gia:

- `WAREHOUSE_STAFF`
- `WAREHOUSE_MANAGER`
- `ADMIN`

Màn hình:

- `/putaway`
- Có thể đi từ chi tiết inbound receipt nếu UI có link.

Mục tiêu:

Sau khi nhận hàng, nhân viên đưa hàng từ khu receiving vào kệ/vị trí lưu trữ thật.

Từng bước thao tác thực tế:

1. Nhân viên mở `/putaway` trên điện thoại.
2. Chọn kho hoặc xem danh sách task theo kho được gán.
3. Chọn task đang pending/in-progress.
4. Nhìn thông tin:
   - SKU/product.
   - Số lượng cần cất.
   - Location nguồn: receiving.
   - Location đề xuất nếu có.
5. Nhân viên lấy hàng ở receiving area.
6. Di chuyển hàng đến kệ thực tế.
7. Nhân viên chọn hoặc nhập actual location.
8. Nếu có barcode location, nên scan location để tránh sai vị trí.
9. Nhập số lượng hoàn tất nếu form yêu cầu.
10. Bấm hoàn tất.
11. Backend kiểm tra:
    - Task tồn tại.
    - Task còn pending/in-progress.
    - User có quyền warehouse.
    - Actual location thuộc cùng warehouse với receipt.
12. Backend đánh dấu task completed.
13. Backend trừ tồn ở receiving location.
14. Backend cộng tồn ở actual location.
15. Backend cập nhật trạng thái receipt nếu tất cả putaway xong.
16. Backend ghi stock movement và audit log.

Dữ liệu thay đổi:

- Putaway task status.
- Stock level ở receiving giảm.
- Stock level ở storage/picking location tăng.
- Receipt putaway status.
- Stock movements.
- Audit log.

Lỗi thường gặp:

- Chọn location thuộc kho khác.
- Receiving location không đủ tồn do đã move trước đó.
- Task đã completed.
- Mất mạng khi bấm hoàn tất: idempotency stock movement giúp giảm rủi ro double adjust nếu key ổn định.

Rủi ro cần sửa:

- Service hiện có warehouse scope nhưng chưa thấy enforce assignee như picking.
- Nếu nghiệp vụ yêu cầu task giao cho từng người, cần chặn nhân viên khác hoàn tất task đó.

Khuyến nghị mobile:

- Nút hoàn tất phải lớn, dễ bấm bằng một tay.
- Ưu tiên scan location.
- Màn hình task nên hiển thị SKU, quantity, from/to location thật rõ, không bắt người dùng đọc bảng rộng.

### 6.6 Luồng xem tồn kho và điều chỉnh tồn

Vai trò tham gia:

- `ADMIN`
- `WAREHOUSE_MANAGER`
- `WAREHOUSE_STAFF` tùy quyền.
- `REPORT_VIEWER` thường chỉ xem.

Màn hình:

- `/inventory`
- `/history`
- Có thể liên quan `/reports`.

Mục tiêu:

Theo dõi on-hand, reserved, available và lịch sử movement.

Từng bước thao tác xem tồn:

1. Người dùng vào `/inventory`.
2. Chọn warehouse.
3. Tìm theo SKU, tên sản phẩm hoặc location.
4. Xem từng dòng tồn:
   - Product.
   - Warehouse.
   - Location.
   - On-hand.
   - Reserved.
   - Available.
5. Nếu cần điều tra, mở lịch sử movement.
6. Lọc theo product/location/date để xem nguồn thay đổi tồn.

Từng bước thao tác điều chỉnh tồn:

1. Manager/Admin chọn dòng stock level.
2. Bấm điều chỉnh.
3. Nhập loại điều chỉnh:
   - Tăng tồn.
   - Giảm tồn.
   - Điều chỉnh do hư hỏng/thất lạc/kiểm kê.
4. Nhập số lượng.
5. Nhập lý do.
6. Xác nhận.
7. Backend kiểm tra:
   - User có quyền warehouse.
   - Số lượng hợp lệ.
   - Không làm on-hand âm.
   - Không làm reserved vượt on-hand.
8. Backend cập nhật stock level.
9. Backend tạo stock movement.
10. Nếu thấp hơn ngưỡng, backend tạo notification low stock.

Dữ liệu thay đổi:

- Stock level.
- Stock movement.
- Audit log.
- Notification tồn thấp nếu có.

Điểm tốt:

- Backend có guard chống tồn âm.
- Reserved được kiểm soát riêng.
- Query inventory đã có hướng bulk-load summary, tốt hơn N+1.

Lỗi thường gặp:

- Điều chỉnh giảm lớn hơn available/on-hand.
- Location sai warehouse.
- User chỉ có quyền xem nhưng cố điều chỉnh.

### 6.7 Luồng bán hàng: tạo Sales Order

Vai trò tham gia:

- `ADMIN`
- `WAREHOUSE_MANAGER`
- Nhân viên nghiệp vụ được cấp quyền nếu có.

Màn hình:

- `/orders`
- `/orders/new`
- `/orders/[id]`

Mục tiêu:

Tạo đơn xuất cho khách hàng, sau đó xác nhận để bắt đầu picking.

Từng bước thao tác:

1. Người dùng vào `/orders`.
2. Bấm tạo đơn mới.
3. Chọn customer.
4. Chọn warehouse xuất.
5. Nhập thông tin giao hàng nếu cần.
6. Thêm từng dòng sản phẩm:
   - Chọn SKU/product.
   - Nhập số lượng đặt.
   - Chọn location/policy nếu hệ thống yêu cầu.
7. Kiểm tra số lượng khả dụng.
8. Lưu đơn.
9. Đơn ở trạng thái draft.
10. Nếu cần sửa, người dùng sửa khi đơn còn draft.
11. Khi đã đúng, bấm confirm.
12. Backend chuyển trạng thái sang pending.
13. Backend có thể reserve tồn hoặc tạo điều kiện cho picking tùy implementation hiện tại.

Dữ liệu thay đổi:

- Sales order header.
- Sales order items.
- Audit log.
- Notification nếu có.

Lỗi thường gặp:

- Customer inactive/không tồn tại.
- Warehouse không thuộc quyền user.
- Số lượng không hợp lệ.
- Sửa/xóa đơn sau khi không còn draft bị chặn.

Điểm tốt:

- Service chỉ cho update/delete khi DRAFT.
- Có trạng thái hold/resume/cancel.

### 6.8 Luồng picking: giao việc, nhặt hàng, báo lỗi

Vai trò tham gia:

- `WAREHOUSE_MANAGER`
- `WAREHOUSE_STAFF`
- `ADMIN`

Màn hình:

- `/picking`
- `/orders/[id]`

Mục tiêu:

Nhân viên đi lấy hàng theo task để chuẩn bị đóng gói.

Từng bước manager giao task:

1. Manager mở đơn ở trạng thái pending hoặc picking.
2. Bấm start picking nếu đơn đang pending.
3. Hệ thống chuyển đơn sang picking.
4. Manager xem danh sách picking items.
5. Chọn task.
6. Gán cho nhân viên trong cùng warehouse.
7. Backend kiểm tra:
   - Order ở trạng thái cho phép picking.
   - Assignee có quyền/assignment warehouse.
8. Task chuyển trạng thái assigned/in-progress tùy thiết kế.

Từng bước nhân viên nhặt hàng trên điện thoại:

1. Nhân viên mở `/picking`.
2. Hệ thống chỉ hiển thị task được giao hoặc task theo quyền kho.
3. Nhân viên chọn task.
4. Xem:
   - SKU.
   - Tên sản phẩm.
   - Số lượng cần lấy.
   - Location lấy hàng.
   - Đơn hàng liên quan.
5. Nhân viên đi đến location.
6. Lấy đúng số lượng.
7. Nhập số lượng đã pick hoặc bấm hoàn tất nhanh.
8. Backend kiểm tra:
   - Nếu không phải manager/admin bypass, actor phải là assignee.
   - Số lượng không vượt quantity to pick.
   - Task/order còn ở trạng thái cho phép.
9. Backend đánh dấu picking item đã pick.
10. Stock chưa bị trừ on-hand ở bước này.
11. Nhân viên quay lại danh sách task.

Từng bước báo lỗi/exception:

1. Nhân viên thấy hàng thiếu, sai vị trí, hư hỏng hoặc không tìm thấy.
2. Mở task.
3. Bấm báo lỗi.
4. Chọn loại lỗi hoặc nhập ghi chú.
5. Backend kiểm tra quyền assignee.
6. Task reset về trạng thái cần xử lý.
7. Backend gửi notification cho manager.
8. Manager xử lý:
   - Gán lại location.
   - Điều chỉnh tồn.
   - Hold/cancel đơn nếu không đủ hàng.

Dữ liệu thay đổi:

- Picking item status.
- Assigned user.
- Exception note/status nếu có.
- Notification manager.
- Audit log.

Điểm tốt:

- Complete mobile không trừ tồn ngay, tránh sai lệch nếu đơn chưa ship.
- Có test xác nhận stock chỉ trừ khi ship.
- Có kiểm soát assignee cho picking.

Lỗi thường gặp:

- Nhân viên chưa được gán warehouse.
- Task không phải của mình.
- Đơn đang hold/cancelled.
- Pick thiếu nhưng cố hoàn tất.

### 6.9 Luồng đóng gói và xuất hàng

Vai trò tham gia:

- `WAREHOUSE_MANAGER`
- `WAREHOUSE_STAFF`
- `ADMIN`

Màn hình:

- `/orders/[id]`
- `/orders`

Mục tiêu:

Sau khi picking xong, đóng gói và xác nhận ship để trừ tồn chính thức.

Từng bước thao tác:

1. Manager/staff mở chi tiết sales order.
2. Kiểm tra tất cả picking items đã completed/picked.
3. Nếu còn task chưa xong, không được mark packed.
4. Bấm mark packed.
5. Backend kiểm tra tất cả picking complete.
6. Order chuyển sang packed.
7. Khi hàng được bàn giao vận chuyển, user bấm mark shipped.
8. Backend kiểm tra:
   - Order đang packed.
   - Picking vẫn complete.
   - Tồn đủ để trừ.
9. Backend trừ on-hand.
10. Backend giải phóng reserved tương ứng.
11. Backend cập nhật shipped quantity.
12. Backend chuyển order sang shipped.
13. Backend ghi stock movement/audit.

Dữ liệu thay đổi:

- Sales order status: picking -> packed -> shipped.
- Stock level on-hand giảm.
- Reserved giảm.
- Sales order item shipped qty.
- Stock movements.
- Audit log.

Lỗi thường gặp:

- Chưa pick đủ.
- Đơn chưa packed.
- Tồn thực tế không đủ do điều chỉnh/luồng khác.
- Bấm ship nhiều lần: service cần đảm bảo không trừ tồn lần hai; test outbound đã kiểm tra hướng này.

Điểm tốt:

- Trừ tồn ở thời điểm shipped là hợp lý.
- Cancel order release reserved.
- Hold/resume hỗ trợ xử lý ngoại lệ.

### 6.10 Luồng trả hàng khách hàng

Vai trò tham gia:

- `WAREHOUSE_MANAGER`
- `ADMIN`
- Nhân viên kho nhận hàng tùy quyền.

Màn hình:

- `/returns`
- `/returns/[id]`

Mục tiêu:

Xử lý hàng khách trả về, có thể restock hoặc ghi nhận không nhập lại tồn.

Từng bước thao tác:

1. Người dùng vào `/returns`.
2. Bấm tạo return.
3. Chọn loại customer return.
4. Chọn customer.
5. Chọn sales order gốc nếu có.
6. Chọn warehouse nhận hàng trả.
7. Thêm sản phẩm trả:
   - SKU.
   - Số lượng khách trả.
   - Lý do trả.
   - Tình trạng hàng nếu có.
8. Lưu yêu cầu return.
9. Manager kiểm tra yêu cầu.
10. Nếu hợp lệ, bấm approve.
11. Khi hàng thực về kho, nhân viên mở return detail.
12. Chọn receive.
13. Nhập số lượng nhận từng dòng.
14. Chọn return/restock location.
15. Nếu hàng còn bán được, nhập restock quantity.
16. Backend kiểm tra:
    - Customer return phải được approve trước khi receive.
    - Số lượng nhận không vượt số lượng return.
    - Location thuộc warehouse.
17. Backend ghi nhận received quantity.
18. Nếu restock, backend tăng tồn ở location tương ứng.
19. Khi tất cả dòng nhận đủ, user bấm complete hoặc hệ thống complete.

Dữ liệu thay đổi:

- RMA/return request.
- Return lines.
- Stock level tăng nếu restock.
- Stock movement return/restock.
- Audit log.

Lỗi thường gặp:

- Receive trước khi approve.
- Restock vào location sai kho.
- Nhận vượt số lượng khách trả.
- Return liên quan sales order không hợp lệ.

Điểm tốt:

- Customer return có bước approval trước receive.
- Complete yêu cầu các dòng đã nhận đủ.

### 6.11 Luồng trả hàng nhà cung cấp

Vai trò tham gia:

- `WAREHOUSE_MANAGER`
- `ADMIN`

Màn hình:

- `/returns`
- `/returns/[id]`

Mục tiêu:

Trả hàng lỗi/thừa về supplier và trừ tồn khỏi kho.

Từng bước thao tác:

1. Manager vào `/returns`.
2. Tạo return loại supplier.
3. Chọn supplier.
4. Chọn warehouse.
5. Chọn return location chứa hàng sẽ trả.
6. Thêm từng sản phẩm:
   - SKU.
   - Số lượng trả.
   - Lý do trả.
7. Lưu return request.
8. Manager kiểm tra tồn tại return location.
9. Approve nếu cần theo flow.
10. Khi xuất trả supplier, user xác nhận receive/ship/complete theo wording UI.
11. Backend kiểm tra:
    - Supplier tồn tại.
    - Return location bắt buộc.
    - Location thuộc warehouse.
    - Tồn đủ để trả.
12. Backend trừ tồn nếu nghiệp vụ thực hiện xuất trả.
13. Backend cập nhật trạng thái RMA.
14. Backend ghi movement/audit.

Dữ liệu thay đổi:

- Supplier RMA.
- Stock level giảm.
- Stock movement supplier return.
- Audit log.

Lỗi thường gặp:

- Không chọn return location.
- Location sai warehouse.
- Tồn không đủ.
- Supplier inactive.

Rủi ro hiệu năng liên quan:

- Report RMA hiện cần tối ưu DB-level filter khi dữ liệu lớn.

### 6.12 Luồng kiểm kê Cycle Count

Vai trò tham gia:

- `WAREHOUSE_MANAGER`
- `WAREHOUSE_STAFF`
- `ADMIN`

Màn hình:

- `/cycle-counts`
- `/cycle-counts/[id]`

Mục tiêu:

Kiểm đếm tồn thực tế và xử lý chênh lệch có kiểm soát.

Từng bước tạo phiếu kiểm:

1. Manager vào `/cycle-counts`.
2. Bấm tạo cycle count.
3. Chọn warehouse.
4. Chọn phạm vi:
   - Toàn kho.
   - Một số location.
   - Một số product/SKU.
5. Chọn người thực hiện nếu có.
6. Lưu phiếu.
7. Backend tạo cycle count ở trạng thái draft/pending.

Từng bước nhân viên kiểm:

1. Nhân viên mở `/cycle-counts/[id]` trên điện thoại.
2. Xem danh sách item cần kiểm.
3. Đi đến location.
4. Đếm số lượng thực tế.
5. Nhập counted quantity.
6. Có thể nhập ghi chú nếu lệch.
7. Lưu từng dòng hoặc lưu toàn bộ.
8. Khi kiểm xong, bấm submit.

Từng bước manager duyệt:

1. Manager mở phiếu đã submit.
2. Xem chênh lệch:
   - System quantity.
   - Counted quantity.
   - Difference.
3. Kiểm tra các dòng lệch lớn.
4. Nếu cần, yêu cầu kiểm lại.
5. Nếu chấp nhận, bấm approve/apply adjustment.
6. Backend tạo stock adjustment cho các dòng lệch.
7. Nếu không chấp nhận, reject/cancel.

Dữ liệu thay đổi:

- Cycle count header/status.
- Cycle count lines.
- Stock adjustment nếu approve.
- Stock movements.
- Audit log.

Lỗi thường gặp:

- Nhân viên nhập nhầm location.
- Counted quantity âm.
- Phiếu đã submit nhưng vẫn cố sửa.
- Chênh lệch làm reserved/on-hand không hợp lệ nếu adjustment không kiểm soát kỹ.

Khuyến nghị mobile:

- Màn kiểm nên tối ưu nhập số nhanh.
- Nên hỗ trợ scan location/SKU.
- Các dòng đã kiểm nên có trạng thái rõ ràng.

### 6.13 Luồng notification

Vai trò tham gia:

- Tất cả user tùy nội dung notification.

Màn hình:

- `/notifications`
- Có thể có notification bell ở layout.

Mục tiêu:

Thông báo các sự kiện cần xử lý: tồn thấp, picking exception, tài khoản, đơn hàng, return.

Từng bước thao tác:

1. User đăng nhập.
2. Hệ thống lấy danh sách notification liên quan.
3. User mở danh sách notification.
4. Chọn một thông báo.
5. Hệ thống điều hướng đến màn liên quan nếu có link.
6. User xử lý nghiệp vụ.
7. User đánh dấu đã đọc.

Nguồn tạo notification:

- Low stock khi điều chỉnh tồn.
- Picking exception.
- Một số thay đổi PO/order/RMA tùy service.

Khuyến nghị:

- Notification nên có link deep-link rõ.
- Với mobile, nội dung phải ngắn: mã đơn, SKU, kho, hành động cần làm.

### 6.14 Luồng báo cáo và dashboard

Vai trò tham gia:

- `ADMIN`
- `WAREHOUSE_MANAGER`
- `REPORT_VIEWER`

Màn hình:

- `/dashboard`
- `/reports`
- `/history`

Mục tiêu:

Theo dõi tình trạng vận hành kho, tồn kho, nhập/xuất, trả hàng, lịch sử.

Từng bước dashboard:

1. User vào `/dashboard`.
2. Chọn warehouse hoặc xem tất cả nếu có quyền.
3. Chọn khoảng thời gian.
4. Xem các chỉ số:
   - Tồn thấp.
   - Đơn chờ xử lý.
   - Nhập hàng gần đây.
   - Xuất hàng gần đây.
   - Movement hoặc chart liên quan.
5. Click vào card/chỉ số để đi đến danh sách chi tiết nếu UI có hỗ trợ.

Từng bước report:

1. User vào `/reports`.
2. Chọn loại report.
3. Chọn filter:
   - Warehouse.
   - Date range.
   - Product/category.
   - Supplier/customer.
   - Status.
4. Bấm xem report.
5. Hệ thống gọi API.
6. User xem bảng/chart.
7. Nếu cần, export hoặc mở chi tiết từng dòng.

Lỗi thường gặp:

- Date range quá rộng làm report chậm.
- User report viewer không có quyền warehouse nên dữ liệu trống.
- RMA report có nguy cơ chậm nếu dữ liệu lớn vì backend đang filter in-memory.

Khuyến nghị:

- Đặt giới hạn date range mặc định.
- Server-side paging/filter cho mọi report lớn.
- Cache dashboard theo warehouse/date window.

### 6.15 Luồng AI assistant/config

Vai trò tham gia:

- `ADMIN`
- Có thể `WAREHOUSE_MANAGER` nếu được cấp quyền.

Màn hình:

- `/ai-assistant`
- `/settings`

Mục tiêu:

Hỗ trợ hỏi đáp/phân tích nghiệp vụ hoặc gợi ý dựa trên dữ liệu kho.

Từng bước thao tác:

1. Admin kiểm tra cấu hình AI engine.
2. User vào `/ai-assistant`.
3. Nhập câu hỏi nghiệp vụ:
   - Tồn thấp hôm nay?
   - Đơn nào đang chậm?
   - SKU nào có movement bất thường?
4. Frontend gửi request backend.
5. Backend gọi AI engine nếu được cấu hình.
6. Hệ thống trả câu trả lời hoặc gợi ý.

Rủi ro:

- AI engine URL default ngrok không phù hợp production.
- Cần kiểm soát dữ liệu nào được gửi ra AI engine.
- Cần log/audit nếu AI truy cập dữ liệu nhạy cảm.

Khuyến nghị:

- Chỉ bật AI khi cấu hình endpoint production nội bộ/an toàn.
- Mask dữ liệu nhạy cảm nếu không cần.
- Thêm timeout, retry hợp lý, circuit breaker nếu AI engine lỗi.

## 7. Kiểm Tra Theo Nhóm Chất Lượng

### 7.1 Hiệu năng

Đã tốt:

- Stock list có hướng bulk-load warehouse/location/product summary.
- Axios timeout 15s giúp request không treo mãi.
- Lazy/dynamic import đã được dùng ở một số khu vực nặng.

Cần cải thiện:

- RMA report không nên `findAll` rồi filter trong memory.
- Report/dashboard cần paging/cache khi dữ liệu lớn.
- Các màn bảng trên mobile nên ưu tiên card/list nhẹ thay vì render bảng rộng.
- Giant components nên tách để giảm re-render và dễ memo hóa.

### 7.2 Bảo mật

Đã tốt:

- JWT secret được validate mạnh khi app start.
- HttpOnly refresh cookie.
- Access token memory-only.
- Method-level authorization.
- CORS whitelist có cấu hình.
- Global exception không lộ stack trace.

Cần cải thiện:

- Production bắt buộc secure cookie.
- Không để default ngrok AI URL.
- `/auth/me` nên authenticated ở security layer.
- Cần rà lại CSRF theo mô hình cookie refresh: vì state-changing APIs dùng bearer access token là ổn, nhưng refresh/logout dùng cookie nên cần đảm bảo SameSite/CORS/Origin policy chặt.

### 7.3 Logic nghiệp vụ

Đã tốt:

- Inbound idempotency.
- PO lock khi nhận hàng.
- Không trừ tồn ở picking complete.
- Ship mới trừ tồn và release reserved.
- Putaway move tồn giữa locations.
- Cycle count/RMA có trạng thái và audit.

Cần cải thiện:

- Putaway assignment enforcement nếu nghiệp vụ yêu cầu.
- Chuẩn hóa wording trạng thái giữa UI và backend.
- Thêm test race condition cho ship/cancel/adjust đồng thời.

### 7.4 Trải nghiệm mobile

Đã tốt:

- Một số component nền đã responsive tốt hơn: page header, search toolbar, pagination, tabs, category/location/supplier edit.

Cần cải thiện tiếp:

- Các luồng mobile quan trọng nhất nên được test thủ công bằng viewport 360x800:
  - picking task detail
  - putaway completion
  - inbound receive
  - cycle count counting
  - inventory search
- Nút thao tác chính phải đủ lớn, không nằm quá sát mép.
- Form dài nên có sticky action hoặc bottom bar.
- Màn kho nên ưu tiên scan/input nhanh thay vì bảng nhiều cột.

### 7.5 Khả năng quan sát và vận hành

Đã tốt:

- Audit log có ở nhiều luồng.
- Notification được dùng cho sự kiện cần xử lý.

Cần cải thiện:

- Log correlation/request id cho backend API.
- Health check sâu hơn: database, flyway migration, AI engine nếu bật.
- Metrics cho các service chính: inbound duration, picking exception rate, ship failure, stock adjustment count.

## 8. Checklist Ưu Tiên Hành Động

### Ưu tiên ngay

1. Sửa trạng thái backend test compile bị chặn bởi generated mapper trong `target`.
2. Set và kiểm tra production env:
   - `AUTH_COOKIE_SECURE=true`
   - JWT secret mạnh
   - CORS domain thật
   - AI URL không dùng ngrok default
3. Tối ưu RMA report sang DB-level filter + paging.
4. Quyết định và enforce assignment cho putaway.

### Ưu tiên tiếp theo

1. Fix các cảnh báo accessibility còn lại từ React Doctor, nhất là label/control.
2. Tách component lớn ở các màn nghiệp vụ nặng.
3. Thêm e2e mobile cho picking, putaway, inbound, cycle count.
4. Thêm load test dữ liệu lớn cho inventory/report.
5. Thêm audit/metrics cho AI assistant nếu bật.

## 9. Kết Quả Kiểm Chứng Gần Nhất

Frontend:

- `npm run lint`: đã pass ở lượt kiểm tra trước sau khi cải thiện responsive.
- `npm run build`: đã pass ở lượt kiểm tra trước sau khi cải thiện responsive.
- `npx react-doctor@latest . --verbose`: cảnh báo đã giảm mạnh từ 958 còn khoảng 153 ở lượt fix trước.

Backend:

- `.\mvnw.cmd test`: chưa pass vì bị chặn ở compile do lỗi đọc generated mapper trong `target/generated-sources/annotations`.
- Chưa thấy test nghiệp vụ fail; cần chạy lại sau khi clean/fix artifact.

## 10. Kết Luận

Hệ thống có lõi nghiệp vụ tốt, đặc biệt ở các điểm quan trọng của WMS: nhập kho không bị double submit, xuất kho không trừ tồn quá sớm, reserved/on-hand có guard, role và warehouse scope được tách rõ. Đây là nền tảng đáng tin.

Các việc nên làm trước production là siết cấu hình bảo mật, đảm bảo backend test suite chạy sạch, tối ưu RMA/report dữ liệu lớn và hoàn thiện kiểm soát assignment cho putaway. Với nhóm người dùng kho hay dùng điện thoại, nên tiếp tục ưu tiên các luồng picking, putaway, inbound và cycle count như các trải nghiệm mobile-first thay vì chỉ là bảng desktop thu nhỏ.
