import clsx from "clsx";
import LogoIcon from "./icons/logo";

export default function LogoSquare({ size }: { size?: "sm" | undefined }) {
  return (
    <div
      className={clsx(
        "flex flex-none items-center justify-center bg-blue-700 text-white shadow-sm",
        {
          "h-[42px] w-[42px] rounded-xl": !size,
          "h-[32px] w-[32px] rounded-lg": size === "sm",
        },
      )}
    >
      <LogoIcon
        className={clsx("text-white", {
          "h-[26px] w-[26px]": !size,
          "h-[18px] w-[18px]": size === "sm",
        })}
      />
    </div>
  );
}
