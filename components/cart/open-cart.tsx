import { ShoppingCartIcon } from "@heroicons/react/24/outline";
import clsx from "clsx";

export default function OpenCart({
  className,
  quantity,
  isAdding,
}: {
  className?: string;
  quantity?: number;
  isAdding?: boolean;
}) {
  return (
    <div
      className={clsx(
        "relative flex h-9 w-9 items-center justify-center rounded-lg border bg-white text-blue-700 shadow-sm",
        "transition-all duration-200 hover:border-blue-300 hover:bg-blue-50",
        isAdding
          ? "scale-125 border-blue-400 bg-blue-50 shadow-blue-200"
          : "border-blue-100",
      )}
    >
      <ShoppingCartIcon
        className={clsx(
          "h-5 w-5 transition-all ease-in-out",
          isAdding ? "text-blue-600" : "hover:scale-110",
          className,
        )}
      />
      {quantity ? (
        <div
          className={clsx(
            "absolute -right-1.5 -top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-blue-700 text-[10px] font-bold text-white shadow transition-transform duration-200",
            isAdding && "scale-125",
          )}
        >
          {quantity > 9 ? "9+" : quantity}
        </div>
      ) : null}
    </div>
  );
}
