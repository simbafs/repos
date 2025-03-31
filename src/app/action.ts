import { Octokit } from 'octokit'

export type Actions = {
	rename: Record<string, string>
	isArchive: Record<string, boolean>
	isPrivate: Record<string, boolean>
	remove: Record<string, boolean>
}

type Repo = {
	owner: string
	repo: string
	name?: string
	private?: boolean
	archived?: boolean
}

function origanize(actions: Actions) {
	const toBeRemoved = Object.keys(actions.remove).map(repoName => {
		const [owner, repo] = repoName.split('/')
		return { owner, repo } as Repo
	})
	const repos = [
		...new Set(
			[Object.keys(actions.isPrivate), Object.keys(actions.isArchive), Object.keys(actions.rename)].flat(),
		),
	].map(repoName => {
		const [owner, repo] = repoName.split('/')
		const r: Repo = { owner, repo }

		if (repoName in actions.isPrivate) {
			r.private = actions.isPrivate[repoName]
		}

		if (repoName in actions.isArchive) {
			r.archived = actions.isArchive[repoName]
		}

		if (repoName in actions.rename) {
			r.name = actions.rename[repoName]
		}

		return r
	})

	return { toBeRemoved, repos }
}

export function composeMsg(actions: Actions) {
	const s: string[] = []

	const { toBeRemoved, repos } = origanize(actions)

	for (const repo of repos) {
		const action: string[] = []
		if (repo.archived != undefined) {
			if (repo.archived) action.push('封存')
			else action.push('解封存')
		}
		if (repo.private != undefined) {
			if (repo.private) action.push('設為私人')
			else action.push('公開')
		}
		if (repo.name) action.push(`改名為 ${repo.name}`)

		s.push(action.join('、') + `${repo.owner}/${repo.repo}`)
	}

	for (const repo of toBeRemoved) {
		s.push(`刪除 ${repo.owner}/${repo.repo}`)
	}

	return s.join('\n')
}

export async function doAction(octokit: Octokit, actions: Actions) {
	const { toBeRemoved, repos } = origanize(actions)

	return Promise.all(repos.map(repo => octokit.request(`PATCH /repos/{owner}/{repo}`, repo))).then(() =>
		toBeRemoved.map(repo => octokit.request('DELETE /repos/{owner}/{repo}', repo)),
	)
}
