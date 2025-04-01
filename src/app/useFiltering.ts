import { useReducer } from 'react'

export type Filtering = {
	private: boolean | undefined
	archived: boolean | undefined
}

type Action = 'private' | 'archived' | 'clear-private' | 'clear-archived'

const booleanValue = new Map([
	[true, false],
	[false, undefined],
	[undefined, true],
])

export function useFiltering() {
	const [filtering, setFiltering] = useReducer((state: Filtering, action: Action) => {
		switch (action) {
			case 'private':
				return { ...state, private: booleanValue.get(state.private) }
			case 'archived':
				return { ...state, archived: booleanValue.get(state.archived) }
			default:
				return state
		}
	}, {} as Filtering)

	return [filtering, setFiltering] as const
}
