import { cn } from "@/lib/utils/cn"
import type * as React from "react"

export function Card({ className, ...props }: React.ComponentProps<"div">) {
	return (
		<div
			data-slot="card"
			className={cn(
				"bg-card text-card-foreground flex flex-col gap-5 rounded-[var(--app-radius)] border border-transparent py-6 shadow-[0_12px_34px_-24px_rgba(0,0,0,0.22)] transition-[transform,box-shadow,background-color] duration-300 ease-out dark:border-transparent dark:shadow-[0_14px_36px_-24px_rgba(0,0,0,0.52)] motion-reduce:transition-none",
				className,
			)}
			{...props}
		/>
	)
}
