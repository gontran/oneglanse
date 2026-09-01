"use client"

import ReactMarkdown from "react-markdown"
import rehypeSanitize from "rehype-sanitize"
import remarkGfm from "remark-gfm"

export function MarkdownRenderer({ content }: { content: string }) {
	return (
		<div className="prose prose-sm max-w-none text-gray-700 dark:prose-invert dark:text-gray-300">
			<ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeSanitize]}>
				{content}
			</ReactMarkdown>
		</div>
	)
}
