import clsx from "clsx"
import { DetailedHTMLProps, ButtonHTMLAttributes, ReactNode } from "react"
import colors from "tailwindcss/colors"

export type ButtonProps = DetailedHTMLProps<
    ButtonHTMLAttributes<HTMLButtonElement>,
    HTMLButtonElement
> & {
    icon?: ReactNode
    color?: "success" | "danger"
}

export default function Button({ children, icon, color, ...props }: ButtonProps) {
    return (
        <button
            {...props}
            className={clsx(
                "border rounded focus:ring flex gap-2 items-center py-2 px-4",
                color === undefined && "hover:bg-slate-50 focus:ring-slate-500",
                color === "success" && "bg-green-200 hover:bg-green-300 focus:ring-green-500",
                color === "danger" && "bg-red-200 hover:bg-red-300 focus:ring-red-500"
            )}
        >
            {icon && <div className="-ml-2">{icon}</div>}
            {children}
        </button>
    )
}
