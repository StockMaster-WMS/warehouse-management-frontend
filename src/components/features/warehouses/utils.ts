export function getCapacityWidthClass(capacity: number) {
  if (capacity >= 100) return "w-full";
  if (capacity >= 95) return "w-[95%]";
  if (capacity >= 90) return "w-[90%]";
  if (capacity >= 80) return "w-[80%]";
  if (capacity >= 70) return "w-[70%]";
  if (capacity >= 60) return "w-[60%]";
  if (capacity >= 50) return "w-1/2";
  if (capacity >= 40) return "w-[40%]";
  if (capacity >= 30) return "w-[30%]";
  if (capacity >= 20) return "w-1/5";
  if (capacity >= 10) return "w-[10%]";
  if (capacity > 0) return "w-[5%]";
  return "w-0";
}
