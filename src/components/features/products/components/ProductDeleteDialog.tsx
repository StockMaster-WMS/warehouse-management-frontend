import { DeleteConfirmDialog } from "@/components/features/DeleteConfirmDialog";

type ProductDeleteDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  itemName?: string;
  onConfirm: () => Promise<void>;
};

export function ProductDeleteDialog({
  open,
  onOpenChange,
  itemName,
  onConfirm,
}: ProductDeleteDialogProps) {
  return (
    <DeleteConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      onConfirm={onConfirm}
      itemName={itemName}
      title="Ngừng sử dụng sản phẩm"
      description="Sản phẩm sẽ được chuyển sang trạng thái ngừng dùng thay vì bị xóa khỏi hệ thống."
      confirmText="Ngừng sử dụng"
      variant="warning"
    />
  );
}
