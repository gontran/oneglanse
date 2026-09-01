"use client"

import { cn } from "@/lib/utils/cn"
import * as DropdownMenuPrimitive from "@radix-ui/react-dropdown-menu"
import { Check as CheckIcon, ChevronRight as ChevronRightIcon, Circle as CircleIcon } from "lucide-react"
import type * as React from "react"

export function DropdownMenu({
	...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Root>) {
	return <DropdownMenuPrimitive.Root data-slot="dropdown-menu" modal={false} {...props} />
}

export function DropdownMenuTrigger({
	...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Trigger>) {
	return <DropdownMenuPrimitive.Trigger data-slot="dropdown-menu-trigger" {...props} />
}

export function DropdownMenuContent({
	className,
	sideOffset = 4,
	...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Content>) {
	return (
		<DropdownMenuPrimitive.Portal>
			<DropdownMenuPrimitive.Content
				data-slot="dropdown-menu-content"
				sideOffset={sideOffset}
				className={cn(
					"bg-popover text-popover-foreground data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 z-50 max-h-(--radix-dropdown-menu-content-available-height) min-w-[8rem] origin-(--radix-dropdown-menu-content-transform-origin) overflow-x-hidden overflow-y-auto rounded-[var(--app-radius)] border border-transparent bg-white p-1.5 shadow-[0_1px_2px_rgba(15,23,42,0.06),0_16px_34px_-14px_rgba(15,23,42,0.24)] dark:bg-neutral-950 dark:shadow-[0_1px_2px_rgba(0,0,0,0.2),0_18px_38px_-16px_rgba(0,0,0,0.58)]",
					className,
				)}
				{...props}
			/>
		</DropdownMenuPrimitive.Portal>
	)
}

export function DropdownMenuItem({
	className,
	inset,
	variant = "default",
	...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Item> & {
	inset?: boolean
	variant?: "default" | "destructive"
}) {
	return (
		<DropdownMenuPrimitive.Item
			data-slot="dropdown-menu-item"
			data-inset={inset}
			data-variant={variant}
			className={cn(
				"focus:bg-accent focus:text-accent-foreground hover:bg-accent hover:text-accent-foreground transition-[background-color,color] duration-150 ease-out relative flex cursor-pointer items-center gap-2 rounded-[var(--app-radius)] px-3 py-2.5 text-sm outline-hidden select-none data-[disabled]:pointer-events-none data-[disabled]:opacity-50 data-[inset]:pl-8 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
				className,
			)}
			{...props}
		/>
	)
}

export function DropdownMenuLabel({
	className,
	inset,
	...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Label> & { inset?: boolean }) {
	return (
		<DropdownMenuPrimitive.Label
			data-slot="dropdown-menu-label"
			data-inset={inset}
			className={cn("px-2 py-1.5 text-sm font-medium data-[inset]:pl-8", className)}
			{...props}
		/>
	)
}

export function DropdownMenuSeparator({
	className,
	...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Separator>) {
	return (
		<DropdownMenuPrimitive.Separator
			data-slot="dropdown-menu-separator"
			className={cn("bg-border -mx-1 my-1 h-px", className)}
			{...props}
		/>
	)
}
