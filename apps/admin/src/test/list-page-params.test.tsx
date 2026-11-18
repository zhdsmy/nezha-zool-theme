import { useListPagination } from "@/hooks/useListPagination"
import { renderHook } from "@testing-library/react"
import { MemoryRouter } from "react-router-dom"
import { expect, test } from "vitest"

test("invalid page numbers fall back before requesting or rendering a page", () => {
    const { result } = renderHook(useListPagination, { wrapper: ({ children }) =>
        <MemoryRouter initialEntries={["/?page=Infinity&pageSize=-1"]}>{children}</MemoryRouter> })
    expect(result.current).toMatchObject({ page: 1, pageSize: 10 })
})
