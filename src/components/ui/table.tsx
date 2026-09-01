import { cn } from "@/lib/utils/cn"
import type * as React from "react"

export function Table({
	className,
	containerClassName,
	...props
}: React.ComponentProps<"table"> & { containerClassName?: string }) {
	return (
		<div
			data-slot="table-container"
			className={cn(
				"relative w-full overflow-x-auto overscroll-x-contain [touch-action:pan-x_pinch-zoom] rounded-[var(--app-radius)] border border-transparent bg-white shadow-[0_12px_34px_-24px_rgba(0,0,0,0.2)] dark:border-transparent dark:bg-neutral-950 dark:shadow-[0_14px_36px_-24px_rgba(0,0,0,0.5)]",
				containerClassName,
			)}
		>
			<table
				data-slot="table"
				className={cn("w-full caption-bottom text-sm", className)}
				{...props}
			/>
		</div>
	)
}

export function TableHeader({ className, ...props }: React.ComponentProps<"thead">) {
	return <thead data-slot="table-header" className={cn("[&_tr]:border-b", className)} {...props} />
}

export function TableBody({ className, ...props }: React.ComponentProps<"tbody">) {
	return (
		<tbody
			data-slot="table-body"
			className={cn("[&_tr:last-child]:border-0", className)}
			{...props}
		/>
	)
}

export function TableRow({ className, ...props }: React.ComponentProps<"tr">) {
	return (
		<tr
			data-slot="table-row"
			className={cn(
				"hover:bg-muted/50 data-[state=selected]:bg-muted border-b border-gray-100/70 transition-[background-color] duration-200 ease-out dark:border-gray-800/70",
				className,
			)}
			{...props}
		/>
	)
}

export function TableHead({ className, ...props }: React.ComponentProps<"th">) {
	return (
		<th
			data-slot="table-head"
			className={cn(
				"text-foreground h-11 px-4 text-left align-middle font-medium whitespace-normal sm:whitespace-nowrap",
				className,
			)}
			{...props}
		/>
	)
}

export function TableCell({ className, ...props }: React.ComponentProps<"td">) {
	return (
		<td
			data-slot="table-cell"
			className={cn("px-4 py-3 align-middle whitespace-normal sm:whitespace-nowrap", className)}
			{...props}
		/>
	)
}
