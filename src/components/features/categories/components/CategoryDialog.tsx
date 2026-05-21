import { Controller } from "react-hook-form";
import type { CreateCategoryFormValues, EditCategoryFormValues } from "../schemas/categoryFormSchema";
import { Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCategoryCreateForm } from "../hooks/useCategoryCreateForm";
import { useCategoryEditForm } from "../hooks/useCategoryEditForm";
import { CategoryTreeSelectItems } from "../../CategoryTreeSelectItems";

function CreateCategoryForm({ onOpenChange }: { onOpenChange: (open: boolean) => void }) {
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
    onValid,
    onInvalid,
    categories,
    isLoadingCategories,
    categoriesError,
    refetchCategories,
    categoriesById,
    isSaveDisabled,
    isCreating,
  } = useCategoryCreateForm();

  const handleValidSub = async (data: CreateCategoryFormValues) => {
    await onValid(data);
    onOpenChange(false);
  };

  return (
    <form onSubmit={handleSubmit(handleValidSub, onInvalid)} noValidate className="space-y-6">
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name" className="text-xs uppercase text-slate-500 font-bold">
            Tên nhóm / Phân loại <span className="text-rose-500">*</span>
          </Label>
          <Input
            id="name"
            placeholder="Điện thoại, Tivi, Tủ Lạnh..."
            {...register("name")}
            aria-invalid={Boolean(errors.name)}
          />
          {errors.name?.message && (
            <p className="text-xs font-medium text-rose-600">{errors.name.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="parentId" className="text-xs uppercase text-slate-500 font-bold">
            Nhóm / loại cha
          </Label>
          <Controller
            name="parentId"
            control={control}
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger id="parentId">
                  <SelectValue placeholder={isLoadingCategories ? "Đang tải danh sách..." : "Chọn nhóm cha hoặc để gốc"}>
                    {(val) => {
                      if (val === "" || val == null) return "Nhóm gốc (không thuộc nhóm cha)";
                      const c = categoriesById.get(val as string);
                      return c ? `${c.name} (${c.code})` : "Đang tải...";
                    }}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent className="max-h-80">
                  {categoriesError && (
                    <div className="px-2 py-1.5 text-xs text-rose-500">
                      Không tải được danh sách.
                      <button type="button" onClick={() => refetchCategories()} className="ml-1 underline">Thử lại</button>
                    </div>
                  )}
                  <SelectItem value="">Nhóm gốc (không thuộc nhóm cha)</SelectItem>
                  <CategoryTreeSelectItems categories={categories} />
                </SelectContent>
              </Select>
            )}
          />
        </div>

        <Controller
          name="isActive"
          control={control}
          render={({ field }) => (
            <div className="flex items-center justify-between rounded-lg border p-3">
              <Label className="text-sm font-bold text-slate-700 cursor-pointer" onClick={() => field.onChange(!field.value)}>
                Trạng thái hiển thị
              </Label>
              <Switch checked={field.value} onCheckedChange={field.onChange} />
            </div>
          )}
        />
      </div>

      <DialogFooter>
        <Button variant="outline" type="button" onClick={() => onOpenChange(false)}>
          Hủy
        </Button>
        <Button type="submit" disabled={isSaveDisabled} className="bg-indigo-600 hover:bg-indigo-700">
          {isCreating && <Loader2 className="size-4 mr-2 animate-spin" />}
          {isCreating ? "Đang lưu..." : "Thêm mới"}
        </Button>
      </DialogFooter>
    </form>
  );
}

function EditCategoryForm({
  categoryId,
  onOpenChange,
}: {
  categoryId: string;
  onOpenChange: (open: boolean) => void;
}) {
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
    onValid,
    onInvalid,
    allCategories,
    categoriesById,
    isLoadingCategories,
    categoriesError,
    refetchCategories,
    parentSelectExcludeIds,
    isLoading,
    isSaveDisabled,
    isUpdating,
  } = useCategoryEditForm(categoryId);

  const handleValidSub = async (data: EditCategoryFormValues) => {
    await onValid(data);
    onOpenChange(false);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center p-6">
        <Loader2 className="size-6 animate-spin text-slate-400" />
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(handleValidSub, onInvalid)} noValidate className="space-y-6">
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name" className="text-xs uppercase text-slate-500 font-bold">
            Tên nhóm / Phân loại <span className="text-rose-500">*</span>
          </Label>
          <Input
            id="name"
            placeholder="Điện thoại, Tivi, Tủ Lạnh..."
            {...register("name")}
            aria-invalid={Boolean(errors.name)}
          />
          {errors.name?.message && (
            <p className="text-xs font-medium text-rose-600">{errors.name.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="parentId" className="text-xs uppercase text-slate-500 font-bold">
            Nhóm / loại cha
          </Label>
          <Controller
            name="parentId"
            control={control}
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger id="parentId">
                  <SelectValue placeholder={isLoadingCategories ? "Đang tải danh sách..." : "Chọn nhóm cha hoặc để gốc"}>
                    {(val) => {
                      if (val === "" || val == null) return "Nhóm gốc (không thuộc nhóm cha)";
                      const c = categoriesById.get(val as string);
                      return c ? `${c.name} (${c.code})` : "Đang tải...";
                    }}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent className="max-h-80">
                  {categoriesError && (
                    <div className="px-2 py-1.5 text-xs text-rose-500">
                      Không tải được danh sách.
                      <button type="button" onClick={() => refetchCategories()} className="ml-1 underline">Thử lại</button>
                    </div>
                  )}
                  <SelectItem value="">Nhóm gốc (không thuộc nhóm cha)</SelectItem>
                  <CategoryTreeSelectItems
                    categories={allCategories}
                    excludeIds={parentSelectExcludeIds}
                  />
                </SelectContent>
              </Select>
            )}
          />
        </div>

        <Controller
          name="isActive"
          control={control}
          render={({ field }) => (
            <div className="flex items-center justify-between rounded-lg border p-3">
              <Label className="text-sm font-bold text-slate-700 cursor-pointer" onClick={() => field.onChange(!field.value)}>
                Trạng thái hiển thị
              </Label>
              <Switch checked={field.value} onCheckedChange={field.onChange} />
            </div>
          )}
        />
      </div>

      <DialogFooter>
        <Button variant="outline" type="button" onClick={() => onOpenChange(false)}>
          Hủy
        </Button>
        <Button type="submit" disabled={isSaveDisabled} className="bg-indigo-600 hover:bg-indigo-700">
          {isUpdating && <Loader2 className="size-4 mr-2 animate-spin" />}
          {isUpdating ? "Đang lưu..." : "Lưu thay đổi"}
        </Button>
      </DialogFooter>
    </form>
  );
}

export function CategoryDialog({
  open,
  onOpenChange,
  categoryId,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categoryId?: string | null;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <DialogTitle className="text-lg">{categoryId ? "Sửa phân loại" : "Thêm phân loại mới"}</DialogTitle>
          <DialogDescription className="text-sm">
            {categoryId
              ? "Cập nhật thông tin phân loại sản phẩm. Các thay đổi sẽ có hiệu lực ngay lập tức."
              : "Thêm nhóm hàng hoặc loại hàng mới vào hệ thống."}
          </DialogDescription>
        </DialogHeader>

        {categoryId ? (
          <EditCategoryForm categoryId={categoryId} onOpenChange={onOpenChange} />
        ) : (
          <CreateCategoryForm onOpenChange={onOpenChange} />
        )}
      </DialogContent>
    </Dialog>
  );
}
