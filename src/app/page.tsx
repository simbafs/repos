'use client'
import React, { useState } from 'react'
import { Octokit } from 'octokit'
import { useRepos } from './useRepos'
import { useLocalStorage } from 'usehooks-ts'
import { composeMsg, doAction } from './action'

function Cell({ children, action }: { children: React.ReactNode; action?: () => void }) {
	return (
		<div className="bg-white p-2" onClick={action}>
			{children}
		</div>
	)
}

export default function Page() {
	const [octokit, setOctokit] = useState<Octokit>()
	const [token, setToken] = useLocalStorage('token', '')

	if (!octokit)
		return (
			<div className="flex flex-col items-center justify-center min-h-screen">
				<input
					type="text"
					value={token}
					onChange={e => setToken(e.target.value)}
					placeholder="Enter your GitHub token"
					className="border rounded-lg p-2 my-2"
				/>
				<button
					className="border rounded-lg p-2 my-2"
					type="button"
					onClick={() => {
						try {
							const octokit = new Octokit({ auth: token })
							console.log(octokit)
							octokit.auth()
							octokit.rest.users.getAuthenticated().then(() => {
								setOctokit(octokit)
							})
						} catch {
							alert('Invalid token')
						}
					}}
				>
					Auth
				</button>
			</div>
		)

	return <WithOctokit octokit={octokit} />
}

function WithOctokit({ octokit }: { octokit: Octokit }) {
	const [repos, actions, action] = useRepos(octokit)

	if (repos.length == 0)
		return (
			<div className="flex flex-col items-center justify-center min-h-screen">
				<h1 className="text-2xl">Loading...</h1>
			</div>
		)

	return (
		<div className="m-8">
			<div className="grid grid-cols-[2fr_2fr_6rem_7rem_6rem] gap-0.5 bg-black border-2">
				{repos.map(repo => (
					<>
						<Cell
							action={() => {
								const name = repo.nameWithOwner.split('/')[1]
								action.rename(repo, prompt(`Rename ${name}`, name) || name)
							}}
						>
							<h2>
								{repo.nameWithOwner}
								<br />
								{repo.nameWithOwner in actions.rename && (
									<span className="text-red-500 font-bold">
										-&gt;{actions.rename[repo.nameWithOwner]}{' '}
									</span>
								)}
							</h2>
						</Cell>
						<Cell>
							<p>{repo.description}</p>
						</Cell>
						<Cell action={() => action.toggleIsPrivate(repo)}>
							<p>
								{repo.isPrivate ? 'Private' : 'Public'}
								<br />
								{repo.nameWithOwner in actions.isPrivate && (
									<span className="text-red-500 font-bold">
										-&gt;{actions.isPrivate[repo.nameWithOwner] ? 'Private' : 'Public'}{' '}
									</span>
								)}
							</p>
						</Cell>
						<Cell action={() => action.toggleIsArchive(repo)}>
							<p>
								{repo.isArchived ? 'Archived' : 'Unarchived'}
								<br />
								{repo.nameWithOwner in actions.isArchive && (
									<span className="text-red-500 font-bold">
										-&gt;{actions.isArchive[repo.nameWithOwner] ? 'Archived' : 'Unarchived'}{' '}
									</span>
								)}
							</p>
						</Cell>
						<Cell action={() => action.remove(repo)}>
							{repo.nameWithOwner in actions.remove && <p className="text-red-500 font-bold">Removed</p>}
						</Cell>
					</>
				))}
			</div>
			<button
				className="w-full border rounded-lg p-2 my-2"
				type="button"
				onClick={() =>
					// TODO: 組合出會做哪些更動
					confirm(composeMsg(actions)) &&
					confirm('確定要執行？不可回復喔！') &&
					confirm('真的嗎？這是最後一次確認') &&
					doAction(octokit, actions)
						.then(() => alert('ok'))
						.then(action.reset)
						.catch(e => {
							alert('error\n'+e.message)
							console.error(e)
						})
				}
			>
				Submit
			</button>
		</div>
	)
}
