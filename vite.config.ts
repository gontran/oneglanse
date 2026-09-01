import { resolve } from "node:path"
import tailwindcss from "@tailwindcss/postcss"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"

export default defineConfig({
	plugins: [react()],
	resolve: {
		alias: {
			"@": resolve(__dirname, "src"),
		},
	},
	css: {
		postcss: {
			plugins: [tailwindcss()],
		},
	},
	server: {
		host: true,
		port: 3000,
	},
	preview: {
		host: true,
		port: 3000,
	},
})
