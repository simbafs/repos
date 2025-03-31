import { Octokit } from 'octokit'
import { useEffect, useReducer, useState } from 'react'
import { Actions } from './action'

export type Repo = {
	nameWithOwner: string
	description: string
	isArchived: boolean
	isPrivate: boolean
}

export type Action =
	| {
			repo: string
			action: 'isArchive' | 'isPrivate' | 'remove'
	  }
	| {
			repo: string
			name: string
			action: 'rename'
	  }
	| {
			action: 'reset'
	  }

async function getAllRepos(octokit: Octokit) {
	return octokit
		.paginate(`GET /user/repos?sort=created`, {
			'X-GitHub-Api-Version': '2022-11-28',
		})
		.then(res => {
			console.log(res)
			return res.map(
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				(repo: any) =>
					({
						nameWithOwner: repo.full_name,
						description: repo.description || '',
						isArchived: repo.archived,
						isPrivate: repo.private,
					}) as Repo,
			)
		})
}

export function useRepos(octokit: Octokit) {
	const [repos, setRepos] = useState<Repo[]>([])

	useEffect(() => {
		getAllRepos(octokit).then(setRepos).catch(console.error)
	}, [octokit])

	const getRepo = (name: string) => repos.find(r => r.nameWithOwner == name)

	const [actions, updateActions] = useReducer(
		(actions: Actions, action: Action) => {
			if (action.action == 'reset') {
				return {
					rename: {},
					isArchive: {},
					isPrivate: {},
					remove: {},
				}
			}

			const s = { ...actions }

			const repo = getRepo(action.repo)
			switch (action.action) {
				case 'rename':
					s.rename[action.repo] = action.name
					if (action.name == repo?.nameWithOwner) delete s.rename[action.repo]
					break
				case 'isPrivate':
					const isPrivate = action.repo in s.isPrivate ? !s.isPrivate[action.repo] : !repo?.isPrivate
					s.isPrivate[action.repo] = isPrivate
					if (isPrivate == repo?.isPrivate) delete s.isPrivate[action.repo]
					break
				case 'isArchive':
					const isArchive = action.repo in s.isArchive ? !s.isArchive[action.repo] : !repo?.isArchived
					s.isArchive[action.repo] = isArchive
					if (isArchive == repo?.isArchived) delete s.isArchive[action.repo]
					break
				case 'remove':
					const remove = action.repo in s.remove ? !s.remove[action.repo] : true
					s.remove[action.repo] = remove
					if (remove == false) {
						delete s.remove[action.repo]
					}
					break
				default:
					console.error('unknown action:', action)
			}

			return s
		},
		{
			rename: {},
			isArchive: {},
			isPrivate: {},
			remove: {},
		},
	)

	const toggleIsArchive = (repo: Repo) => {
		updateActions({
			repo: repo.nameWithOwner,
			action: 'isArchive',
		})
	}

	const toggleIsPrivate = (repo: Repo) => {
		updateActions({
			repo: repo.nameWithOwner,
			action: 'isPrivate',
		})
	}

	const rename = (repo: Repo, name: string) => {
		const owner = repo.nameWithOwner.split('/')[0]
		updateActions({
			repo: repo.nameWithOwner,
			name: `${owner}/${name}`,
			action: 'rename',
		})
	}

	const remove = (repo: Repo) => {
		updateActions({
			repo: repo.nameWithOwner,
			action: 'remove',
		})
	}

	const reset = () => {
		updateActions({ action: 'reset' })
	}

	return [
		repos,
		actions,
		{
			toggleIsArchive,
			toggleIsPrivate,
			rename,
			remove,
			reset,
		},
	] as const
}
