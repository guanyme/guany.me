import { NextResponse } from 'next/server'
import type { GitHubUser } from '@/types/github'
import { getUser } from '@/lib/github'

export async function GET() {
  if (!process.env.GITHUB_TOKEN) {
    return NextResponse.json({ error: 'GITHUB_TOKEN is not configured' }, { status: 500 })
  }

  // Same request and one-hour cache as the site header
  const data = await getUser()

  if (!data) {
    return NextResponse.json({ error: 'Failed to fetch GitHub user' }, { status: 502 })
  }

  const user: GitHubUser = {
    login: data.login,
    id: data.id,
    avatar_url: data.avatar_url,
    html_url: data.html_url,
    name: data.name,
    bio: data.bio,
    location: data.location,
    public_repos: data.public_repos,
    followers: data.followers,
    following: data.following,
  }

  return NextResponse.json(user)
}
