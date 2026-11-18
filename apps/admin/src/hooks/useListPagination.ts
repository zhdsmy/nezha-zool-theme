import { useSearchParams } from "react-router-dom"

function positiveInteger(value: string | null, fallback: number) {
    const number = Number(value)
    return Number.isSafeInteger(number) && number > 0 ? number : fallback
}

export function useListPagination() {
    const [params, setParams] = useSearchParams()
    const page = positiveInteger(params.get("page"), 1)
    const pageSize = positiveInteger(params.get("pageSize"), 10)
    const onPageChange = (next: number) => setParams({ page: String(next), pageSize: String(pageSize) })
    return { page, pageSize, onPageChange }
}
