import type { IDataService } from "./data-service"
import { MockDataService } from "./mock-data-service"
import { SupabaseDataService } from "./supabase-data-service"

const source = import.meta.env.VITE_DATA_SOURCE as string | undefined

let instance: IDataService

if (source === "database") {
	instance = new SupabaseDataService()
} else {
	if (import.meta.env.DEV && source !== "mock") {
		console.warn(
			`[dataService] VITE_DATA_SOURCE="${source}" is not a valid value. Falling back to MockDataService. Valid values: "mock" | "database".`,
		)
	}
	instance = new MockDataService()
}

export const dataService: IDataService = instance

export type { IDataService } from "./data-service"
