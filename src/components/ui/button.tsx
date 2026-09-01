import { cn } from "@/lib/utils/cn"
import { Slot } from "@radix-ui/react-slot"
import { cva } from "class-variance-authority"
import type { VariantProps } from "class-variance-authority"
import type * as React from "react"

const buttonVariants = cva(
	"cursor-pointer inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-[var(--app-radius)] border text-sm font-medium transition-[box-shadow,background-color,color,border-color,opacity] duration-200 ease-out disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none aria-invalid:border-destructive motion-reduce:transition-none",
	{
		variants: {
			variant: {
				default:
					"border-transparent bg-gray-950 text-white shadow-[0_20px_48px_-26px_rgba(15,23,42,0.38)] hover:bg-gray-800 hover:text-white dark:border-transparent dark:bg-white dark:text-gray-950 dark:shadow-[0_20px_48px_-26px_rgba(0,0,0,0.56)] dark:hover:bg-gray-200",
				destructive:
					"border-transparent bg-red-600 text-white hover:bg-red-700 dark:border-transparent dark:bg-red-600 dark:hover:bg-red-500",
				outline:
					"border border-transparent bg-white text-gray-700 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_8px_18px_-14px_rgba(15,23,42,0.12)] hover:bg-stone-100 hover:text-gray-950 dark:border-transparent dark:bg-neutral-950 dark:text-gray-200 dark:hover:bg-gray-900",
				secondary:
					"border-transparent bg-stone-100 text-gray-800 hover:bg-stone-200 dark:border-transparent dark:bg-neutral-900 dark:text-gray-200 dark:hover:bg-neutral-800",
				ghost:
					"border border-transparent bg-white text-gray-600 hover:bg-stone-100 hover:text-gray-950 dark:border-transparent dark:bg-neutral-950 dark:text-gray-300 dark:hover:bg-neutral-900",
				link: "text-primary underline-offset-4 hover:underline",
			},
			size: {
				default: "h-8 px-3 py-2 text-[13px] has-[>svg]:px-2.5 sm:h-9 sm:px-3.5 sm:text-sm",
				sm: "h-7 gap-1.5 px-2.5 text-[13px] has-[>svg]:px-2 sm:h-8 sm:px-3 sm:text-sm",
				lg: "h-8 px-4 text-[13px] has-[>svg]:px-3 sm:h-9 sm:px-4.5 sm:text-sm",
				icon: "size-7 sm:size-8",
			},
		},
		defaultVariants: { variant: "default", size: "default" },
	},
)

export function Button({
	className,
	variant,
	size,
	asChild = false,
	...props
}: React.ComponentProps<"button"> & VariantProps<typeof buttonVariants> & { asChild?: boolean }) {
	const Comp = asChild ? Slot : "button"
	return (
		<Comp
			data-slot="button"
			className={cn(buttonVariants({ variant, size, className }))}
			{...props}
		/>
	)
}

export { buttonVariants }
