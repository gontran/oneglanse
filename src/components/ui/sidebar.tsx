"use client"

import { cn } from "@/lib/utils/cn"
import { Slot } from "@radix-ui/react-slot"
import { cva } from "class-variance-authority"
import type { VariantProps } from "class-variance-authority"
import { PanelLeft as PanelLeftIcon } from "lucide-react"
import * as React from "react"
import { Button } from "./button"
import { Separator } from "./separator"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "./sheet"
import { Skeleton } from "./skeleton"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./tooltip"
import { useIsMobile } from "./use-mobile"

const SIDEBAR_WIDTH = "16rem"
const SIDEBAR_WIDTH_MOBILE = "18rem"
const SIDEBAR_WIDTH_ICON = "3rem"

type SidebarContextProps = {
	state: "expanded" | "collapsed"
	open: boolean
	setOpen: (open: boolean) => void
	openMobile: boolean
	setOpenMobile: (open: boolean) => void
	isMobile: boolean
	toggleSidebar: () => void
}

const SidebarContext = React.createContext<SidebarContextProps | null>(null)

function useSidebar() {
	const context = React.useContext(SidebarContext)
	if (!context) throw new Error("useSidebar must be used within a SidebarProvider.")
	return context
}

function SidebarProvider({
	defaultOpen = true,
	className,
	style,
	children,
	...props
}: React.ComponentProps<"div"> & { defaultOpen?: boolean }) {
	const isMobile = useIsMobile()
	const [openMobile, setOpenMobile] = React.useState(false)
	const [_open, _setOpen] = React.useState(defaultOpen)
	const open = _open
	const setOpen = React.useCallback(
		(value: boolean | ((value: boolean) => boolean)) => {
			const openState = typeof value === "function" ? value(_open) : value
			_setOpen(openState)
		},
		[_open],
	)

	const toggleSidebar = React.useCallback(() => {
		return isMobile ? setOpenMobile((open) => !open) : setOpen((open) => !open)
	}, [isMobile, setOpen])

	React.useEffect(() => {
		const handleKeyDown = (event: KeyboardEvent) => {
			if (event.key === "b" && (event.metaKey || event.ctrlKey)) {
				event.preventDefault()
				toggleSidebar()
			}
		}
		window.addEventListener("keydown", handleKeyDown)
		return () => window.removeEventListener("keydown", handleKeyDown)
	}, [toggleSidebar])

	const state = open ? "expanded" : "collapsed"

	const contextValue = React.useMemo<SidebarContextProps>(
		() => ({ state, open, setOpen, isMobile, openMobile, setOpenMobile, toggleSidebar }),
		[state, open, setOpen, isMobile, openMobile, toggleSidebar],
	)

	return (
		<SidebarContext.Provider value={contextValue}>
			<TooltipProvider delayDuration={0}>
				<div
					data-slot="sidebar-wrapper"
					style={
						{
							"--sidebar-width": SIDEBAR_WIDTH,
							"--sidebar-width-icon": SIDEBAR_WIDTH_ICON,
							...style,
						} as React.CSSProperties
					}
					className={cn(
						"group/sidebar-wrapper flex min-h-svh min-w-0 w-full overflow-x-hidden",
						className,
					)}
					{...props}
				>
					{children}
				</div>
			</TooltipProvider>
		</SidebarContext.Provider>
	)
}

function Sidebar({
	side = "left",
	className,
	children,
	...props
}: React.ComponentProps<"div"> & { side?: "left" | "right" }) {
	const { isMobile, state, openMobile, setOpenMobile } = useSidebar()

	if (isMobile) {
		return (
			<Sheet open={openMobile} onOpenChange={setOpenMobile} {...props}>
				<SheetContent
					data-sidebar="sidebar"
					data-mobile="true"
					className="bg-sidebar text-sidebar-foreground w-(--sidebar-width) p-0 [&>button]:hidden"
					style={{ "--sidebar-width": SIDEBAR_WIDTH_MOBILE } as React.CSSProperties}
					side={side}
				>
					<SheetHeader className="sr-only">
						<SheetTitle>Navigation</SheetTitle>
						<SheetDescription>Barre de navigation principale</SheetDescription>
					</SheetHeader>
					<div className="flex h-full w-full flex-col">{children}</div>
				</SheetContent>
			</Sheet>
		)
	}

	return (
		<div
			className="group peer text-sidebar-foreground hidden md:block"
			data-state={state}
			data-slot="sidebar"
			{...props}
		>
			<div
				className={cn(
					"relative w-(--sidebar-width) bg-transparent transition-[width] duration-200 ease-linear",
					"group-data-[state=collapsed]:w-0",
					side === "right" && "rotate-180",
				)}
			/>
			<div
				className={cn(
					"fixed inset-y-0 z-10 hidden h-svh w-(--sidebar-width) transition-[left,right,width] duration-200 ease-linear md:flex",
					side === "left"
						? "left-0 group-data-[state=collapsed]:left-[calc(var(--sidebar-width)*-1)]"
						: "right-0 group-data-[state=collapsed]:right-[calc(var(--sidebar-width)*-1)]",
					className,
				)}
			>
				<div
					data-sidebar="sidebar"
					className="bg-sidebar flex h-full w-full flex-col border-r border-sidebar-border/40 dark:shadow-[10px_0_22px_-28px_rgba(0,0,0,0.28)]"
				>
					{children}
				</div>
			</div>
		</div>
	)
}

function SidebarTrigger({ className, onClick, ...props }: React.ComponentProps<typeof Button>) {
	const { toggleSidebar } = useSidebar()
	return (
		<Button
			data-sidebar="trigger"
			variant="ghost"
			size="icon"
			className={cn(
				"size-10 rounded-[var(--app-radius)] text-gray-700 hover:bg-stone-100 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-neutral-900 dark:hover:text-gray-100",
				className,
			)}
			onClick={(event) => {
				onClick?.(event)
				toggleSidebar()
			}}
			{...props}
		>
			<PanelLeftIcon />
			<span className="sr-only">Afficher/Masquer la navigation</span>
		</Button>
	)
}

function SidebarHeader({ className, ...props }: React.ComponentProps<"div">) {
	return (
		<div
			data-slot="sidebar-header"
			data-sidebar="header"
			className={cn("flex flex-col gap-2 p-3", className)}
			{...props}
		/>
	)
}

function SidebarFooter({ className, ...props }: React.ComponentProps<"div">) {
	return (
		<div
			data-slot="sidebar-footer"
			data-sidebar="footer"
			className={cn("flex flex-col gap-2 p-3", className)}
			{...props}
		/>
	)
}

function SidebarContent({ className, ...props }: React.ComponentProps<"div">) {
	return (
		<div
			data-slot="sidebar-content"
			data-sidebar="content"
			className={cn("flex min-h-0 flex-1 flex-col gap-3 overflow-auto px-1 pb-2", className)}
			{...props}
		/>
	)
}

function SidebarGroup({ className, ...props }: React.ComponentProps<"div">) {
	return (
		<div
			data-slot="sidebar-group"
			data-sidebar="group"
			className={cn("relative flex w-full min-w-0 flex-col px-2 py-1.5", className)}
			{...props}
		/>
	)
}

function SidebarGroupLabel({ className, ...props }: React.ComponentProps<"div">) {
	return (
		<div
			data-slot="sidebar-group-label"
			data-sidebar="group-label"
			className={cn(
				"text-sidebar-foreground/70 flex h-8 shrink-0 items-center rounded-[var(--app-radius)] px-3 text-[11px] font-semibold uppercase tracking-[0.12em]",
				className,
			)}
			{...props}
		/>
	)
}

function SidebarGroupContent({ className, ...props }: React.ComponentProps<"div">) {
	return (
		<div
			data-slot="sidebar-group-content"
			data-sidebar="group-content"
			className={cn("w-full text-sm", className)}
			{...props}
		/>
	)
}

function SidebarMenu({ className, ...props }: React.ComponentProps<"ul">) {
	return (
		<ul
			data-slot="sidebar-menu"
			data-sidebar="menu"
			className={cn("flex w-full min-w-0 flex-col gap-1", className)}
			{...props}
		/>
	)
}

function SidebarMenuItem({ className, ...props }: React.ComponentProps<"li">) {
	return (
		<li
			data-slot="sidebar-menu-item"
			data-sidebar="menu-item"
			className={cn("group/menu-item relative", className)}
			{...props}
		/>
	)
}

const sidebarMenuButtonVariants = cva(
	"peer/menu-button flex w-full items-center gap-2.5 overflow-hidden rounded-[var(--app-radius)] border border-transparent px-3.5 py-2.5 text-left text-sm outline-hidden transition-[width,height,padding,background-color,color,border-color,box-shadow] duration-200 ease-out hover:bg-sidebar-accent hover:text-sidebar-accent-foreground disabled:pointer-events-none disabled:opacity-50 data-[active=true]:bg-stone-100/90 data-[active=true]:font-medium data-[active=true]:text-stone-950 dark:data-[active=true]:bg-neutral-900 dark:data-[active=true]:text-gray-100 [&>span:last-child]:truncate [&>svg]:size-4 [&>svg]:shrink-0",
	{
		variants: {
			variant: {
				default: "bg-transparent text-gray-700 dark:bg-transparent dark:text-gray-200",
				outline: "bg-background hover:bg-sidebar-accent",
			},
			size: { default: "h-10 text-sm", sm: "h-7 text-xs", lg: "h-12 text-sm" },
		},
		defaultVariants: { variant: "default", size: "default" },
	},
)

function SidebarMenuButton({
	asChild = false,
	isActive = false,
	variant = "default",
	size = "default",
	className,
	...props
}: React.ComponentProps<"button"> & { asChild?: boolean; isActive?: boolean } & VariantProps<
		typeof sidebarMenuButtonVariants
	>) {
	const Comp = asChild ? Slot : "button"
	return (
		<Comp
			data-slot="sidebar-menu-button"
			data-sidebar="menu-button"
			data-size={size}
			data-active={isActive}
			className={cn(sidebarMenuButtonVariants({ variant, size }), className)}
			{...props}
		/>
	)
}

export {
	Sidebar,
	SidebarContent,
	SidebarFooter,
	SidebarGroup,
	SidebarGroupContent,
	SidebarGroupLabel,
	SidebarHeader,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
	SidebarProvider,
	SidebarTrigger,
	useSidebar,
}
