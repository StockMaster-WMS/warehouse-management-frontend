import { DeleteConfirmDialog } from "@/components/features/DeleteConfirmDialog";

interface CategoryDeleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  itemName?: string;
  onConfirm: () => void;
}

export function CategoryDeleteDialog({
  open,
  onOpenChange,
  itemName,
  onConfirm,
}: CategoryDeleteDialogProps) {
  return (
    <DeleteConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      onConfirm={onConfirm}
      itemName={itemName}
      title="Xóa nhóm hàng"
      description="Xóa nhóm hàng sẽ ảnh hưởng đến việc phân loại các sản phẩm hiện có. Hãy kiểm tra kỹ trước khi thực hiện."
    />
  );
}
